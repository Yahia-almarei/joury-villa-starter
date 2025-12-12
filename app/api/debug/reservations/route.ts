import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@/lib/supabase'

const supabase = createServerClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start') || '2024-09-01'
    const endDate = searchParams.get('end') || '2024-10-31'

    // Get property ID
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .limit(1)
      .single()

    // Get all reservations in broader date range
    const { data: allReservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('property_id', property?.id)
      .gte('check_in', startDate)
      .lte('check_out', endDate)
      .order('check_in')

    // Get all reservations with any status
    const { data: allStatusReservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('property_id', property?.id)
      .gte('check_in', '2024-09-01')
      .lte('check_out', '2024-10-31')
      .order('check_in')

    // Check blocked periods
    const { data: blockedPeriods } = await supabase
      .from('blocked_periods')
      .select('*')
      .eq('property_id', property?.id)
      .gte('start_date', '2024-09-01')
      .lte('end_date', '2024-10-31')

    // Also get reservations that might overlap with Sept 24-26
    const checkIn = '2025-09-24T00:00:00.000Z'
    const checkOut = '2025-09-26T00:00:00.000Z'

    const { data: conflictingReservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('property_id', property?.id)
      .in('status', ['PENDING', 'AWAITING_APPROVAL', 'APPROVED', 'PAID'])
      .or(`and(check_in.lt.${checkOut},check_out.gt.${checkIn})`)

    // Debug: also get ALL reservations to see what we have
    const { data: allActiveReservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('property_id', property?.id)
      .in('status', ['PENDING', 'AWAITING_APPROVAL', 'APPROVED', 'PAID'])

    // Test the exact same query from booking.ts
    const now = new Date()
    const activeReservations = (conflictingReservations || []).filter((reservation: any) => {
      if (reservation.status === 'PENDING') {
        return reservation.hold_expires_at ? new Date(reservation.hold_expires_at) > now : false
      }
      return true
    })

    return NextResponse.json({
      propertyId: property?.id,
      allReservations,
      allStatusReservations,
      allActiveReservations,
      blockedPeriods,
      conflictingWithSept24: conflictingReservations,
      activeConflictingReservations: activeReservations,
      testDates: {
        checkIn,
        checkOut,
        now: now.toISOString()
      },
      sqlQuery: `and(check_in.lt.${checkOut},check_out.gt.${checkIn})`,
      existingReservation: {
        checkIn: '2025-09-21',
        checkOut: '2025-09-24',
        testConditions: {
          checkInLtNewCheckOut: '2025-09-21 < 2025-09-26T00:00:00.000Z',
          checkOutGtNewCheckIn: '2025-09-24 > 2025-09-24T00:00:00.000Z'
        }
      }
    })

  } catch (error) {
    console.error('Debug reservations error:', error)
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
  }
}