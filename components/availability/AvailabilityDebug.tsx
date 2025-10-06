'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Bug, CheckCircle, XCircle } from 'lucide-react';

interface AvailabilityDebugProps {
  therapistId: string;
}

interface DebugResult {
  success: boolean;
  date: string;
  therapist_id: string;
  slots: any[];
  total_slots: number;
  source: string;
  message: string;
}

export function AvailabilityDebug({ therapistId }: AvailabilityDebugProps) {
  const [debugInfo, setDebugInfo] = useState<DebugResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAvailability = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      // Test with today's date
      const testDate = new Date().toISOString().split('T')[0];
      
      console.log('🔍 Testing availability API with:', { therapistId, testDate });
      
      const response = await fetch(
        `/api/availability/slots?therapist_id=${therapistId}&date=${testDate}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      setDebugInfo(data);
      console.log('✅ Availability Debug Result:', data);
      
    } catch (error) {
      console.error('❌ Debug test failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testMultipleDates = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      const dates = [];
      const today = new Date();
      
      // Test next 7 days
      for (let i = 0; i < 7; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        dates.push(testDate.toISOString().split('T')[0]);
      }
      
      console.log('🔍 Testing availability for multiple dates:', dates);
      
      const results = [];
      for (const date of dates) {
        try {
          const response = await fetch(
            `/api/availability/slots?therapist_id=${therapistId}&date=${date}`
          );
          const data = await response.json();
          results.push({ date, ...data });
        } catch (error) {
          results.push({ date, error: error instanceof Error ? error.message : 'Failed' });
        }
      }
      
      console.log('✅ Multiple dates test results:', results);
      
      // Show the first successful result or the first error
      const firstResult = results.find(r => r.success);
      if (firstResult) {
        setDebugInfo(firstResult);
      } else {
        setError('No availability found for any of the test dates');
      }
      
    } catch (error) {
      console.error('❌ Multiple dates test failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Bug className="h-5 w-5" />
          Availability Debug Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-700">
          <p><strong>Therapist ID:</strong> {therapistId}</p>
          <p className="mt-1">Use this tool to test if the availability API is working correctly.</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={testAvailability}
            disabled={loading}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Bug className="h-4 w-4 mr-2" />
                Test Today's Availability
              </>
            )}
          </Button>
          
          <Button
            onClick={testMultipleDates}
            disabled={loading}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <Bug className="h-4 w-4 mr-2" />
            Test Next 7 Days
          </Button>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {debugInfo && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>API Test Successful!</strong>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Date:</strong> {debugInfo.date}
              </div>
              <div>
                <strong>Source:</strong> 
                <Badge variant="outline" className="ml-2">
                  {debugInfo.source}
                </Badge>
              </div>
              <div>
                <strong>Total Slots:</strong> {debugInfo.total_slots}
              </div>
              <div>
                <strong>Therapist ID:</strong> {debugInfo.therapist_id}
              </div>
            </div>

            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold text-gray-900 mb-2">Raw API Response:</h4>
              <pre className="text-xs overflow-auto max-h-40 bg-gray-50 p-2 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            {debugInfo.slots && debugInfo.slots.length > 0 && (
              <div className="bg-white p-4 rounded border">
                <h4 className="font-semibold text-gray-900 mb-2">Available Time Slots:</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {debugInfo.slots.map((slot: any, index: number) => (
                    <div key={index} className="bg-blue-50 p-2 rounded text-center">
                      <div className="font-medium">{slot.start_time}</div>
                      <div className="text-xs text-gray-600">{slot.session_duration}min</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugInfo.total_slots === 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  <strong>No Available Slots Found</strong>
                  <br />
                  This could mean:
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Therapist hasn't set availability for this day</li>
                    <li>All slots are already booked</li>
                    <li>There's a data synchronization issue</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
