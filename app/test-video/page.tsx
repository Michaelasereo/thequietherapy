'use client';

import { useState } from 'react';
import VideoCall from '@/components/video-call';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestVideoPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [userType, setUserType] = useState<'user' | 'therapist'>('user');

  const startCall = () => {
    setIsCallActive(true);
  };

  const endCall = () => {
    setIsCallActive(false);
  };

  if (isCallActive) {
    return (
      <VideoCall
        sessionId="test-session-123"
        userId={userType === 'user' ? 'user-123' : 'therapist-123'}
        userType={userType}
        onEndCall={endCall}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Video Call Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Test Video Call Functionality</h3>
              <p className="text-gray-600 mb-4">
                This page allows you to test the video call component. Choose your role and start a test call.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Role:</label>
                <div className="flex space-x-4">
                  <Button
                    variant={userType === 'user' ? 'default' : 'outline'}
                    onClick={() => setUserType('user')}
                  >
                    User
                  </Button>
                  <Button
                    variant={userType === 'therapist' ? 'default' : 'outline'}
                    onClick={() => setUserType('therapist')}
                  >
                    Therapist
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Features to Test:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Camera and microphone access</li>
                  <li>• Mute/unmute functionality</li>
                  <li>• Video on/off toggle</li>
                  <li>• Screen sharing</li>
                  <li>• Chat functionality</li>
                  <li>• Call duration timer</li>
                  <li>• End call functionality</li>
                </ul>
              </div>

              <Button 
                onClick={startCall}
                size="lg"
                className="w-full"
              >
                Start Test Video Call
              </Button>

              <div className="text-sm text-gray-500 text-center">
                <p>Note: This is a test environment. No actual peer connection will be established.</p>
                <p>The video call will simulate a connection after 2 seconds.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
