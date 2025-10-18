"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { UserCheck, Search, Eye, Shield, Calendar, Mail, Phone, FileText, Star, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { useSearchParams } from 'next/navigation'

interface Therapist {
  id: string
  full_name: string
  email: string
  phone?: string
  mdcn_code: string
  specialization: string[]
  languages: string[]
  is_verified: boolean
  is_active: boolean
  status: string
  rating?: number
  totalSessions: number
  session_rate?: number
  created_at: string
  lastActivity?: string
}

function TherapistsContent() {
  const searchParams = useSearchParams()
  const reviewId = searchParams.get('review')
  
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [verificationFilter, setVerificationFilter] = useState("all")
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [newRate, setNewRate] = useState<string>('')

  // Helper function to trigger therapist data refresh
  const triggerTherapistDataRefresh = () => {
    console.log('🔄 Admin: Dispatching global therapist data refresh event')
    // Dispatch a custom event that the therapist context will listen for
    window.dispatchEvent(new CustomEvent('therapist-data-refresh'))
  }

  // Fetch therapists on component mount
  useEffect(() => {
    fetchTherapists()
  }, [])

  // Handle review parameter from URL
  useEffect(() => {
    if (reviewId && therapists.length > 0) {
      const therapist = therapists.find(t => t.id === reviewId)
      if (therapist) {
        setSelectedTherapist(therapist)
        // Scroll to the therapist in the table
        const element = document.getElementById(`therapist-${reviewId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50')
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50')
          }, 3000)
        }
      }
    }
  }, [reviewId, therapists])

  const fetchTherapists = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/therapists?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Fetched therapists:', data.length)
        setTherapists(data)
      } else {
        toast.error('Failed to fetch therapists')
      }
    } catch (error) {
      console.error('Error fetching therapists:', error)
      toast.error('Error loading therapists')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationToggle = async (therapistId: string, isVerified: boolean) => {
    try {
      // This would be replaced with actual API call
      setTherapists(prev => prev.map(therapist => 
        therapist.id === therapistId ? { ...therapist, is_verified: isVerified } : therapist
      ))
      toast.success(`Therapist verification ${isVerified ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Error updating therapist verification:', error)
      toast.error('Failed to update therapist verification')
    }
  }

  const handleStatusChange = async (therapistId: string, newStatus: string) => {
    try {
      // This would be replaced with actual API call
      setTherapists(prev => prev.map(therapist => 
        therapist.id === therapistId ? { ...therapist, status: newStatus, is_active: newStatus === 'active' } : therapist
      ))
      toast.success(`Therapist status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating therapist status:', error)
      toast.error('Failed to update therapist status')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
      case 'suspended':
        return <Badge variant="outline" className="text-red-600 border-red-600">Suspended</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge variant="default" className="bg-green-600">Approved</Badge>
    ) : (
      <Badge variant="secondary">Pending</Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter therapists based on search and filters
  const filteredTherapists = therapists.filter(therapist => {
    const matchesSearch = therapist.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         therapist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         therapist.mdcn_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || therapist.status === statusFilter
    const matchesVerification = verificationFilter === "all" || 
                               (verificationFilter === "verified" && therapist.is_verified) ||
                               (verificationFilter === "unverified" && !therapist.is_verified)
    
    return matchesSearch && matchesStatus && matchesVerification
  })

  const therapistStats = {
    total: therapists.length,
    active: therapists.filter(t => t.status === 'active').length,
    verified: therapists.filter(t => t.is_verified).length,
    pending: therapists.filter(t => t.status === 'pending').length,
    totalSessions: therapists.reduce((sum, t) => sum + t.totalSessions, 0),
    averageRating: therapists.filter(t => t.rating).reduce((sum, t) => sum + (t.rating || 0), 0) / therapists.filter(t => t.rating).length
  }

  // Get pending verifications
  const pendingVerifications = therapists.filter(t => t.status === 'pending')
  const [rejectionReason, setRejectionReason] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleApprove = async (therapistId: string) => {
    try {
      setProcessingId(therapistId)
      
      const response = await fetch('/api/admin/approve-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: therapistId,
          type: 'therapist',
          action: 'approve'
        }),
      })

      if (response.ok) {
        setTherapists(prev => prev.map(therapist => 
          therapist.id === therapistId ? { ...therapist, status: 'approved', is_verified: true } : therapist
        ))
        toast.success('Availability update approved successfully')
        fetchTherapists() // Refresh the list
      } else {
        toast.error('Failed to approve therapist')
      }
    } catch (error) {
      console.error('Error approving therapist:', error)
      toast.error('Failed to approve therapist')
    } finally {
      setProcessingId(null)
    }
  }

  const handleAvailabilityApprove = async (therapistId: string) => {
    try {
      setProcessingId(therapistId)
      
      console.log('🔍 Approving therapist:', therapistId)
      
      const response = await fetch('/api/admin/approve-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: therapistId,
          type: 'therapist',
          action: 'approve'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Therapist approved:', result)
        
        toast.success(result.message || 'Therapist approved successfully')
        
        // Update local state immediately for better UX
        setTherapists(prev => prev.map(t => 
          t.id === therapistId 
            ? { ...t, status: 'approved', is_verified: true, is_active: true } 
            : t
        ))
        
        // 🔥 CRITICAL: Check for the invalidates flag and trigger a refetch
        if (result.invalidates && result.invalidates.includes('therapist-profile')) {
          console.log('🔄 Admin: Triggering therapist data refetch after approval')
          triggerTherapistDataRefresh()
        }
        
        // Refresh the admin list after a delay to ensure database sync
        setTimeout(() => {
          console.log('🔄 Refreshing therapists list...')
          fetchTherapists()
        }, 1000)
      } else {
        const errorData = await response.json()
        console.error('❌ Approval failed:', errorData)
        toast.error(errorData.error || 'Failed to approve therapist')
      }
    } catch (error) {
      console.error('❌ Error approving therapist:', error)
      toast.error('Failed to approve therapist')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (therapistId: string, reason: string) => {
    try {
      setProcessingId(therapistId)
      
      const response = await fetch('/api/admin/approve-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: therapistId,
          type: 'therapist',
          action: 'reject'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setTherapists(prev => prev.map(therapist => 
          therapist.id === therapistId ? { ...therapist, status: 'rejected' } : therapist
        ))
        toast.success(result.message || 'Availability update rejected')
        setRejectionReason("")
        
        // 🔥 CRITICAL: Check for the invalidates flag and trigger a refetch
        if (result.invalidates && result.invalidates.includes('therapist-profile')) {
          console.log('🔄 Admin: Triggering therapist data refetch after rejection')
          triggerTherapistDataRefresh()
        }
        
        fetchTherapists() // Refresh the admin list
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to reject therapist')
      }
    } catch (error) {
      console.error('Error rejecting therapist:', error)
      toast.error('Failed to reject therapist')
    } finally {
      setProcessingId(null)
    }
  }

  const handleUnapprove = async (therapistId: string, reason: string) => {
    try {
      setProcessingId(therapistId)
      
      const response = await fetch('/api/admin/unapprove-therapist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          reason
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Therapist unapproved successfully')
        // Refresh the therapist list
        fetchTherapists()
      } else {
        throw new Error(data.error || 'Failed to unapprove therapist')
      }
    } catch (error) {
      console.error('Error unapproving therapist:', error)
      toast.error('Failed to unapprove therapist')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRateUpdate = async (therapistId: string) => {
    try {
      setProcessingId(therapistId)
      
      const rate = parseFloat(newRate)
      if (isNaN(rate) || rate < 0) {
        toast.error('Please enter a valid rate')
        return
      }

      const response = await fetch('/api/admin/therapist-rate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          sessionRate: rate
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Therapist rate updated successfully')
        // Update local state
        setTherapists(prev => prev.map(therapist => 
          therapist.id === therapistId ? { ...therapist, session_rate: rate } : therapist
        ))
        setEditingRate(null)
        setNewRate('')
        // Refresh the therapist list
        fetchTherapists()
      } else {
        throw new Error(data.error || 'Failed to update therapist rate')
      }
    } catch (error) {
      console.error('Error updating therapist rate:', error)
      toast.error('Failed to update therapist rate')
    } finally {
      setProcessingId(null)
    }
  }

  const startRateEdit = (therapistId: string, currentRate: number) => {
    setEditingRate(therapistId)
    setNewRate(currentRate.toString())
  }

  const cancelRateEdit = () => {
    setEditingRate(null)
    setNewRate('')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Therapist Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading therapists...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Therapist Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage licensed therapists and their specializations</p>
      </div>

      {/* Manual Verification Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Therapist Approval Process:</strong> New therapist enrollments require admin approval. 
          When you approve a therapist, they gain full access to the platform including the ability to set their availability and accept sessions.
        </AlertDescription>
      </Alert>

      {/* Therapist Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Therapists</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{therapistStats.total}</div>
            <p className="text-xs text-muted-foreground">All therapists</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Therapists</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{therapistStats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Therapists</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{therapistStats.verified}</div>
            <p className="text-xs text-muted-foreground">Approved & verified</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{therapistStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Conducted sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Availability Updates */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <h2 className="text-lg font-medium">Pending Availability Updates ({pendingVerifications.length})</h2>
        </div>
        
        {pendingVerifications.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {pendingVerifications.map((therapist) => (
              <Card key={therapist.id} className="shadow-sm border-l-4 border-l-yellow-500">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold">{therapist.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{therapist.email}</p>
                    </div>
                    {getStatusBadge(therapist.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Therapist Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">MDCN Code:</span>
                      <span className="text-muted-foreground">{therapist.mdcn_code}</span>
                    </div>
                    
                    {therapist.specialization && therapist.specialization.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium">Specializations:</span>
                        </div>
                        <div className="flex flex-wrap gap-1 ml-6">
                          {therapist.specialization.map((spec, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Requested: {formatDate(therapist.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAvailabilityApprove(therapist.id)}
                        disabled={processingId === therapist.id}
                      >
                        {processingId === therapist.id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Processing</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Approve</span>
                          </div>
                        )}
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={processingId === therapist.id}
                            className="text-sm"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Availability Update</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="rejectionReason">Reason for Rejection</Label>
                              <Textarea
                                id="rejectionReason"
                                placeholder="Please provide a reason for rejecting this availability update..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => setRejectionReason("")}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleReject(therapist.id, rejectionReason)}
                                disabled={!rejectionReason.trim() || processingId === therapist.id}
                              >
                                {processingId === therapist.id ? "Processing..." : "Reject Update"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Therapist Availability Update Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Full Name</Label>
                                <p className="text-sm">{therapist.full_name}</p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm">{therapist.email}</p>
                              </div>
                              <div>
                                <Label>Phone</Label>
                                <p className="text-sm">{therapist.phone || "Not provided"}</p>
                              </div>
                              <div>
                                <Label>MDCN Code</Label>
                                <p className="text-sm">{therapist.mdcn_code}</p>
                              </div>
                            </div>
                            <div>
                              <Label>Specializations</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {therapist.specialization.map((spec, index) => (
                                  <Badge key={index} variant="secondary">
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label>Languages</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {therapist.languages.map((lang, index) => (
                                  <Badge key={index} variant="outline">
                                    {lang}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label>Update Requested</Label>
                              <p className="text-sm">{formatDateTime(therapist.created_at)}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardContent className="py-8">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-green-700 mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  No pending availability updates at the moment. All therapist availability requests have been processed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters and Search */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Therapists</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or MDCN code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verification">Availability Status</Label>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Approved</SelectItem>
                  <SelectItem value="unverified">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Therapists Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Therapists ({filteredTherapists.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Therapist</TableHead>
                <TableHead>MDCN Code</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Session Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Availability Status</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTherapists.map((therapist) => (
                <TableRow key={therapist.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{therapist.full_name}</div>
                      <div className="text-sm text-muted-foreground">{therapist.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono">{therapist.mdcn_code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {therapist.specialization.slice(0, 2).map((spec, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {therapist.specialization.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{therapist.specialization.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingRate === therapist.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={newRate}
                          onChange={(e) => setNewRate(e.target.value)}
                          className="w-20 h-8"
                          min="0"
                          step="100"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleRateUpdate(therapist.id)}
                          disabled={processingId === therapist.id}
                          className="h-8 px-2"
                        >
                          {processingId === therapist.id ? '...' : '✓'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelRateEdit}
                          className="h-8 px-2"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          ₦{(therapist.session_rate || 5000).toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startRateEdit(therapist.id, therapist.session_rate || 5000)}
                          className="h-6 px-2 text-xs"
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(therapist.status)}
                  </TableCell>
                  <TableCell>
                    {getVerificationBadge(therapist.is_verified)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{therapist.totalSessions}</div>
                  </TableCell>
                  <TableCell>
                    {therapist.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{therapist.rating}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No rating</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Therapist Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Full Name</Label>
                              <p className="text-sm">{therapist.full_name}</p>
                            </div>
                            <div>
                              <Label>Email</Label>
                              <p className="text-sm">{therapist.email}</p>
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <p className="text-sm">{therapist.phone || "Not provided"}</p>
                            </div>
                            <div>
                              <Label>MDCN Code</Label>
                              <p className="text-sm font-mono">{therapist.mdcn_code}</p>
                            </div>
                          </div>
                          <div>
                            <Label>Specializations</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {therapist.specialization.map((spec, index) => (
                                <Badge key={index} variant="secondary">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label>Languages</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {therapist.languages.map((lang, index) => (
                                <Badge key={index} variant="outline">
                                  {lang}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Status</Label>
                              <div className="mt-1">{getStatusBadge(therapist.status)}</div>
                            </div>
                            <div>
                              <Label>Verification</Label>
                              <div className="mt-1">{getVerificationBadge(therapist.is_verified)}</div>
                            </div>
                            <div>
                              <Label>Session Rate</Label>
                              <p className="text-sm font-medium">₦{(therapist.session_rate || 5000).toLocaleString()}</p>
                            </div>
                            <div>
                              <Label>Total Sessions</Label>
                              <p className="text-sm font-medium">{therapist.totalSessions}</p>
                            </div>
                            <div>
                              <Label>Rating</Label>
                              {therapist.rating ? (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm font-medium">{therapist.rating}</span>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No rating</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label>Created</Label>
                            <p className="text-sm">{formatDateTime(therapist.created_at)}</p>
                          </div>
                          {therapist.lastActivity && (
                            <div>
                              <Label>Last Activity</Label>
                              <p className="text-sm">{formatDateTime(therapist.lastActivity)}</p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerificationToggle(therapist.id, !therapist.is_verified)}
                            >
                              {therapist.is_verified ? "Unverify" : "Verify"}
                            </Button>
                            {therapist.status === 'active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(therapist.id, 'suspended')}
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(therapist.id, 'active')}
                              >
                                Activate
                              </Button>
                            )}
                            {therapist.is_verified && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={processingId === therapist.id}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Unapprove
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Unapprove Therapist</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="unapproveReason">Reason for Unapproval</Label>
                                      <Textarea
                                        id="unapproveReason"
                                        placeholder="Please provide a reason for unapproving this therapist..."
                                        rows={4}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="outline" 
                                        onClick={() => {
                                          const textarea = document.getElementById('unapproveReason') as HTMLTextAreaElement
                                          if (textarea) textarea.value = ''
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => {
                                          const textarea = document.getElementById('unapproveReason') as HTMLTextAreaElement
                                          const reason = textarea?.value || 'No reason provided'
                                          handleUnapprove(therapist.id, reason)
                                          if (textarea) textarea.value = ''
                                        }}
                                        disabled={processingId === therapist.id}
                                      >
                                        {processingId === therapist.id ? "Processing..." : "Unapprove Therapist"}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredTherapists.length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No therapists found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TherapistsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Therapists</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading therapists...</p>
          </div>
        </div>
      </div>
    }>
      <TherapistsContent />
    </Suspense>
  )
}
