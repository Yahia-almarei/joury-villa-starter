import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// PUT - Update booking policy
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = params
    const body = await request.json()
    const {
      description_en,
      description_ar,
      is_active
    } = body

    // Validate required fields
    if (!description_en) {
      return NextResponse.json(
        { error: 'Missing required field: description_en' },
        { status: 400 }
      )
    }

    const { data: policy, error } = await supabase
      .from('booking_policies')
      .update({
        description_en,
        description_ar,
        is_active
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking policy:', error)
      return NextResponse.json(
        { error: 'Failed to update booking policy' },
        { status: 500 }
      )
    }

    if (!policy) {
      return NextResponse.json(
        { error: 'Booking policy not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ policy })
  } catch (error) {
    console.error('Error in PUT /api/admin/booking-policies/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete booking policy
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = params

    const { error } = await supabase
      .from('booking_policies')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting booking policy:', error)
      return NextResponse.json(
        { error: 'Failed to delete booking policy' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/booking-policies/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}