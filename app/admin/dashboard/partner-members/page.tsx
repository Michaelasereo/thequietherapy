"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Search, Eye, Calendar, CreditCard, UserCheck, UserX, Upload, Download, FileText } from "lucide-react"
import { toast } from "sonner"

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

export default function PartnerMembersPage() {
  const [members, setMembers] = useState<PartnerMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMember, setSelectedMember] = useState<PartnerMember | null>(null)
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)

  // Fetch members on component mount
  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      // This would be replaced with actual API call
      const mockMembers: PartnerMember[] = [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          phone: "+2348012345678",
          department: "Engineering",
          employeeId: "EMP001",
          creditsAssigned: 40,
          creditsUsed: 25,
          sessionsBooked: 5,
          status: "active",
          joinedAt: "2024-01-15T10:30:00Z",
          lastActivity: "2024-01-20T14:45:00Z"
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "+2348098765432",
          department: "Marketing",
          employeeId: "EMP002",
          creditsAssigned: 30,
          creditsUsed: 15,
          sessionsBooked: 3,
          status: "active",
          joinedAt: "2024-01-10T09:15:00Z",
          lastActivity: "2024-01-19T16:20:00Z"
        },
        {
          id: "3",
          name: "Bob Lee",
          email: "bob@example.com",
          phone: "+2348055555555",
          department: "HR",
          employeeId: "EMP003",
          creditsAssigned: 20,
          creditsUsed: 0,
          sessionsBooked: 0,
          status: "inactive",
          joinedAt: "2024-01-05T11:00:00Z"
        }
      ]
      
      setMembers(mockMembers)
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to fetch members')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
      case 'inactive':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Inactive</Badge>
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

  // Filter members based on search
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const memberStats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    totalCreditsAssigned: members.reduce((sum, m) => sum + m.creditsAssigned, 0),
    totalCreditsUsed: members.reduce((sum, m) => sum + m.creditsUsed, 0),
    totalSessions: members.reduce((sum, m) => sum + m.sessionsBooked, 0),
    creditsRemaining: members.reduce((sum, m) => sum + m.creditsAssigned, 0) - members.reduce((sum, m) => sum + m.creditsUsed, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-semibold">Partner Members</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading members...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
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
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Partner Members</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage partner organization members</p>
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

      {/* Member Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberStats.total}</div>
            <p className="text-xs text-muted-foreground">All members</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberStats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberStats.totalCreditsUsed}</div>
            <p className="text-xs text-muted-foreground">Of {memberStats.totalCreditsAssigned} assigned</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Booked sessions</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberStats.creditsRemaining}</div>
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
            <Label htmlFor="search">Search by name or email</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                          className="bg-brand-gold h-2 rounded-full" 
                          style={{ width: `${(member.creditsAssigned > 0 ? (member.creditsUsed / member.creditsAssigned) * 100 : 0)}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{member.sessionsBooked}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(member.status)}
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
                              <Label>Status</Label>
                              <div className="mt-1">{getStatusBadge(member.status)}</div>
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
              <p className="text-muted-foreground">Try adjusting your search criteria.</p>
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
