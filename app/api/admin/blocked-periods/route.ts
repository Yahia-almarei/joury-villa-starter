import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/database'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('property_id')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // If date range provided, filter by dates for performance
    if (startDate && endDate) {
      const blockedPeriods = await db.getBlockedPeriodsByDateRange(startDate, endDate, propertyId || undefined)
      return NextResponse.json({
        success: true,
        blockedPeriods
      })
    }

    // Fallback to all blocked periods
    const blockedPeriods = await db.getAllBlockedPeriods(propertyId || undefined)

    return NextResponse.json({
      success: true,
      blockedPeriods
    })
  } catch (error) {
    console.error('Error fetching blocked periods:', error)
    
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
      error: 'Failed to fetch blocked periods'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    
    const { startDate, endDate, reason, propertyId } = await req.json()
    
    if (!startDate || !endDate) {
      return NextResponse.json({
        success: false,
        error: 'Start date and end date are required'
      }, { status: 400 })
    }
    
    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) {
      return NextResponse.json({
        success: false,
        error: 'End date must be after or equal to start date'
      }, { status: 400 })
    }
    
    // Get property ID (use first available if not provided)
    let actualPropertyId = propertyId
    if (!actualPropertyId) {
      const property = await db.getProperty()
      if (!property) {
        return NextResponse.json({
          success: false,
          error: 'No property found'
        }, { status: 400 })
      }
      actualPropertyId = property.id
    }
    
    // Check if dates overlap with existing reservations
    const conflictingReservations = await db.getConflictingReservations(startDate, endDate)
    if (conflictingReservations.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot block this date - there is an existing reservation. Please choose a different date or cancel the reservation first.',
        conflicts: conflictingReservations
      }, { status: 400 })
    }
    
    const blockedPeriod = await db.createBlockedPeriod(
      actualPropertyId,
      startDate,
      endDate,
      reason
    )
    
    return NextResponse.json({
      success: true,
      message: 'Dates blocked successfully',
      blockedPeriod
    })
  } catch (error) {
    console.error('Error creating blocked period:', error)
    
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
      error: 'Failed to block dates'
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Blocked period ID is required'
      }, { status: 400 })
    }
    
    await db.deleteBlockedPeriod(id)
    
    return NextResponse.json({
      success: true,
      message: 'Blocked period deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting blocked period:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete blocked period'
    }, { status: 500 })
  }
}