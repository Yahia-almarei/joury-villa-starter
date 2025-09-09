import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@/lib/supabase'
import { format, startOfYear, endOfYear, addYears } from "date-fns"

export const dynamic = 'force-dynamic'

const supabase = createServerClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property') || 'joury-villa'
    const token = searchParams.get('token') // Optional auth token for private calendars

    // Get current year and next year data
    const now = new Date()
    const yearStart = startOfYear(now)
    const yearEnd = endOfYear(addYears(now, 1))

    // Fetch reservations and blocked periods
    const [reservationsResult, blockedPeriodsResult] = await Promise.all([
      supabase
        .from('reservations')
        .select(`
          *,
          users(
            email,
            customer_profiles(
              full_name
            )
          ),
          properties(
            name,
            address
          )
        `)
        .eq('property_id', propertyId)
        .in('status', ['PAID', 'APPROVED', 'AWAITING_APPROVAL'])
        .gte('check_out', yearStart.toISOString())
        .lte('check_in', yearEnd.toISOString()),
      
      supabase
        .from('blocked_periods')
        .select(`
          *,
          properties(
            name,
            address
          )
        `)
        .eq('property_id', propertyId)
        .gte('end_date', yearStart.toISOString())
        .lte('start_date', yearEnd.toISOString())
    ])

    const reservations = reservationsResult.data || []
    const blockedPeriods = blockedPeriodsResult.data || []

    // Generate iCal content
    const icalLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Joury Villa//Booking Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Joury Villa - Reservations`,
      `X-WR-CALDESC:Booking calendar for Joury Villa`,
      `X-WR-TIMEZONE:Asia/Jerusalem`,
    ]

    // Add reservations as events
    reservations.forEach((reservation: any) => {
      const startDate = format(new Date(reservation.check_in), 'yyyyMMdd')
      const endDate = format(new Date(reservation.check_out), 'yyyyMMdd')
      const guestName = reservation.users?.customer_profiles?.[0]?.full_name || 'Guest'
      const uid = `reservation-${reservation.id}@jouryvilla.com`
      const timestamp = format(new Date(reservation.created_at), "yyyyMMdd'T'HHmmss'Z'")
      
      icalLines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `DTSTAMP:${timestamp}`,
        `SUMMARY:${guestName} - ${reservation.nights} nights`,
        `DESCRIPTION:Reservation ${reservation.id}\\n${reservation.adults} adults, ${reservation.children} children\\nStatus: ${reservation.status}\\nTotal: ${formatICalCurrency(reservation.total)}`,
        `LOCATION:${reservation.properties?.address}`,
        `STATUS:${getICalStatus(reservation.status)}`,
        'TRANSP:OPAQUE',
        'END:VEVENT'
      )
    })

    // Add blocked periods as events
    blockedPeriods.forEach((block: any) => {
      const startDate = format(new Date(block.start_date), 'yyyyMMdd')
      const endDate = format(new Date(block.end_date), 'yyyyMMdd')
      const uid = `block-${block.id}@jouryvilla.com`
      const timestamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'")
      
      icalLines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `DTSTAMP:${timestamp}`,
        `SUMMARY:BLOCKED - ${block.reason || 'Unavailable'}`,
        `DESCRIPTION:Property blocked\\nReason: ${block.reason || 'Administrative block'}`,
        `LOCATION:${block.properties?.address}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      )
    })

    icalLines.push('END:VCALENDAR')

    const icalContent = icalLines.join('\r\n')

    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="joury-villa-calendar.ics"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      }
    })

  } catch (error) {
    console.error('iCal generation error:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    )
  }
}

function formatICalCurrency(amount: number): string {
  return `${amount.toFixed(0)} ILS`
}

function getICalStatus(reservationStatus: string): string {
  switch (reservationStatus) {
    case 'PAID':
    case 'APPROVED':
      return 'CONFIRMED'
    case 'AWAITING_APPROVAL':
    case 'PENDING':
      return 'TENTATIVE'
    case 'CANCELLED':
      return 'CANCELLED'
    default:
      return 'TENTATIVE'
  }
}
