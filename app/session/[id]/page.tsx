'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  ArrowLeft
} from 'lucide-react';
import VideoSession from '@/components/video-session';
import { toast } from 'sonner';

interface SessionData {
  id: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  therapist?: {
    full_name: string;
    email: string;
  };
  user?: {
    full_name: string;
    email: string;
  };
  daily_room_url?: string;
  daily_room_name?: string;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [meetingToken, setMeetingToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching session details for ID:', sessionId);
      
      // First, test the main sessions API
      try {
        const response = await fetch('/api/sessions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        console.log('📡 Sessions API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Sessions API response:', result);
          
          if (result.sessions) {
            const sessionData = result.sessions.find((s: any) => s.id === sessionId);
            if (sessionData) {
              console.log('✅ Found session in main API:', sessionData);
              
              const formattedSession: SessionData = {
                id: sessionData.id,
                start_time: sessionData.start_time,
                end_time: sessionData.end_time,
                duration: sessionData.duration || sessionData.duration_minutes || 30,
                status: sessionData.status,
                therapist: sessionData.therapist,
                user: sessionData.user,
                daily_room_url: sessionData.daily_room_url,
                daily_room_name: sessionData.daily_room_name
              };
              
              setSession(formattedSession);
              return;
            }
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Sessions API error response:', errorText);
        }
      } catch (error) {
        console.error('❌ Sessions API failed:', error);
      }
      
      // Fallback: Try upcoming sessions API
      try {
        const upcomingResponse = await fetch('/api/sessions/upcoming');
        if (upcomingResponse.ok) {
          const upcomingResult = await upcomingResponse.json();
          if (upcomingResult.session && upcomingResult.session.id === sessionId) {
            console.log('✅ Found session in upcoming API');
            const sessionData = upcomingResult.session;
            
            const formattedSession: SessionData = {
              id: sessionData.id,
              start_time: sessionData.start_time,
              end_time: sessionData.end_time,
              duration: sessionData.duration || sessionData.duration_minutes || 30,
              status: sessionData.status,
              therapist: sessionData.therapist || sessionData.therapists,
              user: sessionData.user,
              daily_room_url: sessionData.daily_room_url,
              daily_room_name: sessionData.daily_room_name
            };
            
            setSession(formattedSession);
            return;
          }
        }
      } catch (error) {
        console.log('Upcoming sessions API failed:', error);
      }
      
      // If all APIs fail, show error
      throw new Error('Session not found in any API endpoint');
      
    } catch (error) {
      console.error('❌ Error fetching session:', error);
      setError(`Failed to load session details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!sessionId) return;

    setIsJoining(true);
    setError(null);

    try {
      console.log('🔍 Attempting to join session:', sessionId);

      const response = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();

      console.log('🔍 Join response:', result);
      console.log('🔍 Meeting token received:', result.data?.meeting_token ? 'Yes' : 'No');

      if (result.success) {
        setRoomUrl(result.data.room_url);
        setRoomName(result.data.room_name);
        setMeetingToken(result.data.meeting_token);
        console.log('🔍 Setting meeting token:', result.data.meeting_token);
        toast.success('Successfully joined session!');
      } else {
        const errorMsg = result.error || 'Failed to join session';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Join session error:', error);
      const errorMsg = 'Network error. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveSession = () => {
    setRoomUrl(null);
    setRoomName(null);
    setMeetingToken(null);
    toast.info('Left the session');
  };

  const handleVideoError = (error: string) => {
    setError(error);
    toast.error(error);
  };

  const canJoinSession = (session: SessionData) => {
    const now = new Date();
    const sessionTime = new Date(session.start_time);
    const timeDiff = sessionTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Can join 15 minutes before, during, or when session is in progress
    return (minutesDiff >= -15 && session.status === 'scheduled') || session.status === 'in_progress';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Session not found</p>
            <Button onClick={() => router.back()} variant="outline" className="w-full mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we have a room URL, show the video session
  if (roomUrl) {
    return (
      <div className="min-h-screen">
        <VideoSession 
          roomUrl={roomUrl}
          roomName={roomName || undefined}
          meetingToken={meetingToken || undefined}
          sessionDuration={session.duration}
          onLeave={handleLeaveSession}
          onError={handleVideoError}
        />
      </div>
    );
  }

  // Show session details and join button
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Button onClick={() => router.back()} variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Therapy Session
              </CardTitle>
              {getStatusBadge(session.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(session.start_time)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{formatTime(session.start_time)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Therapist</p>
                  <p className="font-medium">{session.therapist?.full_name || 'TBD'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{session.duration} minutes</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              {canJoinSession(session) ? (
                <Button 
                  onClick={handleJoinSession} 
                  disabled={isJoining}
                  size="lg"
                  className="w-full"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining Session...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Join Video Session
                    </>
                  )}
                </Button>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-gray-600">
                    {session.status === 'scheduled' 
                      ? 'Session is not ready yet. You can join 15 minutes before the start time.'
                      : 'This session cannot be joined at this time.'
                    }
                  </p>
                  <Button variant="outline" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Session Not Ready
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
