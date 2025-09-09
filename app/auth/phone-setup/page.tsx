'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CountryCodeSelect } from '@/components/country-code-select'
import { Loader2, Phone } from 'lucide-react'
import { countryCodes, type CountryCode } from '@/lib/country-codes'

export default function PhoneSetupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    countryCodes.find(c => c.code === 'US') || countryCodes[0]
  )
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirect if not authenticated or if not a customer
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.role === 'ADMIN') {
      router.push('/admin')
      return
    }

    // Check if phone is already provided
    checkPhoneStatus()
  }, [session, status, router])

  const checkPhoneStatus = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const profile = await response.json()
        if (profile.phone && profile.phone.trim()) {
          // Phone already provided, redirect to main page
          console.log('📱 Phone already provided, redirecting to home')
          router.push('/')
          return
        } else {
          console.log('📱 No phone number found, staying on setup page')
        }
      }
    } catch (error) {
      console.error('Error checking phone status:', error)
    }
  }

  const handleSavePhone = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Combine country code and phone number
      const fullPhoneNumber = selectedCountry.dialCode + phoneNumber.replace(/\D/g, '')
      
      console.log('📱 Saving phone number:', fullPhoneNumber)
      
      // First ensure customer profile exists by calling save-phone endpoint
      const saveResponse = await fetch('/api/save-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: fullPhoneNumber,
          country: selectedCountry.name
        }),
      })

      if (!saveResponse.ok) {
        const data = await saveResponse.json()
        throw new Error(data.error || 'Failed to save phone number')
      }

      const result = await saveResponse.json()
      console.log('📱 Phone save result:', result)

      // Force a hard redirect to bypass middleware caching
      window.location.href = '/'
    } catch (error) {
      console.error('📱 Phone save error:', error)
      setError(error instanceof Error ? error.message : 'Failed to save phone number')
    } finally {
      setIsLoading(false)
    }
  }

  const getFullPhoneNumber = () => {
    return selectedCountry.dialCode + phoneNumber.replace(/\D/g, '')
  }


  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session || session.user.role === 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Please provide your phone number for booking confirmations
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Phone Number Required</CardTitle>
            <CardDescription>
              Please provide your phone number for booking confirmations and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex-shrink-0">
                  <CountryCodeSelect
                    value={selectedCountry.dialCode}
                    onChange={setSelectedCountry}
                  />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => {
                    // Only allow digits and common phone formatting characters
                    const value = e.target.value.replace(/[^\d\s\-\(\)]/g, '')
                    setPhoneNumber(value)
                  }}
                  disabled={isLoading}
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-gray-500">
                Select your country and enter your phone number (without country code)
              </p>
              {phoneNumber && (
                <p className="text-xs text-blue-600 font-medium">
                  Complete number: {getFullPhoneNumber()}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSavePhone}
                disabled={isLoading || !phoneNumber.trim()}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Phone Number
              </Button>
              
            </div>

            <div className="text-xs text-gray-500 text-center">
              Your phone number will be used for booking confirmations and important updates.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}