'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { RefreshCw, Users, CheckCircle, XCircle, AlertCircle, Database, Eye } from 'lucide-react'

interface SyncResult {
  total: number
  successful: number
  failed: number
  results: Array<{
    user_id: string
    email: string
    result: {
      success: boolean
      auth_user_id?: string
      message?: string
      error?: string
    }
  }>
}

interface SupabaseAuthUser {
  id: string
  email: string
  user_type?: string
  full_name?: string
  phone?: string
  created_at: string
  last_sign_in?: string
  email_confirmed?: string
  provider?: string
}

interface SupabaseAuthData {
  total_users: number
  users: SupabaseAuthUser[]
}

export default function SyncUsersPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isViewingUsers, setIsViewingUsers] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [supabaseAuthData, setSupabaseAuthData] = useState<SupabaseAuthData | null>(null)

  const handleSyncUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/sync-users-to-supabase-auth', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSyncResult(data.sync)
        setSupabaseAuthData(data.supabase_auth)
        toast({
          title: 'Sync Completed',
          description: `Successfully synced ${data.sync.successful} users to Supabase auth`,
        })
      } else {
        toast({
          title: 'Sync Failed',
          description: data.error || 'Failed to sync users',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: 'Sync Error',
        description: 'Network error occurred during sync',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewUsers = async () => {
    setIsViewingUsers(true)
    try {
      const response = await fetch('/api/sync-users-to-supabase-auth')
      const data = await response.json()
      
      if (data.success) {
        setSupabaseAuthData(data.data)
        toast({
          title: 'Users Retrieved',
          description: `Found ${data.data.total_users} users in Supabase auth`,
        })
      } else {
        toast({
          title: 'Failed to Get Users',
          description: data.error || 'Failed to retrieve users',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Get users error:', error)
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsViewingUsers(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Sync Management</h1>
          <p className="text-muted-foreground">
            Sync your custom users to Supabase auth for dashboard visibility
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sync Action Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sync Users to Supabase Auth
            </CardTitle>
            <CardDescription>
              Sync all custom users to Supabase's auth.users table so you can see them in the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSyncUsers} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync All Users
                </>
              )}
            </Button>

            {syncResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Users:</span>
                  <Badge variant="outline">{syncResult.total}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Successful:</span>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {syncResult.successful}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Failed:</span>
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    {syncResult.failed}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Users Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Supabase Auth Users
            </CardTitle>
            <CardDescription>
              View all users currently in Supabase's auth.users table
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleViewUsers} 
              disabled={isViewingUsers}
              variant="outline"
              className="w-full"
            >
              {isViewingUsers ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  View Users
                </>
              )}
            </Button>

            {supabaseAuthData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Users:</span>
                  <Badge variant="outline">{supabaseAuthData.total_users}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Results */}
      {syncResult && syncResult.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Results</CardTitle>
            <CardDescription>
              Detailed results of the user synchronization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {syncResult.results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    result.result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{result.email}</p>
                      <p className="text-sm text-muted-foreground">ID: {result.user_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.result.success ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">
                            {result.result.message}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">
                            {result.result.error}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supabase Auth Users List */}
      {supabaseAuthData && supabaseAuthData.users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Supabase Auth Users</CardTitle>
            <CardDescription>
              All users currently in Supabase's auth.users table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {supabaseAuthData.users.map((user) => (
                <div key={user.id} className="p-3 rounded-lg border bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>ID: {user.id}</span>
                        {user.user_type && (
                          <Badge variant="secondary">{user.user_type}</Badge>
                        )}
                        {user.provider && (
                          <Badge variant="outline">{user.provider}</Badge>
                        )}
                      </div>
                      {user.full_name && (
                        <p className="text-sm text-muted-foreground">
                          Name: {user.full_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
                      {user.last_sign_in && (
                        <p>Last Sign In: {new Date(user.last_sign_in).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
