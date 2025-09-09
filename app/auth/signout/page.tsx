'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        // Clear NextAuth session and redirect
        await signOut({ 
          callbackUrl: '/',
          redirect: false 
        })
        // Force redirect after sign out
        router.push('/')
        router.refresh()
      } catch (error) {
        console.error('Sign out error:', error)
        // Fallback: force redirect
        window.location.href = '/'
      }
    }

    handleSignOut()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Signing you out...</h1>
        <p className="text-gray-600">Please wait while we sign you out securely.</p>
      </div>
    </div>
  )
}