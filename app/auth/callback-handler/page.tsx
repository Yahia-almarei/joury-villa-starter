'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function CallbackHandler() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') {
      console.log('⏳ Session loading...')
      return
    }

    if (status === 'unauthenticated') {
      console.log('❌ Not authenticated, redirecting to sign-in')
      router.push('/auth/signin')
      return
    }

    if (session?.user) {
      console.log('✅ Session found:', session.user)
      console.log('👤 User role:', session.user.role)
      
      if (session.user.role === 'ADMIN') {
        console.log('🔀 Redirecting admin to /admin')
        router.push('/admin')
      } else {
        console.log('🔀 Redirecting customer to phone setup check')
        // For customers, check if phone number is provided
        checkPhoneStatus()
      }
    }
  }, [session, status, router])

  const checkPhoneStatus = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const profile = await response.json()
        if (profile.phone && profile.phone.trim()) {
          console.log('📱 Phone number already provided, redirecting to /')
          router.push('/')
        } else {
          console.log('📱 Phone number needed, redirecting to phone setup')
          router.push('/auth/phone-setup')
        }
      } else {
        // If profile doesn't exist or error, redirect to phone setup
        console.log('📱 No profile found, redirecting to phone setup')
        router.push('/auth/phone-setup')
      }
    } catch (error) {
      console.error('Error checking phone status:', error)
      // On error, redirect to phone setup to be safe
      router.push('/auth/phone-setup')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Completing sign-in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}