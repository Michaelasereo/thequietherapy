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
  addToGoogleCalendar, 
  downloadICSFile, 
  createSessionCalendarEvent,
  type CalendarEvent 
} from '@/lib/google-calendar'
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
  
  const handleAddToGoogleCalendar = () => {
    try {
      console.log('📅 Creating calendar event for session:', session)
      const event = createSessionCalendarEvent(session)
      console.log('✅ Calendar event created:', event)
      addToGoogleCalendar(event)
      toast.success('Opening Google Calendar...')
    } catch (error) {
      console.error('Error adding to calendar:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to open Google Calendar: ${errorMessage}`)
    }
  }

  const handleDownloadICS = () => {
    try {
      const event = createSessionCalendarEvent(session)
      const filename = `therapy-session-${session.id.slice(0, 8)}.ics`
      downloadICSFile(event, filename)
      toast.success('Calendar file downloaded!')
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
        <DropdownMenuItem onClick={handleAddToGoogleCalendar}>
          <Calendar className="h-4 w-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS}>
          <Download className="h-4 w-4 mr-2" />
          Download ICS File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

