"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertTriangle, 
  Shield, 
  UserX, 
  UserCheck, 
  DollarSign, 
  Calendar,
  Database,
  Activity,
  Clock,
  Users,
  TrendingUp
} from "lucide-react"
import { toast } from "sonner"

// =============================================
// EMERGENCY ADMIN DASHBOARD
// Crisis management tools for system administrators
// =============================================

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  availability: 'healthy' | 'warning' | 'critical';
  earnings: 'healthy' | 'warning' | 'critical';
  bookings: 'healthy' | 'warning' | 'critical';
}

interface TherapistState {
  id: string;
  name: string;
  email: string;
  status: string;
  verificationStatus: string;
  lastActive: string;
  earnings: number;
  sessionCount: number;
}

interface EmergencyAction {
  id: string;
  action: string;
  target: string;
  reason: string;
  performedBy: string;
  performedAt: Date;
  status: 'pending' | 'completed' | 'failed';
}

export default function EmergencyAdminDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    availability: 'healthy',
    earnings: 'healthy',
    bookings: 'healthy'
  })
  
  const [therapists, setTherapists] = useState<TherapistState[]>([])
  const [emergencyActions, setEmergencyActions] = useState<EmergencyAction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTherapist, setSelectedTherapist] = useState<string>("")
  const [actionReason, setActionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadSystemData()
    loadEmergencyActions()
  }, [])

  const loadSystemData = async () => {
    try {
      setLoading(true)
      
      // Load system health
      const healthResponse = await fetch('/api/admin/system-health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setSystemHealth(healthData.health)
      }

      // Load therapists
      const therapistsResponse = await fetch('/api/admin/therapist-state?status=all')
      if (therapistsResponse.ok) {
        const therapistsData = await therapistsResponse.json()
        setTherapists(therapistsData.therapists || [])
      }

    } catch (error) {
      console.error('Error loading system data:', error)
      toast.error('Failed to load system data')
    } finally {
      setLoading(false)
    }
  }

  const loadEmergencyActions = async () => {
    try {
      const response = await fetch('/api/admin/emergency-actions')
      if (response.ok) {
        const data = await response.json()
        setEmergencyActions(data.actions || [])
      }
    } catch (error) {
      console.error('Error loading emergency actions:', error)
    }
  }

  const performEmergencyAction = async (action: string) => {
    if (!selectedTherapist) {
      toast.error('Please select a therapist')
      return
    }

    if (!actionReason.trim()) {
      toast.error('Please provide a reason for this action')
      return
    }

    try {
      setIsProcessing(true)

      const response = await fetch('/api/admin/therapist-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          therapist_id: selectedTherapist,
          reason: actionReason,
          emergency: true
        })
      })

      if (response.ok) {
        toast.success(`${action} completed successfully`)
        setActionReason("")
        setSelectedTherapist("")
        loadSystemData()
        loadEmergencyActions()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Action failed')
      }

    } catch (error) {
      console.error('Error performing emergency action:', error)
      toast.error('Failed to perform action')
    } finally {
      setIsProcessing(false)
    }
  }

  const getHealthBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'pending_verification': return 'bg-yellow-100 text-yellow-800'
      case 'offboarded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Emergency Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Emergency Admin Dashboard</h1>
          </div>
          <p className="text-red-100">
            Crisis management tools for system administrators. Use with extreme caution.
          </p>
        </div>

        {/* System Health Overview */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Activity className="h-5 w-5" />
              System Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600">Database</p>
                <Badge className={getHealthBadgeColor(systemHealth.database)}>
                  {systemHealth.database}
                </Badge>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-gray-600">Availability</p>
                <Badge className={getHealthBadgeColor(systemHealth.availability)}>
                  {systemHealth.availability}
                </Badge>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-sm text-gray-600">Earnings</p>
                <Badge className={getHealthBadgeColor(systemHealth.earnings)}>
                  {systemHealth.earnings}
                </Badge>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-gray-600">Bookings</p>
                <Badge className={getHealthBadgeColor(systemHealth.bookings)}>
                  {systemHealth.bookings}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Actions */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Shield className="h-5 w-5" />
              Emergency Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>WARNING:</strong> These actions are irreversible and will affect therapist accounts immediately. 
                Use only in emergency situations.
              </AlertDescription>
            </Alert>

            {/* Therapist Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="therapist-select">Select Therapist</Label>
                <select
                  id="therapist-select"
                  value={selectedTherapist}
                  onChange={(e) => setSelectedTherapist(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Choose a therapist...</option>
                  {therapists.map((therapist) => (
                    <option key={therapist.id} value={therapist.id}>
                      {therapist.name} ({therapist.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="action-reason">Reason for Action</Label>
                <Input
                  id="action-reason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Describe the emergency situation..."
                  className="w-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => performEmergencyAction('suspend_therapist')}
                disabled={!selectedTherapist || !actionReason || isProcessing}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <UserX className="h-4 w-4 mr-2" />
                Suspend Therapist
              </Button>
              <Button
                onClick={() => performEmergencyAction('verify_therapist')}
                disabled={!selectedTherapist || !actionReason || isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Emergency Verify
              </Button>
              <Button
                onClick={() => performEmergencyAction('reject_therapist')}
                disabled={!selectedTherapist || !actionReason || isProcessing}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <UserX className="h-4 w-4 mr-2" />
                Reject Verification
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Therapist Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Therapist Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Verification</th>
                    <th className="text-left p-2">Sessions</th>
                    <th className="text-left p-2">Earnings</th>
                    <th className="text-left p-2">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {therapists.map((therapist) => (
                    <tr key={therapist.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{therapist.name}</td>
                      <td className="p-2 text-gray-600">{therapist.email}</td>
                      <td className="p-2">
                        <Badge className={getStatusBadgeColor(therapist.status)}>
                          {therapist.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusBadgeColor(therapist.verificationStatus)}>
                          {therapist.verificationStatus}
                        </Badge>
                      </td>
                      <td className="p-2">{therapist.sessionCount}</td>
                      <td className="p-2">₦{(therapist.earnings / 100).toLocaleString()}</td>
                      <td className="p-2 text-gray-600">{therapist.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Emergency Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Emergency Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emergencyActions.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No recent emergency actions</p>
            ) : (
              <div className="space-y-2">
                {emergencyActions.slice(0, 10).map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{action.action} - {action.target}</p>
                      <p className="text-sm text-gray-600">{action.reason}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusBadgeColor(action.status)}>
                        {action.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(action.performedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{therapists.length}</p>
              <p className="text-gray-600">Total Therapists</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">
                {therapists.filter(t => t.status === 'active').length}
              </p>
              <p className="text-gray-600">Active Therapists</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold">
                ₦{(therapists.reduce((sum, t) => sum + t.earnings, 0) / 100).toLocaleString()}
              </p>
              <p className="text-gray-600">Total Earnings</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
