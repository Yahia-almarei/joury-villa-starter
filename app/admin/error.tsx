'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Admin page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong!
          </h2>
          
          <p className="text-gray-600 mb-6">
            {error.message === 'Jest worker encountered 2 child process exceptions, exceeding retry limit' 
              ? 'The server is experiencing high load. Please try again in a moment.'
              : 'An error occurred while loading the admin dashboard.'}
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={reset}
              className="w-full bg-coral hover:bg-coral/90"
            >
              Try again
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go to homepage
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Error details (development only)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

