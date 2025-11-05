'use client'

import { Calendar, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  generateCalendarEvent,
  generateCalendarLinks,
  createICSDataUrl
} from '@/lib/calendar'
import { toast } from 'sonner'

interface AddToCalendarButtonProps {
  session: {
    id: string
    title?: string
    start_time: string | Date
    end_time: string | Date
    therapist_name?: string
    patient_name?: string
    therapist_email?: string
    patient_email?: string
    session_url?: string
  }
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  className?: string
}

export default function AddToCalendarButton({ 
  session, 
  variant = 'outline', 
  size = 'sm',
  showIcon = true,
  className = ''
}: AddToCalendarButtonProps) {
  
  // Parse session dates and create Date objects
  const getStartTime = (): Date => {
    if (session.start_time instanceof Date) {
      return session.start_time
    }
    if (typeof session.start_time === 'string') {
      return new Date(session.start_time)
    }
    // Fallback: use current time + 1 hour
    return new Date(Date.now() + 60 * 60 * 1000)
  }

  const getEndTime = (): Date => {
    if (session.end_time instanceof Date) {
      return session.end_time
    }
    if (typeof session.end_time === 'string' && session.end_time) {
      return new Date(session.end_time)
    }
    // Fallback: start time + 30 minutes
    const startTime = getStartTime()
    return new Date(startTime.getTime() + 30 * 60 * 1000)
  }

  // Removed handleAddToGoogleCalendar - Google Calendar may automatically create Meet links
  // Users should use the ICS download option instead, which works with Google Calendar
  // when they import the file manually

  const handleAddToOutlook = () => {
    try {
      const startTime = getStartTime()
      const endTime = getEndTime()
      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thequietherapy.live'
      const calendarLinks = generateCalendarLinks({
        title: session.title || `Therapy Session with ${session.therapist_name || 'Therapist'}`,
        description: `Therapy session with ${session.therapist_name || 'Therapist'}. Please check your dashboard before the session to access the meeting room.\n\nIMPORTANT: Join via your dashboard (${dashboardUrl}/dashboard/sessions), NOT through calendar video links.`,
        startTime,
        endTime,
        location: 'Online - Check dashboard for meeting room'
      })
      
      window.open(calendarLinks.outlook, '_blank', 'noopener,noreferrer')
      toast.success('Opening Outlook Calendar...')
    } catch (error) {
      console.error('Error adding to Outlook:', error)
      toast.error('Failed to open Outlook Calendar')
    }
  }

  const handleDownloadICS = () => {
    try {
      const startTime = getStartTime()
      const endTime = getEndTime()
      
      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thequietherapy.live'
      const therapistName = session.therapist_name || session.patient_name || 'Therapist'
      const userEmail = session.therapist_email || session.patient_email
      
      const calendarIcs = generateCalendarEvent({
        title: session.title || `Therapy Session with ${therapistName}`,
        description: `Therapy session with ${therapistName}. Please check your dashboard before the session to access the meeting room: ${dashboardUrl}/dashboard/sessions\n\nIMPORTANT: Join via your dashboard, not through calendar video links.`,
        startTime,
        endTime,
        location: 'Online - Check dashboard for meeting room',
        organizerEmail: process.env.NEXT_PUBLIC_SENDER_EMAIL || 'noreply@thequietherapy.live',
        // Intentionally NOT including attendeeEmails to prevent Google Meet link creation
        // Users should join via the dashboard, not through calendar video links
        reminderMinutes: 60, // 1 hour before
      })

      // Create download link
      const blob = new Blob([calendarIcs], { type: 'text/calendar;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `therapy-session-${session.id.slice(0, 8)}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      
      toast.success('Calendar file downloaded! Add it to your calendar app.')
    } catch (error) {
      console.error('Error downloading calendar file:', error)
      toast.error('Failed to download calendar file')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {showIcon && <Calendar className="h-4 w-4 mr-2" />}
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownloadICS}>
          <Download className="h-4 w-4 mr-2" />
          Download ICS File
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddToOutlook}>
          <Calendar className="h-4 w-4 mr-2" />
          Add to Outlook Calendar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

