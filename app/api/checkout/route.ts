import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from '@/lib/database'
import { addMinutes, eachDayOfInterval, addDays } from "date-fns"
import { 
  withRateLimit, 
  validateSchema, 
  getClientIp, 
  logApiCall,
  authenticate 
} from "@/lib/api-utils"
import { createHold } from "@/lib/booking"

const checkoutSchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-in date format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-out date format"),
  total: z.number().positive(),
  holdToken: z.string(),
})

type CheckoutData = z.infer<typeof checkoutSchema>

async function handleCheckout(request: NextRequest, data: CheckoutData) {
  try {
    // Check authentication status
    const sessionUser = await authenticate(request);
    if (!sessionUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    logApiCall('CHECKOUT_REQUEST', sessionUser.id, {
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      total: data.total,
      ip: getClientIp(request)
    })

    // Get property data
    const property = await db.getProperty()
    if (!property) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 })
    }

    // Convert dates
    const checkInDate = new Date(data.checkIn)
    const checkOutDate = new Date(data.checkOut)

    // Create the reservation hold with authenticated user
    const holdResult = await createHold(
      property.id,
      checkInDate,
      checkOutDate,
      data.total,
      data.holdToken,
      sessionUser.id
    )

    if (!holdResult.success) {
      logApiCall('CHECKOUT_ERROR', undefined, {
        error: holdResult.error,
        checkIn: data.checkIn,
        checkOut: data.checkOut
      })

      return NextResponse.json({
        success: false,
        error: holdResult.error || 'Failed to create reservation'
      }, { status: 400 })
    }

    // Calculate nights for detailed breakdown
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Update the reservation status to require admin approval
    const updatedReservation = await db.updateReservation(holdResult.reservationId!, {
      status: 'AWAITING_APPROVAL' // Always require admin approval
    })

    logApiCall('CHECKOUT_SUCCESS', sessionUser.id, {
      reservationId: holdResult.reservationId,
      total: data.total,
      status: updatedReservation.status
    })

    return NextResponse.json({
      success: true,
      reservationId: holdResult.reservationId,
      status: updatedReservation.status,
      message: 'Your reservation has been created and is awaiting admin approval. You will receive a confirmation email once approved.'
    })

  } catch (error) {
    console.error('Checkout error:', error)
    
    logApiCall('CHECKOUT_ERROR', undefined, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to create reservation',
      details: 'Please try again or contact support'
    }, { status: 500 })
  }
}

export const POST = withRateLimit(
  (request) => getClientIp(request),
  5, // 5 checkout attempts per minute
  60000,
  validateSchema(checkoutSchema)(handleCheckout as any)
)
