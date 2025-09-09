import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    
    // Get an existing reservation to update
    const reservations = await db.findReservationsByStatus('PENDING', 1)
    
    if (!reservations || reservations.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No pending reservations found to approve'
      })
    }
    
    const reservation = reservations[0]
    
    // Update it to APPROVED status
    const updated = await db.updateReservation(reservation.id, {
      status: 'APPROVED',
      updated_at: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      message: `Updated reservation ${reservation.id} to APPROVED status`,
      reservation: updated
    })
  } catch (error) {
    console.error('Create revenue error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}