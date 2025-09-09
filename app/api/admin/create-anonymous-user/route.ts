import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name } = body
    
    // If specific email and name provided, create/find that user
    if (email && name) {
      // Check if user already exists
      const existingUser = await db.findUserByEmail(email)
      
      if (existingUser) {
        return NextResponse.json({
          success: true,
          message: 'User already exists',
          userId: existingUser.id
        })
      }

      // Create new user
      const newUser = await db.createUser({
        email: email,
        password_hash: 'guest', // Not used for authentication
        role: 'CUSTOMER',
        state: 'active',
        email_verified: new Date().toISOString()
      })

      // Create customer profile
      await db.createCustomerProfile({
        user_id: newUser.id,
        full_name: name,
        phone: null,
        country: null,
        notes: 'Guest user created by admin'
      })

      return NextResponse.json({
        success: true,
        message: 'Guest user created',
        userId: newUser.id
      })
    }

    // Default: create/get anonymous user
    const existingUser = await db.findUserByEmail('anonymous@jouryvilla.internal')
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Anonymous user already exists',
        userId: existingUser.id
      })
    }

    // Create anonymous user for guest bookings
    const anonymousUser = await db.createUser({
      email: 'anonymous@jouryvilla.internal',
      password_hash: 'anonymous', // Not used for authentication
      role: 'CUSTOMER',
      state: 'active',
      email_verified: new Date().toISOString()
    })

    // Create customer profile
    await db.createCustomerProfile({
      user_id: anonymousUser.id,
      full_name: 'Anonymous Guest',
      phone: null,
      country: null,
      notes: 'System user for anonymous guest bookings'
    })

    return NextResponse.json({
      success: true,
      message: 'Anonymous user created',
      userId: anonymousUser.id
    })
  } catch (error) {
    console.error('Error creating anonymous user:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create anonymous user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}