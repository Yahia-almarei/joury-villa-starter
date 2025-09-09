import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/database'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    
    const reservation = await db.findReservationById(params.id)
    
    if (!reservation) {
      return NextResponse.json({
        success: false,
        error: 'Reservation not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      reservation
    })
  } catch (error) {
    console.error('Error fetching reservation:', error)
    
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
      error: 'Failed to fetch reservation'
    }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    
    const updateData = await req.json()
    
    // Update reservation
    const reservation = await db.updateReservation(params.id, {
      ...updateData,
      updated_at: new Date().toISOString()
    })
    
    // Log the action
    const actionMap: Record<string, string> = {
      'APPROVED': 'RESERVATION_APPROVED',
      'CANCELLED': 'RESERVATION_DECLINED',
      'PAID': 'RESERVATION_PAID'
    }
    
    if (updateData.status && actionMap[updateData.status]) {
      await db.createAuditLog({
        action: actionMap[updateData.status],
        target_type: 'reservation',
        target_id: params.id,
        payload: updateData,
        created_at: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Reservation updated successfully',
      reservation
    })
  } catch (error) {
    console.error('Error updating reservation:', error)
    
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
      error: 'Failed to update reservation'
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    
    const reservation = await db.deleteReservation(params.id)
    
    if (!reservation) {
      return NextResponse.json({
        success: false,
        error: 'Reservation not found'
      }, { status: 404 })
    }
    
    // Log the action
    await db.createAuditLog({
      action: 'RESERVATION_DELETED',
      target_type: 'reservation',
      target_id: params.id,
      payload: { deleted: true },
      created_at: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      message: 'Reservation deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting reservation:', error)
    
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
      error: 'Failed to delete reservation'
    }, { status: 500 })
  }
}