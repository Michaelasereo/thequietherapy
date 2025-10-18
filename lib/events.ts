/**
 * Global Event System for Therapist Profile Updates
 * 
 * This provides a simple, lightweight event emitter for cross-component
 * communication without prop drilling or complex state management.
 * 
 * Usage:
 * ```typescript
 * // Emit an event
 * therapistEvents.emit('avatar-updated', { profile_image_url: newUrl })
 * 
 * // Listen for events
 * therapistEvents.on('avatar-updated', (data) => {
 *   console.log('Avatar updated:', data.profile_image_url)
 * })
 * 
 * // Clean up
 * therapistEvents.off('avatar-updated', callback)
 * ```
 */

type EventCallback = (data?: any) => void

class TherapistEventEmitter {
  private static instance: TherapistEventEmitter
  private listeners: Map<string, EventCallback[]> = new Map()

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): TherapistEventEmitter {
    if (!TherapistEventEmitter.instance) {
      TherapistEventEmitter.instance = new TherapistEventEmitter()
    }
    return TherapistEventEmitter.instance
  }

  /**
   * Emit an event to all registered listeners
   */
  emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event) || []
    console.log(`🔔 Event emitted: ${event}`, data)
    eventListeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
  }

  /**
   * Register a listener for an event
   */
  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
    console.log(`👂 Listener registered for: ${event}`)
  }

  /**
   * Remove a listener for an event
   */
  off(event: string, callback: EventCallback): void {
    const eventListeners = this.listeners.get(event) || []
    const index = eventListeners.indexOf(callback)
    if (index > -1) {
      eventListeners.splice(index, 1)
      console.log(`🔇 Listener removed for: ${event}`)
    }
  }

  /**
   * Remove all listeners for an event
   */
  clear(event: string): void {
    this.listeners.delete(event)
    console.log(`🗑️  All listeners cleared for: ${event}`)
  }

  /**
   * Remove all listeners for all events
   */
  clearAll(): void {
    this.listeners.clear()
    console.log(`🗑️  All event listeners cleared`)
  }
}

// Export singleton instance
export const therapistEvents = TherapistEventEmitter.getInstance()

// Event type definitions for type safety
export const THERAPIST_EVENTS = {
  AVATAR_UPDATED: 'avatar-updated',
  PROFILE_UPDATED: 'profile-updated',
  PROFILE_FIELD_UPDATED: 'profile-field-updated',
  SESSION_REFRESHED: 'session-refreshed',
} as const

export type TherapistEventType = typeof THERAPIST_EVENTS[keyof typeof THERAPIST_EVENTS]

// Type-safe event data structures
export interface AvatarUpdatedData {
  profile_image_url: string
}

export interface ProfileUpdatedData {
  [key: string]: any
}

export interface ProfileFieldUpdatedData {
  fieldName: string
  newValue: any
  oldValue?: any
}

