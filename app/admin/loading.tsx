import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-coral animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading Admin Dashboard
        </h2>
        <p className="text-gray-600">
          Please wait while we fetch your data...
        </p>
      </div>
    </div>
  )
}

