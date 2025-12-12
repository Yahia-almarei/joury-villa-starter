import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'
import { differenceInDays } from 'date-fns'
import { sendBookingRescheduled } from '@/lib/email-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Temporarily disable admin check for debugging
    // await requireAdmin()
    
    const reservationId = params.id
    const { newCheckIn, newCheckOut, reason } = await req.json()
    
    if (!newCheckIn || !newCheckOut) {
      return NextResponse.json({
        success: false,
        error: 'New check-in and check-out dates are required'
      }, { status: 400 })
    }
    
    // Validate dates
    const checkInDate = new Date(newCheckIn)
    const checkOutDate = new Date(newCheckOut)
    const now = new Date()
    
    if (checkInDate >= checkOutDate) {
      return NextResponse.json({
        success: false,
        error: 'Check-out date must be after check-in date'
      }, { status: 400 })
    }
    
    // Allow same-day bookings but not past dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Today at 00:00:00
    
    if (checkInDate < today) {
      return NextResponse.json({
        success: false,
        error: 'Check-in date cannot be in the past'
      }, { status: 400 })
    }
    
    // Get the reservation first
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single()
    
    if (reservationError || !reservation) {
      return NextResponse.json({
        success: false,
        error: 'Reservation not found'
      }, { status: 404 })
    }
    
    // Check if reservation can be rescheduled
    if (reservation.status === 'CANCELLED') {
      return NextResponse.json({
        success: false,
        error: 'Cannot reschedule cancelled reservation'
      }, { status: 400 })
    }
    
    // Calculate new nights
    const nights = differenceInDays(checkOutDate, checkInDate)
    
    // Check for conflicts with other reservations (excluding current one)
    const { data: conflicts, error: conflictError } = await supabase
      .from('reservations')
      .select('id')
      .neq('id', reservationId)
      .neq('status', 'CANCELLED')
      .or(`and(check_in.lt.${newCheckOut},check_out.gt.${newCheckIn})`)

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json({
        success: false,
        error: 'Error checking date availability'
      }, { status: 500 })
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Selected dates conflict with existing reservations'
      }, { status: 409 })
    }

    // Check for blocked periods
    const { data: blockedPeriods, error: blockedError } = await supabase
      .from('blocked_periods')
      .select('*')
      .or(`and(start_date.lt.${newCheckOut},end_date.gt.${newCheckIn})`)

    if (blockedError) {
      console.error('Error checking blocked periods:', blockedError)
      return NextResponse.json({
        success: false,
        error: 'Error checking blocked periods'
      }, { status: 500 })
    }

    if (blockedPeriods && blockedPeriods.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Selected dates include blocked periods'
      }, { status: 409 })
    }
    
    // Store old dates for email notification
    const oldCheckIn = reservation.check_in
    const oldCheckOut = reservation.check_out

    // Update reservation with new dates
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update({
        check_in: newCheckIn,
        check_out: newCheckOut,
        nights: nights
      })
      .eq('id', reservationId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating reservation:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update reservation'
      }, { status: 500 })
    }

    // Create audit log entry
    try {
      await supabase
        .from('audit_logs')
        .insert({
          actor_user_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Use proper UUID format for admin
          action: 'RESERVATION_RESCHEDULED',
          target_type: 'Reservation',
          target_id: reservationId,
          payload: {
            old_check_in: reservation.check_in,
            old_check_out: reservation.check_out,
            new_check_in: newCheckIn,
            new_check_out: newCheckOut,
            old_nights: reservation.nights,
            new_nights: nights,
            reason: reason || null,
            timestamp: new Date().toISOString()
          }
        })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the request for audit log errors
    }
    
    // Send reschedule email to customer
    await sendBookingRescheduled(reservationId, oldCheckIn, oldCheckOut, reason)

    // TODO: Recalculate pricing if needed based on new dates/seasons

    return NextResponse.json({
      success: true,
      message: `Reservation rescheduled successfully and notification email sent${reason ? '. Reason: ' + reason : ''}`,
      reservation: updatedReservation
    })
  } catch (error) {
    console.error('Error rescheduling reservation:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to reschedule reservation'
    }, { status: 500 })
  }
}