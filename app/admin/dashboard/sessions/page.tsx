"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Search, MoreHorizontal, Eye, Clock, CheckCircle, XCircle, DollarSign, Users, TrendingUp, Video } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock session data
const mockSessions = [
  {
    id: "s1",
    clientName: "John Doe",
    therapistName: "Dr. Sarah Johnson",
    date: "2024-01-20",
    time: "10:00 AM",
    duration: 60,
    status: "Completed",
    type: "Cognitive Behavioral Therapy",
    amount: 5000,
    paymentStatus: "Paid",
    notes: "Session focused on anxiety management techniques",
    partner: null
  },
  {
    id: "s2",
    clientName: "Jane Smith",
    therapistName: "Dr. Michael Brown",
    date: "2024-01-20",
    time: "2:00 PM",
    duration: 45,
    status: "Scheduled",
    type: "Family Therapy",
    amount: 4500,
    paymentStatus: "Pending",
    notes: "Upcoming family counseling session",
    partner: "TechCorp Solutions"
  },
  {
    id: "s3",
    clientName: "Mike Johnson",
    therapistName: "Dr. Emily White",
    date: "2024-01-19",
    time: "11:30 AM",
    duration: 60,
    status: "Completed",
    type: "Trauma Therapy",
    amount: 6000,
    paymentStatus: "Paid",
    notes: "Trauma processing session completed successfully",
    partner: null
  },
  {
    id: "s4",
    clientName: "Sarah Wilson",
    therapistName: "Dr. David Wilson",
    date: "2024-01-19",
    time: "4:00 PM",
    duration: 30,
    status: "Cancelled",
    type: "Child Psychology",
    amount: 3000,
    paymentStatus: "Refunded",
    notes: "Client requested cancellation due to emergency",
    partner: "HealthCorp Ltd"
  },
  {
    id: "s5",
    clientName: "David Brown",
    therapistName: "Dr. Lisa Chen",
    date: "2024-01-18",
    time: "3:00 PM",
    duration: 60,
    status: "Completed",
    type: "Anxiety & Depression",
    amount: 5000,
    paymentStatus: "Paid",
    notes: "Depression management techniques discussed",
    partner: null
  },
  {
    id: "s6",
    clientName: "Lisa Chen",
    therapistName: "Dr. Sarah Johnson",
    date: "2024-01-21",
    time: "9:00 AM",
    duration: 60,
    status: "Scheduled",
    type: "Cognitive Behavioral Therapy",
    amount: 5000,
    paymentStatus: "Paid",
    notes: "Follow-up session scheduled",
    partner: "EduCare Foundation"
  }
]

export default function AdminSessionsPage() {
  const completedSessions = mockSessions.filter(s => s.status === "Completed")
  const scheduledSessions = mockSessions.filter(s => s.status === "Scheduled")
  const cancelledSessions = mockSessions.filter(s => s.status === "Cancelled")
  const paidSessions = mockSessions.filter(s => s.paymentStatus === "Paid")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case "Scheduled":
        return <Badge variant="secondary">Scheduled</Badge>
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "No-show":
        return <Badge variant="outline">No-show</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>
      case "Refunded":
        return <Badge variant="destructive">Refunded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      "Cognitive Behavioral Therapy": "bg-blue-100 text-blue-800",
      "Family Therapy": "bg-purple-100 text-purple-800",
      "Trauma Therapy": "bg-red-100 text-red-800",
      "Child Psychology": "bg-yellow-100 text-yellow-800",
      "Anxiety & Depression": "bg-green-100 text-green-800"
    }
    return <Badge variant="outline" className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{type}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Session Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and manage all therapy sessions</p>
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          View Calendar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{mockSessions.length}</div>
                <div className="text-sm text-muted-foreground">Total Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{completedSessions.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{scheduledSessions.length}</div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">₦{mockSessions.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
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
                  placeholder="Search sessions by client or therapist..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Sessions ({mockSessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Therapist</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">Session #{session.id}</div>
                      <div className="text-sm text-muted-foreground">{session.duration} min</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{session.clientName}</div>
                      {session.partner && (
                        <div className="text-xs text-muted-foreground">{session.partner}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{session.therapistName}</div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(session.type)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{session.date}</div>
                      <div className="text-xs text-muted-foreground">{session.time}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(session.status)}
                  </TableCell>
                  <TableCell>
                    {getPaymentBadge(session.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">₦{session.amount.toLocaleString()}</div>
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
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Video className="mr-2 h-4 w-4" />
                          Join Session
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Clock className="mr-2 h-4 w-4" />
                          Reschedule
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Session
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

      {/* Session Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(completedSessions.length / mockSessions.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{completedSessions.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Scheduled</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(scheduledSessions.length / mockSessions.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{scheduledSessions.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cancelled</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(cancelledSessions.length / mockSessions.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{cancelledSessions.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Therapists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(
                mockSessions.reduce((acc, session) => {
                  acc[session.therapistName] = (acc[session.therapistName] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              )
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([therapist, sessions], index) => (
                  <div key={therapist} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{therapist}</div>
                        <div className="text-sm text-muted-foreground">{sessions} sessions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₦{(sessions * 5000).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">estimated revenue</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Notes and Details */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Session Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockSessions
              .filter(s => s.status === "Completed" && s.notes)
              .slice(0, 5)
              .map((session) => (
                <div key={session.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{session.clientName}</span>
                      <span className="text-muted-foreground">with</span>
                      <span className="font-medium">{session.therapistName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{session.date}</div>
                  </div>
                  <p className="text-sm text-muted-foreground">{session.notes}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {getTypeBadge(session.type)}
                    {getStatusBadge(session.status)}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
