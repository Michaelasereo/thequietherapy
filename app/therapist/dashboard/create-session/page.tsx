'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  CheckCircle,
  Loader2,
  AlertCircle,
  Zap,
  CalendarCheck
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { AvailabilityService, TimeSlot } from '@/lib/services/availabilityService';
import { ConflictResolutionModal } from '@/components/conflict-resolution-modal';

export default function CreateSessionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'patient' | 'date' | 'time' | 'confirm'>('patient');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [success, setSuccess] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [requestedTime, setRequestedTime] = useState<string>('');
  
  const [formData, setFormData] = useState({
    user_id: '',
    user_name: '',
    session_date: '',
    start_time: '',
    duration: '30',
    session_type: 'video',
    notes: '',
    is_custom: false,
    is_instant: false
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Fetch all patients who have ANY session with this therapist (past, present, or future)
  useEffect(() => {
    const fetchPatients = async () => {
      if (!user?.id) return;
      
      try {
        // Fetch ALL sessions (regardless of status or date) to get patients
        // This includes past, present, and future sessions so therapists can see all their patients
        const response = await fetch(`/api/sessions?therapist_id=${user.id}&order=created_at.desc&limit=200`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.sessions) {
            // Extract unique patients from sessions
            const uniquePatients = new Map();
            data.sessions.forEach((session: any) => {
              if (session.user_id && !uniquePatients.has(session.user_id)) {
                uniquePatients.set(session.user_id, {
                  id: session.user_id,
                  full_name: session.user?.full_name || session.user_name || 'Unknown',
                  email: session.user?.email || session.user_email || ''
                });
              }
            });
            
            setUsers(Array.from(uniquePatients.values()));
          }
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, [user?.id]);

  // Fetch available time slots when a date is selected
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!formData.session_date || !user?.id) {
        setTimeSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const slots = await AvailabilityService.getTimeSlots(user.id, formData.session_date);
        setTimeSlots(slots);
        console.log('✅ Fetched available time slots:', slots.length);
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setTimeSlots([]);
        toast({
          title: "Error Loading Slots",
          description: "Failed to load available time slots. Using default times.",
          variant: "destructive",
        });
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [formData.session_date, user?.id]);

  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return dateLocal < todayLocal;
  };

  const isDateBeyondLimit = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Therapists can schedule up to 21 days in advance
    const twentyOneDaysFromNow = new Date(today);
    twentyOneDaysFromNow.setDate(today.getDate() + 21);
    
    return date > twentyOneDaysFromNow;
  };

  const isDateToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isDateSelected = (date: Date) => {
    return formData.session_date === formatDateForAPI(date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleDateClick = (date: Date) => {
    if (isDatePast(date) || isDateBeyondLimit(date)) return;
    
    const dateStr = formatDateForAPI(date);
    setFormData({ ...formData, session_date: dateStr });
    setCurrentStep('time');
  };

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const isCurrentMonth = currentDate.getMonth() === month;
      const isSelected = isDateSelected(currentDate);
      const isToday = isDateToday(currentDate);
      const isPast = isDatePast(currentDate);
      const isBeyondLimit = isDateBeyondLimit(currentDate);
      const isAvailable = !isPast && !isBeyondLimit;
      const dayNumber = currentDate.getDate();
      
      days.push(
        <button
          key={i}
          type="button"
          onClick={() => handleDateClick(currentDate)}
          disabled={isPast || isBeyondLimit}
          className={`
            relative h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200
            ${!isCurrentMonth ? 'text-gray-300' : ''}
            ${isPast || isBeyondLimit ? 'text-gray-300 cursor-not-allowed' : ''}
            ${isAvailable && isCurrentMonth ? 'hover:bg-gray-100 cursor-pointer' : ''}
            ${isSelected ? 'bg-black text-white hover:bg-gray-800' : ''}
            ${isToday && !isSelected ? 'ring-2 ring-gray-300' : ''}
          `}
        >
          {dayNumber}
          {isToday && !isSelected && (
            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-brand-gold rounded-full"></div>
          )}
        </button>
      );
    }
    
    return days;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on session type
    if (!formData.user_id) {
      toast({
        title: "Missing Information",
        description: "Please select a client.",
        variant: "destructive",
      });
      return;
    }

    // For instant sessions, no date/time required
    if (!formData.is_instant && (!formData.session_date || !formData.start_time)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Use custom session API for custom/instant sessions
      if (formData.is_custom || formData.is_instant) {
        // STEP 1: Pre-validate availability (only for scheduled sessions)
        if (!formData.is_instant && formData.session_date && formData.start_time) {
          console.log('🔍 Checking time slot availability before creating session...');
          
          const requestedDateTime = new Date(`${formData.session_date}T${formData.start_time}:00+01:00`);
          setRequestedTime(requestedDateTime.toISOString());
          
          const availabilityResponse = await fetch('/api/therapist/check-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              start_time: requestedDateTime.toISOString(),
              duration_minutes: parseInt(formData.duration)
            })
          });

          const availabilityResult = await availabilityResponse.json();
          
          if (!availabilityResult.available) {
            console.log('🚨 Time slot not available:', availabilityResult);
            
            // Show conflict resolution modal
            setConflicts(availabilityResult.conflicting_sessions || []);
            setSuggestions(availabilityResult.suggested_times || []);
            setShowConflictModal(true);
            setLoading(false);
            return;
          }

          console.log('✅ Time slot available, proceeding with session creation...');
        }

        // STEP 2: Create the session
        const response = await fetch('/api/therapist/create-custom-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            patient_id: formData.user_id,
            session_date: formData.session_date || undefined,
            session_time: formData.start_time || undefined,
            duration_minutes: parseInt(formData.duration),
            session_type: formData.session_type,
            notes: formData.notes,
            title: `Session with ${formData.user_name}`,
            is_instant: formData.is_instant
          }),
        });

        let result;
        const responseText = await response.text();
        console.log('📅 Custom session raw response:', responseText);
        
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Failed to parse response:', parseError);
          throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}`);
        }
        
        console.log('📅 Custom session response status:', response.status);
        console.log('📅 Custom session response data:', result);

        if (response.ok && result.success) {
          setSuccess(true);
          toast({
            title: formData.is_instant 
              ? "Instant Session Created! ⚡" 
              : "Custom Session Created! 🎉",
            description: formData.is_instant
              ? `${formData.user_name} can approve and join immediately.`
              : `Session pending approval from ${formData.user_name}.`,
          });
          
          setTimeout(() => {
            router.push('/therapist/dashboard/client-sessions');
          }, 2000);
        } else {
          console.error('❌ API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            result: result
          });
          
          // Handle conflict errors (409) - database trigger or our conflict detection
          if (response.status === 409) {
            const requestedDateTime = new Date(`${formData.session_date}T${formData.start_time}:00+01:00`);
            setRequestedTime(requestedDateTime.toISOString());
            
            // If we have conflicting_sessions, use them. Otherwise, fetch them
            if (result.conflicting_sessions && result.conflicting_sessions.length > 0) {
              setConflicts(result.conflicting_sessions);
              setSuggestions(result.suggested_times || result.suggested_actions || []);
              setShowConflictModal(true);
              setLoading(false);
              return;
            }
            
            // If it's a conflict but no details, fetch them using check-availability API
            if (result.code === 'P0001' || result.code === 'TIME_SLOT_CONFLICT' || result.error?.includes('booked')) {
              console.log('🔍 Conflict detected but no details, fetching conflict information...');
              
              try {
                const availabilityResponse = await fetch('/api/therapist/check-availability', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    start_time: requestedDateTime.toISOString(),
                    duration_minutes: parseInt(formData.duration)
                  })
                });

                const availabilityResult = await availabilityResponse.json();
                
                if (!availabilityResult.available && availabilityResult.conflicting_sessions) {
                  setConflicts(availabilityResult.conflicting_sessions);
                  setSuggestions(availabilityResult.suggested_times || []);
                  setShowConflictModal(true);
                  setLoading(false);
                  return;
                }
              } catch (fetchError) {
                console.error('❌ Error fetching conflict details:', fetchError);
                // Fall through to show error
              }
            }
            
            // Fallback: Show error message if we can't get conflict details
            const conflictMsg = result.details || result.error || 'This time slot is already booked. Please select a different time.';
            throw new Error(conflictMsg);
          }
          
          const errorMsg = result.error || result.details || result.message || `Failed to create session (Status: ${response.status})`;
          throw new Error(errorMsg);
        }
      } else {
        // Use regular session API for standard sessions
        const response = await fetch('/api/therapist/schedule-next-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            therapistId: user?.id,
            patientId: formData.user_id,
            scheduledDate: formData.session_date,
            scheduledTime: formData.start_time,
            durationMinutes: parseInt(formData.duration),
            notes: formData.notes
          }),
        });

      const result = await response.json();
      
      console.log('📅 Response status:', response.status);
      console.log('📅 Response data:', result);

      if (response.ok && result.success) {
        setSuccess(true);
        toast({
          title: "Session Created Successfully! 🎉",
          description: `Session scheduled with ${formData.user_name} for ${formData.session_date}`,
        });
        
        // Redirect to sessions page after 2 seconds
        setTimeout(() => {
          router.push('/therapist/dashboard/client-sessions');
        }, 2000);
      } else {
        const errorMsg = result.error || result.details || result.message || 'Failed to create session';
        console.error('❌ API Error:', result);
        throw new Error(errorMsg);
      }
      } // Close the else block for regular sessions
    } catch (error) {
      console.error('❌ Error creating session:', error);
      
      // Show detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      
      toast({
        title: "Error Creating Session",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Also show in alert on the page
      alert(`Error: ${errorMessage}\n\nCheck the browser console and terminal for more details.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-gray-100 p-2 rounded-full">
          <Calendar className="h-6 w-6 text-gray-900" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Create Session</h1>
          <p className="text-muted-foreground">Schedule a new therapy session with a client</p>
        </div>
      </div>

      {!success ? (
        <>
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 bg-white p-4 rounded-lg shadow-sm">
            <div className={`flex items-center gap-2 ${currentStep === 'patient' ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'patient' ? 'bg-black text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="text-sm">Client</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center gap-2 ${currentStep === 'date' ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'date' ? 'bg-black text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="text-sm">Date</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center gap-2 ${currentStep === 'time' ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'time' ? 'bg-black text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="text-sm">Time</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center gap-2 ${currentStep === 'confirm' ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'confirm' ? 'bg-black text-white' : 'bg-gray-200'}`}>
                4
              </div>
              <span className="text-sm">Confirm</span>
            </div>
          </div>

          {/* Step 1: Select Client */}
          {currentStep === 'patient' && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
                  Select Client
          </CardTitle>
        </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-brand-gold bg-brand-gold/10">
                  <AlertCircle className="h-4 w-4 text-brand-gold" />
                  <AlertDescription className="text-gray-900 text-sm">
                    Select a client from your client list to schedule a session. This includes all clients who have booked sessions with you.
                  </AlertDescription>
                </Alert>

                {users.length > 0 ? (
                  <div className="grid gap-2 max-h-[400px] overflow-y-auto">
                    {users.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, user_id: patient.id, user_name: patient.full_name });
                          // For instant sessions, skip date/time selection
                          if (formData.is_instant) {
                            setCurrentStep('confirm');
                          } else {
                            setCurrentStep('date');
                          }
                        }}
                        className={`
                          p-4 text-left border-2 rounded-lg transition-all
                          ${formData.user_id === patient.id 
                            ? 'border-black bg-gray-50' 
                            : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-full">
                            <User className="h-4 w-4 text-gray-900" />
                          </div>
                          <div>
                            <p className="font-medium">{patient.full_name}</p>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-muted-foreground">No clients found</p>
                    <p className="text-sm text-muted-foreground mt-1">Clients will appear here once they book a session with you</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Date */}
          {currentStep === 'date' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Select Date
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep('patient')}
                  >
                    Change Client
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Client Info */}
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-900">
                    <strong>Client:</strong> {formData.user_name}
                  </p>
                </div>

                <Alert className="border-brand-gold bg-brand-gold/10">
                  <AlertCircle className="h-4 w-4 text-brand-gold" />
                  <AlertDescription className="text-gray-900 text-sm">
                    <strong>Therapist Scheduling:</strong> You can schedule up to 21 days in advance, 
                    regardless of your regular weekly availability.
                  </AlertDescription>
                </Alert>

                {/* Calendar Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    type="button"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="font-semibold text-lg">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    type="button"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
              </div>

                {/* Calendar Grid */}
              <div className="space-y-2">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1">
                    {dayNames.map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
              </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendarDays()}
                  </div>
              </div>

                {formData.session_date && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Selected:</strong> {new Date(formData.session_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Select Time */}
          {currentStep === 'time' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Select Time
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep('date')}
                    type="button"
                  >
                    Change Date
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Date Info */}
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg space-y-1">
                  <p className="text-sm text-gray-900">
                    <strong>Client:</strong> {formData.user_name}
                  </p>
                  <p className="text-sm text-gray-900">
                    <strong>Date:</strong> {new Date(formData.session_date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
              </div>

                {/* Loading State */}
                {loadingSlots && (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-gray-400" />
                    <p className="text-sm text-muted-foreground">Loading available times...</p>
                  </div>
                )}

                {/* Time Slots Grid */}
                {!loadingSlots && timeSlots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 max-h-[350px] overflow-y-auto p-2">
                    {timeSlots.map(slot => {
                      const formatTime = (timeString: string) => {
                        const [hours, minutes] = timeString.split(':');
                        const hour = parseInt(hours);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour % 12 || 12;
                        return `${displayHour}:${minutes} ${ampm}`;
                      };

                      return (
                        <button
                          key={`${slot.start_time}-${slot.end_time}`}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, start_time: slot.start_time });
                            setCurrentStep('confirm');
                          }}
                          className={`
                            p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                            ${formData.start_time === slot.start_time 
                              ? 'bg-black text-white border-black' 
                              : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                            }
                          `}
                        >
                          <Clock className="h-4 w-4 mx-auto mb-1" />
                          {formatTime(slot.start_time)}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* No Slots Available */}
                {!loadingSlots && timeSlots.length === 0 && (
                  <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 mb-1">No Available Times</p>
                    <p className="text-xs text-muted-foreground">
                      No time slots are available for this date.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirm & Details */}
          {currentStep === 'confirm' && (
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Confirm & Customize
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep('time')}
                      type="button"
                    >
                      Edit Time
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-gray-900" />
                      <div>
                        <p className="text-xs text-muted-foreground">Client</p>
                        <p className="font-medium">{formData.user_name}</p>
                      </div>
                    </div>

                    {!formData.is_instant && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-900" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {new Date(formData.session_date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {!formData.is_instant && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="h-5 w-5 text-gray-900" />
                        <div>
                          <p className="text-xs text-muted-foreground">Time</p>
                          <p className="font-medium">{formData.start_time}</p>
                        </div>
                      </div>
                    )}

                    {formData.is_instant && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-xs text-yellow-600 font-medium">Instant Session</p>
                          <p className="font-medium text-yellow-700">Client can join immediately after approval</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Session Type Selection - Custom/Instant vs Regular */}
                  <div className="space-y-2">
                    <Label>Session Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_custom: false, is_instant: false })}
                        className={`
                          p-3 rounded-lg border-2 transition-all text-sm font-medium
                          ${!formData.is_custom && !formData.is_instant
                            ? 'bg-black text-white border-black' 
                            : 'bg-white border-gray-200 hover:border-gray-400'
                          }
                        `}
                      >
                        <CalendarCheck className="h-4 w-4 mx-auto mb-1" />
                        Regular
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_custom: true, is_instant: false })}
                        className={`
                          p-3 rounded-lg border-2 transition-all text-sm font-medium
                          ${formData.is_custom && !formData.is_instant
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white border-gray-200 hover:border-gray-400'
                          }
                        `}
                      >
                        <Calendar className="h-4 w-4 mx-auto mb-1" />
                        Custom
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, is_custom: true, is_instant: true });
                        }}
                        className={`
                          p-3 rounded-lg border-2 transition-all text-sm font-medium
                          ${formData.is_instant
                            ? 'bg-yellow-600 text-white border-yellow-600' 
                            : 'bg-white border-gray-200 hover:border-gray-400'
                          }
                        `}
                      >
                        <Zap className="h-4 w-4 mx-auto mb-1" />
                        Instant
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.is_instant 
                        ? '⚡ Client approves and joins immediately'
                        : formData.is_custom 
                          ? '📅 Custom session - client must approve before joining'
                          : '📅 Regular session - no approval needed'}
                    </p>
                  </div>

                  {/* Duration Selection */}
                  <div className="space-y-2">
                    <Label>Session Duration</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: '30', label: '30 min' },
                        { value: '45', label: '45 min' },
                        { value: '60', label: '1 hour' },
                        { value: '90', label: '1.5 hours' }
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, duration: option.value })}
                          className={`
                            p-2 rounded-lg border-2 transition-all text-sm font-medium
                            ${formData.duration === option.value 
                              ? 'bg-black text-white border-black' 
                              : 'bg-white border-gray-200 hover:border-gray-400'
                            }
                          `}
                        >
                          {option.label}
                        </button>
                      ))}
              </div>
            </div>

                  {/* Session Notes */}
            <div className="space-y-2">
                    <Label htmlFor="notes">Session Focus (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="What will you work on in this session?"
                      className="min-h-[80px] resize-none"
              />
            </div>

                  <Alert className="border-brand-gold bg-brand-gold/10">
                    <AlertCircle className="h-4 w-4 text-brand-gold" />
                    <AlertDescription className="text-gray-900 text-sm">
                      <strong>Credit Requirement:</strong> The client will need 1 available credit to join this session. 
                      Make sure they have credits before scheduling.
                    </AlertDescription>
                  </Alert>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentStep('patient');
                        setFormData({
                          user_id: '',
                          user_name: '',
                          session_date: '',
                          start_time: '',
                          duration: '30',
                          session_type: 'video',
                          notes: '',
                          is_custom: false,
                          is_instant: false
                        });
                      }}
                      disabled={loading}
                      className="flex-1"
                    >
                      Start Over
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-black hover:bg-gray-800"
                    >
                {loading ? (
                  <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                  </>
                ) : (
                  <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                    Create Session
                  </>
                )}
              </Button>
            </div>
        </CardContent>
      </Card>
            </form>
          )}
        </>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Session Created!</h3>
            <p className="text-muted-foreground mb-4">
              Session with {formData.user_name} has been scheduled successfully.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg mb-6">
              <Calendar className="h-4 w-4 text-gray-900" />
              <span className="text-sm font-medium text-gray-900">
                {new Date(formData.session_date).toLocaleDateString()} at {formData.start_time}
              </span>
          </div>
            <p className="text-sm text-muted-foreground">
              Redirecting to sessions page...
            </p>
        </CardContent>
      </Card>
      )}

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={showConflictModal}
        onClose={() => {
          setShowConflictModal(false);
          setConflicts([]);
          setSuggestions([]);
          setRequestedTime('');
        }}
        conflicts={conflicts}
        suggestions={suggestions}
        requestedTime={requestedTime}
        onResolve={(suggestion) => {
          // Update form data with the suggested time
          const suggestedDate = new Date(suggestion.time);
          const dateStr = suggestedDate.toISOString().split('T')[0];
          const timeStr = suggestedDate.toTimeString().split(' ')[0].slice(0, 5); // HH:mm format
          
          setFormData({
            ...formData,
            session_date: dateStr,
            start_time: timeStr
          });
          
          setShowConflictModal(false);
          setConflicts([]);
          setSuggestions([]);
          setRequestedTime('');
          
          // Optionally auto-submit or just let user review and submit
          toast({
            title: "Time Updated",
            description: `Session time updated to ${suggestion.label}. Review and confirm to proceed.`,
          });
        }}
      />
    </div>
  );
}
