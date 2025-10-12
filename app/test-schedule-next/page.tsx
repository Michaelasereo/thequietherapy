'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PostSessionModal from "@/components/post-session-modal"
import ScheduleNextSessionModal from "@/components/schedule-next-session-modal"
import { 
  TestTube, 
  PlayCircle, 
  Calendar,
  User,
  FileText,
  Info,
  CheckCircle
} from "lucide-react"

export default function TestScheduleNextPage() {
  const [showPostSessionModal, setShowPostSessionModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduledSessions, setScheduledSessions] = useState<any[]>([])

  // Test data
  const testSessionId = '13480a74-71b6-470e-94eb-e446d77b76b8'
  const testPatientId = '5803b951-f0b4-462c-b1d9-7bab27dfc5f7'
  const testPatientName = 'adenike'
  const testTherapistId = '9412940e-8445-4903-a6a2-16009ecebb36'

  const handleSessionScheduled = (sessionId: string) => {
    console.log('✅ Test: Session scheduled:', sessionId)
    setScheduledSessions(prev => [...prev, {
      id: sessionId,
      patientName: testPatientName,
      createdAt: new Date().toISOString()
    }])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <TestTube className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Schedule Next Session - Test Page</h1>
            <p className="text-muted-foreground">Test the therapist's ability to schedule follow-up sessions</p>
          </div>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Feature Overview:</strong> After completing a session, therapists can immediately schedule the next appointment 
            with the same patient. The session appears on the patient's dashboard and requires credits to join.
          </AlertDescription>
        </Alert>

        {/* Test Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Scenario 1: Post-Session Modal Flow */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Test 1: Post-Session Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Scenario:</h3>
                <p className="text-sm text-muted-foreground">
                  Therapist completes a session and wants to schedule a follow-up appointment.
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                <p><strong>Session ID:</strong> {testSessionId.substring(0, 8)}...</p>
                <p><strong>Patient:</strong> {testPatientName}</p>
                <p><strong>Status:</strong> <Badge variant="outline">Completed</Badge></p>
              </div>

              <Button 
                onClick={() => setShowPostSessionModal(true)}
                className="w-full"
                size="lg"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Open Post-Session Modal
              </Button>

              <div className="text-xs text-muted-foreground">
                This will open the post-session review modal. Complete the notes step to see the 
                "Schedule Next Session" button.
              </div>
            </CardContent>
          </Card>

          {/* Scenario 2: Direct Schedule Modal */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Test 2: Direct Schedule Modal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Scenario:</h3>
                <p className="text-sm text-muted-foreground">
                  Test the scheduling modal directly without going through post-session flow.
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                <p><strong>Patient ID:</strong> {testPatientId.substring(0, 8)}...</p>
                <p><strong>Patient Name:</strong> {testPatientName}</p>
                <p><strong>Therapist ID:</strong> {testTherapistId.substring(0, 8)}...</p>
              </div>

              <Button 
                onClick={() => setShowScheduleModal(true)}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Open Schedule Modal
              </Button>

              <div className="text-xs text-muted-foreground">
                This opens the scheduling modal directly. Fill in the date/time to create a test session.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Sessions Log */}
        {scheduledSessions.length > 0 && (
          <Card className="shadow-lg border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Scheduled Sessions ({scheduledSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {scheduledSessions.map((session, index) => (
                  <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">Session #{index + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          Patient: {session.patientName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Session ID: {session.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(session.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        ✓ Scheduled
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* How to Test Instructions */}
        <Card className="shadow-lg border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <FileText className="h-5 w-5" />
              How to Test
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Option 1: Full Post-Session Flow</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Click "Open Post-Session Modal" button</li>
                  <li>Fill in session notes (or click "Skip Notes")</li>
                  <li>If you're logged in as therapist, you'll see feedback step - skip it</li>
                  <li>On completion screen, click "Schedule Next Session"</li>
                  <li>Fill in date and time for next appointment</li>
                  <li>Click "Schedule Session"</li>
                  <li>Session will be created and logged below</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Option 2: Direct Schedule Modal</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Click "Open Schedule Modal" button</li>
                  <li>Select a future date and time</li>
                  <li>Choose session duration</li>
                  <li>Optionally add session focus notes</li>
                  <li>Click "Schedule Session"</li>
                  <li>Check the scheduled sessions log below</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-yellow-800 mb-2">What Happens:</h4>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>✓ Session created in database with status "scheduled"</li>
                  <li>✓ No credit deducted yet (credit_used_id = null)</li>
                  <li>✓ Session appears on patient's dashboard</li>
                  <li>✓ Patient sees "💳 Credit Required" badge</li>
                  <li>✓ When patient joins: System checks credits automatically</li>
                  <li>✓ If credits available: 1 credit deducted, session starts</li>
                  <li>✓ If no credits: Error shown, patient must buy credits</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Check Patient Dashboard:</h4>
                <p className="text-sm text-blue-700">
                  After scheduling, go to <strong>/dashboard</strong> (logged in as patient) 
                  to see the scheduled session appear in "Upcoming Sessions" with the credit requirement badge.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Data Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Test Data Being Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">Patient Info:</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>ID:</strong> {testPatientId}</p>
                  <p><strong>Name:</strong> {testPatientName}</p>
                  <p><strong>Email:</strong> obgynect@gmail.com</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Therapist Info:</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>ID:</strong> {testTherapistId}</p>
                  <p><strong>Name:</strong> Dr Adelabu Yusuf</p>
                  <p><strong>Email:</strong> michaelasereo@gmail.com</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showPostSessionModal && (
        <PostSessionModal 
          sessionId={testSessionId}
          isOpen={showPostSessionModal}
          onClose={() => setShowPostSessionModal(false)}
          onComplete={() => setShowPostSessionModal(false)}
        />
      )}

      {showScheduleModal && (
        <ScheduleNextSessionModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          patientId={testPatientId}
          patientName={testPatientName}
          therapistId={testTherapistId}
          currentSessionId={testSessionId}
          onSessionScheduled={handleSessionScheduled}
        />
      )}
    </div>
  )
}

