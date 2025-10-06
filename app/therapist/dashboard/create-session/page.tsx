'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, Video } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth-context';

export default function CreateSessionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    user_id: '',
    session_date: '',
    start_time: '',
    duration: '30',
    session_type: 'video',
    notes: ''
  });

  // Fetch available users (individuals) for session creation
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users?user_type=individual&limit=50', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.users) {
            setUsers(data.users);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id || !formData.session_date || !formData.start_time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Create session using the booking API (simulating user booking)
      const response = await fetch('/api/sessions/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          therapist_id: user?.id,
          session_date: formData.session_date,
          start_time: formData.start_time,
          duration: parseInt(formData.duration),
          session_type: formData.session_type,
          notes: formData.notes || `Session created by therapist ${user?.full_name}`
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Session Created Successfully",
          description: `Session scheduled for ${formData.session_date} at ${formData.start_time}`,
        });
        
        // Reset form
        setFormData({
          user_id: '',
          session_date: '',
          start_time: '',
          duration: '30',
          session_type: 'video',
          notes: ''
        });
      } else {
        throw new Error(result.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create session',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-blue-100 p-2 rounded-full">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Create Session</h1>
          <p className="text-muted-foreground">Schedule a new therapy session with a patient</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Session Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="user_id">Select Patient *</Label>
                <Select 
                  value={formData.user_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Session Date */}
              <div className="space-y-2">
                <Label htmlFor="session_date">Session Date *</Label>
                <Input
                  id="session_date"
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, session_date: e.target.value }))}
                  min={today}
                  required
                />
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select 
                  value={formData.duration} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Session Type */}
              <div className="space-y-2">
                <Label htmlFor="session_type">Session Type</Label>
                <Select 
                  value={formData.session_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, session_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video Session
                      </div>
                    </SelectItem>
                    <SelectItem value="audio">Audio Session</SelectItem>
                    <SelectItem value="chat">Chat Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Session Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this session..."
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Session...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Session
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Session Creation Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Sessions will be automatically added to the patient's dashboard</li>
                <li>• Video sessions will include a Daily.co room for the call</li>
                <li>• The patient will receive notifications about the new session</li>
                <li>• Make sure the patient has sufficient credits for the session</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
