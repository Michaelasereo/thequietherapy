'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function PartnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Partner error caught:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Partner Portal Error
        </h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'Something went wrong in the partner portal'}
        </p>
        <div className="space-x-4">
          <Button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/partner/auth'}
            variant="outline"
          >
            Go to Partner Portal
          </Button>
        </div>
      </div>
    </div>
  )
}
