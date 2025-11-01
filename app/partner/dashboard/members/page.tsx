'use client';

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, Download, Users, Calendar, Clock, CreditCard, Plus, Mail, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import CSVUpload from "@/components/csv-upload"

interface PartnerMember {
  id: string
  name: string
  email: string
  creditsAssigned: number
  sessionsUsed: number
  status: 'active' | 'inactive' | 'pending'
  joinedAt: string
  lastActivity?: string
}

interface CSVUploadData {
  firstname: string
  email: string
  statustype: 'doctor' | 'student'
  caderlevel: string
  phone?: string
  department?: string
  employeeId?: string
}

export default function PartnerMembersPage() {
  const [members, setMembers] = useState<PartnerMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({})
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // Manual add state
  const [manualName, setManualName] = useState("")
  const [manualEmail, setManualEmail] = useState("")
  const [manualStatusType, setManualStatusType] = useState<'doctor' | 'student'>('doctor')
  const [manualCaderLevel, setManualCaderLevel] = useState("")
  const [manualPhone, setManualPhone] = useState("")
  const [manualDepartment, setManualDepartment] = useState("")
  const [manualEmployeeId, setManualEmployeeId] = useState("")
  const [addingManual, setAddingManual] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/partner/members')
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      } else {
        console.error('Failed to fetch members')
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCSVUpload = async (file: File) => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/partner/upload-members', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Upload Successful",
          description: `${result.uploaded} members uploaded and magic links sent`
        })
        setShowCSVModal(false)
        setCsvFile(null)
        fetchMembers() // Refresh the members list
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading CSV:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload CSV",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSelectMember = (memberId: string) => {
    setSelectedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }))
  }

  const handleSelectAll = () => {
    const allSelected = Object.keys(selectedMembers).length === members.length
    if (allSelected) {
      setSelectedMembers({})
    } else {
      const newSelection: Record<string, boolean> = {}
      members.forEach(member => {
        newSelection[member.id] = true
      })
      setSelectedMembers(newSelection)
    }
  }

  const downloadTemplate = () => {
    const templateContent = `firstname,email,statustype,caderlevel,phone,department,employeeid
John,john.doe@hospital.com,doctor,consultant,+2348012345678,Cardiology,EMP001
Sarah,sarah.smith@hospital.com,doctor,resident,+2348012345679,Neurology,EMP002
Michael,michael.johnson@university.edu,student,300level,+2348012345680,Medicine,STU001
Emily,emily.brown@university.edu,student,400level,+2348012345681,Medicine,STU002
David,david.wilson@hospital.com,doctor,house officer,+2348012345682,Internal Medicine,EMP003`

    const blob = new Blob([templateContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'partner-member-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleManualAdd = async () => {
    // Validate required fields
    if (!manualName || !manualEmail || !manualCaderLevel) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Email, Cader Level)",
        variant: "destructive"
      })
      return
    }

    setAddingManual(true)

    try {
      // Create CSV content for single member
      const csvContent = `firstname,email,statustype,caderlevel,phone,department,employeeid\n${manualName},${manualEmail},${manualStatusType},${manualCaderLevel},${manualPhone || ''},${manualDepartment || ''},${manualEmployeeId || ''}`

      const response = await fetch('/api/partner/upload-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv'
        },
        body: csvContent
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Member Added",
          description: `${result.uploaded} member added successfully`
        })
        
        // Reset form
        setManualName("")
        setManualEmail("")
        setManualStatusType('doctor')
        setManualCaderLevel("")
        setManualPhone("")
        setManualDepartment("")
        setManualEmployeeId("")
        
        // Refresh list
        fetchMembers()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      toast({
        title: "Add Failed",
        description: error instanceof Error ? error.message : "Failed to add member",
        variant: "destructive"
      })
    } finally {
      setAddingManual(false)
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate summary data
  const totalMembers = members.length
  const activeMembers = members.filter(m => m.status === 'active').length
  const totalSessions = members.reduce((sum, m) => sum + m.sessionsUsed, 0)
  const totalCreditsAssigned = members.reduce((sum, m) => sum + m.creditsAssigned, 0)
  const upcomingSessions = 0 // This would come from a sessions API in a real implementation

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Members</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <h2 className="text-2xl font-bold">Members</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">All registered members</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">Members with active status</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">Sessions completed by members</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions}</div>
            <p className="text-xs text-muted-foreground">Scheduled sessions this week</p>
          </CardContent>
        </Card>
      </div>

      {/* CSV Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Bulk Member Upload</h3>
          <div className="text-sm text-muted-foreground">
            Upload CSV files to add multiple members at once
          </div>
        </div>
        <CSVUpload />
      </div>

      {/* Manual Add */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Add Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input 
                placeholder="John Doe" 
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input 
                placeholder="john.doe@hospital.com" 
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Status Type *</Label>
              <Select value={manualStatusType} onValueChange={(value: 'doctor' | 'student') => setManualStatusType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cader/Level *</Label>
              <Input 
                placeholder="consultant, resident, 300level, etc" 
                value={manualCaderLevel}
                onChange={(e) => setManualCaderLevel(e.target.value)}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input 
                placeholder="+2348012345678" 
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
              />
            </div>
            <div>
              <Label>Department</Label>
              <Input 
                placeholder="Cardiology" 
                value={manualDepartment}
                onChange={(e) => setManualDepartment(e.target.value)}
              />
            </div>
            <div>
              <Label>Employee ID</Label>
              <Input 
                placeholder="EMP001" 
                value={manualEmployeeId}
                onChange={(e) => setManualEmployeeId(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={handleManualAdd} 
            disabled={addingManual || !manualName || !manualEmail || !manualCaderLevel}
            className="w-full md:w-auto"
          >
            {addingManual ? "Adding..." : "Add Member"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline">Bulk Remove</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Member List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Credits Assigned</TableHead>
                <TableHead>Sessions Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length > 0 ? filteredMembers.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <input 
                      type="checkbox" 
                      checked={!!selectedMembers[m.id]} 
                      onChange={() => handleSelectMember(m.id)}
                    />
                  </TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.creditsAssigned}</TableCell>
                  <TableCell>{m.sessionsUsed}</TableCell>
                  <TableCell>{m.status}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm">Assign 10</Button>
                    <Button variant="destructive" size="sm">Remove</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No members found</h3>
                      <p className="text-muted-foreground">Upload a CSV file to add members or add them manually.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


