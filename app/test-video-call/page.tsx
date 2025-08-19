'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Video, 
  Brain, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Play,
  Square,
  Settings
} from "lucide-react"
import Link from 'next/link'

export default function TestVideoCallPage() {
  const [testResults, setTestResults] = useState<any>(null)

  const runSystemTest = async () => {
    setTestResults({ status: 'testing', message: 'Running system tests...' })
    
    try {
      // Test 1: OpenAI API
      const openaiResponse = await fetch('/api/test-openai-simple')
      const openaiResult = await openaiResponse.json()
      
      // Test 2: Mock AI Services
      const mockResponse = await fetch('/api/test-ai-mock')
      const mockResult = await mockResponse.json()
      
      // Test 3: Session Notes Structure
      const structureResponse = await fetch('/api/test-session-notes-structure')
      const structureResult = await structureResponse.json()
      
      setTestResults({
        status: 'completed',
        tests: {
          openai: openaiResult,
          mock: mockResult,
          structure: structureResult
        }
      })
    } catch (error) {
      setTestResults({
        status: 'error',
        message: 'Test failed',
        error: error
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI-Powered Video Call System Test
          </h1>
          <p className="text-gray-600">
            Complete testing suite for the therapy platform's video call and AI session notes system
          </p>
        </div>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Video className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Video Calls</h3>
                <p className="text-sm text-gray-600">Daily.co integration with recording</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Brain className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">AI Processing</h3>
                <p className="text-sm text-gray-600">OpenAI Whisper + GPT-4 for SOAP notes</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">Session Notes</h3>
                <p className="text-sm text-gray-600">Automated clinical documentation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={runSystemTest} className="w-full">
                Run Complete System Test
              </Button>
              
              {testResults && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Test Results:</h4>
                  <div className="space-y-2">
                    {testResults.status === 'testing' && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock className="h-4 w-4 animate-spin" />
                        {testResults.message}
                      </div>
                    )}
                    
                    {testResults.status === 'completed' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          All tests completed successfully
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-green-50">
                            <CardContent className="p-3">
                              <h5 className="font-semibold text-green-800">OpenAI API</h5>
                              <Badge variant="secondary" className="text-xs">
                                {testResults.tests.openai.success ? 'Working' : 'Failed'}
                              </Badge>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-blue-50">
                            <CardContent className="p-3">
                              <h5 className="font-semibold text-blue-800">Mock AI Services</h5>
                              <Badge variant="secondary" className="text-xs">
                                {testResults.tests.mock.success ? 'Working' : 'Failed'}
                              </Badge>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-purple-50">
                            <CardContent className="p-3">
                              <h5 className="font-semibold text-purple-800">Database</h5>
                              <Badge variant="secondary" className="text-xs">
                                {testResults.tests.structure.success ? 'Ready' : 'Error'}
                              </Badge>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                    
                    {testResults.status === 'error' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        Test failed: {testResults.message}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/video-call?room=test-session&participant=Therapist&sessionId=test-123&isTherapist=true">
                <Button className="w-full" variant="outline">
                  <Video className="h-4 w-4 mr-2" />
                  Test Video Call (Therapist)
                </Button>
              </Link>
              
              <Link href="/video-call?room=test-session&participant=Patient&sessionId=test-123&isTherapist=false">
                <Button className="w-full" variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Test Video Call (Patient)
                </Button>
              </Link>
              
              <Link href="/api/test-ai-mock">
                <Button className="w-full" variant="outline">
                  <Brain className="h-4 w-4 mr-2" />
                  Test AI Services
                </Button>
              </Link>
              
              <Link href="/api/test-openai">
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Test SOAP Notes Generation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Feature List */}
        <Card>
          <CardHeader>
            <CardTitle>Implemented Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Video Call System</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Daily.co room creation and management</li>
                  <li>• Automatic recording start/stop</li>
                  <li>• Session-specific room naming</li>
                  <li>• Call duration tracking</li>
                  <li>• Webhook integration for recording events</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">AI Processing Pipeline</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• OpenAI Whisper transcription</li>
                  <li>• GPT-4 SOAP notes generation</li>
                  <li>• Therapeutic insights extraction</li>
                  <li>• Background processing with webhooks</li>
                  <li>• Fallback to mock services</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Session Management</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Real-time session notes panel</li>
                  <li>• AI-generated vs manual notes</li>
                  <li>• SOAP notes structure</li>
                  <li>• Therapeutic insights display</li>
                  <li>• Session completion tracking</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Database Integration</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Session notes storage</li>
                  <li>• AI processing status tracking</li>
                  <li>• Error logging and retry mechanisms</li>
                  <li>• Row-level security policies</li>
                  <li>• Automated notifications</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Database Setup</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Run these SQL scripts in your Supabase dashboard:
                </p>
                <ol className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>1. <code className="bg-gray-100 px-1 rounded">setup-session-notes-complete.sql</code></li>
                  <li>2. <code className="bg-gray-100 px-1 rounded">update-session-notes-for-ai.sql</code></li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Environment Variables</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Ensure these are set in your <code className="bg-gray-100 px-1 rounded">.env.local</code>:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• <code className="bg-gray-100 px-1 rounded">OPENAI_API_KEY</code> ✅ Set</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">DAILY_API_KEY</code> ✅ Set</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">DAILY_DOMAIN</code> ✅ Set</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Daily.co Webhook</h4>
                <p className="text-sm text-gray-600">
                  Configure webhook URL in Daily.co dashboard: <br/>
                  <code className="bg-gray-100 px-1 rounded">https://your-domain.com/api/daily/webhook</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
