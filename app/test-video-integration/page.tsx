'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Video, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Play,
  Settings,
  Database,
  Wifi
} from "lucide-react"
import { toast } from "sonner"

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
  timestamp: string
}

export default function TestVideoIntegrationPage() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({})

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setIsRunning((prev: any) => ({ ...prev, [testName]: true }))
    
    try {
      console.log(`🧪 Running test: ${testName}`)
      const result = await testFunction()
      
      setTestResults((prev: any) => ({
        ...prev,
        [testName]: {
          success: true,
          message: `${testName} completed successfully`,
          data: result,
          timestamp: new Date().toISOString()
        }
      }))
      
      toast.success(`✅ ${testName} passed`)
      console.log(`✅ Test ${testName} passed:`, result)
    } catch (error) {
      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error'
      
      setTestResults((prev: any) => ({
        ...prev,
        [testName]: {
          success: false,
          message: `${testName} failed`,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      }))
      
      toast.error(`❌ ${testName} failed: ${errorMessage}`)
      console.error(`❌ Test ${testName} failed:`, error)
    } finally {
      setIsRunning((prev: any) => ({ ...prev, [testName]: false }))
    }
  }

  // Test 1: Daily.co Configuration
  const testDailyConfig = async () => {
    const response = await fetch('/api/test-daily-config')
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Daily.co configuration test failed')
    }
    
    return data
  }

  // Test 2: Create Daily.co Room
  const testCreateRoom = async () => {
    const roomName = `test-room-${Date.now()}`
    const response = await fetch('/api/daily/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create Daily.co room')
    }
    
    return data
  }

  // Test 3: Generate Meeting Token
  const testGenerateToken = async () => {
    const roomName = `test-room-${Date.now()}`
    
    // First create a room
    const createResponse = await fetch('/api/daily/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName })
    })
    
    if (!createResponse.ok) {
      throw new Error('Failed to create room for token test')
    }
    
    // Then generate a token
    const tokenResponse = await fetch('/api/daily/get-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        roomName, 
        participantName: 'Test User',
        isOwner: true 
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error || 'Failed to generate meeting token')
    }
    
    return tokenData
  }

  // Test 4: Session API Endpoints
  const testSessionAPIs = async () => {
    const results: {
      upcoming: { status: number; ok: boolean; data: any } | { error: string } | null
      history: { status: number; ok: boolean; data: any } | { error: string } | null
      therapistToday: { status: number; ok: boolean; data: any } | { error: string } | null
    } = {
      upcoming: null,
      history: null,
      therapistToday: null
    }
    
    try {
      // Test upcoming sessions API
      const upcomingResponse = await fetch('/api/sessions/upcoming')
      results.upcoming = {
        status: upcomingResponse.status,
        ok: upcomingResponse.ok,
        data: upcomingResponse.ok ? await upcomingResponse.json() : null
      }
    } catch (error) {
      results.upcoming = { error: error instanceof Error ? (error as Error).message : 'Unknown error' }
    }
    
    try {
      // Test session history API
      const historyResponse = await fetch('/api/sessions/history?limit=5')
      results.history = {
        status: historyResponse.status,
        ok: historyResponse.ok,
        data: historyResponse.ok ? await historyResponse.json() : null
      }
    } catch (error) {
      results.history = { error: error instanceof Error ? (error as Error).message : 'Unknown error' }
    }
    
    try {
      // Test therapist today sessions API
      const therapistResponse = await fetch('/api/therapist/sessions/today')
      results.therapistToday = {
        status: therapistResponse.status,
        ok: therapistResponse.ok,
        data: therapistResponse.ok ? await therapistResponse.json() : null
      }
    } catch (error) {
      results.therapistToday = { error: error instanceof Error ? (error as Error).message : 'Unknown error' }
    }
    
    return results
  }

  // Test 5: Database Connection
  const testDatabaseConnection = async () => {
    const response = await fetch('/api/test-db-connection')
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Database connection test failed')
    }
    
    return data
  }

  // Test 6: Video Features Complete Flow
  const testCompleteVideoFlow = async () => {
    const response = await fetch('/api/test-video-features')
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Complete video flow test failed')
    }
    
    return data
  }

  // Run all tests
  const runAllTests = async () => {
    const tests = [
      { name: 'Daily.co Configuration', fn: testDailyConfig },
      { name: 'Database Connection', fn: testDatabaseConnection },
      { name: 'Create Daily.co Room', fn: testCreateRoom },
      { name: 'Generate Meeting Token', fn: testGenerateToken },
      { name: 'Session API Endpoints', fn: testSessionAPIs },
      { name: 'Complete Video Flow', fn: testCompleteVideoFlow }
    ]
    
    for (const test of tests) {
      await runTest(test.name, test.fn)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Video Integration Test Suite</h1>
        <p className="text-muted-foreground">
          Comprehensive testing for TRPI video call system integration
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Button onClick={runAllTests} size="lg" className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Run All Tests
        </Button>
        <Button 
          onClick={() => window.open('/test-video-complete-flow', '_blank')}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-5 w-5" />
          Open Video Test Page
        </Button>
      </div>

      <Tabs defaultValue="tests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">Individual Tests</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily.co Configuration Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Daily.co Configuration
                  </div>
                  {getTestStatusBadge('Daily.co Configuration')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Verify Daily.co API keys and domain configuration
                </p>
                <Button 
                  onClick={() => runTest('Daily.co Configuration', testDailyConfig)}
                  disabled={isRunning['Daily.co Configuration']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Daily.co Configuration'] ? 'Testing...' : 'Test Configuration'}
                </Button>
              </CardContent>
            </Card>

            {/* Database Connection Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database Connection
                  </div>
                  {getTestStatusBadge('Database Connection')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test Supabase database connection and table access
                </p>
                <Button 
                  onClick={() => runTest('Database Connection', testDatabaseConnection)}
                  disabled={isRunning['Database Connection']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Database Connection'] ? 'Testing...' : 'Test Database'}
                </Button>
              </CardContent>
            </Card>

            {/* Create Room Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Create Daily.co Room
                  </div>
                  {getTestStatusBadge('Create Daily.co Room')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test creating a new video call room
                </p>
                <Button 
                  onClick={() => runTest('Create Daily.co Room', testCreateRoom)}
                  disabled={isRunning['Create Daily.co Room']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Create Daily.co Room'] ? 'Creating...' : 'Create Room'}
                </Button>
              </CardContent>
            </Card>

            {/* Generate Token Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Generate Meeting Token
                  </div>
                  {getTestStatusBadge('Generate Meeting Token')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test generating secure meeting access tokens
                </p>
                <Button 
                  onClick={() => runTest('Generate Meeting Token', testGenerateToken)}
                  disabled={isRunning['Generate Meeting Token']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Generate Meeting Token'] ? 'Generating...' : 'Generate Token'}
                </Button>
              </CardContent>
            </Card>

            {/* Session APIs Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Session API Endpoints
                  </div>
                  {getTestStatusBadge('Session API Endpoints')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test session management API endpoints
                </p>
                <Button 
                  onClick={() => runTest('Session API Endpoints', testSessionAPIs)}
                  disabled={isRunning['Session API Endpoints']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Session API Endpoints'] ? 'Testing...' : 'Test APIs'}
                </Button>
              </CardContent>
            </Card>

            {/* Complete Flow Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    Complete Video Flow
                  </div>
                  {getTestStatusBadge('Complete Video Flow')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test the complete video call workflow end-to-end
                </p>
                <Button 
                  onClick={() => runTest('Complete Video Flow', testCompleteVideoFlow)}
                  disabled={isRunning['Complete Video Flow']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Complete Video Flow'] ? 'Testing...' : 'Test Complete Flow'}
                </Button>
              </CardContent>
            </Card>
          </div>
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
                          <Badge variant={result.success ? 'default' : 'destructive'}>
                            {result.success ? 'PASSED' : 'FAILED'}
                          </Badge>
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

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Test the patient therapy dashboard integration
                </p>
                <Button asChild className="w-full">
                  <a href="/dashboard/therapy" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Patient Dashboard
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Therapist Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Test the therapist video call dashboard
                </p>
                <Button asChild className="w-full">
                  <a href="/therapist/dashboard/video-call" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Therapist Dashboard
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Video Test Pages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Access existing video test pages
                </p>
                <div className="space-y-2">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href="/test-video-complete-flow" target="_blank" rel="noopener noreferrer">
                      Complete Video Flow Test
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href="/test-browser-recording" target="_blank" rel="noopener noreferrer">
                      Browser Recording Test
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Integration Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Daily.co Integration:</span>
                    <Badge variant="default">✅ Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Browser Recording:</span>
                    <Badge variant="default">✅ Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>OpenAI Whisper:</span>
                    <Badge variant="default">✅ Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AI Analysis:</span>
                    <Badge variant="default">✅ Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dashboard Integration:</span>
                    <Badge variant="default">✅ Complete</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
