'use client';

import { useEffect } from 'react';
import { X, Clock, User, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConflictSession {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  user_name?: string;
  user_email?: string;
}

interface SuggestedTime {
  time: string;
  label: string;
}

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictSession[];
  suggestions?: SuggestedTime[];
  onResolve?: (suggestion: SuggestedTime) => void;
  requestedTime?: string;
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  conflicts,
  suggestions = [],
  onResolve,
  requestedTime
}: ConflictResolutionModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <Card className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Time Slot Conflict</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The selected time slot is already booked. Please choose a different time or contact the existing client to reschedule.
            </AlertDescription>
          </Alert>

          {requestedTime && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-sm text-gray-700">
                  Requested Time
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {formatDateTime(requestedTime).date} at {formatDateTime(requestedTime).time}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Conflicting Sessions
            </h3>
            
            <div className="space-y-3">
              {conflicts.map((conflict, index) => {
                const startTime = formatDateTime(conflict.start_time);
                const endTime = formatDateTime(conflict.end_time);
                
                return (
                  <Card key={conflict.id} className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-white">
                            Conflict #{index + 1}
                          </Badge>
                          <Badge 
                            variant={
                              conflict.status === 'scheduled' || conflict.status === 'confirmed' 
                                ? 'default' 
                                : 'secondary'
                            }
                          >
                            {conflict.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">Client:</span>
                          <span>{conflict.user_name || 'Unknown User'}</span>
                        </div>

                        {conflict.user_email && (
                          <div className="text-sm text-gray-600 ml-6">
                            {conflict.user_email}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">Time:</span>
                          <span>
                            {startTime.date === endTime.date 
                              ? `${startTime.date} from ${startTime.time} to ${endTime.time}`
                              : `${startTime.date} ${startTime.time} - ${endTime.date} ${endTime.time}`
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {suggestions && suggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Suggested Alternative Times</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((suggestion, index) => {
                  const formatted = formatDateTime(suggestion.time);
                  
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="flex flex-col items-start h-auto p-4 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => onResolve?.(suggestion)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-sm">{suggestion.label}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatted.date}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Choose Different Time
            </Button>
            <Button
              variant="default"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Refresh Calendar
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-sm mb-2">Suggested Actions:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Choose a different time slot from the suggestions above</li>
              <li>Contact the existing client to reschedule their session</li>
              <li>Try adding buffer time between sessions (minimum 15 minutes recommended)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

