import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendVerificationEmail } from '@/lib/email-verification'

const supabase = createServerClient()

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  country: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, phone, country } = signUpSchema.parse(body)

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1)

    const existingUser = existingUsers?.[0]

    if (existingUser) {
      if (existingUser.email_verified) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        )
      } else {
        // User exists but email not verified - resend verification
        const result = await sendVerificationEmail(email, fullName)
        if (result.success) {
          return NextResponse.json({
            message: 'Verification email sent. Please check your inbox to verify your account.'
          })
        } else {
          return NextResponse.json(
            { error: 'Failed to send verification email' },
            { status: 500 }
          )
        }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and profile
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        role: 'CUSTOMER',
        state: 'active',
      })
      .select()
      .single()

    if (userError || !newUser) {
      console.error('Failed to create user:', userError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Create customer profile
    const { error: profileError } = await supabase
      .from('customer_profiles')
      .insert({
        user_id: newUser.id,
        full_name: fullName,
        phone: phone || null,
        country: country || null,
      })

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      // Continue anyway - profile creation is not critical for account creation
    }

    const user = newUser

    // Send verification email
    const emailResult = await sendVerificationEmail(email, fullName)
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      // Don't fail the registration if email sending fails
    }

    // Log the signup
    await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: user.id,
        action: 'USER_SIGNUP',
        target_type: 'User',
        target_id: user.id,
        payload: {
          email: user.email,
          fullName,
          signupAt: new Date()
        }
      })

    return NextResponse.json({
      message: 'Account created successfully. Please check your email to verify your account.'
    })

  } catch (error) {
    console.error('Signup error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}