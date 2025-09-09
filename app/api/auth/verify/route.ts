import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyEmailToken } from '@/lib/email-verification'

const verifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifySchema.parse(body)

    const result = await verifyEmailToken(token)

    if (result.success) {
      return NextResponse.json({
        message: 'Email verified successfully',
        email: result.email
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Email verification error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}