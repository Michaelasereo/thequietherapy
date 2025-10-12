/**
 * Google Calendar Integration Utilities
 * Generates "Add to Google Calendar" links for therapy sessions
 */

export interface CalendarEvent {
  title: string
  description?: string
  location?: string
  startTime: Date | string
  endTime: Date | string
  attendees?: string[] // Email addresses
}

/**
 * Generate a Google Calendar link for a session
 * @param event - The calendar event details
 * @returns URL to add event to Google Calendar
 */
export function generateGoogleCalendarLink(event: CalendarEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render'
  
  // Format dates to Google Calendar format (YYYYMMDDTHHmmssZ)
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      console.error('Invalid date provided to formatDate:', date)
      // Return current date as fallback
      return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }
    
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startTime)}/${formatDate(event.endTime)}`,
    details: event.description || '',
    location: event.location || 'QuietTherapy Online Platform',
  })

  // Note: We intentionally do NOT add attendees to prevent Google Meet link creation
  // Users should join via the QuietTherapy dashboard, not Google Meet

  return `${baseUrl}?${params.toString()}`
}

/**
 * Generate calendar event data for a therapy session
 */
export function createSessionCalendarEvent(session: {
  id: string
  title?: string
  start_time: string | Date
  end_time: string | Date
  therapist_name?: string
  patient_name?: string
  therapist_email?: string
  patient_email?: string
  session_url?: string
}): CalendarEvent {
  const isTherapist = session.patient_name !== undefined
  
  // Generate appropriate title based on user type
  let title: string
  if (isTherapist) {
    // For therapists: "QuietTherapy with [Patient Name]" or "Follow-up Session with [Patient Name]"
    if (session.title && session.title.toLowerCase().includes('follow-up')) {
      title = `Follow-up Session with ${session.patient_name || 'Patient'}`
    } else {
      title = `QuietTherapy with ${session.patient_name || 'Patient'}`
    }
  } else {
    // For patients: "QuietTherapy with [Therapist Name]"
    title = `QuietTherapy with ${session.therapist_name || 'Therapist'}`
  }
  
  // Ensure valid dates
  const startTime = session.start_time || new Date().toISOString()
  const endTime = session.end_time || new Date(new Date(startTime).getTime() + 30 * 60000).toISOString()
  
  // Validate dates
  const startDate = new Date(startTime)
  const endDate = new Date(endTime)
  
  if (isNaN(startDate.getTime())) {
    console.error('Invalid start_time:', session.start_time)
    throw new Error('Invalid start time for calendar event')
  }
  
  if (isNaN(endDate.getTime())) {
    console.error('Invalid end_time:', session.end_time)
    // Use start time + 30 minutes as fallback
    const fallbackEnd = new Date(startDate.getTime() + 30 * 60000)
    console.log('Using fallback end time:', fallbackEnd.toISOString())
  }
  
  const description = `
QuietTherapy Session Details:
- Session ID: ${session.id}
${session.therapist_name ? `- Therapist: ${session.therapist_name}` : ''}
${session.patient_name ? `- Patient: ${session.patient_name}` : ''}

📱 HOW TO JOIN:
Please log in to your QuietTherapy dashboard at the scheduled time to join the session.

🌐 Dashboard: https://quiettherapy.com/dashboard
(Log in with your registered email)

⏰ IMPORTANT:
- Please join 5 minutes before the session starts
- Make sure you have a stable internet connection
- Test your camera and microphone before the session

For any technical issues, please contact support.
  `.trim()

  // Note: We intentionally do NOT include attendees to prevent Google Meet link creation
  // Users should join via the QuietTherapy dashboard

  return {
    title,
    description,
    location: 'QuietTherapy Online Platform - Log in to your dashboard',
    startTime: startDate,
    endTime: endDate,
    // attendees: undefined - Removed to prevent Google Meet link
  }
}

/**
 * Open Google Calendar link in a new tab
 */
export function addToGoogleCalendar(event: CalendarEvent): void {
  const link = generateGoogleCalendarLink(event)
  window.open(link, '_blank', 'noopener,noreferrer')
}

/**
 * Generate an iCal/ICS file content for download
 * (Alternative for users who don't use Google Calendar)
 */
export function generateICSFile(event: CalendarEvent): string {
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//QuietTherapy//Therapy Session//EN
BEGIN:VEVENT
UID:${Date.now()}@quiettherapy.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.startTime)}
DTEND:${formatDate(event.endTime)}
SUMMARY:${event.title}
DESCRIPTION:${event.description?.replace(/\n/g, '\\n') || ''}
LOCATION:${event.location || ''}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder: Session starts in 15 minutes
END:VALARM
END:VEVENT
END:VCALENDAR`

  return icsContent
}

/**
 * Download ICS file for calendar import
 */
export function downloadICSFile(event: CalendarEvent, filename: string = 'therapy-session.ics'): void {
  const icsContent = generateICSFile(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

