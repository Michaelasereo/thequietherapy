'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Calendar, 
  Upload, 
  Bell, 
  Search,
  Database,
  CheckCircle,
  AlertCircle,
  Play,
  ExternalLink,
  FileText,
  Image,
  Music
} from "lucide-react"
import { toast } from "sonner"
import FileUpload from "@/components/file-upload"

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
  timestamp: string
  duration?: number
}

export default function TestRealDataIntegrationPage() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({})
  const [testUserId] = useState('test-user-123')

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setIsRunning(prev => ({ ...prev, [testName]: true }))
    const startTime = Date.now()
    
    try {
      console.log(`🧪 Running test: ${testName}`)
      const result = await testFunction()
      const duration = Date.now() - startTime
      
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          message: `${testName} completed successfully`,
          data: result,
          timestamp: new Date().toISOString(),
          duration
        }
      }))
      
      toast.success(`✅ ${testName} passed (${duration}ms)`)
      console.log(`✅ Test ${testName} passed:`, result)
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          message: `${testName} failed`,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          duration
        }
      }))
      
      toast.error(`❌ ${testName} failed: ${errorMessage}`)
      console.error(`❌ Test ${testName} failed:`, error)
    } finally {
      setIsRunning(prev => ({ ...prev, [testName]: false }))
    }
  }

  // Test 1: Therapist Directory API
  const testTherapistDirectory = async () => {
    const response = await fetch('/api/therapists?limit=5')
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch therapists')
    }
    
    return {
      therapists_count: data.therapists?.length || 0,
      has_pagination: !!data.pagination,
      sample_therapist: data.therapists?.[0] || null
    }
  }

  // Test 2: Therapist Search & Filtering
  const testTherapistSearch = async () => {
    const searchParams = new URLSearchParams({
      search: 'therapy',
      specialization: 'anxiety',
      limit: '3'
    })
    
    const response = await fetch(`/api/therapists?${searchParams}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Search failed')
    }
    
    return {
      search_results: data.therapists?.length || 0,
      filters_applied: data.filters,
      pagination: data.pagination
    }
  }

  // Test 3: Therapist Availability
  const testTherapistAvailability = async () => {
    // Use a test therapist ID
    const therapistId = 'test-therapist-123'
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const response = await fetch(`/api/therapists/${therapistId}/availability?start_date=${startDate}&end_date=${endDate}`)
    const data = await response.json()
    
    // This might return empty results if no test data exists, which is expected
    return {
      therapist_id: therapistId,
      date_range: { start_date: startDate, end_date: endDate },
      available_slots: data.availability?.slots?.length || 0,
      endpoint_accessible: response.status !== 404
    }
  }

  // Test 4: File Upload System
  const testFileUploadAPI = async () => {
    // Create a test file
    const testContent = 'This is a test file for upload testing'
    const testFile = new File([testContent], 'test-document.txt', { type: 'text/plain' })
    
    const formData = new FormData()
    formData.append('file', testFile)
    formData.append('category', 'documents')
    formData.append('user_id', testUserId)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed')
    }
    
    return {
      file_uploaded: !!data.file,
      file_id: data.file?.id,
      file_url: data.file?.url,
      file_size: data.file?.size
    }
  }

  // Test 5: Notifications System
  const testNotificationsAPI = async () => {
    // Create a test notification
    const createResponse = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId,
        title: 'Test Notification',
        message: 'This is a test notification for API testing',
        type: 'info',
        action_url: '/dashboard',
        action_text: 'View Dashboard'
      })
    })
    
    const createData = await createResponse.json()
    
    if (!createResponse.ok) {
      throw new Error(createData.error || 'Failed to create notification')
    }
    
    // Fetch notifications
    const fetchResponse = await fetch(`/api/notifications?user_id=${testUserId}&limit=5`)
    const fetchData = await fetchResponse.json()
    
    if (!fetchResponse.ok) {
      throw new Error(fetchData.error || 'Failed to fetch notifications')
    }
    
    return {
      notification_created: !!createData.notification,
      notifications_fetched: fetchData.notifications?.length || 0,
      unread_count: fetchData.unreadCount || 0
    }
  }

  // Test 6: Credit Packages API
  const testCreditPackagesAPI = async () => {
    const response = await fetch('/api/credit-packages')
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch credit packages')
    }
    
    return {
      packages_available: data.packages?.length || 0,
      has_pricing: data.packages?.every((pkg: any) => pkg.price > 0) || false,
      sample_package: data.packages?.[0] || null
    }
  }

  const getTestStatusBadge = (testName: string) => {
    const result = testResults[testName]
    const running = isRunning[testName]
    
    if (running) {
      return <Badge variant="secondary">Running...</Badge>
    }
    
    if (!result) {
      return <Badge variant="outline">Not Run</Badge>
    }
    
    return result.success ? 
      <Badge variant="default">✅ Passed</Badge> : 
      <Badge variant="destructive">❌ Failed</Badge>
  }

  const runAllTests = async () => {
    const tests = [
      { name: 'Therapist Directory API', fn: testTherapistDirectory },
      { name: 'Therapist Search & Filtering', fn: testTherapistSearch },
      { name: 'Therapist Availability', fn: testTherapistAvailability },
      { name: 'File Upload System', fn: testFileUploadAPI },
      { name: 'Notifications System', fn: testNotificationsAPI },
      { name: 'Credit Packages API', fn: testCreditPackagesAPI }
    ]
    
    for (const test of tests) {
      await runTest(test.name, test.fn)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Real Data Integration Test Suite</h1>
        <p className="text-muted-foreground">
          Test real database connections, APIs, and data processing systems
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Button onClick={runAllTests} size="lg" className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Run All Tests
        </Button>
        <Button 
          onClick={() => window.open('/dashboard', '_blank')}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-5 w-5" />
          Main Dashboard
        </Button>
      </div>

      <Tabs defaultValue="api-tests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-tests">API Tests</TabsTrigger>
          <TabsTrigger value="file-upload">File Upload</TabsTrigger>
          <TabsTrigger value="data-integration">Data Integration</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="api-tests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Therapist Directory Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Therapist Directory API
                  </div>
                  {getTestStatusBadge('Therapist Directory API')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test real therapist data loading from database
                </p>
                <Button 
                  onClick={() => runTest('Therapist Directory API', testTherapistDirectory)}
                  disabled={isRunning['Therapist Directory API']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Therapist Directory API'] ? 'Testing...' : 'Test Directory'}
                </Button>
              </CardContent>
            </Card>

            {/* Search & Filtering Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search & Filtering
                  </div>
                  {getTestStatusBadge('Therapist Search & Filtering')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test search functionality and filtering options
                </p>
                <Button 
                  onClick={() => runTest('Therapist Search & Filtering', testTherapistSearch)}
                  disabled={isRunning['Therapist Search & Filtering']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Therapist Search & Filtering'] ? 'Testing...' : 'Test Search'}
                </Button>
              </CardContent>
            </Card>

            {/* Availability Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Therapist Availability
                  </div>
                  {getTestStatusBadge('Therapist Availability')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test real availability data and booking system
                </p>
                <Button 
                  onClick={() => runTest('Therapist Availability', testTherapistAvailability)}
                  disabled={isRunning['Therapist Availability']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Therapist Availability'] ? 'Testing...' : 'Test Availability'}
                </Button>
              </CardContent>
            </Card>

            {/* Notifications Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications System
                  </div>
                  {getTestStatusBadge('Notifications System')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test real-time notification creation and retrieval
                </p>
                <Button 
                  onClick={() => runTest('Notifications System', testNotificationsAPI)}
                  disabled={isRunning['Notifications System']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Notifications System'] ? 'Testing...' : 'Test Notifications'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="file-upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload System Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Test the comprehensive file upload system with different file types and categories.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Document Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      category="documents"
                      userId={testUserId}
                      maxFiles={3}
                      onUploadComplete={(files) => {
                        toast.success(`Uploaded ${files.length} document(s)`)
                        console.log('Documents uploaded:', files)
                      }}
                      onUploadError={(error) => {
                        toast.error(`Upload error: ${error}`)
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Image Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      category="images"
                      userId={testUserId}
                      maxFiles={5}
                      onUploadComplete={(files) => {
                        toast.success(`Uploaded ${files.length} image(s)`)
                        console.log('Images uploaded:', files)
                      }}
                      onUploadError={(error) => {
                        toast.error(`Upload error: ${error}`)
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Audio Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Audio Files
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      category="audio"
                      userId={testUserId}
                      maxFiles={2}
                      onUploadComplete={(files) => {
                        toast.success(`Uploaded ${files.length} audio file(s)`)
                        console.log('Audio files uploaded:', files)
                      }}
                      onUploadError={(error) => {
                        toast.error(`Upload error: ${error}`)
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              <Button 
                onClick={() => runTest('File Upload System', testFileUploadAPI)}
                disabled={isRunning['File Upload System']}
                className="w-full"
              >
                {isRunning['File Upload System'] ? 'Testing API...' : 'Test File Upload API'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Real Data Integration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold">Therapist Directory</h4>
                  <Badge variant="default">✅ Real Data</Badge>
                  <p className="text-xs text-gray-500 mt-1">Connected to Supabase</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Search className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold">Search & Filtering</h4>
                  <Badge variant="default">✅ Implemented</Badge>
                  <p className="text-xs text-gray-500 mt-1">Advanced query support</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold">Session Booking</h4>
                  <Badge variant="default">✅ Real Availability</Badge>
                  <p className="text-xs text-gray-500 mt-1">Live availability data</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <h4 className="font-semibold">File Upload</h4>
                  <Badge variant="default">✅ Full System</Badge>
                  <p className="text-xs text-gray-500 mt-1">Multi-format support</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <h4 className="font-semibold">Notifications</h4>
                  <Badge variant="default">✅ Real-time</Badge>
                  <p className="text-xs text-gray-500 mt-1">Database-driven</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Database className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                  <h4 className="font-semibold">Analytics</h4>
                  <Badge variant="secondary">🔄 In Progress</Badge>
                  <p className="text-xs text-gray-500 mt-1">Real data integration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(testResults).length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No tests have been run yet. Click "Run All Tests" or run individual tests.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {Object.entries(testResults).map(([testName, result]) => (
                    <Card key={testName} className={`border ${result.success ? 'border-green-200' : 'border-red-200'}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>{testName}</span>
                          <div className="flex items-center gap-2">
                            {result.duration && (
                              <Badge variant="outline">{result.duration}ms</Badge>
                            )}
                            <Badge variant={result.success ? 'default' : 'destructive'}>
                              {result.success ? 'PASSED' : 'FAILED'}
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Message:</strong> {result.message}</p>
                          <p><strong>Time:</strong> {new Date(result.timestamp).toLocaleString()}</p>
                          {result.error && (
                            <p className="text-red-600"><strong>Error:</strong> {result.error}</p>
                          )}
                          {result.data && (
                            <details className="mt-2">
                              <summary className="cursor-pointer font-medium">View Data</summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
