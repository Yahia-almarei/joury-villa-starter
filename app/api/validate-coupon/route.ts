import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from '@/lib/supabase'

const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  checkIn: z.string().nullable(),
  checkOut: z.string().nullable(), 
  nights: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, checkIn, checkOut, nights } = validateCouponSchema.parse(body)

    const supabase = createServerClient()

    // Find the coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !coupon) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coupon code'
      }, { status: 400 })
    }

    // No date validation - coupons work for any dates

    // Check minimum nights requirement
    if (coupon.min_nights && nights && nights < coupon.min_nights) {
      return NextResponse.json({
        success: false,
        error: `This coupon requires a minimum of ${coupon.min_nights} nights`
      }, { status: 400 })
    }

    // Build discount description
    let discountText = ''
    if (coupon.percent_off) {
      discountText = `${coupon.percent_off}% discount`
    } else if (coupon.amount_off) {
      discountText = `₪${coupon.amount_off} discount`
    }

    return NextResponse.json({
      success: true,
      discount: discountText,
      coupon: {
        code: coupon.code,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
        min_nights: coupon.min_nights
      }
    })

  } catch (error) {
    console.error('Coupon validation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to validate coupon'
    }, { status: 500 })
  }
}