'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

type VerificationState = 'loading' | 'success' | 'error'

function VerifyEmailForm() {
  const [state, setState] = useState<VerificationState>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('Invalid verification link')
      return
    }

    const verifyEmail = async (token: string) => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setState('success')
          setEmail(data.email)
          setMessage('Your email has been successfully verified!')
          
          // Redirect to sign in after 3 seconds
          setTimeout(() => {
            router.push('/auth/signin?message=verified')
          }, 3000)
        } else {
          setState('error')
          setMessage(data.error || 'Failed to verify email')
        }
      } catch (error) {
        setState('error')
        setMessage('Failed to verify email. Please try again.')
      }
    }

    verifyEmail(token)
  }, [token, router])


  return (
    <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {state === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
              <CardTitle className="text-2xl font-bold">Verifying email...</CardTitle>
              <CardDescription>
                Please wait while we verify your email address
              </CardDescription>
            </>
          )}
          
          {state === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <CardTitle className="text-2xl font-bold">Email verified!</CardTitle>
              <CardDescription>
                Your account has been successfully verified
              </CardDescription>
            </>
          )}
          
          {state === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <CardTitle className="text-2xl font-bold">Verification failed</CardTitle>
              <CardDescription>
                We couldn&apos;t verify your email address
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">{message}</p>
          
          {state === 'success' && (
            <>
              {email && (
                <p className="text-sm font-medium">
                  Email: <span className="text-primary">{email}</span>
                </p>
              )}
              <p className="text-sm text-gray-600">
                You can now sign in to your account. You&apos;ll be redirected automatically in a few seconds.
              </p>
            </>
          )}
          
          {state === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                This could happen if the verification link has expired or has already been used.
              </p>
              <Link href="/auth/resend-verification">
                <Button variant="outline" className="w-full">
                  Request new verification email
                </Button>
              </Link>
            </div>
          )}

          <div className="pt-4 space-y-2">
            <Link href="/auth/signin">
              <Button 
                variant={state === 'success' ? 'default' : 'outline'} 
                className="w-full"
              >
                {state === 'success' ? 'Sign in now' : 'Back to Sign In'}
              </Button>
            </Link>
            
            {state !== 'success' && (
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  Back to Home
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
  )
}

function VerifyEmailPageFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
        <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
        <CardDescription>
          Please wait while we prepare the verification page
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-gray-600">
          This may take a moment
        </p>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<VerifyEmailPageFallback />}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  )
}