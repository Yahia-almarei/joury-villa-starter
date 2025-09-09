import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Coupon ID is required'
      }, { status: 400 })
    }

    const supabase = createServerClient()

    // Delete coupon using service role
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting coupon:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to delete coupon: ${error.message}`
      }, { status: 400 })
    }

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        action: 'COUPON_DELETED',
        target_type: 'coupon',
        target_id: id
      })
    } catch (logError) {
      console.warn('Failed to log action:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    })

  } catch (error) {
    console.error('Coupon deletion error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete coupon'
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Coupon ID is required'
      }, { status: 400 })
    }

    const supabase = createServerClient()

    // Toggle coupon active status
    const { data, error } = await supabase
      .from('coupons')
      .update({ is_active: body.is_active })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error toggling coupon:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to toggle coupon: ${error.message}`
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      coupon: data?.[0] || null,
      message: 'Coupon toggled successfully'
    })

  } catch (error) {
    console.error('Coupon toggle error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to toggle coupon'
    }, { status: 500 })
  }
}