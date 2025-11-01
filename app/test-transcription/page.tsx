'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

export default function TestTranscriptionPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [soapNotes, setSoapNotes] = useState<string | null>(null)
  const [soapNotesObj, setSoapNotesObj] = useState<any | null>(null)
  const [showRaw, setShowRaw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const sessionIdRef = useRef<string>(`test-session-${Date.now()}`)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      setTranscript(null)
      setSoapNotes(null)
      setSoapNotesObj(null)
      setShowRaw(false)
      audioChunksRef.current = []
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      toast.success('Recording started')
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to access microphone. Please check permissions.')
      toast.error('Failed to access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    setIsRecording(false)
    toast.info('Recording stopped')
  }

  const transcribeAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      toast.error('No recording available')
      return
    }

    try {
      setIsProcessing(true)
      setError(null)
      
      // Combine audio chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      
      // Create FormData
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('sessionId', sessionIdRef.current)
      
      console.log('Sending audio for transcription...', {
        size: audioBlob.size,
        sessionId: sessionIdRef.current
      })
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setTranscript(result.text)
        toast.success('Transcription completed!')
        
        // Clear audio chunks after successful transcription
        audioChunksRef.current = []
      } else {
        const errorMsg = result.error || 'Transcription failed'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      console.error('Transcription error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Transcription failed'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateSOAPNotes = async () => {
    if (!transcript) {
      toast.error('No transcript available. Please record and transcribe first.')
      return
    }

    try {
      setIsProcessing(true)
      setError(null)
      
      const response = await fetch('/api/sessions/soap-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          transcript: transcript
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        // Handle JSON object or string format
        const notes = result.soapNotes || result.data?.soapNotes
        if (typeof notes === 'object' && notes !== null) {
          setSoapNotesObj(notes)
          // Also keep a raw JSON string for copy
          setSoapNotes(JSON.stringify(notes, null, 2))
        } else {
          setSoapNotes(String(notes || 'No SOAP notes generated'))
          setSoapNotesObj(null)
        }
        toast.success('SOAP notes generated!')
      } else {
        const errorMsg = result.error || 'SOAP notes generation failed'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      console.error('SOAP notes generation error:', err)
      const errorMsg = err instanceof Error ? err.message : 'SOAP notes generation failed'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Test Transcription & SOAP Notes</h1>
          <p className="text-gray-600">
            Record audio, test transcription, and generate SOAP notes
          </p>
        </div>

        {/* Recording Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Audio Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              )}
              
              {audioChunksRef.current.length > 0 && !isRecording && (
                <Button
                  onClick={transcribeAudio}
                  size="lg"
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-2" />
                      Transcribe Audio
                    </>
                  )}
                </Button>
              )}
            </div>

            {isRecording && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="font-mono text-2xl font-bold">{formatTime(recordingTime)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Recording in progress...</p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Transcript Display */}
        {transcript && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Transcription Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{transcript.length} characters</span>
                <span>{transcript.split(' ').length} words</span>
              </div>
              
              {!soapNotes && (
                <Button
                  onClick={generateSOAPNotes}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating SOAP Notes...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate SOAP Notes from Transcript
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* SOAP Notes Display */}
        {(soapNotes || soapNotesObj) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI-Generated SOAP Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Toggle */}
              {soapNotesObj && (
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRaw(!showRaw)}
                  >
                    {showRaw ? 'Show Pretty View' : 'Show Raw JSON'}
                  </Button>
                </div>
              )}

              {/* Pretty View */}
              {soapNotesObj && !showRaw && (
                <div className="space-y-6">
                  {(['subjective','objective','assessment','plan'] as const).map((section) => (
                    <div key={section}>
                      <h4 className="font-semibold text-gray-900 uppercase tracking-wide text-xs mb-2">{section}</h4>
                      {renderSection(soapNotesObj[section])}
                    </div>
                  ))}
                </div>
              )}

              {/* Raw JSON fallback or explicit view */}
              {(showRaw || !soapNotesObj) && soapNotes && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {soapNotes}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. <strong>Start Recording:</strong> Click the "Start Recording" button and speak into your microphone</p>
            <p>2. <strong>Stop Recording:</strong> Click "Stop Recording" when you're done</p>
            <p>3. <strong>Transcribe:</strong> Click "Transcribe Audio" to process your recording</p>
            <p>4. <strong>Generate SOAP Notes:</strong> Once transcribed, click "Generate SOAP Notes" to create AI notes</p>
            <p className="mt-4 text-xs text-gray-500">
              <strong>Note:</strong> Make sure to allow microphone access when prompted by your browser.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function renderSection(value: any) {
  if (!value) {
    return <p className="text-sm text-gray-600">N/A</p>
  }
  if (typeof value === 'string') {
    return <p className="text-sm text-gray-800 whitespace-pre-wrap">{value}</p>
  }
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
        {value.map((item, idx) => (
          <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    )
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k}>
            <div className="text-xs font-medium text-gray-500">{humanize(k)}</div>
            <div className="text-sm text-gray-800">{typeof v === 'string' ? v : JSON.stringify(v)}</div>
          </div>
        ))}
      </div>
    )
  }
  return <p className="text-sm text-gray-800">{String(value)}</p>
}

function humanize(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

