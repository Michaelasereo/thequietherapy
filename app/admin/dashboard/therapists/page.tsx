"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCheck, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, DollarSign, Users, Calendar } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Therapist data - will be populated with real data
const mockTherapists: any[] = [
  {
    id: "1",
    name: "Dr. Emily White",
    email: "emily@example.com",
    specialization: "Anxiety, Depression",
    status: "Active",
    verificationStatus: "Verified",
    sessions: 45,
    rating: 4.8,
    joinDate: "2024-01-15",
    mdcnCode: "MDCN12345",
    totalEarnings: 125000
  },
  {
    id: "2", 
    name: "Dr. John Smith",
    email: "john@example.com",
    specialization: "Trauma Therapy",
    status: "Pending",
    verificationStatus: "Pending",
    sessions: 0,
    rating: 0,
    joinDate: "2024-01-20",
    mdcnCode: "MDCN67890",
    totalEarnings: 0
  }
]

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState(mockTherapists)
  const [isLoading, setIsLoading] = useState(false)
  
  const activeTherapists = therapists.filter(t => t.status === "Active")
  const verifiedTherapists = therapists.filter(t => t.verificationStatus === "Verified")
  const pendingVerifications = therapists.filter(t => t.verificationStatus === "Pending")

  const handleApproveTherapist = async (therapistId: string) => {
    setIsLoading(true)
    try {
      // In real app, call API to approve therapist
      setTherapists(prev => prev.map(t => 
        t.id === therapistId 
          ? { ...t, status: "Active", verificationStatus: "Verified" }
          : t
      ))
      
      // Show success message
      console.log(`Therapist ${therapistId} approved successfully!`)
    } catch (error) {
      console.error('Error approving therapist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectTherapist = async (therapistId: string) => {
    setIsLoading(true)
    try {
      // In real app, call API to reject therapist
      setTherapists(prev => prev.map(t => 
        t.id === therapistId 
          ? { ...t, status: "Inactive", verificationStatus: "Rejected" }
          : t
      ))
      
      // Show success message
      console.log(`Therapist ${therapistId} rejected successfully!`)
    } catch (error) {
      console.error('Error rejecting therapist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="default">Active</Badge>
      case "Inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "Suspended":
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "Verified":
        return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Therapist Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all platform therapists</p>
        </div>
        <Button>
          <UserCheck className="mr-2 h-4 w-4" />
          Add Therapist
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{mockTherapists.length}</div>
                <div className="text-sm text-muted-foreground">Total Therapists</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{activeTherapists.length}</div>
                <div className="text-sm text-muted-foreground">Active Therapists</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{pendingVerifications.length}</div>
                <div className="text-sm text-muted-foreground">Pending Verification</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Pending Enrollments</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">₦{mockTherapists.reduce((sum, t) => sum + t.totalEarnings, 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Earnings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Enrollments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pending Therapist Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Pending Enrollments</h3>
            <p className="text-sm text-muted-foreground mb-4">
              When therapists complete the enrollment process, they will appear here for manual verification.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• MDCN codes will be verified manually</p>
              <p>• Document uploads will be reviewed</p>
              <p>• Approved therapists will be activated</p>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Check the "All Therapists" table below for any unverified therapists that need approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search therapists by name or email..."
                  className="pl-9"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verifications</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Therapists Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Therapists ({therapists.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Therapist</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>MDCN Code</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {therapists.map((therapist) => (
                <TableRow key={therapist.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{therapist.name}</div>
                      <div className="text-sm text-muted-foreground">{therapist.email}</div>
                      <div className="text-xs text-muted-foreground">Joined: {therapist.joinDate}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{therapist.specialization}</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(therapist.status)}
                  </TableCell>
                  <TableCell>
                    {getVerificationBadge(therapist.verificationStatus)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{therapist.totalSessions}</div>
                    <div className="text-xs text-muted-foreground">{therapist.clients} clients</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">₦{therapist.totalEarnings.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{therapist.rating}</span>
                      <span className="text-yellow-500">★</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{therapist.mdcnCode}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Therapist
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          View Clients
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          View Sessions
                        </DropdownMenuItem>
                        {therapist.verificationStatus === "Pending" && (
                          <>
                            <DropdownMenuItem 
                              className="text-green-600"
                              onClick={() => handleApproveTherapist(therapist.id)}
                              disabled={isLoading}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve Therapist
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleRejectTherapist(therapist.id)}
                              disabled={isLoading}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject Therapist
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Suspend Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Therapists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTherapists
                .sort((a, b) => b.totalSessions - a.totalSessions)
                .slice(0, 5)
                .map((therapist, index) => (
                  <div key={therapist.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{therapist.name}</div>
                        <div className="text-sm text-muted-foreground">{therapist.specialization}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{therapist.totalSessions} sessions</div>
                      <div className="text-sm text-muted-foreground">₦{therapist.totalEarnings.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Verified</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(verifiedTherapists.length / mockTherapists.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{verifiedTherapists.length}/{mockTherapists.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(pendingVerifications.length / mockTherapists.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{pendingVerifications.length}/{mockTherapists.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
