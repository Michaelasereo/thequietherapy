"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Search, Eye, Users, CreditCard, Calendar, Mail, Phone, AlertTriangle, CheckCircle, XCircle, Plus, TrendingUp, Upload, Download, FileText } from "lucide-react"
import { toast } from "sonner"

interface Partner {
  id: string
  name: string
  email: string
  phone?: string
  memberCount: number
  totalCredits: number
  usedCredits: number
  status: string
  is_verified: boolean
  created_at: string
  lastActivity?: string
}

interface PartnerMember {
  id: string
  name: string
  email: string
  phone?: string
  department?: string
  employeeId?: string
  creditsAssigned: number
  creditsUsed: number
  sessionsBooked: number
  status: "active" | "inactive"
  joinedAt: string
  lastActivity?: string
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [members, setMembers] = useState<PartnerMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [currentView, setCurrentView] = useState<'main' | 'members' | 'credits'>('main')
  const [selectedPartnerForView, setSelectedPartnerForView] = useState<Partner | null>(null)
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [memberSearchTerm, setMemberSearchTerm] = useState("")

  // Fetch partners on component mount
  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/partners')
      if (response.ok) {
        const data = await response.json()
        setPartners(data)
      } else {
        toast.error('Failed to fetch partners')
      }
    } catch (error) {
      console.error('Error fetching partners:', error)
      toast.error('Error loading partners')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
      case 'under_review':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Under Review</Badge>
      case 'suspended':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Suspended</Badge>
      case 'inactive':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Inactive</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
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

  // Filter partners based on search
  const filteredPartners = partners.filter(partner => 
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const partnerStats = {
    total: partners.length,
    active: partners.filter(p => p.status === 'active').length,
    totalMembers: partners.reduce((sum, p) => sum + p.memberCount, 0),
    totalCredits: partners.reduce((sum, p) => sum + p.totalCredits, 0),
    usedCredits: partners.reduce((sum, p) => sum + p.usedCredits, 0)
  }

  // Get pending verifications
  const pendingVerifications = partners.filter(p => p.status === 'pending')
  const [rejectionReason, setRejectionReason] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleApprove = async (partnerId: string) => {
    try {
      setProcessingId(partnerId)
      
      // This would be replaced with actual API call
      setPartners(prev => prev.map(partner => 
        partner.id === partnerId ? { ...partner, status: 'active', is_verified: true } : partner
      ))
      toast.success('Partner approved successfully')
    } catch (error) {
      console.error('Error approving partner:', error)
      toast.error('Failed to approve partner')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (partnerId: string, reason: string) => {
    try {
      setProcessingId(partnerId)
      
      const response = await fetch('/api/admin/partner-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, action: 'reject', reason })
      })
      
      if (response.ok) {
        setPartners(prev => prev.map(partner => 
          partner.id === partnerId ? { ...partner, status: 'rejected' } : partner
        ))
        toast.success('Partner application rejected')
        setRejectionReason("")
      } else {
        toast.error('Failed to reject partner')
      }
    } catch (error) {
      console.error('Error rejecting partner:', error)
      toast.error('Failed to reject partner')
    } finally {
      setProcessingId(null)
    }
  }

  const handlePartnerStateChange = async (partnerId: string, action: string, reason?: string) => {
    try {
      setProcessingId(partnerId)
      
      const response = await fetch('/api/admin/partner-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, action, reason })
      })
      
      if (response.ok) {
        const data = await response.json()
        setPartners(prev => prev.map(partner => 
          partner.id === partnerId ? { 
            ...partner, 
            status: action === 'activate' ? 'active' : 
                   action === 'deactivate' ? 'inactive' : 
                   action === 'suspend' ? 'suspended' : partner.status
          } : partner
        ))
        toast.success(`Partner ${action}ed successfully`)
      } else {
        toast.error(`Failed to ${action} partner`)
      }
    } catch (error) {
      console.error(`Error ${action}ing partner:`, error)
      toast.error(`Failed to ${action} partner`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleViewMembers = (partner: Partner) => {
    setSelectedPartnerForView(partner)
    setCurrentView('members')
  }

  const handleManageCredits = (partner: Partner) => {
    setSelectedPartnerForView(partner)
    setCurrentView('credits')
  }

  const handleBackToMain = () => {
    setCurrentView('main')
    setSelectedPartnerForView(null)
  }

  const handleCSVImport = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      // Validate required columns
      const requiredColumns = ['name', 'email', 'phone', 'department', 'employeeId']
      const missingColumns = requiredColumns.filter(col => !headers.includes(col))
      
      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(', ')}`)
        return
      }

      const newMembers: PartnerMember[] = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim())
        return {
          id: `imported-${Date.now()}-${index}`,
          name: values[headers.indexOf('name')] || '',
          email: values[headers.indexOf('email')] || '',
          phone: values[headers.indexOf('phone')] || '',
          department: values[headers.indexOf('department')] || '',
          employeeId: values[headers.indexOf('employeeId')] || '',
          creditsAssigned: 0,
          creditsUsed: 0,
          sessionsBooked: 0,
          status: 'active' as const,
          joinedAt: new Date().toISOString()
        }
      }).filter(member => member.name && member.email)

      setMembers(prev => [...prev, ...newMembers])
      toast.success(`Successfully imported ${newMembers.length} members`)
      setShowCSVModal(false)
      setCsvFile(null)
    } catch (error) {
      console.error('Error importing CSV:', error)
      toast.error('Failed to import CSV file')
    }
  }

  const downloadCSVTemplate = () => {
    const headers = ['name', 'email', 'phone', 'department', 'employeeId']
    const csvContent = headers.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'member-import-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getMemberStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
      case 'inactive':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Inactive</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Filter members based on search
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(memberSearchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-semibold">Partner Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading partners...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
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

  // Render different views based on currentView state
  if (currentView === 'members' && selectedPartnerForView) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToMain}>
              ← Back to Partners
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Partner Members</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Managing members for {selectedPartnerForView.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSVTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button onClick={() => setShowCSVModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </div>
        
        {/* Partner Members Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedPartnerForView.memberCount}</div>
              <p className="text-xs text-muted-foreground">Active members</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Assigned</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedPartnerForView.totalCredits}</div>
              <p className="text-xs text-muted-foreground">Total credits</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedPartnerForView.usedCredits}</div>
              <p className="text-xs text-muted-foreground">Used credits</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedPartnerForView.totalCredits - selectedPartnerForView.usedCredits}</div>
              <p className="text-xs text-muted-foreground">Available credits</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="member-search">Search by name or email</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="member-search"
                  placeholder="Search members..."
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Members ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="font-medium">{member.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{member.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{member.phone || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{member.department || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{member.employeeId || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {member.creditsUsed} / {member.creditsAssigned}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${member.creditsAssigned > 0 ? (member.creditsUsed / member.creditsAssigned) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{member.sessionsBooked}</div>
                    </TableCell>
                    <TableCell>
                      {getMemberStatusBadge(member.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(member.joinedAt)}
                      </div>
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
                            <DialogTitle>Member Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Name</Label>
                                <p className="text-sm">{member.name}</p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm">{member.email}</p>
                              </div>
                              <div>
                                <Label>Phone</Label>
                                <p className="text-sm">{member.phone || "Not provided"}</p>
                              </div>
                              <div>
                                <Label>Department</Label>
                                <p className="text-sm">{member.department || "Not specified"}</p>
                              </div>
                              <div>
                                <Label>Employee ID</Label>
                                <p className="text-sm font-mono">{member.employeeId || "Not assigned"}</p>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <div className="mt-1">{getMemberStatusBadge(member.status)}</div>
                              </div>
                              <div>
                                <Label>Credits Assigned</Label>
                                <p className="text-sm font-medium">{member.creditsAssigned}</p>
                              </div>
                              <div>
                                <Label>Credits Used</Label>
                                <p className="text-sm font-medium">{member.creditsUsed}</p>
                              </div>
                              <div>
                                <Label>Sessions Booked</Label>
                                <p className="text-sm font-medium">{member.sessionsBooked}</p>
                              </div>
                            </div>
                            <div>
                              <Label>Joined</Label>
                              <p className="text-sm">{formatDateTime(member.joinedAt)}</p>
                            </div>
                            {member.lastActivity && (
                              <div>
                                <Label>Last Activity</Label>
                                <p className="text-sm">{formatDateTime(member.lastActivity)}</p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-4">
                              <Button variant="outline" size="sm">
                                Manage Credits
                              </Button>
                              <Button variant="outline" size="sm">
                                View Sessions
                              </Button>
                              <Button variant="outline" size="sm">
                                Contact Member
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredMembers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No members found</h3>
                <p className="text-muted-foreground">Try importing members using the CSV upload or adjust your search criteria.</p>
              </div>
                      )}
        </CardContent>
      </Card>

      {/* CSV Import Modal */}
      <Dialog open={showCSVModal} onOpenChange={setShowCSVModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Import Members from CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Required CSV Columns:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div><strong>name</strong> - Full name of the member</div>
                <div><strong>email</strong> - Email address (required)</div>
                <div><strong>phone</strong> - Phone number</div>
                <div><strong>department</strong> - Department/team</div>
                <div><strong>employeeId</strong> - Employee ID or reference</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setCsvFile(file)
                  }
                }}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => csvFile && handleCSVImport(csvFile)}
                disabled={!csvFile}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Members
              </Button>
              <Button variant="outline" onClick={() => setShowCSVModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

  if (currentView === 'credits' && selectedPartnerForView) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToMain}>
            ← Back to Partners
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Partner Credits</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Managing credits for {selectedPartnerForView.name}
            </p>
          </div>
        </div>
        
        {/* Partner Credits Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedPartnerForView.totalCredits - selectedPartnerForView.usedCredits}</div>
              <p className="text-xs text-muted-foreground">Available credits</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedPartnerForView.totalCredits}</div>
              <p className="text-xs text-muted-foreground">Credits bought</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedPartnerForView.usedCredits}</div>
              <p className="text-xs text-muted-foreground">Used credits</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usage Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedPartnerForView.totalCredits > 0 
                  ? Math.round((selectedPartnerForView.usedCredits / selectedPartnerForView.totalCredits) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Credits used</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Credit Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Credit Management</h3>
              <p className="text-muted-foreground mb-4">
                Purchase credits, assign to members, and manage credit transactions for {selectedPartnerForView.name}
              </p>
              <div className="flex gap-2 justify-center">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase Credits
                </Button>
                <Button variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Assign Credits
                </Button>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Transactions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Partner Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage partner organizations and their members</p>
      </div>

      {/* Partner Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerStats.total}</div>
            <p className="text-xs text-muted-foreground">Partner organizations</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerStats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerStats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Across all partners</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerStats.usedCredits}</div>
            <p className="text-xs text-muted-foreground">Of {partnerStats.totalCredits} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Verifications */}
      {pendingVerifications.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-medium">Pending Partner Verifications ({pendingVerifications.length})</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {pendingVerifications.map((partner) => (
              <Card key={partner.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{partner.name}</CardTitle>
                    {getStatusBadge(partner.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{partner.email}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Members:</span>
                      <span className="text-sm">{partner.memberCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Credits:</span>
                      <span className="text-sm">{partner.totalCredits}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Applied: {formatDate(partner.created_at)}
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
                          <DialogTitle>Partner Application Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Organization Name</Label>
                              <p className="text-sm">{partner.name}</p>
                            </div>
                            <div>
                              <Label>Email</Label>
                              <p className="text-sm">{partner.email}</p>
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <p className="text-sm">{partner.phone || "Not provided"}</p>
                            </div>
                            <div>
                              <Label>Member Count</Label>
                              <p className="text-sm">{partner.memberCount}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Total Credits</Label>
                              <p className="text-sm font-medium">{partner.totalCredits}</p>
                            </div>
                            <div>
                              <Label>Used Credits</Label>
                              <p className="text-sm font-medium">{partner.usedCredits}</p>
                            </div>
                          </div>
                          <div>
                            <Label>Applied</Label>
                            <p className="text-sm">{formatDateTime(partner.created_at)}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(partner.id)}
                      disabled={processingId === partner.id}
                    >
                      {processingId === partner.id ? (
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
                          disabled={processingId === partner.id}
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
                              onClick={() => handleReject(partner.id, rejectionReason)}
                              disabled={!rejectionReason.trim() || processingId === partner.id}
                            >
                              {processingId === partner.id ? "Processing..." : "Reject Application"}
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

      {/* Search */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Search by name or email</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Partners ({filteredPartners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{partner.name}</div>
                      <div className="text-sm text-muted-foreground">{partner.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{partner.memberCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {partner.usedCredits} / {partner.totalCredits}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(partner.usedCredits / partner.totalCredits) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(partner.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(partner.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {partner.lastActivity ? formatDateTime(partner.lastActivity) : "Never"}
                    </div>
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
                          <DialogTitle>Partner Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Organization Name</Label>
                              <p className="text-sm">{partner.name}</p>
                            </div>
                            <div>
                              <Label>Email</Label>
                              <p className="text-sm">{partner.email}</p>
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <p className="text-sm">{partner.phone || "Not provided"}</p>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <div className="mt-1">{getStatusBadge(partner.status)}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Member Count</Label>
                              <p className="text-sm font-medium">{partner.memberCount}</p>
                            </div>
                            <div>
                              <Label>Credits Usage</Label>
                              <p className="text-sm font-medium">
                                {partner.usedCredits} of {partner.totalCredits} credits used
                              </p>
                            </div>
                          </div>
                          <div>
                            <Label>Created</Label>
                            <p className="text-sm">{formatDateTime(partner.created_at)}</p>
                          </div>
                          {partner.lastActivity && (
                            <div>
                              <Label>Last Activity</Label>
                              <p className="text-sm">{formatDateTime(partner.lastActivity)}</p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewMembers(partner)}
                            >
                              View Members
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleManageCredits(partner)}
                            >
                              Manage Credits
                            </Button>
                            <Button variant="outline" size="sm">
                              Contact Partner
                            </Button>
                          </div>
                          
                          {/* Partner State Management */}
                          <div className="border-t pt-4">
                            <Label className="text-sm font-medium">Partner Management</Label>
                            <div className="flex gap-2 mt-2">
                              {partner.status === 'active' ? (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handlePartnerStateChange(partner.id, 'deactivate')}
                                    disabled={processingId === partner.id}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Deactivate
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handlePartnerStateChange(partner.id, 'suspend', 'Suspended by admin')}
                                    disabled={processingId === partner.id}
                                    className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Suspend
                                  </Button>
                                </>
                              ) : partner.status === 'inactive' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handlePartnerStateChange(partner.id, 'activate')}
                                  disabled={processingId === partner.id}
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Activate
                                </Button>
                              ) : partner.status === 'suspended' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handlePartnerStateChange(partner.id, 'activate')}
                                  disabled={processingId === partner.id}
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Reactivate
                                </Button>
                              ) : partner.status === 'under_review' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handlePartnerStateChange(partner.id, 'approve')}
                                  disabled={processingId === partner.id}
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Final Approve
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPartners.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No partners found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
