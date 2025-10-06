/**
 * Development Time Utilities
 * 
 * Provides time manipulation capabilities for development and testing.
 * These utilities bypass real-time constraints to speed up development.
 */

let testTimeOffset = 0; // milliseconds offset from real time
let testTimeEnabled = false;

/**
 * Get the current test time (real time + offset in development)
 */
export function getTestTime(): Date {
  if (process.env.NODE_ENV !== 'development') {
    return new Date();
  }
  
  const now = new Date();
  return new Date(now.getTime() + testTimeOffset);
}

/**
 * Set a time offset for testing (in minutes)
 */
export function setTestTimeOffset(minutes: number): void {
  if (process.env.NODE_ENV === 'development') {
    testTimeOffset = minutes * 60 * 1000;
    testTimeEnabled = true;
    console.log(`🕐 Test time offset set to ${minutes} minutes`);
  }
}

/**
 * Reset test time to real time
 */
export function resetTestTime(): void {
  if (process.env.NODE_ENV === 'development') {
    testTimeOffset = 0;
    testTimeEnabled = false;
    console.log('🕐 Test time reset to real time');
  }
}

/**
 * Check if we're in test time mode
 */
export function isTestTimeEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && testTimeEnabled;
}

/**
 * Check if booking is allowed immediately (bypasses time restrictions in dev)
 */
export function canBookImmediately(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if a time slot can be booked (bypasses real availability in dev)
 */
export function canBookTimeSlot(scheduledTime: Date): boolean {
  // In development, allow booking any future time
  if (process.env.NODE_ENV === 'development' && scheduledTime > getTestTime()) {
    return true;
  }
  
  // Production logic: must be at least 15 minutes before the session
  const now = getTestTime();
  const timeDiff = scheduledTime.getTime() - now.getTime();
  const minutesUntilSession = timeDiff / (1000 * 60);
  
  return minutesUntilSession >= 15;
}

/**
 * Get test therapist IDs that bypass availability rules
 */
export function getTestTherapistIds(): string[] {
  return [
    'test-therapist-1',
    'test-therapist-2',
    'test-therapist-3'
  ];
}

/**
 * Check if a therapist ID is a test therapist
 */
export function isTestTherapist(therapistId: string): boolean {
  return process.env.NODE_ENV === 'development' && (
    getTestTherapistIds().includes(therapistId) ||
    therapistId.includes('test') ||
    therapistId.includes('demo')
  );
}

/**
 * Create a test session time (2 minutes from now)
 */
export function createTestSessionTime(): Date {
  const now = getTestTime();
  return new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
}

/**
 * Create a test session end time (30 minutes after start)
 */
export function createTestSessionEndTime(startTime: Date): Date {
  return new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes
}

/**
 * Format time for display in dev tools
 */
export function formatTestTime(): string {
  const testTime = getTestTime();
  return testTime.toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Get time status for dev tools display
 */
export function getTimeStatus(): { 
  isTestMode: boolean; 
  currentTime: string; 
  offset: number; 
  offsetText: string;
} {
  const isTestMode = isTestTimeEnabled();
  const currentTime = formatTestTime();
  const offset = testTimeOffset / (1000 * 60); // minutes
  const offsetText = offset > 0 ? `+${offset}m` : offset < 0 ? `${offset}m` : 'real time';
  
  return {
    isTestMode,
    currentTime,
    offset,
    offsetText
  };
}
