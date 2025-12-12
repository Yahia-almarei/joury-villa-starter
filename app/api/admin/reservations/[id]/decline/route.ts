import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { sendBookingDeclined } from '@/lib/email-service'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // For now, skip admin verification during development
    // TODO: Implement proper admin authentication
    // await requireAdmin()
    
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
    
    // Update reservation status to CANCELLED
    const updatedReservation = await db.updateReservation(reservationId, {
      status: 'CANCELLED'
    })

    // Send decline email to customer
    await sendBookingDeclined(reservationId, reason)

    return NextResponse.json({
      success: true,
      message: 'Reservation declined successfully and notification email sent',
      reservation: updatedReservation
    })
  } catch (error) {
    console.error('Error declining reservation:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to decline reservation'
    }, { status: 500 })
  }
}