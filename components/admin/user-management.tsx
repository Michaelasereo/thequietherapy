"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Trash2, 
  UserCheck, 
  UserX, 
  Eye,
  Filter,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  email: string
  full_name: string
  user_type: 'individual' | 'therapist' | 'partner' | 'admin'
  is_verified: boolean
  is_active: boolean
  created_at: string
  last_login_at?: string
  therapist_profiles?: {
    verification_status: string
    specialization: string
    years_of_experience: number
  }[]
}

interface UserManagementProps {
  userType?: 'all' | 'individual' | 'therapist' | 'partner'
}

export function UserManagement({ userType = 'all' }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserType, setSelectedUserType] = useState(userType)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  })
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [selectedUserType, searchTerm, pagination.offset])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: selectedUserType,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
        setPagination((prev: any) => ({
          ...prev,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore
        }))
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }

    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, permanent = false) => {
    try {
      setDeletingUserId(userId)

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
        toast({
          title: "Success",
          description: data.message
        })
        
        // Remove user from list or mark as inactive
        if (permanent) {
          setUsers(users.filter(user => user.id !== userId))
        } else {
          setUsers(users.map(user => 
            user.id === userId 
              ? { ...user, is_active: false }
              : user
          ))
        }
      } else {
        throw new Error(data.error || 'Failed to delete user')
      }

    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? (error as Error).message : "Failed to delete user",
        variant: "destructive"
      })
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleReactivateUser = async (userId: string) => {
    try {
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
        toast({
          title: "Success",
          description: data.message
        })
        
        // Update user in list
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, is_active: true }
            : user
        ))
      } else {
        throw new Error(data.error || 'Failed to reactivate user')
      }

    } catch (error) {
      console.error('Error reactivating user:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? (error as Error).message : "Failed to reactivate user",
        variant: "destructive"
      })
    }
  }

  const getUserTypeLabel = (type: string) => {
    const labels = {
      individual: 'User',
      therapist: 'Therapist',
      partner: 'Partner',
      admin: 'Admin'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getUserTypeBadgeColor = (type: string) => {
    const colors = {
      individual: 'default',
      therapist: 'secondary',
      partner: 'outline',
      admin: 'destructive'
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  if (loading && users.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading users...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>User Management</span>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <Select value={selectedUserType} onValueChange={setSelectedUserType}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="individual">Users</SelectItem>
                <SelectItem value="therapist">Therapists</SelectItem>
                <SelectItem value="partner">Partners</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || 'N/A'}
                  </TableCell>
                  
                  <TableCell>{user.email}</TableCell>
                  
                  <TableCell>
                    <Badge variant={getUserTypeBadgeColor(user.user_type) as any}>
                      {getUserTypeLabel(user.user_type)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {user.is_verified && (
                        <Badge variant="outline" className="text-green-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {/* View Details Button */}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {/* Reactivate/Deactivate */}
                      {user.is_active ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={deletingUserId === user.id}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will deactivate {user.full_name} ({user.email}). 
                                They won't be able to login, but their data will be preserved.
                                You can reactivate them later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(user.id, false)}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReactivateUser(user.id)}
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {/* Permanent Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={deletingUserId === user.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center">
                              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                              Permanent Delete
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              <div className="space-y-2">
                                <p className="font-semibold text-red-600">
                                  ⚠️ This action cannot be undone!
                                </p>
                                <p>
                                  This will permanently delete {user.full_name} ({user.email}) 
                                  and ALL their data including:
                                </p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  <li>Session history and notes</li>
                                  <li>Payment records</li>
                                  <li>Credits and purchases</li>
                                  <li>Profile information</li>
                                </ul>
                                <p className="text-sm text-gray-600">
                                  Consider deactivating instead of permanent deletion.
                                </p>
                              </div>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} users
            </p>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev: any) => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={pagination.offset === 0}
              >
                Previous
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev: any) => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={!pagination.hasMore}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {users.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
