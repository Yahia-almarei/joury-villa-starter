import { NextRequest, NextResponse } from 'next/server'
import { createAdminIfNotExists } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const result = await createAdminIfNotExists()
    
    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Admin user created successfully',
        email: result.email
      })
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'Admin user already exists'
      })
    }
  } catch (error) {
    console.error('Error initializing admin:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to initialize admin user' 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Admin initialization endpoint. Use POST to create admin user.' 
  })
}