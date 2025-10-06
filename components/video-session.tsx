'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, PhoneOff, AlertCircle, RefreshCw, Clock } from 'lucide-react';

interface VideoSessionProps {
  roomUrl: string;
  roomName?: string;
  meetingToken?: string;
  sessionDuration?: number; // Duration in minutes
  onLeave?: () => void;
  onError?: (error: string) => void;
}

export default function VideoSession({ 
  roomUrl, 
  roomName, 
  meetingToken,
  sessionDuration = 60, // Default to 60 minutes
  onLeave, 
  onError 
}: VideoSessionProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(sessionDuration * 60); // Convert to seconds
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  console.log('🔍 VideoSession props:', { roomUrl, roomName, meetingToken: meetingToken ? 'Present' : 'Missing' });
  const iframeUrl = meetingToken ? `${roomUrl}?t=${meetingToken}` : roomUrl;
  console.log('🔍 Iframe URL will be:', iframeUrl);
  console.log('🔍 Meeting token value:', meetingToken);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
    setSessionStartTime(new Date());
  };

  // Timer effect
  useEffect(() => {
    if (!sessionStartTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
      const remaining = Math.max(0, (sessionDuration * 60) - elapsed);
      setTimeRemaining(remaining);

      // Auto-end session when time is up
      if (remaining === 0) {
        clearInterval(timer);
        onLeave?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime, sessionDuration, onLeave]);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleIframeError = () => {
    const errorMsg = 'Failed to load video session. This might be due to browser security policies. Please try refreshing the page or check your browser settings.';
    setError(errorMsg);
    setIsLoading(false);
    onError?.(errorMsg);
    console.error('❌ Iframe failed to load. This might be a CSP or permissions policy issue.');
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Force iframe reload by changing the key
    window.location.reload();
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <br /><br />
                <strong>Troubleshooting steps:</strong>
                <br />• Try refreshing the page
                <br />• Check if your browser allows camera/microphone access
                <br />• Try using a different browser
                <br />• Contact support if the issue persists
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={onLeave} variant="destructive" className="flex-1">
                <PhoneOff className="h-4 w-4 mr-2" />
                Leave Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header with session info and controls */}
      <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-gray-900">Therapy Session</span>
          </div>
          {roomName && (
            <span className="text-sm text-gray-500">Room: {roomName}</span>
          )}
        </div>
        
        {/* Timer Display */}
        <div className="flex items-center gap-4">
          {sessionStartTime && (
            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border shadow-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-mono font-semibold text-gray-900">
                {formatTime(timeRemaining)}
              </span>
              <span className="text-xs text-gray-500">remaining</span>
            </div>
          )}
          
          <Button
            onClick={onLeave}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <PhoneOff className="h-4 w-4" />
            Leave Session
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to video session...</p>
          </div>
        </div>
      )}

      {/* Daily.co Iframe - THE MOST IMPORTANT PART */}
      <div className="flex-1 relative">
        <iframe
          key={`${roomUrl}-${meetingToken}`} // Force re-render when URL or token changes
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          src={iframeUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{ 
            minHeight: '500px',
            display: isLoading ? 'none' : 'block'
          }}
          title="Therapy Session Video Call"
        />
      </div>

      {/* Footer with session info */}
      <div className="p-3 bg-gray-50 border-t text-center">
        <p className="text-xs text-gray-500">
          Secure video session powered by Daily.co
        </p>
      </div>
    </div>
  );
}