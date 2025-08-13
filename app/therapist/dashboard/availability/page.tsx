"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const
const sessionDurations = ["30", "45", "60"] as const // in minutes

const formSchema = z.object({
  availableDays: z.array(z.enum(daysOfWeek)).min(1, { message: "Please select at least one available day." }),
  // Using string for time for simplicity, could be refined with a custom time picker component
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid start time format (HH:MM)." }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid end time format (HH:MM)." }),
  sessionDuration: z.enum(sessionDurations, { message: "Please select a session duration." }),
  maxSessionsPerDay: z.coerce
    .number()
    .min(1, { message: "Must be at least 1 session per day." })
    .max(20, { message: "Cannot exceed 20 sessions per day." }),
})

type AvailabilityFormValues = z.infer<typeof formSchema>

export default function TherapistAvailabilityPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [savedAvailability, setSavedAvailability] = useState<any[]>([])

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      startTime: "09:00",
      endTime: "17:00",
      sessionDuration: "60",
      maxSessionsPerDay: 8,
    },
  })

  // Load existing availability
  useEffect(() => {
    fetch('/api/therapist/availability')
      .then(response => response.json())
      .then(data => {
        if (data.success && data.availability) {
          setSavedAvailability(data.availability)
          // Update form with existing data
          const availableDays = data.availability
            .filter((day: any) => day.is_available)
            .map((day: any) => {
              const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
              return dayNames[day.day_of_week]
            })
          
          if (availableDays.length > 0) {
            form.setValue('availableDays', availableDays)
            form.setValue('startTime', data.availability[0].start_time)
            form.setValue('endTime', data.availability[0].end_time)
            form.setValue('sessionDuration', data.availability[0].session_duration.toString())
            form.setValue('maxSessionsPerDay', data.availability[0].max_sessions_per_day)
          }
        }
      })
      .catch(error => {
        console.error('Error loading availability:', error)
      })
  }, [form])

  async function onSubmit(data: AvailabilityFormValues) {
    setIsLoading(true)
    try {
      // Convert form data to API format
      const availability = daysOfWeek.map((day, index) => ({
        dayOfWeek: index,
        startTime: data.startTime,
        endTime: data.endTime,
        isAvailable: data.availableDays.includes(day),
        sessionDuration: parseInt(data.sessionDuration),
        maxSessionsPerDay: data.maxSessionsPerDay
      }))

      const response = await fetch('/api/therapist/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availability })
      })

      const result = await response.json()

      if (result.success) {
        toast({ 
          title: "Availability Saved!", 
          description: "Your availability settings have been updated." 
        })
        setSavedAvailability(result.data)
      } else {
        toast({ 
          title: "Error", 
          description: result.error || "Failed to save availability",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      toast({ 
        title: "Error", 
        description: "Failed to save availability",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Availability</h2>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Set Your Weekly Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">Select specific days to customize availability.</p>
            <Calendar mode="multiple" selected={[]} onSelect={() => {}} className="rounded-md border inline-block" />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Day</th>
                      <th className="py-2 pr-4">Enabled</th>
                      <th className="py-2 pr-4">Start</th>
                      <th className="py-2 pr-4">End</th>
                      <th className="py-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daysOfWeek.map((day) => (
                      <tr key={day} className="border-t">
                        <td className="py-3 pr-4 font-medium">{day}</td>
                        <td className="py-3 pr-4">
                          <FormField
                            control={form.control}
                            name="availableDays"
                            render={({ field }) => (
                              <Checkbox
                                checked={field.value?.includes(day)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), day])
                                    : field.onChange(field.value?.filter((d: string) => d !== day))
                                }}
                              />
                            )}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                              <Input type="time" {...field} />
                            )}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => <Input type="time" {...field} />}
                          />
                        </td>
                        <td className="py-3">
                          <FormField
                            control={form.control}
                            name="sessionDuration"
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Duration" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {sessionDurations.map((duration) => (
                                    <SelectItem key={duration} value={duration}>
                                      {duration} minutes
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxSessionsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Sessions Per Day</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Availability"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
