import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from '@/lib/supabase'

const createCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  discount_type: z.enum(["percentage", "amount"]),
  percent_off: z.number().optional(),
  amount_off: z.number().optional(),
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching coupons:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch coupons'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      coupons: coupons || []
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

    // Prepare coupon data
    const couponData: any = {
      code: validatedData.code.toUpperCase(),
      valid_from: validatedData.valid_from || null,
      valid_to: validatedData.valid_to || null,
      min_nights: validatedData.min_nights || null,
      is_active: validatedData.is_active,
      is_public: validatedData.is_public,
    }

    // Set discount fields based on type
    if (validatedData.discount_type === 'percentage') {
      couponData.percent_off = validatedData.percent_off || null
      couponData.amount_off = null
    } else {
      couponData.amount_off = validatedData.amount_off || null
      couponData.percent_off = null
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
      valid_from: couponData.valid_from || null,
      valid_to: couponData.valid_to || null,
      min_nights: couponData.min_nights || null,
      is_active: couponData.is_active,
      is_public: couponData.is_public,
    }

    // Set discount fields based on type
    if (couponData.discount_type === 'percentage') {
      updateData.percent_off = couponData.percent_off || null
      updateData.amount_off = null
    } else {
      updateData.amount_off = couponData.amount_off || null
      updateData.percent_off = null
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