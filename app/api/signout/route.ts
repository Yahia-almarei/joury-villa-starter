import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Clear NextAuth cookies
    const cookieStore = cookies()
    const cookieNames = [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      'authjs.session-token',
      'authjs.callback-url',
      'authjs.csrf-token'
    ]

    const response = NextResponse.json({ success: true })

    // Clear all auth-related cookies
    cookieNames.forEach(name => {
      response.cookies.delete(name)
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    return response
  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json({ success: false, error: 'Failed to sign out' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}