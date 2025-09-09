import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // For now, skip admin verification during development
    // TODO: Implement proper admin authentication
    // await requireAdmin()
    
    const reservationId = params.id
    
    // Get the reservation first
    const reservation = await db.findReservationById(reservationId)
    
    if (!reservation) {
      return NextResponse.json({
        success: false,
        error: 'Reservation not found'
      }, { status: 404 })
    }
    
    // Update reservation status to APPROVED
    const updatedReservation = await db.updateReservation(reservationId, {
      status: 'APPROVED',
      approved_at: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      message: 'Reservation approved successfully',
      reservation: updatedReservation
    })
  } catch (error) {
    console.error('Error approving reservation:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to approve reservation'
    }, { status: 500 })
  }
}