'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

const ADMIN_EMAIL = 'jouryvillaa@gmail.com'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Verify this is the admin email
    if (email !== ADMIN_EMAIL) {
      setError('Invalid admin credentials')
      setLoading(false)
      return
    }
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })
      
      if (result?.error) {
        setError('Invalid credentials')
        return
      }
      
      // Success - redirect to admin dashboard
      router.push('/admin')
      router.refresh()
      
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-coral">
            Joury Villa
          </Link>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Admin Portal</h2>
          <p className="mt-2 text-gray-600">Sign in to your admin account</p>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Lock className="w-6 h-6 text-coral" />
              Admin Login
            </CardTitle>
            <CardDescription className="text-center">
              Restricted access for authorized personnel only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-coral hover:bg-coral/90"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Link 
                href="/"
                className="text-sm text-coral hover:text-coral/80 font-medium"
              >
                ← Back to Villa Website
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>This is a secure admin area.</p>
          <p>Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  )
}