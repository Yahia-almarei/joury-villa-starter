'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface CustomerProfile {
  full_name: string
  phone: string
  country: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<CustomerProfile>({
    full_name: '',
    phone: '',
    country: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/profile')
      return
    }

    if (session?.user) {
      fetchProfile()
    }
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      setError('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save profile')
      }

      setSuccess('Profile updated successfully!')
      await fetchProfile() // Refresh the data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }


  if (status === 'loading' || isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground">
          Update your personal information and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Keep your profile information up to date
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={session.user.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Used for booking confirmations and updates
              </p>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                type="text"
                value={profile.country}
                onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Enter your country"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/account')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}