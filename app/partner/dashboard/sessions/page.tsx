'use client';

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, User, Video, CheckCircle, AlertCircle, Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface Session {
  id: string
  memberName: string
  memberEmail: string
  therapistName: string
  scheduledDate: string
  scheduledTime: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  creditsUsed: number
  sessionType: string
  notes?: string
}

export default function PartnerSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const router = useRouter()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/partner/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      } else {
        console.error('Failed to fetch sessions')
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Scheduled</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600">Cancelled</Badge>
      case 'no-show':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">No Show</Badge>
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

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Filter sessions based on search and status
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.memberEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.therapistName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || session.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const sessionStats = {
    total: sessions.length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
    totalCreditsUsed: sessions.reduce((sum, s) => sum + s.creditsUsed, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading sessions...</p>
        </div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track member therapy sessions</p>
        </div>
        <Button onClick={() => router.push('/partner/dashboard/members')}>
          View Members
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.total}</div>
            <p className="text-xs text-muted-foreground">All time sessions</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.scheduled}</div>
            <p className="text-xs text-muted-foreground">Upcoming sessions</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished sessions</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.totalCreditsUsed}</div>
            <p className="text-xs text-muted-foreground">Total credits consumed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>

          {/* Sessions Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Therapist</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{session.memberName}</div>
                        <div className="text-sm text-muted-foreground">{session.memberEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{session.therapistName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatDate(session.scheduledDate)}</div>
                        <div className="text-sm text-muted-foreground">{formatTime(session.scheduledTime)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(session.status)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{session.creditsUsed}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{session.sessionType}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {session.status === 'scheduled' && (
                          <Button variant="outline" size="sm">
                            <Video className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No sessions found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm || filterStatus !== "all" 
                          ? "Try adjusting your search criteria" 
                          : "No sessions have been booked yet"}
                      </p>
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
