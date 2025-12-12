import { NextRequest, NextResponse } from 'next/server'
import { createAdminIfNotExists } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const admin = await createAdminIfNotExists()

    if (admin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user created/verified successfully',
        email: admin.email
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create admin user'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup admin',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}