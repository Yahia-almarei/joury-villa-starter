import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from '@/lib/supabase'

const createCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  discount_type: z.enum(["percentage", "amount"]),
  percent_off: z.number().optional(),
  amount_off: z.number().optional(),
  max_uses: z.number().optional(),
  valid_from: z.string().nullable().optional(),
  valid_to: z.string().nullable().optional(),
  min_nights: z.number().nullable().optional(),
  is_active: z.boolean().default(true),
  is_public: z.boolean().default(false),
})

const updateCouponSchema = createCouponSchema.extend({
  id: z.string().uuid(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('valid_from', { ascending: false })

    if (error) {
      console.error('Error fetching coupons:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch coupons'
      }, { status: 500 })
    }


    // Transform coupons to match frontend expectations
    const transformedCoupons = (coupons || []).map(coupon => ({
      ...coupon,
      // Map database fields to frontend fields
      percent_off: coupon.discount_type === 'PERCENTAGE' ? coupon.discount_value : null,
      amount_off: coupon.discount_type === 'FIXED_AMOUNT' ? coupon.discount_value : null,
      valid_to: coupon.valid_until // Map valid_until to valid_to
    }))

    return NextResponse.json({
      success: true,
      coupons: transformedCoupons
    })

  } catch (error) {
    console.error('Coupon fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch coupons'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCouponSchema.parse(body)

    const supabase = createServerClient()

    // Prepare coupon data to match actual database schema
    const couponData: any = {
      code: validatedData.code.toUpperCase(),
      discount_type: validatedData.discount_type === 'percentage' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
      discount_value: validatedData.discount_type === 'percentage' ? validatedData.percent_off : validatedData.amount_off,
      max_uses: validatedData.max_uses || 1,
      used_count: 0,
      valid_from: validatedData.valid_from,
      valid_until: validatedData.valid_to,
      min_nights: validatedData.min_nights || null,
      is_active: validatedData.is_active,
      is_public: validatedData.is_public
    }

    // Create coupon using service role
    const { data, error } = await supabase
      .from('coupons')
      .insert([couponData])
      .select()

    if (error) {
      console.error('Error creating coupon:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to create coupon: ${error.message}`
      }, { status: 400 })
    }

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        action: 'COUPON_CREATED',
        target_type: 'coupon',
        target_id: couponData.code,
        payload: couponData
      })
    } catch (logError) {
      console.warn('Failed to log action:', logError)
    }

    return NextResponse.json({
      success: true,
      coupon: data?.[0] || null,
      message: 'Coupon created successfully'
    })

  } catch (error) {
    console.error('Coupon creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create coupon'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateCouponSchema.parse(body)

    const supabase = createServerClient()

    // Prepare coupon data (excluding id)
    const { id, ...couponData } = validatedData

    const updateData: any = {
      code: couponData.code.toUpperCase(),
      discount_type: couponData.discount_type === 'percentage' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
      discount_value: couponData.discount_type === 'percentage' ? couponData.percent_off : couponData.amount_off,
      max_uses: couponData.max_uses || 1,
      valid_from: couponData.valid_from,
      valid_until: couponData.valid_to,
      min_nights: couponData.min_nights || null,
      is_active: couponData.is_active,
      is_public: couponData.is_public,
    }

    // Update coupon using service role
    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating coupon:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to update coupon: ${error.message}`
      }, { status: 400 })
    }

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        action: 'COUPON_UPDATED',
        target_type: 'coupon',
        target_id: id,
        payload: updateData
      })
    } catch (logError) {
      console.warn('Failed to log action:', logError)
    }

    return NextResponse.json({
      success: true,
      coupon: data?.[0] || null,
      message: 'Coupon updated successfully'
    })

  } catch (error) {
    console.error('Coupon update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update coupon'
    }, { status: 500 })
  }
}