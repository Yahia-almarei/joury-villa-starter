import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { quote, QuoteInput } from "@/lib/booking"
import { withRateLimit, validateSchema, getClientIp, logApiCall } from "@/lib/api-utils"

const quoteSchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-in date format (YYYY-MM-DD)"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-out date format (YYYY-MM-DD)"),
  coupon: z.string().optional().nullable(),
  propertyId: z.string().optional().default("joury-villa")
}).transform(data => ({
  ...data,
  propertyId: data.propertyId || "joury-villa"
}))

type QuoteData = {
  checkIn: string;
  checkOut: string;
  coupon?: string | null;
  propertyId: string;
}

async function handleQuote(request: NextRequest, data: QuoteData) {
  try {
    logApiCall('QUOTE_REQUEST', undefined, {
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      coupon: data.coupon ? '[REDACTED]' : undefined,
      ip: getClientIp(request)
    })

    const quoteInput: QuoteInput = {
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      coupon: data.coupon,
      propertyId: data.propertyId
    }

    const result = await quote(quoteInput)

    if (result.success) {
      logApiCall('QUOTE_SUCCESS', undefined, {
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        total: result.total,
        currency: result.currency,
        nights: result.nights
      })
    } else {
      logApiCall('QUOTE_ERROR', undefined, {
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        error: result.error
      })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Quote API error:', error)
    
    logApiCall('QUOTE_ERROR', undefined, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to calculate quote',
      details: 'Please try again or contact support'
    }, { status: 500 })
  }
}

export const POST = withRateLimit(
  (request) => getClientIp(request),
  30, // 30 requests per minute for quotes
  60000,
  validateSchema(quoteSchema)(handleQuote as any)
)
