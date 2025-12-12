import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/database'
import { sendBookingCancelled } from '@/lib/email-service'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    
    const reservationId = params.id
    const { reason } = await req.json()
    
    // Get the reservation first
    const reservation = await db.findReservationById(reservationId)
    
    if (!reservation) {
      return NextResponse.json({
        success: false,
        error: 'Reservation not found'
      }, { status: 404 })
    }
    
    // Check if reservation can be cancelled
    if (reservation.status === 'CANCELLED') {
      return NextResponse.json({
        success: false,
        error: 'Reservation is already cancelled'
      }, { status: 400 })
    }
    
    // Update reservation status to CANCELLED
    const updatedReservation = await db.updateReservation(reservationId, {
      status: 'CANCELLED'
    })

    // Send cancellation email to customer and admin notification
    await sendBookingCancelled(reservationId, reason)

    return NextResponse.json({
      success: true,
      message: 'Reservation cancelled successfully and notification emails sent',
      reservation: updatedReservation
    })
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel reservation'
    }, { status: 500 })
  }
}