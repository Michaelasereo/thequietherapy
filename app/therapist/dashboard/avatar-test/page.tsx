'use client'

import { useTherapistUser } from '@/context/therapist-user-context'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function AvatarTestPage() {
  const [mounted, setMounted] = useState(false)
  const [apiData, setApiData] = useState<any>(null)
  const { therapistUser, loading, refreshTherapist } = useTherapistUser()
  const { user } = useAuth()
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered')
    await refreshTherapist()
    setRefreshCount(prev => prev + 1)
  }

  const handleDirectAPITest = async () => {
    console.log('🧪 Testing direct API call...')
    try {
      const response = await fetch('/api/therapist/profile?t=' + Date.now(), {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      })
      
      console.log('🧪 Response status:', response.status)
      console.log('🧪 Response ok:', response.ok)
      console.log('🧪 Response headers:', Object.fromEntries(response.headers.entries()))
      
      const rawText = await response.text()
      console.log('🧪 Raw response text:', rawText)
      
      let data
      try {
        data = JSON.parse(rawText)
      } catch (e) {
        console.error('❌ Failed to parse JSON:', e)
        setApiData({ error: 'Failed to parse response', rawText })
        return
      }
      
      console.log('🧪 Parsed API response:', data)
      console.log('🧪 API response keys:', Object.keys(data))
      console.log('🧪 data.success:', data.success)
      console.log('🧪 data.therapist:', data.therapist)
      console.log('🧪 data.error:', data.error)
      console.log('🧪 Full data object:', JSON.stringify(data, null, 2))
      
      if (data.therapist) {
        console.log('✅ Therapist object found!')
        console.log('🧪 Profile Image URL from direct API:', data.therapist?.profile_image_url)
        setApiData(data)
      } else {
        console.error('❌ API returned no therapist object!')
        console.error('❌ This is likely an auth error or API error')
        setApiData(data) // Store the whole response to see what we got
      }
    } catch (error) {
      console.error('🧪 Direct API test failed:', error)
      setApiData({ error: String(error) })
    }
  }

  if (!mounted) {
    return <div className="p-6">Mounting...</div>
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading therapist data...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Avatar Diagnostic Test</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Context ({refreshCount})
          </Button>
          <Button onClick={handleDirectAPITest} variant="secondary">
            Test Direct API
          </Button>
        </div>
      </div>

      {/* Auth Context Data */}
      <Card>
        <CardHeader>
          <CardTitle>Auth Context (useAuth)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>ID:</strong> {user?.id || 'null'}</p>
            <p><strong>Email:</strong> {user?.email || 'null'}</p>
            <p><strong>Full Name:</strong> {user?.full_name || 'null'}</p>
            <p><strong>User Type:</strong> {user?.user_type || 'null'}</p>
            <p><strong>Avatar URL:</strong> {user?.avatar_url || 'undefined/null'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Therapist Context Data */}
      <Card>
        <CardHeader>
          <CardTitle>Therapist Context (useTherapistUser)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>ID:</strong> {therapistUser?.id || 'null'}</p>
            <p><strong>Email:</strong> {therapistUser?.email || 'null'}</p>
            <p><strong>Full Name:</strong> {therapistUser?.full_name || 'null'}</p>
            <p className="text-green-600 font-bold">
              <strong>Profile Image URL:</strong> {therapistUser?.profile_image_url || 'undefined/null'}
            </p>
            <p><strong>Has profile_image_url Field:</strong> {'profile_image_url' in (therapistUser || {}) ? 'Yes' : 'No'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Display Test */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar Rendering Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Using therapistUser profile_image_url */}
            <div>
              <p className="text-sm font-medium mb-2">From therapistUser.profile_image_url:</p>
              <Avatar className="w-24 h-24">
                <AvatarImage src={therapistUser?.profile_image_url} alt="Test 1" />
                <AvatarFallback>T1</AvatarFallback>
              </Avatar>
              <p className="text-xs mt-1 break-all">{therapistUser?.profile_image_url || 'No URL'}</p>
            </div>

            {/* Using API data */}
            <div>
              <p className="text-sm font-medium mb-2">From Direct API:</p>
              <Avatar className="w-24 h-24">
                <AvatarImage src={apiData?.therapist?.profile_image_url} alt="Test 2" />
                <AvatarFallback>T2</AvatarFallback>
              </Avatar>
              <p className="text-xs mt-1 break-all">{apiData?.therapist?.profile_image_url || 'No URL'}</p>
            </div>

            {/* Direct URL test */}
            <div>
              <p className="text-sm font-medium mb-2">Direct hardcoded URL test:</p>
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src="https://frzciymslvpohhyefmtr.supabase.co/storage/v1/object/public/profile-images/therapist-profiles/therapist-77eeefa4-7e39-4683-af4e-c6baa782591b-1760722896122.jpeg" 
                  alt="Test 3" 
                />
                <AvatarFallback>T3</AvatarFallback>
              </Avatar>
              <p className="text-xs mt-1">Hardcoded URL</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Direct API Data (if tested) */}
      {apiData && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Direct API Response (Click "Test Direct API" button)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm mb-4">
              <p className="font-bold">
                Has 'therapist' property: {apiData.therapist ? '✅ Yes' : '❌ No'}
              </p>
              <p className="font-bold text-green-900">
                Profile Image URL: {apiData.therapist?.profile_image_url || '❌ NOT PRESENT'}
              </p>
              <p className="text-red-600 font-bold">
                Error: {apiData.error || 'None'}
              </p>
              <p className="font-bold">
                Success: {apiData.success ? '✅ True' : '❌ False/Undefined'}
              </p>
            </div>
            <p className="text-xs font-medium mb-2">Full API Response:</p>
            <pre className="text-xs bg-white p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Full Therapist Object */}
      <Card>
        <CardHeader>
          <CardTitle>Therapist Context Object (JSON)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(therapistUser, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">🔍 How to Use This Test</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>1. Click "Test Direct API" to see what the API actually returns</p>
          <p>2. Check browser console for detailed logs</p>
          <p>3. Click "Refresh Context" to force reload therapist data</p>
          <p>4. Compare what the API returns vs what the context has</p>
          <p>5. Check if the hardcoded URL (Test 3) displays correctly</p>
          <p className="mt-4 font-bold">Expected: Test 3 should show an image. If Test 1 and Test 2 don't, it means context doesn't have the profile_image_url.</p>
        </CardContent>
      </Card>
    </div>
  )
}

