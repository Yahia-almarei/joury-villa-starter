import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(req: NextRequest) {
  try {
    // Get all reservations to see what we have
    const allReservations = await db.findReservationsByStatus('ALL', 100)
    
    // Filter and identify the problematic ones
    const anonymousReservations = allReservations.filter(res => 
      res.users?.email === 'anonymous@jouryvilla.internal'
    )
    
    const pendingReservations = allReservations.filter(res => 
      res.status === 'PENDING'
    )
    
    const targetDateReservations = allReservations.filter(res => 
      res.check_in === '2025-08-25' && res.check_out === '2025-08-27'
    )
    
    return NextResponse.json({
      success: true,
      summary: {
        total: allReservations.length,
        anonymous: anonymousReservations.length,
        pending: pendingReservations.length,
        targetDates: targetDateReservations.length
      },
      allReservations: allReservations.map(res => ({
        id: res.id,
        email: res.users?.email,
        checkIn: res.check_in,
        checkOut: res.check_out,
        status: res.status,
        createdAt: res.created_at
      })),
      anonymousReservations: anonymousReservations.map(res => ({
        id: res.id,
        email: res.users?.email,
        checkIn: res.check_in,
        checkOut: res.check_out,
        status: res.status,
        createdAt: res.created_at
      })),
      targetDateReservations: targetDateReservations.map(res => ({
        id: res.id,
        email: res.users?.email,
        checkIn: res.check_in,
        checkOut: res.check_out,
        status: res.status,
        createdAt: res.created_at
      }))
    })
    
  } catch (error) {
    console.error('Error listing reservations:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to list reservations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}