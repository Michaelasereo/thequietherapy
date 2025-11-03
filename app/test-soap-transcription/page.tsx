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
  Sparkles,
  Bug,
  RefreshCw,
  ChevronRight,
  XCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface StepStatus {
  name: string
  status: 'pending' | 'in_progress' | 'success' | 'error'
  message?: string
  details?: any
}

export default function TestSOAPTranscriptionPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [soapNotes, setSoapNotes] = useState<string | null>(null)
  const [soapNotesObj, setSoapNotesObj] = useState<any | null>(null)
  const [showRaw, setShowRaw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  
  // Step tracking
  const [transcriptionSteps, setTranscriptionSteps] = useState<StepStatus[]>([
    { name: 'Audio Recording', status: 'pending' },
    { name: 'Audio Blob Creation', status: 'pending' },
    { name: 'API Request', status: 'pending' },
    { name: 'Server Processing', status: 'pending' },
    { name: 'OpenAI Transcription', status: 'pending' },
    { name: 'Database Storage', status: 'pending' }
  ])
  
  const [soapSteps, setSoapSteps] = useState<StepStatus[]>([
    { name: 'Transcript Validation', status: 'pending' },
    { name: 'API Request', status: 'pending' },
    { name: 'OpenAI/DeepSeek Processing', status: 'pending' },
    { name: 'JSON Parsing', status: 'pending' },
    { name: 'Response Formatting', status: 'pending' }
  ])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const sessionIdRef = useRef<string>(`test-session-${Date.now()}`)
  const debugLogRef = useRef<string[]>([])

  const logDebug = (message: string, data?: any) => {
    const logEntry = `[${new Date().toISOString()}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`
    debugLogRef.current.push(logEntry)
    console.log(logEntry)
    if (debugLogRef.current.length > 50) {
      debugLogRef.current.shift()
    }
  }

  const updateStep = (steps: StepStatus[], stepName: string, status: StepStatus['status'], message?: string, details?: any) => {
    return steps.map(step => 
      step.name === stepName 
        ? { ...step, status, message, details }
        : step
    )
  }

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
      debugLogRef.current = []
      setTranscriptionSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const, message: undefined, details: undefined })))
      
      logDebug('Starting recording...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          logDebug('Audio chunk received', { size: event.data.size, totalChunks: audioChunksRef.current.length })
        }
      }
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        setTranscriptionSteps(prev => updateStep(prev, 'Audio Recording', 'success', `Recorded ${audioChunksRef.current.length} chunks`))
        logDebug('Recording stopped', { totalChunks: audioChunksRef.current.length })
      }
      
      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)
      setTranscriptionSteps(prev => updateStep(prev, 'Audio Recording', 'in_progress'))
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      toast.success('Recording started')
      logDebug('Recording started successfully')
    } catch (err) {
      console.error('Error starting recording:', err)
      const errorMsg = 'Failed to access microphone. Please check permissions.'
      setError(errorMsg)
      setTranscriptionSteps(prev => updateStep(prev, 'Audio Recording', 'error', errorMsg))
      toast.error(errorMsg)
      logDebug('Recording error', { error: err })
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
    logDebug('Recording stopped by user')
  }

  const transcribeAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      toast.error('No recording available')
      return
    }

    try {
      setError(null)
      setTranscript(null)
      setTranscriptionSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const, message: undefined })))
      
      // Step 1: Create audio blob
      logDebug('Creating audio blob...')
      setTranscriptionSteps(prev => updateStep(prev, 'Audio Blob Creation', 'in_progress'))
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      logDebug('Audio blob created', { size: audioBlob.size, type: audioBlob.type })
      setTranscriptionSteps(prev => updateStep(prev, 'Audio Blob Creation', 'success', `Blob size: ${(audioBlob.size / 1024).toFixed(2)} KB`))
      
      // Step 2: Prepare form data
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('sessionId', sessionIdRef.current)
      
      logDebug('Sending transcription request...', {
        sessionId: sessionIdRef.current,
        blobSize: audioBlob.size,
        blobType: audioBlob.type
      })
      
      // Step 3: API Request
      setTranscriptionSteps(prev => updateStep(prev, 'API Request', 'in_progress'))
      const startTime = Date.now()
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })
      
      const requestTime = Date.now() - startTime
      logDebug('API response received', { status: response.status, statusText: response.statusText, time: `${requestTime}ms` })
      
      // Step 4: Parse response
      let result
      try {
        result = await response.json()
        logDebug('Response parsed', result)
      } catch (parseError) {
        logDebug('Failed to parse JSON response', { error: parseError, responseText: await response.text() })
        throw new Error('Failed to parse API response')
      }
      
      if (response.ok) {
        // Check for success indicator
        if (result.success !== false && result.text) {
          setTranscriptionSteps(prev => {
            let updated = updateStep(prev, 'API Request', 'success', `Response received in ${requestTime}ms`)
            updated = updateStep(updated, 'Server Processing', 'success', 'Server processed request')
            updated = updateStep(updated, 'OpenAI Transcription', 'success', `Transcribed ${result.text.length} characters`)
            return updateStep(updated, 'Database Storage', 'success', 'Transcript stored')
          })
          
          setTranscript(result.text)
          toast.success('Transcription completed!')
          
          // Clear audio chunks after successful transcription
          audioChunksRef.current = []
          
          logDebug('Transcription successful', { textLength: result.text.length, preview: result.text.substring(0, 100) })
        } else {
          const errorMsg = result.error || result.message || 'Transcription returned no text'
          setTranscriptionSteps(prev => {
            let updated = updateStep(prev, 'API Request', 'error', errorMsg, result)
            return updateStep(updated, 'Server Processing', 'error', 'Failed to process transcription')
          })
          setError(errorMsg)
          toast.error(errorMsg)
          logDebug('Transcription failed', result)
        }
      } else {
        const errorMsg = result.error || result.details || `HTTP ${response.status}: ${response.statusText}`
        setTranscriptionSteps(prev => updateStep(prev, 'API Request', 'error', errorMsg, result))
        setError(errorMsg)
        toast.error(errorMsg)
        logDebug('Transcription API error', { status: response.status, result })
      }
    } catch (err) {
      console.error('Transcription error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Transcription failed'
      setError(errorMsg)
      setTranscriptionSteps(prev => updateStep(prev, 'API Request', 'error', errorMsg))
      toast.error(errorMsg)
      logDebug('Transcription exception', { error: err })
    }
  }

  const generateSOAPNotes = async () => {
    if (!transcript || transcript.trim().length < 10) {
      toast.error('No valid transcript available. Please record and transcribe first.')
      return
    }

    try {
      setError(null)
      setSoapNotes(null)
      setSoapNotesObj(null)
      setSoapSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const, message: undefined })))
      
      logDebug('Starting SOAP generation...', { transcriptLength: transcript.length })
      
      // Step 1: Validate transcript
      setSoapSteps(prev => updateStep(prev, 'Transcript Validation', 'in_progress'))
      if (transcript.trim().length < 10) {
        throw new Error('Transcript is too short')
      }
      setSoapSteps(prev => updateStep(prev, 'Transcript Validation', 'success', `Valid transcript: ${transcript.length} chars`))
      
      // Step 2: Prepare request
      const requestBody = {
        sessionId: sessionIdRef.current,
        transcript: transcript
      }
      
      logDebug('Sending SOAP generation request...', { sessionId: sessionIdRef.current, transcriptLength: transcript.length })
      
      // Step 3: API Request
      setSoapSteps(prev => updateStep(prev, 'API Request', 'in_progress'))
      const startTime = Date.now()
      
      const response = await fetch('/api/sessions/soap-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      const requestTime = Date.now() - startTime
      logDebug('SOAP API response received', { status: response.status, time: `${requestTime}ms` })
      
      // Step 4: Parse response
      let result
      try {
        result = await response.json()
        logDebug('SOAP response parsed', result)
      } catch (parseError) {
        logDebug('Failed to parse SOAP JSON response', { error: parseError })
        throw new Error('Failed to parse SOAP API response')
      }
      
      if (response.ok && result.success !== false) {
        // Step 5: Process SOAP notes
        setSoapSteps(prev => updateStep(prev, 'API Request', 'success', `Response received in ${requestTime}ms`))
        setSoapSteps(prev => updateStep(prev, 'OpenAI/DeepSeek Processing', 'in_progress'))
        
        const notes = result.soapNotes || result.data?.soapNotes
        
        if (!notes) {
          throw new Error('No SOAP notes in response')
        }
        
        logDebug('Processing SOAP notes', { notesType: typeof notes, hasNotes: !!notes })
        setSoapSteps(prev => updateStep(prev, 'OpenAI/DeepSeek Processing', 'success', 'AI processing completed'))
        
        // Step 6: Parse JSON
        setSoapSteps(prev => updateStep(prev, 'JSON Parsing', 'in_progress'))
        
        let parsedNotes
        if (typeof notes === 'string') {
          try {
            parsedNotes = JSON.parse(notes)
            logDebug('Parsed JSON string', parsedNotes)
          } catch (parseError) {
            logDebug('JSON parse error, using as string', { error: parseError })
            // If it's not valid JSON, treat as plain text
            setSoapNotes(notes)
            setSoapNotesObj(null)
            setSoapSteps(prev => updateStep(prev, 'JSON Parsing', 'error', 'Failed to parse as JSON, using as text'))
            setSoapSteps(prev => updateStep(prev, 'Response Formatting', 'success'))
            toast.success('SOAP notes generated! (text format)')
            return
          }
        } else if (typeof notes === 'object' && notes !== null) {
          parsedNotes = notes
          logDebug('Notes already an object', parsedNotes)
        } else {
          throw new Error('Invalid SOAP notes format')
        }
        
        setSoapSteps(prev => updateStep(prev, 'JSON Parsing', 'success', 'Successfully parsed JSON'))
        
        // Step 7: Format response
        setSoapSteps(prev => updateStep(prev, 'Response Formatting', 'in_progress'))
        
        setSoapNotesObj(parsedNotes)
        setSoapNotes(JSON.stringify(parsedNotes, null, 2))
        
        setSoapSteps(prev => updateStep(prev, 'Response Formatting', 'success', 'Notes formatted successfully'))
        
        toast.success('SOAP notes generated!')
        logDebug('SOAP generation successful', { notesKeys: Object.keys(parsedNotes) })
      } else {
        const errorMsg = result.error || result.details || `HTTP ${response.status}: SOAP generation failed`
        setSoapSteps(prev => updateStep(prev, 'API Request', 'error', errorMsg, result))
        setError(errorMsg)
        toast.error(errorMsg)
        logDebug('SOAP generation failed', { status: response.status, result })
      }
    } catch (err) {
      console.error('SOAP notes generation error:', err)
      const errorMsg = err instanceof Error ? err.message : 'SOAP notes generation failed'
      setError(errorMsg)
      setSoapSteps(prev => updateStep(prev, 'API Request', 'error', errorMsg))
      toast.error(errorMsg)
      logDebug('SOAP generation exception', { error: err })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = (status: StepStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusColor = (status: StepStatus['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'in_progress':
        return 'text-blue-600'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">SOAP & Transcription Test Page</h1>
          <p className="text-gray-600">
            Comprehensive testing with detailed diagnostics for transcription and SOAP generation
          </p>
        </div>

        {/* Debug Toggle */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowDebug(!showDebug)}
            className="gap-2"
          >
            <Bug className="h-4 w-4" />
            {showDebug ? 'Hide' : 'Show'} Debug Log
          </Button>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Transcribe Audio
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

        {/* Transcription Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transcription Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transcriptionSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-white">
                  <div className="mt-0.5">
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${getStatusColor(step.status)}`}>
                      {step.name}
                    </div>
                    {step.message && (
                      <div className="text-sm text-gray-600 mt-1">{step.message}</div>
                    )}
                    {step.details && showDebug && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(step.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate SOAP Notes from Transcript
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* SOAP Generation Steps */}
        {transcript && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                SOAP Notes Generation Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {soapSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-white">
                    <div className="mt-0.5">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${getStatusColor(step.status)}`}>
                        {step.name}
                      </div>
                      {step.message && (
                        <div className="text-sm text-gray-600 mt-1">{step.message}</div>
                      )}
                      {step.details && showDebug && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(step.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

        {/* Debug Log */}
        {showDebug && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Debug Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-auto">
                {debugLogRef.current.length === 0 ? (
                  <div className="text-gray-500">No debug logs yet...</div>
                ) : (
                  debugLogRef.current.map((log, idx) => (
                    <div key={idx} className="mb-1">{log}</div>
                  ))
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { debugLogRef.current = []; toast.info('Debug log cleared') }}
                className="mt-2"
              >
                Clear Log
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. <strong>Start Recording:</strong> Click "Start Recording" and speak into your microphone</p>
            <p>2. <strong>Stop Recording:</strong> Click "Stop Recording" when done</p>
            <p>3. <strong>Transcribe:</strong> Click "Transcribe Audio" - watch the step-by-step process</p>
            <p>4. <strong>Generate SOAP Notes:</strong> Once transcribed, click "Generate SOAP Notes"</p>
            <p>5. <strong>Debug Mode:</strong> Toggle debug log to see detailed API requests/responses</p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <strong>Tip:</strong> Each step shows its status. If any step fails, check the error message and debug log for details. 
                  This helps identify exactly where the process is failing (API call, server processing, JSON parsing, etc.)
                </div>
              </div>
            </div>
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

