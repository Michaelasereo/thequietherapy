"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, MoreHorizontal, Eye, Calendar as CalendarIcon2, X, FileText, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { SessionData } from "@/lib/session-management"

interface SessionActionsMenuProps {
  session: SessionData
  onSessionUpdate: () => void
  userType: 'individual' | 'therapist' | 'admin'
}

export default function SessionActionsMenu({ session, onSessionUpdate, userType }: SessionActionsMenuProps) {
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [newDate, setNewDate] = useState<Date>()
  const [newTime, setNewTime] = useState("")
  const [rescheduleReason, setRescheduleReason] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [note, setNote] = useState("")

  // Check if session can be modified
  const canModify = session.status === 'scheduled'
  const sessionDateTime = new Date(session.start_time || "" || "")
  const now = new Date()
  const timeDiff = sessionDateTime.getTime() - now.getTime()
  const hoursDiff = timeDiff / (1000 * 60 * 60)
  const canCancel = canModify && hoursDiff >= 24 // 24 hours notice required

  const handleReschedule = async () => {
    if (!newDate || !newTime || !rescheduleReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sessions/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          newDate: format(newDate, 'yyyy-MM-dd'),
          newTime: newTime,
          reason: rescheduleReason,
          requestedBy: userType
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Session Rescheduled",
          description: "Your session has been successfully rescheduled.",
        })
        setRescheduleOpen(false)
        onSessionUpdate()
      } else {
        toast({
          title: "Reschedule Failed",
          description: result.error || "Failed to reschedule session.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error rescheduling session:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for cancellation.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sessions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          reason: cancelReason,
          cancelledBy: userType
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Session Cancelled",
          description: "Your session has been successfully cancelled.",
        })
        setCancelOpen(false)
        onSessionUpdate()
      } else {
        toast({
          title: "Cancellation Failed",
          description: result.error || "Failed to cancel session.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cancelling session:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!note.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a note.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sessions/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          note: note,
          createdBy: userType
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Note Added",
          description: "Your note has been successfully added.",
        })
        setNotesOpen(false)
        setNote("")
        onSessionUpdate()
      } else {
        toast({
          title: "Failed to Add Note",
          description: result.error || "Failed to add note.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setViewDetailsOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          {canModify && (
            <>
              <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>
                <CalendarIcon2 className="mr-2 h-4 w-4" />
                Reschedule
              </DropdownMenuItem>
              
              {canCancel && (
                <DropdownMenuItem onClick={() => setCancelOpen(true)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel Session
                </DropdownMenuItem>
              )}
            </>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setNotesOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Add Note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>
              Complete information about this therapy session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Session ID</Label>
                <p className="text-sm text-muted-foreground">{session.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-sm text-muted-foreground capitalize">{session.status}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(session.start_time || "" || "").toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Time</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(session.start_time || "" || "").toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {new Date(session.end_time || "" || "").toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Client</Label>
                <p className="text-sm text-muted-foreground">{session.client_name || "N/A" || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Therapist</Label>
                <p className="text-sm text-muted-foreground">{session.therapist_name || "N/A" || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Session Type</Label>
              <p className="text-sm text-muted-foreground">{session.session_type}</p>
            </div>
            
            {session.session_summary || "" && (
              <div>
                <Label className="text-sm font-medium">Summary</Label>
                <p className="text-sm text-muted-foreground">{session.session_summary || ""}</p>
              </div>
            )}
            
            {session.reschedule_reason || "" && (
              <div>
                <Label className="text-sm font-medium">Reschedule Reason</Label>
                <p className="text-sm text-muted-foreground">{session.reschedule_reason || ""}</p>
              </div>
            )}
            
            {session.cancellation_reason && (
              <div>
                <Label className="text-sm font-medium">Cancellation Reason</Label>
                <p className="text-sm text-muted-foreground">{session.cancellation_reason}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Amount Paid</Label>
                <p className="text-sm text-muted-foreground">₦{session.amount_paid || 0?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(session.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
            <DialogDescription>
              Choose a new date and time for your session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-date">New Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !newDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="new-time">New Time</Label>
              <Input
                id="new-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="Select time"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Reschedule</Label>
              <Textarea
                id="reason"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Please provide a reason for rescheduling..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={loading}>
              {loading ? "Rescheduling..." : "Reschedule Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Session Alert Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid gap-2">
            <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              rows={3}
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Session</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={loading}>
              {loading ? "Cancelling..." : "Cancel Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Note Dialog */}
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Session Note</DialogTitle>
            <DialogDescription>
              Add a note or comment about this session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter your note here..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={loading}>
              {loading ? "Adding..." : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
