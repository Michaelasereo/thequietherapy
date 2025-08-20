'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import DailyAudioRecorder from '@/components/daily-audio-recorder';

// Extend Window interface for Daily.co call object
declare global {
  interface Window {
    dailyCallObject?: any;
  }
}

export default function TestBrowserRecording() {
  const [callObject, setCallObject] = useState<any>(null);
  const [roomName, setRoomName] = useState('test-room-browser-recording');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyInitialized, setDailyInitialized] = useState(false);
  
  // Use ref to ensure consistent sessionId across server/client
  const sessionIdRef = useRef<string>('');
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize sessionId on client side only
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = 'test-session-browser-' + Math.floor(Math.random() * 1000000);
      setSessionId(sessionIdRef.current);
    }
  }, []);

  // Initialize Daily.co call object
  useEffect(() => {
    const initCall = async () => {
      // Prevent duplicate initialization
      if (dailyInitialized) return;
      
      try {
        setLoading(true);
        setError(null);

        // Dynamically import Daily.co
        const DailyIframe = (await import('@daily-co/daily-js')).default;
        
        // Check if a call object already exists
        if (window.dailyCallObject) {
          setCallObject(window.dailyCallObject);
          setDailyInitialized(true);
          return;
        }
        
        const call = DailyIframe.createCallObject({
          audioSource: true,
          videoSource: false, // We only need audio for recording
        });

        // Store globally to prevent duplicates
        window.dailyCallObject = call;
        setCallObject(call);
        setDailyInitialized(true);
        console.log('Daily.co call object created');
      } catch (err) {
        console.error('Error initializing Daily.co:', err);
        setError('Failed to initialize Daily.co call object');
      } finally {
        setLoading(false);
      }
    };

    initCall();

    // Cleanup function
    return () => {
      if (window.dailyCallObject) {
        try {
          window.dailyCallObject.destroy();
          delete window.dailyCallObject;
        } catch (err) {
          console.error('Error destroying Daily.co call object:', err);
        }
      }
    };
  }, [dailyInitialized]);

  const handleTranscriptionComplete = (transcriptText: string) => {
    setTranscript(transcriptText);
    console.log('Transcription completed:', transcriptText);
  };

  const testTranscriptionAPI = async () => {
    try {
      setLoading(true);
      setError(null);

      // First test the basic API endpoint
      const testResponse = await fetch('/api/test-transcription', {
        method: 'GET'
      });

      if (!testResponse.ok) {
        throw new Error(`API test failed: ${testResponse.statusText}`);
      }

      const testResult = await testResponse.json();
      console.log('API test result:', testResult);

      // Create a test audio file with actual speech simulation
      // This creates a simple tone that Whisper might be able to process
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const destination = audioContext.createMediaStreamDestination();
      
      oscillator.connect(destination);
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5); // Longer duration for better testing

      const mediaRecorder = new MediaRecorder(destination.stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        const formData = new FormData();
        formData.append('file', audioBlob, 'test-audio.webm');
        formData.append('sessionId', sessionId);

        console.log('Sending test audio file for transcription...');
        console.log('Audio blob size:', audioBlob.size);
        console.log('Audio blob type:', audioBlob.type);

        const response = await fetch('/api/test-transcription', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Transcription failed: ${response.statusText} - ${errorData.error || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('Test transcription result:', result);
        
        if (result.text) {
          alert(`Transcription API test completed successfully!\n\nTranscription: "${result.text}"`);
        } else {
          alert('Transcription API test completed, but no text was returned. This might be normal for test audio.');
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 600);
    } catch (err) {
      console.error('Error testing transcription API:', err);
      setError(err instanceof Error ? err.message : 'Transcription test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Browser-Based Audio Recording Test</h1>
          <p className="text-muted-foreground">
            Test the new browser-based audio recording functionality that captures all participants' audio 
            directly from Daily.co calls and transcribes it using OpenAI Whisper.
          </p>
        </div>

        <Separator />

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={callObject ? "default" : "secondary"}>
                  {callObject ? "✅ Daily.co Ready" : "⏳ Initializing..."}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Session: {sessionId || 'Initializing...'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Room: {roomName}
                </Badge>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={testTranscriptionAPI}
                disabled={loading}
                variant="outline"
              >
                {loading ? "Testing..." : "Test Transcription API"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This tests the transcription API with a silent audio file to verify the backend is working.
            </p>
          </CardContent>
        </Card>

        {/* Audio Recorder */}
        {callObject && sessionId && (
          <Card>
            <CardHeader>
              <CardTitle>Audio Recorder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-600">
                    <strong>Note:</strong> Make sure to grant microphone permissions when prompted. 
                    The recorder will capture audio from all participants in the call.
                  </p>
                </div>
                <DailyAudioRecorder
                  callObject={callObject}
                  sessionId={sessionId}
                  onTranscriptionComplete={handleTranscriptionComplete}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Browser-Based Recording</h4>
              <p className="text-sm text-muted-foreground">
                The recorder captures all participants' audio directly in the browser using MediaRecorder API.
                No server-side recording required!
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Audio Processing</h4>
              <p className="text-sm text-muted-foreground">
                Audio is recorded as WebM format and sent to the backend for transcription using OpenAI Whisper.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">3. Database Storage</h4>
              <p className="text-sm text-muted-foreground">
                Transcriptions are automatically stored in the database and can be used for AI analysis.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Advantages</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>No Daily.co premium subscription required</li>
                <li>Real-time recording with visual feedback</li>
                <li>Captures all participants' audio</li>
                <li>Immediate transcription after recording</li>
                <li>Downloadable audio files</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Latest Transcript */}
        {transcript && (
          <Card>
            <CardHeader>
              <CardTitle>Latest Transcription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 border rounded-md">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
