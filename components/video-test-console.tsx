"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Video, 
  User, 
  Calendar, 
  Clock, 
  Copy, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  TestTube
} from "lucide-react"
import { toast } from "sonner"

interface TestSession {
  id: string
  therapist_id: string
  user_id: string
  start_time: string
  end_time: string
  status: string
  daily_room_url?: string
  test_user_email?: string
  test_user_name?: string
}

export function VideoTestConsole() {
  const [loading, setLoading] = useState(false)
  const [testSession, setTestSession] = useState<TestSession | null>(null)
  const [testUserEmail, setTestUserEmail] = useState("test.patient@example.com")
  const [testUserName, setTestUserName] = useState("Test Patient")
  const [sessionCreated, setSessionCreated] = useState(false)

  const createTestSession = async () => {
    setLoading(true)
    try {
      // Step 1: Create or get test user
      const userResponse = await fetch('/api/dev/create-test-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          full_name: testUserName
        })
      })

      if (!userResponse.ok) {
        throw new Error('Failed to create test user')
      }

      const userData = await userResponse.json()
      console.log('✅ Test user created:', userData)

      // Step 2: Create test session (using simple version)
      const sessionResponse = await fetch('/api/dev/create-test-session-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_user_id: userData.user.id,
          test_user_email: testUserEmail,
          test_user_name: testUserName
        })
      })

      if (!sessionResponse.ok) {
        throw new Error('Failed to create test session')
      }

      const sessionData = await sessionResponse.json()
      console.log('✅ Test session created:', sessionData)

      setTestSession({
        ...sessionData.session,
        test_user_email: testUserEmail,
        test_user_name: testUserName
      })
      setSessionCreated(true)
      
      toast.success('Test session created successfully!')
    } catch (error) {
      console.error('Error creating test session:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create test session')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const joinAsTherapist = () => {
    if (testSession) {
      window.open(`/video-session/${testSession.id}`, '_blank')
    }
  }

  const getPatientLoginLink = () => {
    if (testSession) {
      return `${window.location.origin}/api/dev/auto-login?email=${encodeURIComponent(testUserEmail)}&redirect=/video-session/${testSession.id}`
    }
    return ''
  }

  const openPatientWindow = () => {
    const loginLink = getPatientLoginLink()
    window.open(loginLink, '_blank')
    toast.success('Opening patient window...')
  }

  const resetTest = () => {
    setTestSession(null)
    setSessionCreated(false)
  }

  return (
    <Card className="border-2 border-purple-200 bg-purple-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Video Session Test Console</CardTitle>
            <Badge variant="outline" className="bg-purple-100">
              Development Only
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!sessionCreated ? (
          <>
            <Alert>
              <AlertDescription>
                This will create a test patient user and a video session scheduled for now. 
                You can then join as therapist and test patient simultaneously.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="testUserEmail">Test Patient Email</Label>
                <Input
                  id="testUserEmail"
                  type="email"
                  value={testUserEmail}
                  onChange={(e) => setTestUserEmail(e.target.value)}
                  placeholder="test.patient@example.com"
                />
              </div>

              <div>
                <Label htmlFor="testUserName">Test Patient Name</Label>
                <Input
                  id="testUserName"
                  type="text"
                  value={testUserName}
                  onChange={(e) => setTestUserName(e.target.value)}
                  placeholder="Test Patient"
                />
              </div>
            </div>

            <Button 
              onClick={createTestSession} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Test Session...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Create Test Video Session
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Test session created successfully! Use the buttons below to join.
              </AlertDescription>
            </Alert>

            {testSession && (
              <div className="space-y-4">
                {/* Session Info */}
                <div className="bg-white rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Session ID:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {testSession.id}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(testSession.id, 'Session ID')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Test Patient:</span>
                    <span>{testSession.test_user_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {testSession.test_user_email}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Status:</span>
                    <Badge className="bg-gray-100 text-gray-900">
                      {testSession.status}
                    </Badge>
                  </div>
                </div>

                {/* Join Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={joinAsTherapist}
                    className="bg-black hover:bg-gray-800"
                    size="lg"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Join as Therapist
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button
                    onClick={openPatientWindow}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Join as Patient
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {/* Patient Login Link */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-yellow-800 mb-2">
                    Patient Auto-Login Link:
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={getPatientLoginLink()}
                      readOnly
                      className="text-xs bg-white"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getPatientLoginLink(), 'Patient link')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    Share this link to let others test as the patient (auto-login enabled)
                  </p>
                </div>

                {/* Instructions */}
                <Alert>
                  <AlertDescription className="text-sm space-y-2">
                    <div className="font-medium">Testing Instructions:</div>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Click "Join as Therapist" - opens in new tab (you)</li>
                      <li>Click "Join as Patient" - opens in new tab (test user)</li>
                      <li>Both should see the Daily.co video interface</li>
                      <li>Test video, audio, chat, and recording features</li>
                      <li>Verify session timer and controls work correctly</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                {/* Reset Button */}
                <Button
                  onClick={resetTest}
                  variant="outline"
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Create Another Test Session
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

