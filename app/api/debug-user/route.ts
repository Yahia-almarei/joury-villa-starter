import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Debug - Session user:', session.user.email, session.user.role)
    
    // Get user from database
    const dbUser = await db.findUserByEmail(session.user.email)
    
    console.log('🔍 Debug - Database user found:', !!dbUser)
    console.log('🔍 Debug - Database user role:', dbUser?.role)
    console.log('🔍 Debug - Customer profiles:', dbUser?.customer_profiles)
    
    return NextResponse.json({
      sessionUser: session.user,
      dbUser: dbUser,
      customerProfiles: dbUser?.customer_profiles || [],
      customerProfileCount: dbUser?.customer_profiles?.length || 0
    })
  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json({ 
      error: 'Failed to debug user' 
    }, { status: 500 })
  }
}