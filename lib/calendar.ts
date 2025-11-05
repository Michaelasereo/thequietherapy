/**
 * Calendar utility functions
 * Generates .ics files compatible with Apple Calendar, Outlook, Google Calendar, etc.
 */

/**
 * Generate an .ics calendar file content for a therapy session
 * This creates a calendar event that can be imported into any calendar app
 */
export function generateCalendarEvent({
  title,
  description,
  startTime,
  endTime,
  location,
  organizerEmail,
  attendeeEmails,
  reminderMinutes = 60, // 1 hour before by default
}: {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  organizerEmail?: string;
  attendeeEmails?: string[];
  reminderMinutes?: number;
}): string {
  // Format dates in ICS format (YYYYMMDDTHHMMSSZ)
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // Generate unique ID for the event
  const uid = `therapy-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@thequietherapy.live`;

  // Generate timestamp for now
  const now = formatICSDate(new Date());
  const dtstart = formatICSDate(startTime);
  const dtend = formatICSDate(endTime);

  // Escape text for ICS format (replace commas, semicolons, newlines)
  const escapeICS = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const safeTitle = escapeICS(title);
  const safeDescription = description ? escapeICS(description) : '';
  const safeLocation = location ? escapeICS(location) : '';
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thequietherapy.live';
  const reminderText = `Please check your dashboard before the session: ${dashboardUrl}/dashboard/sessions`;

  // Build ICS file
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Quiet Therapy//Session Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${safeTitle}`,
  ];

  if (safeDescription) {
    ics.push(`DESCRIPTION:${safeDescription}`);
  }

  if (safeLocation) {
    ics.push(`LOCATION:${safeLocation}`);
  }

  // Add organizer
  if (organizerEmail) {
    ics.push(`ORGANIZER;CN=The Quiet Therapy:MAILTO:${organizerEmail}`);
  }

  // NOTE: Intentionally NOT adding attendees to prevent Google Meet link creation
  // Users should join via the dashboard, not through calendar video links
  // if (attendeeEmails && attendeeEmails.length > 0) {
  //   attendeeEmails.forEach((email) => {
  //     ics.push(`ATTENDEE;CN=Attendee:MAILTO:${email}`);
  //   });
  // }

  // Add reminder (alarm) - reminds user to check dashboard
  ics.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT' + reminderMinutes + 'M', // Negative duration = before event
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(reminderText)}`,
    'END:VALARM'
  );

  // Add another reminder 15 minutes before
  ics.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS('Therapy session starts in 15 minutes. Check your dashboard for the meeting room.')}`,
    'END:VALARM'
  );

  ics.push('END:VEVENT');
  ics.push('END:VCALENDAR');

  return ics.join('\r\n');
}

/**
 * Generate calendar event URL for common calendar services
 * This provides direct links to add events to Google Calendar, Outlook, Apple Calendar, etc.
 */
export function generateCalendarLinks({
  title,
  description,
  startTime,
  endTime,
  location,
}: {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}): {
  google: string;
  outlook: string;
  yahoo: string;
  ics: string;
} {
  // Format dates for URL parameters
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const start = formatDate(startTime);
  const end = formatDate(endTime);
  const dates = `${start}/${end}`;

  // Google Calendar - explicitly prevent Meet link creation
  // Note: We don't include attendees or use 'add' action to avoid Meet link creation
  const googleParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: dates,
    details: description || '',
    location: location || '',
    sf: 'true',
    output: 'xml',
    // Explicitly set to not create video call
    // Google Calendar might still create Meet links, so we recommend using ICS download instead
  });
  const googleUrl = `https://calendar.google.com/calendar/render?${googleParams.toString()}`;

  // Outlook Calendar
  const outlookParams = new URLSearchParams({
    subject: title,
    startdt: startTime.toISOString(),
    enddt: endTime.toISOString(),
    body: description || '',
    location: location || '',
  });
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams.toString()}`;

  // Yahoo Calendar
  const yahooParams = new URLSearchParams({
    v: '60',
    view: 'd',
    type: '20',
    title: title,
    st: start,
    dur: String(Math.round((endTime.getTime() - startTime.getTime()) / 60000)), // Duration in minutes
    desc: description || '',
    in_loc: location || '',
  });
  const yahooUrl = `https://calendar.yahoo.com/?${yahooParams.toString()}`;

  // Generate ICS file content
  const ics = generateCalendarEvent({
    title,
    description,
    startTime,
    endTime,
    location,
  });

  return {
    google: googleUrl,
    outlook: outlookUrl,
    yahoo: yahooUrl,
    ics: ics,
  };
}

/**
 * Create a data URL for downloading .ics file
 */
export function createICSDataUrl(icsContent: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
}

