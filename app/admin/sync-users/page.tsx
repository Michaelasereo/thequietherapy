'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Users, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SyncResult {
  success: boolean;
  totalUsers?: number;
  successCount?: number;
  errorCount?: number;
  results?: Array<{
    userId: string;
    email: string;
    success: boolean;
    action?: string;
    error?: string;
  }>;
  error?: string;
}

interface SyncStatus {
  success: boolean;
  total_users: number;
  checked_users: number;
  users: Array<{
    id: string;
    email: string;
    user_type: string;
    created_at: string;
    synced_with_auth: boolean;
    sync_error?: string;
  }>;
}

export default function SyncUsersPage() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  // Load sync status on component mount
  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const response = await fetch('/api/admin/sync-users', {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSyncStatus(data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load sync status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sync status",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const syncAllUsers = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/admin/sync-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'sync-all' }),
      });
      
      const data = await response.json();
      setSyncResult(data);
      
      if (data.success) {
        toast({
          title: "Sync Completed",
          description: `Successfully synced ${data.successCount || 0} users with ${data.errorCount || 0} errors`,
        });
        
        // Reload sync status
        await loadSyncStatus();
      } else {
        toast({
          title: "Sync Failed",
          description: data.error || "Failed to sync users",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSyncResult({ success: false, error: errorMessage });
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const syncSingleUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/sync-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'sync-single', userId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "User Synced",
          description: `Successfully synced user ${data.user?.email}`,
        });
        
        // Reload sync status
        await loadSyncStatus();
      } else {
        toast({
          title: "Sync Failed",
          description: data.error || "Failed to sync user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sync Users with Supabase Auth</h1>
        <p className="text-muted-foreground">
          Synchronize your custom user database with Supabase Auth to resolve authentication conflicts.
        </p>
      </div>

      {/* Sync Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStatus ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                syncStatus?.total_users || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synced Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingStatus ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                syncStatus?.users.filter(u => u.synced_with_auth).length || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Sync</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {isLoadingStatus ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                syncStatus?.users.filter(u => !u.synced_with_auth).length || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Sync Actions</CardTitle>
          <CardDescription>
            Synchronize users between your database and Supabase Auth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={syncAllUsers}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isSyncing ? 'Syncing All Users...' : 'Sync All Users'}
            </Button>
            
            <Button
              onClick={loadSyncStatus}
              disabled={isLoadingStatus}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoadingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Status List */}
      {syncStatus && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Sync Status</CardTitle>
            <CardDescription>
              Showing first {syncStatus.checked_users} of {syncStatus.total_users} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncStatus.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {user.synced_with_auth ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.user_type} • Created {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      {user.sync_error && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {user.sync_error}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.synced_with_auth ? "default" : "destructive"}>
                      {user.synced_with_auth ? "Synced" : "Not Synced"}
                    </Badge>
                    {!user.synced_with_auth && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncSingleUser(user.id)}
                      >
                        Sync
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Results */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Sync Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {syncResult.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{syncResult.totalUsers || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{syncResult.successCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{syncResult.errorCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                </div>
                
                {syncResult.results && syncResult.results.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Detailed Results:</h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {syncResult.results.map((result, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded text-sm ${
                            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                          }`}
                        >
                          <div className="font-medium">{result.email}</div>
                          <div>
                            {result.success 
                              ? `${result.action || 'synced'} successfully`
                              : `Error: ${result.error}`
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                <div className="font-medium">Sync Failed</div>
                <div className="text-sm mt-1">{syncResult.error}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}