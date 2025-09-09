import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/database'

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()
    
    // Get only active reservations for admin calendar view (exclude cancelled)
    const allReservations = await db.findReservationsByStatus('ALL', 100)
    const activeReservations = allReservations.filter(reservation => 
      reservation.status !== 'CANCELLED' && reservation.status !== 'DECLINED'
    )
    
    return NextResponse.json({
      success: true,
      reservations: activeReservations
    })
  } catch (error) {
    console.error('Error fetching admin reservations:', error)
    
    // Handle authentication errors
    if (error instanceof Error) {
      if (error.message.includes('Authentication required') || error.message.includes('Admin access required')) {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized'
        }, { status: 401 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch reservations'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    
    const reservationData = await req.json()
    
    // Validate required fields
    const { user_id, check_in, check_out, adults, children, status, total, subtotal, fees, taxes } = reservationData
    
    if (!user_id || !check_in || !check_out || !adults) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }
    
    // Validate dates
    const checkInDate = new Date(check_in)
    const checkOutDate = new Date(check_out)
    
    if (checkInDate >= checkOutDate) {
      return NextResponse.json({
        success: false,
        error: 'Check-out date must be after check-in date'
      }, { status: 400 })
    }
    
    // Get property ID
    const property = await db.getProperty()
    if (!property) {
      return NextResponse.json({
        success: false,
        error: 'No property found'
      }, { status: 400 })
    }
    
    // Check availability
    const isAvailable = await db.checkAvailability(check_in, check_out)
    if (!isAvailable) {
      return NextResponse.json({
        success: false,
        error: 'Selected dates are not available'
      }, { status: 400 })
    }
    
    // Create reservation
    const reservation = await db.createReservation({
      property_id: property.id,
      user_id,
      check_in,
      check_out,
      nights: reservationData.nights || Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),
      adults,
      children: children || 0,
      subtotal: subtotal || total || 0,
      fees: fees || 0,
      taxes: taxes || 0,
      total: total || 0,
      status: status || 'AWAITING_APPROVAL',
      notes: reservationData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      reservation
    })
  } catch (error) {
    console.error('Error creating reservation:', error)
    
    // Handle authentication errors
    if (error instanceof Error) {
      if (error.message.includes('Authentication required') || error.message.includes('Admin access required')) {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized'
        }, { status: 401 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create reservation'
    }, { status: 500 })
  }
}