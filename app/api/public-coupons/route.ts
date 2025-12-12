import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get booking dates from query parameters
    const { searchParams } = new URL(request.url)
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')

    // Fetch from admin API to ensure consistency
    const adminApiUrl = new URL('/api/admin/coupons', request.url)
    const response = await fetch(adminApiUrl.toString())
    const adminData = await response.json()

    if (!adminData.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch coupons'
      }, { status: 500 })
    }

    // Filter for public, active coupons with date validation
    const publicCoupons = (adminData.coupons || []).filter(coupon => {
      // Basic filters
      if (!coupon.is_active || !coupon.is_public) {
        return false
      }

      // Date validation if booking dates are provided
      if (checkIn && checkOut && coupon.valid_from && coupon.valid_to) {
        const bookingStart = new Date(checkIn)
        const bookingEnd = new Date(checkOut)
        const couponStart = new Date(coupon.valid_from)
        const couponEnd = new Date(coupon.valid_to)

        // Check if booking dates overlap with coupon validity period
        return bookingStart >= couponStart && bookingEnd <= couponEnd
      }

      return true
    })

    return NextResponse.json({
      success: true,
      coupons: publicCoupons
    })

  } catch (error) {
    console.error('Public coupons fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch coupons'
    }, { status: 500 })
  }
}