'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, FileText, MessageSquare, Star, CheckCircle, ThumbsUp, MessageCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { SessionData } from '@/lib/session-management';
import { formatTime, formatDate } from '@/lib/utils';
import SOAPNotesDisplay from '@/components/soap-notes-display';

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionNotes, setSessionNotes] = useState<any>(null);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);

  // Fetch session details
  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch session details
        const sessionResponse = await fetch(`/api/sessions/${sessionId}`, {
          credentials: 'include'
        });
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setSession(sessionData.session);
          
          // Fetch session notes if available
          if (sessionData.session?.id) {
            const notesResponse = await fetch(`/api/sessions/${sessionId}/notes`, {
              credentials: 'include'
            });
            
            if (notesResponse.ok) {
              const notesData = await notesResponse.json();
              setSessionNotes(notesData.notes);
            }

            // Fetch existing feedback if available
            const feedbackResponse = await fetch(`/api/sessions/feedback?sessionId=${sessionId}`, {
              credentials: 'include'
            });
            
            if (feedbackResponse.ok) {
              const feedbackData = await feedbackResponse.json();
              if (feedbackData.feedback) {
                setExistingFeedback(feedbackData.feedback);
                setFeedbackSubmitted(true);
              }
            }
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to load session details",
            variant: "destructive",
          });
          router.push('/dashboard/sessions');
        }
      } catch (error) {
        console.error('Error fetching session details:', error);
        toast({
          title: "Error",
          description: "Failed to load session details",
          variant: "destructive",
        });
        router.push('/dashboard/sessions');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId, router]);

  const handleFeedbackSubmit = async () => {
    if (feedback.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting feedback.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingFeedback(true);
      
      const response = await fetch('/api/sessions/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          rating: feedback.rating,
          comment: feedback.comment,
        }),
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        toast({
          title: "Feedback Submitted",
          description: "Thank you for your feedback!",
          variant: "default",
        });
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'no_show':
        return <Badge variant="destructive">No Show</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/sessions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading session details...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/sessions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Session not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/sessions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sessions
        </Button>
      </div>

      {/* Session Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {session.title || 'Therapy Session'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(session.scheduled_date || session.start_time)} at {formatTime(session.scheduled_time || session.start_time)}
              </p>
            </div>
            {getStatusBadge(session.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Therapist Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {session.therapist_name || session.therapist?.full_name || 'Therapist'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {session.therapist_email || session.therapist?.email || 'therapist@example.com'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Duration: {session.duration || session.duration_minutes || 60} minutes
                </span>
              </div>

              {session.description && (
                <div className="space-y-2">
                  <h4 className="font-medium">Session Description</h4>
                  <p className="text-sm text-muted-foreground">{session.description}</p>
                </div>
              )}
            </div>

            {/* Session Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Session Type: {session.session_type || 'Video'}</span>
              </div>

              {/* Session recording removed for HIPAA compliance */}

              <div className="space-y-2">
                <h4 className="font-medium">Session ID</h4>
                <p className="text-xs font-mono bg-gray-100 p-2 rounded">{session.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Notes */}
      {sessionNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Session Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Therapist Manual Notes */}
            {sessionNotes.notes && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium">Therapist Notes</h4>
                  <Badge variant="secondary" className="text-xs">Manual</Badge>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm whitespace-pre-wrap">{sessionNotes.notes}</p>
                </div>
              </div>
            )}

            {/* SOAP Notes */}
            {sessionNotes.soap_notes && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">SOAP Notes</h4>
                  <Badge variant="secondary" className="text-xs">
                    {sessionNotes.ai_notes_generated ? 'AI Generated' : 'Manual'}
                  </Badge>
                </div>
                <SOAPNotesDisplay soapNotes={sessionNotes.soap_notes} variant="card" />
              </div>
            )}

            {/* Progress Notes */}
            {sessionNotes.progress_notes && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-medium">Progress Notes</h4>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm whitespace-pre-wrap">{sessionNotes.progress_notes}</p>
                </div>
              </div>
            )}

            {/* Homework Assigned */}
            {sessionNotes.homework_assigned && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium">Homework Assigned</h4>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm whitespace-pre-wrap">{sessionNotes.homework_assigned}</p>
                </div>
              </div>
            )}

            {/* Next Session Focus */}
            {sessionNotes.next_session_focus && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <h4 className="font-medium">Next Session Focus</h4>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <p className="text-sm whitespace-pre-wrap">{sessionNotes.next_session_focus}</p>
                </div>
              </div>
            )}

            {/* Mood Rating */}
            {sessionNotes.mood_rating && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-orange-600" />
                  <h4 className="font-medium">Mood Rating</h4>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-orange-600">{sessionNotes.mood_rating}</span>
                    <span className="text-sm text-muted-foreground">/ 10</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Notes Available */}
      {!sessionNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Session Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">No session notes available</p>
              <p className="text-sm text-muted-foreground">
                Your therapist hasn't added notes for this session yet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Feedback */}
      {session.status === 'completed' && !feedbackSubmitted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5" />
              Rate Your Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">How would you rate this session?</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                    className={`text-2xl ${
                      star <= feedback.rating 
                        ? 'text-yellow-500' 
                        : 'text-gray-300 hover:text-yellow-400'
                    } transition-colors`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Comments (Optional)</label>
              <textarea
                value={feedback.comment}
                onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your thoughts about the session..."
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
            </div>

            <Button 
              onClick={handleFeedbackSubmit}
              disabled={submittingFeedback || feedback.rating === 0}
              className="w-full"
            >
              {submittingFeedback ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Feedback Submitted Confirmation or Display Existing Feedback */}
      {feedbackSubmitted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <h3 className="font-semibold text-green-900">Feedback Submitted</h3>
            </div>
            
            {existingFeedback && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-800">Your Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${
                          star <= existingFeedback.rating 
                            ? 'text-yellow-500' 
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                
                {existingFeedback.comment && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-green-800">Your Comment:</span>
                    <p className="text-sm text-green-700 bg-green-100 p-3 rounded border">
                      {existingFeedback.comment}
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-green-600 mt-3">
                  Submitted on {new Date(existingFeedback.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
            
            {!existingFeedback && (
              <p className="text-sm text-green-700">
                Thank you for your feedback! It will help improve our service.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
