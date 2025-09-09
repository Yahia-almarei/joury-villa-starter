import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resendVerificationEmail } from '@/lib/email-verification'

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resendSchema.parse(body)

    const result = await resendVerificationEmail(email.toLowerCase())

    if (result.success) {
      return NextResponse.json({
        message: 'Verification email sent successfully'
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Resend verification error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}