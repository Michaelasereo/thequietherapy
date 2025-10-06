'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Play,
  FileText,
  Zap,
  Clock,
  User
} from "lucide-react"
import { toast } from "sonner"

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
  timestamp: string
  duration?: number
}

export default function TestAIIntegrationPage() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({})
  const [customTranscript, setCustomTranscript] = useState('')
  const [soapNotes, setSoapNotes] = useState<any>(null)

  const defaultTranscript = `Patient: I've been feeling really anxious about work lately. The deadlines are overwhelming me, and I can't seem to focus on anything.

Therapist: Thank you for sharing that with me. Can you tell me more about when these feelings of anxiety started?

Patient: It began about two weeks ago when my manager assigned me this big project. I keep thinking I'm going to mess it up and disappoint everyone.

Therapist: That sounds like a lot of pressure. How has this anxiety been affecting your daily life?

Patient: I'm not sleeping well, maybe 4-5 hours a night. I keep waking up thinking about work. And I've been avoiding social situations because I feel so overwhelmed.

Therapist: I can see how distressing this must be for you. Have you tried any coping strategies that we've discussed before?

Patient: I tried the breathing exercises you taught me, but I keep forgetting to use them when I'm really stressed. It's like my mind just goes blank.

Therapist: That's completely normal. When we're anxious, it's hard to remember our tools. Let's practice that breathing technique right now and talk about ways to make it more automatic.

Patient: Okay, that would be helpful. I really want to get better at managing this anxiety.

Therapist: I can hear your motivation to improve, which is a real strength. Let's work together on building these skills so they become second nature.`

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

  // Test 1: AI Configuration
  const testAIConfig = async () => {
    const response = await fetch('/api/ai/validate-config')
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'AI configuration validation failed')
    }
    
    return data
  }

  // Test 2: Generate SOAP Notes
  const testGenerateSOAP = async () => {
    const transcript = customTranscript || defaultTranscript
    
    const response = await fetch('/api/ai/process-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `test-session-${Date.now()}`,
        transcript: transcript
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate SOAP notes')
    }
    
    // Store the generated SOAP notes for display
    setSoapNotes(data.soapNotes)
    
    return data
  }

  // Test 3: DeepSeek Direct API Test
  const testDeepSeekDirect = async () => {
    const response = await fetch('/api/test-deepseek-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, this is a test message. Please respond with a brief acknowledgment.'
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'DeepSeek direct API test failed')
    }
    
    return data
  }

  // Test 4: Performance Test
  const testPerformance = async () => {
    const shortTranscript = "Patient expressed anxiety about work. Therapist provided coping strategies."
    const results = []
    
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now()
      
      const response = await fetch('/api/ai/process-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `perf-test-${Date.now()}-${i}`,
          transcript: shortTranscript
        })
      })
      
      const duration = Date.now() - startTime
      const data = await response.json()
      
      results.push({
        attempt: i + 1,
        duration,
        success: response.ok,
        wordCount: data.soapNotes?.wordCount || 0
      })
      
      if (!response.ok) {
        throw new Error(`Performance test failed on attempt ${i + 1}: ${data.error}`)
      }
    }
    
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
    
    return {
      attempts: results,
      averageDuration: Math.round(avgDuration),
      totalRequests: results.length,
      successRate: '100%'
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
      { name: 'AI Configuration', fn: testAIConfig },
      { name: 'Generate SOAP Notes', fn: testGenerateSOAP },
      { name: 'DeepSeek Direct API', fn: testDeepSeekDirect },
      { name: 'Performance Test', fn: testPerformance }
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
        <h1 className="text-3xl font-bold">AI Integration Test Suite</h1>
        <p className="text-muted-foreground">
          Test DeepSeek AI integration for SOAP notes generation
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
          Video Integration Test
        </Button>
      </div>

      <Tabs defaultValue="tests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="transcript">Custom Transcript</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="soap">SOAP Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Configuration Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    AI Configuration
                  </div>
                  {getTestStatusBadge('AI Configuration')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Verify DeepSeek API configuration and connectivity
                </p>
                <Button 
                  onClick={() => runTest('AI Configuration', testAIConfig)}
                  disabled={isRunning['AI Configuration']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['AI Configuration'] ? 'Testing...' : 'Test Configuration'}
                </Button>
              </CardContent>
            </Card>

            {/* SOAP Notes Generation Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    SOAP Notes Generation
                  </div>
                  {getTestStatusBadge('Generate SOAP Notes')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test AI-powered SOAP notes generation from transcript
                </p>
                <Button 
                  onClick={() => runTest('Generate SOAP Notes', testGenerateSOAP)}
                  disabled={isRunning['Generate SOAP Notes']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Generate SOAP Notes'] ? 'Generating...' : 'Generate SOAP Notes'}
                </Button>
              </CardContent>
            </Card>

            {/* DeepSeek Direct API Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    DeepSeek Direct API
                  </div>
                  {getTestStatusBadge('DeepSeek Direct API')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test direct communication with DeepSeek API
                </p>
                <Button 
                  onClick={() => runTest('DeepSeek Direct API', testDeepSeekDirect)}
                  disabled={isRunning['DeepSeek Direct API']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['DeepSeek Direct API'] ? 'Testing...' : 'Test Direct API'}
                </Button>
              </CardContent>
            </Card>

            {/* Performance Test */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Performance Test
                  </div>
                  {getTestStatusBadge('Performance Test')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Test AI response times and consistency (3 requests)
                </p>
                <Button 
                  onClick={() => runTest('Performance Test', testPerformance)}
                  disabled={isRunning['Performance Test']}
                  size="sm"
                  className="w-full"
                >
                  {isRunning['Performance Test'] ? 'Testing...' : 'Run Performance Test'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transcript" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Transcript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter a custom therapy session transcript to test SOAP notes generation. 
                Leave empty to use the default transcript.
              </p>
              
              <Textarea
                placeholder="Enter therapy session transcript here..."
                value={customTranscript}
                onChange={(e) => setCustomTranscript(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setCustomTranscript(defaultTranscript)}
                  variant="outline"
                  size="sm"
                >
                  Load Default Transcript
                </Button>
                <Button 
                  onClick={() => setCustomTranscript('')}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
                <span className="text-sm text-muted-foreground ml-auto">
                  {customTranscript.length} characters
                </span>
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

        <TabsContent value="soap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated SOAP Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {soapNotes ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Provider: <strong>{soapNotes.provider}</strong></span>
                    <span>Words: <strong>{soapNotes.wordCount || 'N/A'}</strong></span>
                    <span>Generated: <strong>{new Date(soapNotes.generatedAt || Date.now()).toLocaleString()}</strong></span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2">SUBJECTIVE</h4>
                      <div className="p-3 bg-green-50 rounded border-l-4 border-green-200">
                        <pre className="whitespace-pre-wrap text-sm">{soapNotes.structured.subjective}</pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-blue-700 mb-2">OBJECTIVE</h4>
                      <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-200">
                        <pre className="whitespace-pre-wrap text-sm">{soapNotes.structured.objective}</pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-orange-700 mb-2">ASSESSMENT</h4>
                      <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-200">
                        <pre className="whitespace-pre-wrap text-sm">{soapNotes.structured.assessment}</pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-purple-700 mb-2">PLAN</h4>
                      <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-200">
                        <pre className="whitespace-pre-wrap text-sm">{soapNotes.structured.plan}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded">
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <p className="text-sm">{soapNotes.summary}</p>
                  </div>
                </div>
              ) : (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    No SOAP notes generated yet. Run the "Generate SOAP Notes" test to see results here.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" asChild className="h-16 flex-col">
              <a href="/debug-daily" target="_blank" rel="noopener noreferrer">
                <Settings className="h-6 w-6 mb-2" />
                <span>Daily.co Debug</span>
              </a>
            </Button>
            
            <Button variant="outline" asChild className="h-16 flex-col">
              <a href="/test-video-integration" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-6 w-6 mb-2" />
                <span>Video Integration Test</span>
              </a>
            </Button>
            
            <Button variant="outline" asChild className="h-16 flex-col">
              <a href="/test-csv-upload" target="_blank" rel="noopener noreferrer">
                <User className="h-6 w-6 mb-2" />
                <span>CSV Upload Test</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
