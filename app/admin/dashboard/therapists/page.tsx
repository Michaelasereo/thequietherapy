"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { UserCheck, Search, Eye, Shield, Calendar, Mail, Phone, FileText, Star, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
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
  created_at: string
  lastActivity?: string
}

export default function TherapistsPage() {
  const searchParams = useSearchParams()
  const reviewId = searchParams.get('review')
  
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [verificationFilter, setVerificationFilter] = useState("all")
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)

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
      // This would be replaced with actual API call
      const mockTherapists: Therapist[] = [
        {
          id: "1",
          full_name: "Dr. Sarah Johnson",
          email: "sarah@example.com",
          phone: "+2348098765432",
          mdcn_code: "MDCN12345",
          specialization: ["Cognitive Behavioral Therapy", "Anxiety", "Depression"],
          languages: ["English", "Yoruba"],
          is_verified: true,
          is_active: true,
          status: "active",
          rating: 4.8,
          totalSessions: 156,
          created_at: "2024-01-10T09:15:00Z",
          lastActivity: "2024-01-20T16:20:00Z"
        },
        {
          id: "2",
          full_name: "Dr. Michael Brown",
          email: "michael@example.com",
          phone: "+2348012345678",
          mdcn_code: "MDCN67890",
          specialization: ["Family Therapy", "Marriage Counseling"],
          languages: ["English", "Hausa"],
          is_verified: true,
          is_active: true,
          status: "active",
          rating: 4.6,
          totalSessions: 89,
          created_at: "2024-01-12T11:30:00Z",
          lastActivity: "2024-01-19T14:45:00Z"
        },
        {
          id: "3",
          full_name: "Dr. Emily White",
          email: "emily@example.com",
          phone: "+2348076543210",
          mdcn_code: "MDCN11111",
          specialization: ["Trauma Therapy", "PTSD"],
          languages: ["English", "Igbo"],
          is_verified: false,
          is_active: false,
          status: "pending",
          totalSessions: 0,
          created_at: "2024-01-15T13:20:00Z"
        }
      ]
      
      setTherapists(mockTherapists)
    } catch (error) {
      console.error('Error fetching therapists:', error)
      toast.error('Failed to fetch therapists')
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
      <Badge variant="default" className="bg-green-600">Verified</Badge>
    ) : (
      <Badge variant="secondary">Unverified</Badge>
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
      
      // This would be replaced with actual API call
      setTherapists(prev => prev.map(therapist => 
        therapist.id === therapistId ? { ...therapist, status: 'active', is_verified: true } : therapist
      ))
      toast.success('Therapist approved successfully')
    } catch (error) {
      console.error('Error approving therapist:', error)
      toast.error('Failed to approve therapist')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (therapistId: string, reason: string) => {
    try {
      setProcessingId(therapistId)
      
      // This would be replaced with actual API call
      setTherapists(prev => prev.map(therapist => 
        therapist.id === therapistId ? { ...therapist, status: 'rejected' } : therapist
      ))
      toast.success('Therapist application rejected')
      setRejectionReason("")
    } catch (error) {
      console.error('Error rejecting therapist:', error)
      toast.error('Failed to reject therapist')
    } finally {
      setProcessingId(null)
    }
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
            <p className="text-xs text-muted-foreground">MDCN verified</p>
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

      {/* Pending Verifications */}
      {pendingVerifications.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-medium">Pending Verifications ({pendingVerifications.length})</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingVerifications.map((therapist) => (
              <Card key={therapist.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{therapist.full_name}</CardTitle>
                    {getStatusBadge(therapist.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{therapist.email}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">MDCN Code:</span>
                      <span className="text-sm">{therapist.mdcn_code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Specializations:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {therapist.specialization.map((spec, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Applied: {formatDate(therapist.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Therapist Application Details</DialogTitle>
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
                            <Label>Applied</Label>
                            <p className="text-sm">{formatDateTime(therapist.created_at)}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(therapist.id)}
                      disabled={processingId === therapist.id}
                    >
                      {processingId === therapist.id ? (
                        "Processing..."
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={processingId === therapist.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Application</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="rejectionReason">Reason for Rejection</Label>
                            <Textarea
                              id="rejectionReason"
                              placeholder="Please provide a reason for rejecting this application..."
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
                              {processingId === therapist.id ? "Processing..." : "Reject Application"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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
              <Label htmlFor="verification">Verification</Label>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
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
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
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
