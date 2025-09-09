import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const excludeReservationId = searchParams.get('excludeId')
    
    // Get all non-cancelled reservations
    let reservationsQuery = supabase
      .from('reservations')
      .select('check_in, check_out')
      .neq('status', 'CANCELLED')

    // Exclude current reservation being rescheduled if provided
    if (excludeReservationId) {
      reservationsQuery = reservationsQuery.neq('id', excludeReservationId)
    }

    const { data: reservations, error: reservationsError } = await reservationsQuery

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch reservations' 
      }, { status: 500 })
    }

    // Get all blocked periods
    const { data: blockedPeriods, error: blockedError } = await supabase
      .from('blocked_periods')
      .select('start_date, end_date, reason')

    if (blockedError) {
      console.error('Error fetching blocked periods:', blockedError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch blocked periods' 
      }, { status: 500 })
    }

    // Convert to unavailable date ranges
    const unavailableDates = []

    // Add reservation dates
    if (reservations) {
      for (const reservation of reservations) {
        unavailableDates.push({
          start: reservation.check_in,
          end: reservation.check_out,
          type: 'reservation',
          reason: 'Reserved'
        })
      }
    }

    // Add blocked periods
    if (blockedPeriods) {
      for (const period of blockedPeriods) {
        unavailableDates.push({
          start: period.start_date,
          end: period.end_date,
          type: 'blocked',
          reason: period.reason || 'Blocked'
        })
      }
    }

    return NextResponse.json({
      success: true,
      unavailableDates
    })

  } catch (error) {
    console.error('Error fetching unavailable dates:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}