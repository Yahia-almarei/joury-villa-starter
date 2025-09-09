import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

const supabase = createServerClient()

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  state: 'active' | 'blocked'
  emailVerified?: Date | null
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const userLimits = rateLimitStore.get(identifier)
  
  if (!userLimits || now > userLimits.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimits.count >= maxRequests) {
    return false
  }
  
  userLimits.count++
  return true
}

export async function authenticate(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret',
      salt: process.env.NEXTAUTH_SALT || 'authjs.session-token'
    })
    
    if (!token || !token.sub) {
      return null
    }

    // Get fresh user data to ensure account isn't blocked
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', token.sub)
      .single()

    if (!user || user.state === 'blocked') {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      state: user.state,
      emailVerified: user.email_verified ? new Date(user.email_verified) : null
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await authenticate(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return handler(request, user)
  }
}

export function requireRole(role: 'ADMIN' | 'CUSTOMER', handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
  return requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
    if (user.role !== role) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return handler(request, user)
  })
}

export function requireEmailVerified(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
  return requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Email verification required' },
        { status: 403 }
      )
    }

    return handler(request, user)
  })
}

export function withRateLimit(
  identifier: (request: NextRequest) => string,
  maxRequests: number = 10,
  windowMs: number = 60000,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const id = identifier(request)
    
    if (!rateLimit(id, maxRequests, windowMs)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    return handler(request)
  }
}

export function validateSchema<T, U>(schema: z.ZodSchema<T, any, U>) {
  return (handler: (request: NextRequest, data: T) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      try {
        const body = await request.json()
        const data = schema.parse(body)
        return handler(request, data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { 
              error: 'Validation error',
              details: error.errors.map(e => ({ 
                path: e.path.join('.'), 
                message: e.message 
              }))
            },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        )
      }
    }
  }
}

export function validateSchemaWithAuth<T, U>(schema: z.ZodSchema<T, any, U>) {
  return (handler: (request: NextRequest, user: AuthenticatedUser, data: T) => Promise<NextResponse>) => {
    return async (request: NextRequest, user: AuthenticatedUser) => {
      try {
        const body = await request.json()
        const data = schema.parse(body)
        return handler(request, user, data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { 
              error: 'Validation error',
              details: error.errors.map(e => ({ 
                path: e.path.join('.'), 
                message: e.message 
              }))
            },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        )
      }
    }
  }
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

export function logApiCall(action: string, userId?: string, details?: any) {
  // In development, just log to console
  // In production, this would go to your logging service
  console.log({
    timestamp: new Date().toISOString(),
    action,
    userId,
    details
  })
}