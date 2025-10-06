/**
 * Enhanced 3-Level Availability System Types
 * 
 * This file defines the TypeScript interfaces for the comprehensive availability system
 * that supports weekly templates, specific date overrides, and real-time availability.
 */

// ============================================================================
// CORE AVAILABILITY TYPES
// ============================================================================

export interface TimeRange {
  start: string; // Format: "HH:MM" (24-hour)
  end: string;   // Format: "HH:MM" (24-hour)
  type: 'available' | 'break' | 'unavailable';
}

export interface TimeSlot {
  id: string;
  start: string; // Format: "HH:MM"
  end: string;   // Format: "HH:MM"
  duration: number; // in minutes
  type: 'individual' | 'group' | 'consultation';
  maxSessions: number;
  title: string;
  description?: string;
  isAvailable: boolean;
}

export interface DayAvailability {
  enabled: boolean;
  generalHours?: {
    start: string; // Format: "HH:MM"
    end: string;   // Format: "HH:MM"
    totalHours: number; // Total hours available for sessions
    sessionDuration: number; // Duration per session in minutes
    bufferTime: number; // Buffer between sessions in minutes
  };
  customSlots: TimeSlot[]; // Custom slots that override general hours
  timeSlots: TimeSlot[]; // Legacy support
  breaks?: TimeRange[];
  notes?: string;
}

// ============================================================================
// WEEKLY AVAILABILITY SYSTEM
// ============================================================================

export interface WeeklyAvailability {
  standardHours: {
    monday: DayAvailability;
    tuesday: DayAvailability;
    wednesday: DayAvailability;
    thursday: DayAvailability;
    friday: DayAvailability;
    saturday: DayAvailability;
    sunday: DayAvailability;
  };
  sessionSettings: SessionSettings;
  timezone: string;
  lastUpdated: string;
}

export interface SessionSettings {
  sessionDuration: number; // in minutes
  bufferTime: number; // in minutes between sessions
  maxSessionsPerDay: number;
  advanceBookingDays: number; // how many days in advance clients can book
  cancellationHours: number; // minimum hours before session to cancel
}

// ============================================================================
// AVAILABILITY OVERRIDES SYSTEM
// ============================================================================

export interface AvailabilityOverride {
  id: string;
  therapistId: string;
  date: string; // Format: "YYYY-MM-DD"
  type: 'unavailable' | 'custom_hours' | 'reduced_hours';
  isAvailable: boolean;
  customHours?: {
    start: string;
    end: string;
    timeSlots: TimeSlot[];
  };
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// REAL-TIME AVAILABILITY SYSTEM
// ============================================================================

export interface RealTimeAvailability {
  therapistId: string;
  date: string;
  timeSlots: TimeSlot[];
  isOnline: boolean;
  lastSeen: string;
  currentSession?: {
    id: string;
    startTime: string;
    endTime: string;
    clientName: string;
  };
}

// ============================================================================
// TEMPLATE SYSTEM
// ============================================================================

export interface AvailabilityTemplate {
  id: string;
  therapistId: string;
  name: string;
  description?: string;
  weeklyAvailability: WeeklyAvailability;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface SaveAvailabilityRequest {
  therapistId: string;
  availability: WeeklyAvailability;
  templateName?: string;
}

export interface SaveAvailabilityResponse {
  success: boolean;
  message: string;
  availability?: WeeklyAvailability;
  templateId?: string;
}

export interface GetAvailabilityResponse {
  success: boolean;
  availability: WeeklyAvailability;
  overrides: AvailabilityOverride[];
  templates: AvailabilityTemplate[];
  realTimeStatus?: RealTimeAvailability;
}

export interface SaveOverrideRequest {
  therapistId: string;
  date: string;
  type: 'unavailable' | 'custom_hours' | 'reduced_hours';
  isAvailable: boolean;
  customHours?: {
    start: string;
    end: string;
    timeSlots: TimeSlot[];
  };
  reason: string;
  notes?: string;
}

export interface SaveOverrideResponse {
  success: boolean;
  message: string;
  override: AvailabilityOverride;
}

// ============================================================================
// CALENDAR COMPONENT TYPES
// ============================================================================

export interface CalendarDay {
  date: string;
  dayName: string;
  dayOfWeek: number;
  isToday: boolean;
  isPast: boolean;
  isCurrentMonth: boolean;
  availability: DayAvailability;
  override?: AvailabilityOverride;
  sessions?: SessionInfo[];
}

export interface SessionInfo {
  id: string;
  startTime: string;
  endTime: string;
  clientName: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type: 'individual' | 'group';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface AvailabilityStats {
  totalAvailableHours: number;
  totalSessionsScheduled: number;
  averageSessionsPerDay: number;
  mostPopularTimeSlots: string[];
  upcomingSessions: SessionInfo[];
}

export interface TimeSlotValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface AvailabilityManagerProps {
  therapistId: string;
  initialAvailability?: WeeklyAvailability;
  onSave?: (availability: WeeklyAvailability) => void;
  onError?: (error: string) => void;
}

export interface WeeklyCalendarProps {
  availability: WeeklyAvailability;
  onAvailabilityChange: (availability: WeeklyAvailability) => void;
  onDayClick?: (date: string) => void;
  onTimeSlotClick?: (date: string, timeSlot: TimeSlot) => void;
  readOnly?: boolean;
}

export interface TimeSlotEditorProps {
  timeSlot: TimeSlot;
  onUpdate: (timeSlot: TimeSlot) => void;
  onDelete: (timeSlotId: string) => void;
  availableTypes: string[];
  maxDuration?: number;
}

export interface AvailabilityOverrideProps {
  therapistId: string;
  selectedDate?: string;
  onOverrideSaved?: (override: AvailabilityOverride) => void;
  onOverrideDeleted?: (overrideId: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DAYS_OF_WEEK = [
  'sunday',
  'monday', 
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const;

export const SESSION_TYPES = [
  'individual',
  'group',
  'consultation'
] as const;

export const OVERRIDE_TYPES = [
  'unavailable',
  'custom_hours',
  'reduced_hours'
] as const;

export const DEFAULT_SESSION_DURATIONS = [30, 45, 60, 90, 120] as const;

export const DEFAULT_TIME_SLOT: TimeSlot = {
  id: '',
  start: '09:00',
  end: '10:00',
  duration: 60,
  type: 'individual',
  maxSessions: 1,
  title: 'Individual Therapy Session',
  isAvailable: true
};

export const DEFAULT_DAY_AVAILABILITY: DayAvailability = {
  enabled: false,
  customSlots: [],
  timeSlots: [], // Legacy support
  breaks: [],
  notes: ''
};

export const DEFAULT_WEEKLY_AVAILABILITY: WeeklyAvailability = {
  standardHours: {
    monday: { ...DEFAULT_DAY_AVAILABILITY, enabled: true },
    tuesday: { ...DEFAULT_DAY_AVAILABILITY, enabled: true },
    wednesday: { ...DEFAULT_DAY_AVAILABILITY, enabled: true },
    thursday: { ...DEFAULT_DAY_AVAILABILITY, enabled: true },
    friday: { ...DEFAULT_DAY_AVAILABILITY, enabled: true },
    saturday: { ...DEFAULT_DAY_AVAILABILITY, enabled: false },
    sunday: { ...DEFAULT_DAY_AVAILABILITY, enabled: false }
  },
  sessionSettings: {
    sessionDuration: 60,
    bufferTime: 15,
    maxSessionsPerDay: 8,
    advanceBookingDays: 30,
    cancellationHours: 24
  },
  timezone: 'UTC',
  lastUpdated: new Date().toISOString()
};
