"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Save, 
  CheckCircle2, 
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { 
  WeeklyAvailability, 
  AvailabilityManagerProps,
  DEFAULT_WEEKLY_AVAILABILITY 
} from "@/types/availability"
import { WeeklyCalendar } from "./WeeklyCalendar"

export function AvailabilityManager({ 
  therapistId, 
  initialAvailability, 
  onSave, 
  onError 
}: AvailabilityManagerProps) {
  const [availability, setAvailability] = useState<WeeklyAvailability>(
    initialAvailability || DEFAULT_WEEKLY_AVAILABILITY
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load initial data
  useEffect(() => {
    if (therapistId && !initialAvailability) {
      loadAvailability()
    }
  }, [therapistId, initialAvailability])

  const loadAvailability = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/therapist/availability/template?therapist_id=${therapistId}`, {
        credentials: 'include', // Include authentication cookies
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.availability) {
          setAvailability(data.availability)
        }
      } else {
        console.warn('Failed to load availability, using defaults')
        setAvailability(DEFAULT_WEEKLY_AVAILABILITY)
      }
    } catch (error) {
      console.error('Error loading availability:', error)
      onError?.('Failed to load availability data')
    } finally {
      setLoading(false)
    }
  }

  const handleAvailabilityChange = (newAvailability: WeeklyAvailability) => {
    setAvailability(newAvailability)
    setHasChanges(true)
    setSaved(false)
  }


  const handleSave = async () => {
    if (!therapistId) {
      onError?.('Therapist ID not found')
      return
    }

    setSaving(true)
    try {
      console.log('🔄 Saving availability to both systems:', { therapistId, availability })
      
      // Save to both systems for backward compatibility
      await saveAvailabilityToBothSystems(availability)
      
      console.log('✅ Availability saved successfully to both systems')
      toast.success('Availability saved successfully')
      setSaved(true)
      setHasChanges(false)
      onSave?.(availability)
      
    } catch (error) {
      console.error('Error saving availability:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save availability'
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Save availability to both NEW and OLD systems for backward compatibility
  const saveAvailabilityToBothSystems = async (availability: WeeklyAvailability) => {
    try {
      // 1. Save to NEW weekly availability system
      console.log('📝 Saving to NEW weekly availability system...')
      const weeklyResponse = await fetch('/api/therapist/availability/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ availability })
      });

      if (!weeklyResponse.ok) {
        const weeklyError = await weeklyResponse.json()
        throw new Error(`Failed to save to weekly system: ${weeklyError.error || 'Unknown error'}`);
      }

      console.log('✅ Successfully saved to NEW weekly availability system')

      // 2. Also save to OLD template system for backward compatibility
      console.log('📝 Saving to OLD template system for backward compatibility...')
      const templateResponse = await fetch('/api/therapist/availability/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          therapist_id: therapistId,
          templates: transformToLegacyFormat(availability) 
        })
      });

      if (!templateResponse.ok) {
        const templateError = await templateResponse.json()
        console.warn('⚠️ Failed to save to legacy template system:', templateError.error)
        console.warn('⚠️ But weekly system succeeded, so continuing...')
        // Don't throw error here - weekly system is more important
      } else {
        console.log('✅ Successfully saved to OLD template system')
      }

      console.log('✅ Availability saved to both systems successfully')
      
    } catch (error) {
      console.error('❌ Error saving availability to both systems:', error)
      throw error // Re-throw to be handled by parent function
    }
  };

  // Transform new format to legacy format for backward compatibility
  const transformToLegacyFormat = (weeklyAvailability: WeeklyAvailability) => {
    const legacyTemplates: Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
      session_duration: number;
      is_active: boolean;
    }> = [];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    
    console.log('🔄 Transforming to legacy format...')
    
    days.forEach((dayName, dayIndex) => {
      const dayAvailability = weeklyAvailability.standardHours[dayName];
      
      if (dayAvailability && dayAvailability.enabled) {
        dayAvailability.timeSlots.forEach((timeSlot: any) => {
          if (timeSlot.type === 'available') {
            legacyTemplates.push({
              day_of_week: dayIndex,
              start_time: timeSlot.start,
              end_time: timeSlot.end,
              session_duration: weeklyAvailability.sessionSettings?.sessionDuration || 50,
              is_active: true
            });
          }
        });
      }
    });
    
    console.log('📋 Generated legacy templates:', legacyTemplates.length, 'entries')
    return legacyTemplates;
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading availability...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Save Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Unsaved changes
            </Badge>
          )}
          
          {saved && !hasChanges && (
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={saving || !hasChanges}
          className="flex items-center gap-2"
          size="lg"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Weekly Schedule */}
      <WeeklyCalendar 
        availability={availability}
        onAvailabilityChange={handleAvailabilityChange}
        readOnly={false}
      />

    </div>
  )
}
