'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Zap, Users, Calendar, Video, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth-context';
import { getTimeStatus, setTestTimeOffset, resetTestTime, formatTestTime } from '@/lib/dev-time-utils';

export function DevSessionSetup() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [timeStatus, setTimeStatus] = useState(getTimeStatus());

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleCreateTestSession = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Create a session starting in 2 minutes
      const startTime = new Date(Date.now() + 2 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

      const response = await fetch('/api/dev/book-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          therapistId: 'test-therapist-1',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create test session');
      }

      const session = await response.json();
      
      toast({
        title: "Test Session Created!",
        description: "Redirecting to therapy session...",
      });

      // Redirect to therapy session
      window.location.href = `/dashboard/therapy?session=${session.data.id}`;
    } catch (error) {
      console.error('Error creating test session:', error);
      toast({
        title: "Error",
        description: "Failed to create test session",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTimeTravel = (minutes: number) => {
    setTestTimeOffset(minutes);
    setTimeStatus(getTimeStatus());
    toast({
      title: "Time Travel Activated!",
      description: `Jumped ${minutes > 0 ? '+' : ''}${minutes} minutes`,
    });
  };

  const handleResetTime = () => {
    resetTestTime();
    setTimeStatus(getTimeStatus());
    toast({
      title: "Time Reset",
      description: "Back to real time",
    });
  };

  const handleSeedTestData = async () => {
    try {
      const response = await fetch('/api/dev/seed-test-sessions', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to seed test data');
      }

      toast({
        title: "Test Data Seeded!",
        description: "Created multiple test sessions",
      });
    } catch (error) {
      console.error('Error seeding test data:', error);
      toast({
        title: "Error",
        description: "Failed to seed test data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Dev Tools
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {timeStatus.isTestMode ? 'Test Mode' : 'Real Time'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Time Status */}
          <div className="text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{timeStatus.currentTime}</span>
            </div>
            <div className="text-gray-500 ml-5">
              Offset: {timeStatus.offsetText}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleCreateTestSession}
              disabled={isCreating}
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Video className="h-3 w-3 mr-1" />
                  Test Session
                </>
              )}
            </Button>

            <Button
              onClick={handleSeedTestData}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <Users className="h-3 w-3 mr-1" />
              Seed Data
            </Button>
          </div>

          {/* Time Travel Controls */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Time Travel:</div>
            <div className="grid grid-cols-3 gap-1">
              <Button
                onClick={() => handleTimeTravel(-30)}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                -30m
              </Button>
              <Button
                onClick={() => handleTimeTravel(30)}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                +30m
              </Button>
              <Button
                onClick={handleResetTime}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Quick Tips */}
          <Alert className="text-xs">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription>
              <div className="space-y-1">
                <div>• Test sessions bypass availability</div>
                <div>• Time travel affects booking validation</div>
                <div>• Only visible in development</div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export function DevSessionSetupMinimal() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleCreateTestSession = async () => {
    if (!user?.id) return;

    setIsCreating(true);
    try {
      const startTime = new Date(Date.now() + 2 * 60 * 1000);
      
      const response = await fetch('/api/dev/book-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          therapistId: 'test-therapist-1',
          startTime: startTime.toISOString(),
        }),
      });

      if (response.ok) {
        const session = await response.json();
        window.location.href = `/dashboard/therapy?session=${session.data.id}`;
      }
    } catch (error) {
      console.error('Error creating test session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleCreateTestSession}
        disabled={isCreating}
        className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
        size="sm"
      >
        {isCreating ? (
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Test Session
          </>
        )}
      </Button>
    </div>
  );
}
