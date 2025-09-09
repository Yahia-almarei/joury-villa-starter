import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    
    const { checkIn, checkOut, excludeReservationId } = await req.json()
    
    if (!checkIn || !checkOut) {
      return NextResponse.json({
        success: false,
        error: 'Check-in and check-out dates are required'
      }, { status: 400 })
    }
    
    // Validate dates
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    
    if (checkInDate >= checkOutDate) {
      return NextResponse.json({
        success: false,
        error: 'Check-out date must be after check-in date',
        available: false
      }, { status: 400 })
    }
    
    // Allow same-day bookings but not past dates
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Today at 00:00:00
    
    if (checkInDate < today) {
      return NextResponse.json({
        success: false,
        error: 'Check-in date cannot be in the past',
        available: false
      }, { status: 400 })
    }
    
    // Check availability
    const isAvailable = await db.checkAvailability(checkIn, checkOut, excludeReservationId)
    
    if (!isAvailable) {
      // Get details about conflicting reservations for better error message
      const conflicts = await db.getConflictingReservations(checkIn, checkOut, excludeReservationId)
      
      return NextResponse.json({
        success: true,
        available: false,
        message: 'Selected dates are not available',
        conflicts: conflicts
      })
    }
    
    return NextResponse.json({
      success: true,
      available: true,
      message: 'Dates are available'
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check availability'
    }, { status: 500 })
  }
}