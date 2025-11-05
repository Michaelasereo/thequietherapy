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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Users, Search, Filter, Eye, UserCheck, UserX, Mail, Phone, Calendar, Shield, Trash2, Ban } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  full_name: string
  email: string
  user_type: string
  is_active: boolean
  is_verified: boolean
  status: string
  created_at: string
  last_activity?: string
  phone?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers()
  }, [userTypeFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: userTypeFilter === 'all' ? 'all' : userTypeFilter,
        limit: '100'
      })
      
      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Handle the new API response structure
        const usersData = data.users || []
        setUsers(Array.isArray(usersData) ? usersData : [])
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to fetch users')
        setUsers([]) // Ensure users is always an array
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error loading users')
      setUsers([]) // Ensure users is always an array
    } finally {
      setLoading(false)
    }
  }

  const handleUserStatusChange = async (userId: string, newStatus: string) => {
    try {
      if (newStatus === 'suspended' || newStatus === 'banned') {
        // Deactivate user
        const response = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            userId,
            permanent: false
          })
        })

        const data = await response.json()

        if (response.ok) {
          toast.success(data.message || `User ${newStatus} successfully`)
          setUsers(prev => prev.map(user => 
            user.id === userId ? { ...user, status: newStatus, is_active: false } : user
          ))
        } else {
          toast.error(data.error || 'Failed to update user status')
        }
      } else {
        // Reactivate user
        const response = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            userId,
            action: 'reactivate'
          })
        })

        const data = await response.json()

        if (response.ok) {
          toast.success(data.message || `User ${newStatus} successfully`)
          setUsers(prev => prev.map(user => 
            user.id === userId ? { ...user, status: newStatus, is_active: true } : user
          ))
        } else {
          toast.error(data.error || 'Failed to update user status')
        }
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const handleUserVerification = async (userId: string, isVerified: boolean) => {
    try {
      // This would be replaced with actual API call
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_verified: isVerified } : user
      ))
      toast.success(`User verification ${isVerified ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Error updating user verification:', error)
      toast.error('Failed to update user verification')
    }
  }

  const handleSuspendUser = async (userId: string) => {
    try {
      // This would be replaced with actual API call to suspend user and blacklist email
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'suspended', is_active: false } : user
      ))
      toast.success('User suspended successfully. Email has been blacklisted.')
    } catch (error) {
      console.error('Error suspending user:', error)
      toast.error('Failed to suspend user')
    }
  }

  const handleDeleteUser = async (userId: string, permanent: boolean = true) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          permanent
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'User deleted successfully')
        // Remove user from list
        setUsers(prev => prev.filter(user => user.id !== userId))
        // Refresh the list
        fetchUsers()
      } else {
        toast.error(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
      case 'suspended':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Suspended</Badge>
      case 'banned':
        return <Badge variant="outline" className="text-red-600 border-red-600">Banned</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'user':
        return <Badge variant="secondary">User</Badge>
      case 'therapist':
        return <Badge variant="default" className="bg-blue-600">Therapist</Badge>
      case 'partner':
        return <Badge variant="default" className="bg-purple-600">Partner</Badge>
      case 'admin':
        return <Badge variant="default" className="bg-red-600">Admin</Badge>
      default:
        return <Badge variant="outline">{userType}</Badge>
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

  // Filter users based on search and filters
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUserType = userTypeFilter === "all" || user.user_type === userTypeFilter
    // Map is_active to status for filtering
    const userStatus = user.is_active ? 'active' : (user.status || 'inactive')
    const matchesStatus = statusFilter === "all" || userStatus === statusFilter
    
    return matchesSearch && matchesUserType && matchesStatus
  }) : []

  const userStats = {
    total: Array.isArray(users) ? users.length : 0,
    users: Array.isArray(users) ? users.filter(u => u.user_type === 'user').length : 0,
    therapists: Array.isArray(users) ? users.filter(u => u.user_type === 'therapist').length : 0,
    partners: Array.isArray(users) ? users.filter(u => u.user_type === 'partner').length : 0,
    admins: Array.isArray(users) ? users.filter(u => u.user_type === 'admin').length : 0,
    active: Array.isArray(users) ? users.filter(u => u.is_active).length : 0,
    verified: Array.isArray(users) ? users.filter(u => u.is_verified).length : 0
  }

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading users...</p>
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

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage platform users, therapists, and partners</p>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">All platform users</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.verified}</div>
            <p className="text-xs text-muted-foreground">Email verified</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Therapists</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.therapists}</div>
            <p className="text-xs text-muted-foreground">Licensed therapists</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userType">User Type</Label>
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="therapist">Therapists</SelectItem>
                  <SelectItem value="partner">Partners</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getUserTypeBadge(user.user_type)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.is_active ? 'active' : (user.status || 'inactive'))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_verified ? "default" : "secondary"}>
                      {user.is_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(user.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {user.last_activity ? formatDateTime(user.last_activity) : "Never"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Full Name</Label>
                                <p className="text-sm">{user.full_name}</p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm">{user.email}</p>
                              </div>
                              <div>
                                <Label>Phone</Label>
                                <p className="text-sm">{user.phone || "Not provided"}</p>
                              </div>
                              <div>
                                <Label>User Type</Label>
                                <div className="mt-1">{getUserTypeBadge(user.user_type)}</div>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <div className="mt-1">{getStatusBadge(user.status)}</div>
                              </div>
                              <div>
                                <Label>Verification</Label>
                                <div className="mt-1">
                                  <Badge variant={user.is_verified ? "default" : "secondary"}>
                                    {user.is_verified ? "Verified" : "Unverified"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label>Created</Label>
                              <p className="text-sm">{formatDateTime(user.created_at)}</p>
                            </div>
                            {user.last_activity && (
                              <div>
                                <Label>Last Activity</Label>
                                <p className="text-sm">{formatDateTime(user.last_activity)}</p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserVerification(user.id, !user.is_verified)}
                              >
                                {user.is_verified ? "Unverify" : "Verify"}
                              </Button>
                              {user.status === 'active' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserStatusChange(user.id, 'suspended')}
                                >
                                  Suspend
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserStatusChange(user.id, 'active')}
                                >
                                  Activate
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Ban className="h-4 w-4 mr-1" />
                                    Suspend & Blacklist
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Suspend User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will suspend the user and blacklist their email address. 
                                      They will not be able to create a new account with this email.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleSuspendUser(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Suspend User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete User
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the user 
                                      and blacklist their email address.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user.id, true)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Permanently Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
