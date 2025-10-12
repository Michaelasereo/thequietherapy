'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client
const createClient = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
import { useAuth } from '@/context/auth-context'

export default function DevConsolePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [testPatient, setTestPatient] = useState<any>(null)

  useEffect(() => {
    loadSessions()
    loadTestPatient()
  }, [user])

  const loadSessions = async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase
      .from('sessions')
      .select(`
        *,
        patient:users!sessions_user_id_fkey(id, email, full_name),
        therapist:users!sessions_therapist_id_fkey(id, email, full_name)
      `)
      .or(`therapist_id.eq.${user.id},user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(10)
    
    setSessions(data || [])
  }

  const loadTestPatient = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'quicktest-patient@test.com')
      .single()
    
    setTestPatient(data)
  }

  const createTestSession = async () => {
    if (!user) return
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()

      // Get or create test patient
      let patientId = testPatient?.id
      if (!patientId) {
        const { data: patient, error: patientError } = await supabase
          .from('users')
          .insert({
            email: 'quicktest-patient@test.com',
            full_name: 'Test Patient',
            user_type: 'individual',
            is_verified: true,
            is_active: true,
            credits: 20
          })
          .select()
          .single()

        if (patientError) {
          // Patient might exist, try to get it
          const { data: existing } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'quicktest-patient@test.com')
            .single()
          
          patientId = existing?.id
        } else {
          patientId = patient?.id
        }
      }

      if (!patientId) {
        throw new Error('Could not create/find test patient')
      }

      // Create Daily.co room
      const roomResponse = await fetch('/api/daily/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `test-${Date.now()}`,
          therapistId: user.id,
          userId: patientId
        })
      })

      const roomData = await roomResponse.json()
      if (!roomData.success) {
        throw new Error('Failed to create video room')
      }

      // Create session in database - 5 minutes from now
      const sessionTime = new Date(Date.now() + 5 * 60 * 1000)
      const sessionDate = sessionTime.toISOString().split('T')[0]
      const sessionTimeStr = sessionTime.toTimeString().slice(0, 5)

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: patientId,
          therapist_id: user.id,
          scheduled_date: sessionDate,
          scheduled_time: sessionTimeStr,
          status: 'scheduled',
          service_type: 'Test Session',
          session_type: 'video',
          duration_minutes: 30,
          daily_room_url: roomData.roomUrl,
          daily_room_name: roomData.roomName
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      setMessage(`✅ Test session created! ID: ${session.id}`)
      await loadSessions()
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const joinSession = (sessionId: string) => {
    window.open(`/video-session/${sessionId}`, '_blank')
  }

  const viewSessionDetails = async (sessionId: string) => {
    const supabase = createClient()
    
    // Get session
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    // Get session notes
    const { data: notes } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    console.log('📊 Session Details:', session)
    console.log('📝 Session Notes:', notes)
    alert(`Check console for details!\n\nSession ID: ${sessionId}\nHas Notes: ${notes ? 'Yes' : 'No'}\nHas Transcript: ${notes?.transcript ? 'Yes' : 'No'}\nHas SOAP Notes: ${session?.soap_notes ? 'Yes' : 'No'}`)
  }

  const generateTestTranscript = async (sessionId: string) => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Create a test transcript
      const testTranscript = `Test Patient: I've been feeling really stressed about work lately. The long hours are affecting my sleep.

Therapist: I understand. Can you tell me more about what's been happening at work?

Test Patient: Well, I've been working 12-hour shifts, and when I get home, I can't stop thinking about work. My mind just keeps racing.

Therapist: That sounds very challenging. How long has this been going on?

Test Patient: About three months now. I'm worried I'm heading towards burnout.

Therapist: It's good that you're recognizing these signs early. Let's talk about some coping strategies.`

      // Save transcript
      const { error: notesError } = await supabase
        .from('session_notes')
        .upsert({
          session_id: sessionId,
          transcript: testTranscript,
          recording_url: 'test://recording.mp3',
          created_at: new Date().toISOString()
        })

      if (notesError) throw notesError

      // Generate SOAP notes
      const soapResponse = await fetch('/api/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      const soapData = await soapResponse.json()
      
      if (soapData.success) {
        setMessage(`✅ Test transcript and SOAP notes generated!`)
      } else {
        setMessage(`⚠️ Transcript saved, but SOAP generation failed: ${soapData.message}`)
      }

      await loadSessions()
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const completeSession = async (sessionId: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId)

      setMessage(`✅ Session marked as completed`)
      await loadSessions()
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-yellow-900 mb-2">🔐 Login Required</h1>
            <p className="text-yellow-800">Please login first at <a href="/therapist/login" className="underline">Therapist Login</a></p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-2">🛠️ Developer Console</h1>
          <p className="text-purple-100">Test video sessions and AI features</p>
          <p className="text-sm text-purple-200 mt-2">Logged in as: {user.email}</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
            message.includes('❌') ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">⚡ Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={createTestSession}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium transition-colors"
            >
              {loading ? '⏳ Creating...' : '🎥 Create Test Session'}
            </button>

            <button
              onClick={() => window.location.href = '/therapist/dashboard'}
              className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              📊 Go to Dashboard
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            💡 <strong>Tip:</strong> Create a test session, then use the actions below to simulate the full flow
          </p>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">📋 Recent Sessions</h2>
            <button
              onClick={loadSessions}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              🔄 Refresh
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No sessions yet</p>
              <p className="text-sm">Create a test session to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {session.service_type || 'Therapy Session'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Patient: {session.patient?.full_name || session.patient?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        📅 {session.scheduled_date} at {session.scheduled_time}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                      session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mb-3 font-mono bg-gray-50 p-2 rounded">
                    ID: {session.id}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {session.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => joinSession(session.id)}
                          className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                        >
                          🎥 Join Session
                        </button>
                        <button
                          onClick={() => completeSession(session.id)}
                          className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                        >
                          ✅ Mark Complete
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => generateTestTranscript(session.id)}
                      disabled={loading}
                      className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700 disabled:bg-gray-300 transition-colors"
                    >
                      📝 Generate Test Transcript
                    </button>

                    <button
                      onClick={() => viewSessionDetails(session.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      🔍 View Details
                    </button>

                    {session.soap_notes && (
                      <button
                        onClick={() => {
                          alert(`SOAP Notes:\n\n${session.soap_notes}`)
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        📋 View SOAP Notes
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">📖 How to Use This Console</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li><strong>Create Test Session</strong> - Creates a session scheduled 5 minutes from now</li>
            <li><strong>Join Session</strong> - Opens the video session in a new tab (can join immediately for testing)</li>
            <li><strong>Generate Test Transcript</strong> - Creates a realistic test transcript and triggers AI SOAP notes</li>
            <li><strong>View Details</strong> - Shows full session data in console (check browser console F12)</li>
            <li><strong>Mark Complete</strong> - Changes session status to completed</li>
            <li><strong>Go to Dashboard</strong> - See sessions in the regular therapist dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

