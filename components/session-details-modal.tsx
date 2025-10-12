'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Video, 
  FileText,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import AddToCalendarButton from '@/components/add-to-calendar-button'

interface SessionDetailsModalProps {
  sessionId: string | null
  isOpen: boolean
  onClose: () => void
  userType?: 'therapist' | 'patient'
}

export default function SessionDetailsModal({ 
  sessionId, 
  isOpen, 
  onClose,
  userType = 'therapist'
}: SessionDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionDetails()
    }
  }, [isOpen, sessionId])

  const fetchSessionDetails = async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/sessions/details?sessionId=${sessionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch session details')
      }

      const data = await response.json()
      console.log('📋 Session details received:', data)
      console.log('📋 Session data users:', data.session?.users)
      console.log('📋 Session data therapist:', data.session?.therapist)
      setSessionData(data.session)
    } catch (error) {
      console.error('Error fetching session details:', error)
      toast.error('Failed to load session details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      scheduled: { label: 'Scheduled', variant: 'default' },
      in_progress: { label: 'In Progress', variant: 'secondary' },
      completed: { label: 'Completed', variant: 'outline' },
      cancelled: { label: 'Cancelled', variant: 'destructive' }
    }

    const config = statusConfig[status] || { label: status, variant: 'outline' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Session Details</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessionData ? (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              {getStatusBadge(sessionData.status)}
              {sessionData.status === 'scheduled' && sessionData.credit_used_id === null && (
                <Badge variant="outline" className="bg-orange-50 border-orange-300 text-orange-700">
                  💳 Credit Required
                </Badge>
              )}
            </div>

            {/* Session Title */}
            {sessionData.title && (
              <div>
                <h3 className="text-lg font-semibold">{sessionData.title}</h3>
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Date</span>
                </div>
                <p className="text-sm">{formatDate(sessionData.start_time || sessionData.scheduled_date)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Time</span>
                </div>
                <p className="text-sm">
                  {formatTime(sessionData.start_time || `${sessionData.scheduled_date}T${sessionData.scheduled_time}`)}
                  {sessionData.duration_minutes && ` (${sessionData.duration_minutes} mins)`}
                </p>
              </div>
            </div>

            <Separator />

            {/* Client/Therapist Information */}
            {userType === 'therapist' ? (
              // Show client info for therapists
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client Information
                </h4>
                <div className="space-y-3 pl-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {sessionData.users?.full_name || 
                       sessionData.user_name || 
                       sessionData.patient_name ||
                       sessionData.title?.replace('Follow-up Session - ', '').replace('QuietTherapy with ', '') ||
                       'Not provided'}
                    </p>
                  </div>
                  {sessionData.users?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${sessionData.users.email}`} className="text-sm text-blue-600 hover:underline">
                        {sessionData.users.email}
                      </a>
                    </div>
                  )}
                  {sessionData.users?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${sessionData.users.phone}`} className="text-sm text-blue-600 hover:underline">
                        {sessionData.users.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Show therapist info for patients
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Therapist Information
                </h4>
                <div className="space-y-3 pl-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{sessionData.therapist?.full_name || sessionData.therapist_name || 'Not provided'}</p>
                  </div>
                  {sessionData.therapist?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${sessionData.therapist.email}`} className="text-sm text-blue-600 hover:underline">
                        {sessionData.therapist.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Follow-up Session or Regular Booking */}
            {sessionData.scheduled_by_therapist ? (
              // Follow-up Session - Simple message
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Follow-up Session</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {userType === 'therapist' 
                        ? 'This is a follow-up session you scheduled with your client.'
                        : 'This session was scheduled by your therapist as a follow-up. You will need 1 credit to join this session.'}
                    </p>
                    {sessionData.notes && (
                      <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium mb-1">Therapist Notes:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{sessionData.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Regular Booked Session - Show patient form details
              sessionData.notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {userType === 'therapist' ? 'Client Booking Details' : 'Your Booking Details'}
                  </h4>
                  
                  {userType === 'therapist' ? (
                    // For therapists - show detailed booking information
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-xs font-medium text-amber-900 mb-2">📋 Client submitted the following information:</p>
                        <div className="bg-white p-3 rounded border border-amber-200">
                          <p className="text-sm whitespace-pre-wrap text-gray-700">{sessionData.notes}</p>
                        </div>
                      </div>
                      
                      {sessionData.description && (
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Additional Details:</p>
                          <p className="text-sm whitespace-pre-wrap">{sessionData.description}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // For patients - show their booking details
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{sessionData.notes}</p>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {sessionData.status === 'scheduled' && (
                <AddToCalendarButton
                  session={{
                    id: sessionData.id,
                    title: sessionData.title || 'Therapy Session',
                    start_time: sessionData.start_time || `${sessionData.scheduled_date}T${sessionData.scheduled_time}`,
                    end_time: sessionData.end_time || new Date(new Date(sessionData.start_time || `${sessionData.scheduled_date}T${sessionData.scheduled_time}`).getTime() + (sessionData.duration_minutes || 30) * 60000).toISOString(),
                    therapist_name: sessionData.therapist?.full_name,
                    patient_name: sessionData.users?.full_name,
                    therapist_email: sessionData.therapist?.email,
                    patient_email: sessionData.users?.email,
                    session_url: sessionData.daily_room_url
                  }}
                  variant="default"
                  size="default"
                  className="flex-1"
                />
              )}
              
              {sessionData.daily_room_url && sessionData.status === 'scheduled' && (
                <Button variant="outline" className="flex-1" asChild>
                  <a href={sessionData.daily_room_url} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-2" />
                    Join Video Call
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No session details available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

