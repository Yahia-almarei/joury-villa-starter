import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from '@/lib/supabase'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isAfter, startOfDay } from "date-fns"
import { withRateLimit, validateSchema, getClientIp } from "@/lib/api-utils"
import { db } from '@/lib/database'

const supabase = createServerClient()

const availabilitySchema = z.object({
  year: z.number().int().min(2024).max(2030),
  month: z.number().int().min(1).max(12),
  propertyId: z.string().optional().default("joury-villa")
}).transform(data => ({
  ...data,
  propertyId: data.propertyId || "joury-villa"
}))

type AvailabilityData = {
  year: number;
  month: number; 
  propertyId: string;
}

async function handleAvailability(request: NextRequest, data: AvailabilityData) {
  try {
    let { year, month, propertyId } = data
    
    // Get the actual property ID if using default
    if (propertyId === "joury-villa" || !propertyId) {
      const { data: property } = await supabase
        .from('properties')
        .select('id')
        .limit(1)
        .single();
      if (property) {
        propertyId = property.id;
      }
    }

    // Get the first and last day of the month
    const monthStart = startOfMonth(new Date(year, month - 1, 1))
    const monthEnd = endOfMonth(new Date(year, month - 1, 1))
    
    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Get blocked periods for this month
    const { data: blockedPeriods } = await supabase
      .from('blocked_periods')
      .select('*')
      .eq('property_id', propertyId)
      .or(
        `and(start_date.lte.${monthEnd.toISOString()},end_date.gte.${monthStart.toISOString()})`
      )

    // Get existing reservations for this month
    const { data: reservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('property_id', propertyId)
      .in('status', ['PENDING', 'AWAITING_APPROVAL', 'APPROVED', 'PAID'])
      .or(
        `and(check_in.lt.${monthEnd.toISOString()},check_out.gt.${monthStart.toISOString()})`
      )

    // Filter out expired PENDING reservations
    const now = new Date()
    const activeReservations = (reservations || []).filter((reservation: any) => {
      if (reservation.status === 'PENDING') {
        return reservation.hold_expires_at ? isAfter(new Date(reservation.hold_expires_at), now) : false
      }
      return true
    })

    // Build availability map
    const availability: Record<string, {
      available: boolean
      reason?: string
      price?: number
      minStay?: number
    }> = {}

    const today = startOfDay(new Date())

    for (const day of daysInMonth) {
      const dateKey = format(day, 'yyyy-MM-dd')
      const dayStart = startOfDay(day)
      
      // Past dates are not available
      if (dayStart < today) {
        availability[dateKey] = {
          available: false,
          reason: 'Past date'
        }
        continue
      }

      // Check if day is blocked
      const isBlocked = (blockedPeriods || []).some((block: any) => 
        dayStart >= startOfDay(new Date(block.start_date)) && dayStart <= startOfDay(new Date(block.end_date))
      )

      if (isBlocked) {
        availability[dateKey] = {
          available: false,
          reason: 'Already booked'
        }
        continue
      }

      // Check if day has existing reservation
      const hasReservation = activeReservations.some((reservation: any) =>
        dayStart >= startOfDay(new Date(reservation.check_in)) && dayStart < startOfDay(new Date(reservation.check_out))
      )

      if (hasReservation) {
        availability[dateKey] = {
          available: false,
          reason: 'Already booked'
        }
        continue
      }

      // Day is available
      availability[dateKey] = {
        available: true
      }
    }

    // Get property details for pricing and rules
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()


    if (property) {
      // Get custom pricing for this month
      const customPricingData = await db.getCustomPricingForDateRange(
        propertyId,
        format(monthStart, 'yyyy-MM-dd'),
        format(monthEnd, 'yyyy-MM-dd')
      )
      
      // Create a map for quick lookup
      const customPricingMap = new Map()
      customPricingData.forEach(pricing => {
        customPricingMap.set(pricing.date, pricing)
      })
      
      // Add pricing and minimum stay information
      for (const day of daysInMonth) {
        const dateKey = format(day, 'yyyy-MM-dd')
        
        if (availability[dateKey]?.available) {
          // Check for custom pricing first (highest priority)
          const customPricing = customPricingMap.get(dateKey)
          let basePrice
          
          if (customPricing) {
            basePrice = customPricing.price_per_night
          } else {
            // Determine if this is a weekday or weekend (Thu, Fri, Sat = weekend)
            const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            const isWeekend = dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6; // Thu, Fri, Sat

            // Use correct pricing fields
            const weekdayPrice = property.weekday_price_night ?? 500;
            const weekendPrice = property.weekend_price_night ?? Math.round((property.weekday_price_night ?? 500) * 1.2);

            basePrice = isWeekend ? weekendPrice : weekdayPrice;
          }
          
          availability[dateKey] = {
            ...availability[dateKey],
            price: basePrice,
            minStay: property.min_nights,
            hasCustomPricing: !!customPricing
          }

        }
      }
    }

    return NextResponse.json({
      success: true,
      year,
      month,
      propertyId,
      availability,
      summary: {
        totalDays: daysInMonth.length,
        availableDays: Object.values(availability).filter(day => day.available).length,
        blockedDays: Object.values(availability).filter(day => !day.available).length
      }
    })

  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check availability' 
      },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(
  (request) => getClientIp(request),
  20, // 20 requests per minute
  60000,
  validateSchema(availabilitySchema)(handleAvailability as any)
)
