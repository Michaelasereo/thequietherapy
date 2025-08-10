"use client"

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

// Mock therapist data
const mockTherapists = [
  {
    id: "t1",
    name: "Dr. Sarah Johnson",
    email: "sarah@example.com",
    specialization: "Cognitive Behavioral Therapy",
    status: "Active",
    verificationStatus: "Verified",
    joinDate: "2024-01-10",
    totalSessions: 45,
    totalEarnings: 225000,
    rating: 4.8,
    clients: 12,
    availability: "Full-time",
    mdcnCode: "MDCN12345"
  },
  {
    id: "t2",
    name: "Dr. Michael Brown",
    email: "michael@example.com",
    specialization: "Family Therapy",
    status: "Active",
    verificationStatus: "Pending",
    joinDate: "2024-01-15",
    totalSessions: 23,
    totalEarnings: 115000,
    rating: 4.6,
    clients: 8,
    availability: "Part-time",
    mdcnCode: "MDCN12346"
  },
  {
    id: "t3",
    name: "Dr. Emily White",
    email: "emily@example.com",
    specialization: "Trauma Therapy",
    status: "Inactive",
    verificationStatus: "Verified",
    joinDate: "2024-01-05",
    totalSessions: 67,
    totalEarnings: 335000,
    rating: 4.9,
    clients: 15,
    availability: "Full-time",
    mdcnCode: "MDCN12347"
  },
  {
    id: "t4",
    name: "Dr. David Wilson",
    email: "david@example.com",
    specialization: "Child Psychology",
    status: "Active",
    verificationStatus: "Verified",
    joinDate: "2024-01-20",
    totalSessions: 18,
    totalEarnings: 90000,
    rating: 4.7,
    clients: 6,
    availability: "Part-time",
    mdcnCode: "MDCN12348"
  },
  {
    id: "t5",
    name: "Dr. Lisa Chen",
    email: "lisa@example.com",
    specialization: "Anxiety & Depression",
    status: "Active",
    verificationStatus: "Verified",
    joinDate: "2024-01-12",
    totalSessions: 34,
    totalEarnings: 170000,
    rating: 4.5,
    clients: 10,
    availability: "Full-time",
    mdcnCode: "MDCN12349"
  }
]

export default function AdminTherapistsPage() {
  const activeTherapists = mockTherapists.filter(t => t.status === "Active")
  const verifiedTherapists = mockTherapists.filter(t => t.verificationStatus === "Verified")
  const pendingVerifications = mockTherapists.filter(t => t.verificationStatus === "Pending")

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
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">₦{mockTherapists.reduce((sum, t) => sum + t.totalEarnings, 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Earnings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <CardTitle>All Therapists ({mockTherapists.length})</CardTitle>
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
              {mockTherapists.map((therapist) => (
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
