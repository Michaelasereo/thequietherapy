'use client'
import { useEffect, useState } from 'react'

interface DiagnosticsData {
  environment: string
  hasSupabaseUrl: boolean
  hasSupabaseKey: boolean
  supabaseUrlLength: number
  supabaseKeyLength: number
  responseTime: number
  source: string
  supabaseConnected: boolean
  recordCount: number
  error?: string
}

interface APIResponse {
  success: boolean
  data: {
    raised: number
    donors: number
    totalRecords: number
  }
  diagnostics: DiagnosticsData
  timestamp: number
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<APIResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkDiagnostics = async () => {
      try {
        const response = await fetch('/api/donations/stats')
        const data = await response.json()
        setDiagnostics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    checkDiagnostics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Production Diagnostics</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">Loading diagnostics...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Production Diagnostics</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const diag = diagnostics?.diagnostics

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Production Diagnostics</h1>
        
        {/* Environment Status */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Environment Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded ${diag?.environment === 'production' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
              <strong>Environment:</strong> {diag?.environment || 'Unknown'}
            </div>
            <div className={`p-3 rounded ${diag?.hasSupabaseUrl ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <strong>Supabase URL:</strong> {diag?.hasSupabaseUrl ? 'Present' : 'Missing'}
            </div>
            <div className={`p-3 rounded ${diag?.hasSupabaseKey ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <strong>Supabase Key:</strong> {diag?.hasSupabaseKey ? 'Present' : 'Missing'}
            </div>
            <div className={`p-3 rounded ${diag?.supabaseConnected ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <strong>Connection:</strong> {diag?.supabaseConnected ? 'Connected' : 'Failed'}
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Database Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded ${diag?.source === 'live_database' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
              <strong>Data Source:</strong> {diag?.source || 'Unknown'}
            </div>
            <div className="p-3 rounded bg-blue-50 text-blue-800">
              <strong>Total Records:</strong> {diagnostics?.data.totalRecords || 0}
            </div>
            <div className="p-3 rounded bg-blue-50 text-blue-800">
              <strong>Successful Donations:</strong> {diagnostics?.data.donors || 0}
            </div>
            <div className="p-3 rounded bg-blue-50 text-blue-800">
              <strong>Total Raised:</strong> ₦{diagnostics?.data.raised || 0}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded bg-blue-50 text-blue-800">
              <strong>Response Time:</strong> {diag?.responseTime || 0}ms
            </div>
            <div className="p-3 rounded bg-blue-50 text-blue-800">
              <strong>Timestamp:</strong> {new Date(diagnostics?.timestamp || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Raw Diagnostics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Raw Diagnostics Data</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>

        {/* Action Items */}
        {diag?.source === 'fallback' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-4">Action Required</h2>
            <ul className="list-disc list-inside text-yellow-700 space-y-2">
              <li>Check Netlify environment variables for Supabase configuration</li>
              <li>Verify Supabase project is active and accessible</li>
              <li>Ensure donations table exists in the target database</li>
              <li>Check if you have multiple Supabase projects (dev vs prod)</li>
            </ul>
          </div>
        )}

        {/* Success Message */}
        {diag?.source === 'live_database' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">✅ All Systems Operational</h2>
            <p className="text-green-700">Production database is connected and serving live donation data.</p>
          </div>
        )}
      </div>
    </div>
  )
}
