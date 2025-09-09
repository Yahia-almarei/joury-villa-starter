import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get only public, active coupons
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('id, code, percent_off, amount_off, min_nights, valid_from, valid_to')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching public coupons:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch coupons'
      }, { status: 500 })
    }

    // Filter out expired coupons on the server side
    const now = new Date()
    const activeCoupons = (coupons || []).filter(coupon => {
      // Check if coupon is not expired
      if (coupon.valid_to && new Date(coupon.valid_to) < now) {
        return false
      }
      
      // Check if coupon is already valid
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return false
      }
      
      return true
    })

    return NextResponse.json({
      success: true,
      coupons: activeCoupons
    })

  } catch (error) {
    console.error('Public coupons fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch coupons'
    }, { status: 500 })
  }
}