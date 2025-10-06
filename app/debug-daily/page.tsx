'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Video, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Play,
  Trash2
} from "lucide-react"
import { toast } from "sonner"

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
  timestamp: string
}

export default function DebugDailyPage() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({})
  const [createdRooms, setCreatedRooms] = useState<string[]>([])

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setIsRunning(prev => ({ ...prev, [testName]: true }))
    
    try {
      console.log(`🧪 Running test: ${testName}`)
      const result = await testFunction()
      
      setTestResults(prev => ({
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setTestResults(prev => ({
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
      setIsRunning(prev => ({ ...prev, [testName]: false }))
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
    const roomName = `debug-room-${Date.now()}`
    const response = await fetch('/api/daily/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create Daily.co room')
    }
    
    // Track created rooms for cleanup
    if (data.room?.name) {
      setCreatedRooms(prev => [...prev, data.room.name])
    }
    
    return data
  }

  // Test 3: Generate Meeting Token
  const testGenerateToken = async () => {
    const roomName = `debug-token-room-${Date.now()}`
    
    // First create a room
    const createResponse = await fetch('/api/daily/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName })
    })
    
    if (!createResponse.ok) {
      const createData = await createResponse.json()
      throw new Error(createData.error || 'Failed to create room for token test')
    }
    
    const createData = await createResponse.json()
    if (createData.room?.name) {
      setCreatedRooms(prev => [...prev, createData.room.name])
    }
    
    // Then generate a token
    const tokenResponse = await fetch('/api/daily/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        roomName: createData.room.name, 
        participantName: 'Debug User',
        isOwner: true 
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error || 'Failed to generate meeting token')
    }
    
    return { room: createData.room, token: tokenData }
  }

  // Cleanup function
  const cleanupRooms = async () => {
    if (createdRooms.length === 0) {
      toast.info('No rooms to cleanup')
      return
    }

    let cleaned = 0
    let failed = 0

    for (const roomName of createdRooms) {
      try {
        const response = await fetch(`/api/daily/delete-room`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName })
        })

        if (response.ok) {
          cleaned++
        } else {
          failed++
        }
      } catch (error) {
        failed++
        console.error(`Failed to delete room ${roomName}:`, error)
      }
    }

    setCreatedRooms([])
    toast.success(`Cleanup completed: ${cleaned} rooms deleted, ${failed} failed`)
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
        <h1 className="text-3xl font-bold">Daily.co Debug & Test Suite</h1>
        <p className="text-muted-foreground">
          Debug and test Daily.co integration for TRPI video system
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Button 
          onClick={() => runTest('Daily.co Configuration', testDailyConfig)}
          disabled={isRunning['Daily.co Configuration']}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Test Configuration
        </Button>
        
        <Button 
          onClick={() => runTest('Create Room', testCreateRoom)}
          disabled={isRunning['Create Room']}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Video className="h-4 w-4" />
          Test Room Creation
        </Button>
        
        <Button 
          onClick={() => runTest('Generate Token', testGenerateToken)}
          disabled={isRunning['Generate Token']}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          Test Token Generation
        </Button>
        
        {createdRooms.length > 0 && (
          <Button 
            onClick={cleanupRooms}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Cleanup Rooms ({createdRooms.length})
          </Button>
        )}
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Configuration Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration Test
              </div>
              {getTestStatusBadge('Daily.co Configuration')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Verify Daily.co API keys, domain, and permissions
            </p>
            <Button 
              onClick={() => runTest('Daily.co Configuration', testDailyConfig)}
              disabled={isRunning['Daily.co Configuration']}
              size="sm"
              className="w-full"
            >
              {isRunning['Daily.co Configuration'] ? 'Testing...' : 'Test Config'}
            </Button>
          </CardContent>
        </Card>

        {/* Room Creation Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Room Creation Test
              </div>
              {getTestStatusBadge('Create Room')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Test creating a new Daily.co video room
            </p>
            <Button 
              onClick={() => runTest('Create Room', testCreateRoom)}
              disabled={isRunning['Create Room']}
              size="sm"
              className="w-full"
            >
              {isRunning['Create Room'] ? 'Creating...' : 'Create Room'}
            </Button>
          </CardContent>
        </Card>

        {/* Token Generation Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Token Generation Test
              </div>
              {getTestStatusBadge('Generate Token')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Test generating secure meeting access tokens
            </p>
            <Button 
              onClick={() => runTest('Generate Token', testGenerateToken)}
              disabled={isRunning['Generate Token']}
              size="sm"
              className="w-full"
            >
              {isRunning['Generate Token'] ? 'Generating...' : 'Generate Token'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Test Results</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Created Rooms Tracker */}
      {createdRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Created Rooms ({createdRooms.length})</span>
              <Button onClick={cleanupRooms} size="sm" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {createdRooms.map((roomName, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{roomName}</span>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Troubleshooting Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Common Issues & Solutions:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>401 Unauthorized:</strong> Check your DAILY_API_KEY in environment variables</li>
                <li><strong>403 Forbidden:</strong> Verify your API key has "Room Management" permissions</li>
                <li><strong>Invalid privacy error:</strong> Ensure privacy is set to 'public', 'private', or 'org'</li>
                <li><strong>Room name errors:</strong> Use only lowercase letters, numbers, and hyphens</li>
                <li><strong>409 Conflict:</strong> Room name already exists, try a different name</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Environment Variables Required:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><code>DAILY_API_KEY</code> - Your Daily.co API key</li>
                <li><code>DAILY_DOMAIN</code> - Your Daily.co domain (optional)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Quick Links:</h4>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href="https://dashboard.daily.co/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Daily.co Dashboard
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href="/test-video-integration" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Full Video Test Suite
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
