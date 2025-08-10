"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, Lock, Activity, AlertTriangle, Key, Eye, Edit, Trash2, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock admin users data
const mockAdminUsers = [
  {
    id: "a1",
    name: "Super Admin",
    email: "admin@trpi.com",
    role: "Super Admin",
    status: "Active",
    lastLogin: "2024-01-20 10:30 AM",
    permissions: ["all"],
    twoFactorEnabled: true
  },
  {
    id: "a2",
    name: "Content Manager",
    email: "content@trpi.com",
    role: "Content Manager",
    status: "Active",
    lastLogin: "2024-01-19 2:15 PM",
    permissions: ["content", "users", "analytics"],
    twoFactorEnabled: false
  },
  {
    id: "a3",
    name: "Support Admin",
    email: "support@trpi.com",
    role: "Support Admin",
    status: "Active",
    lastLogin: "2024-01-20 9:45 AM",
    permissions: ["users", "sessions", "verifications"],
    twoFactorEnabled: true
  },
  {
    id: "a4",
    name: "Finance Admin",
    email: "finance@trpi.com",
    role: "Finance Admin",
    status: "Inactive",
    lastLogin: "2024-01-15 11:20 AM",
    permissions: ["payments", "analytics"],
    twoFactorEnabled: false
  }
]

// Mock security logs
const mockSecurityLogs = [
  {
    id: "l1",
    user: "Super Admin",
    action: "Login",
    ip: "192.168.1.100",
    timestamp: "2024-01-20 10:30 AM",
    status: "Success",
    location: "Lagos, Nigeria"
  },
  {
    id: "l2",
    user: "Content Manager",
    action: "Content Published",
    ip: "192.168.1.101",
    timestamp: "2024-01-20 09:15 AM",
    status: "Success",
    location: "Abuja, Nigeria"
  },
  {
    id: "l3",
    user: "Unknown",
    action: "Failed Login",
    ip: "203.0.113.45",
    timestamp: "2024-01-20 08:45 AM",
    status: "Failed",
    location: "Unknown"
  },
  {
    id: "l4",
    user: "Support Admin",
    action: "User Verification Approved",
    ip: "192.168.1.102",
    timestamp: "2024-01-20 08:30 AM",
    status: "Success",
    location: "Port Harcourt, Nigeria"
  }
]

export default function AdminSecurityPage() {
  const activeAdmins = mockAdminUsers.filter(a => a.status === "Active")
  const failedLogins = mockSecurityLogs.filter(l => l.status === "Failed")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case "Inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "Suspended":
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLogStatusBadge = (status: string) => {
    switch (status) {
      case "Success":
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>
      case "Warning":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Warning</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Security & Access Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage admin access and security settings</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin User
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{mockAdminUsers.length}</div>
                <div className="text-sm text-muted-foreground">Admin Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{activeAdmins.length}</div>
                <div className="text-sm text-muted-foreground">Active Admins</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{mockAdminUsers.filter(a => a.twoFactorEnabled).length}</div>
                <div className="text-sm text-muted-foreground">2FA Enabled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{failedLogins.length}</div>
                <div className="text-sm text-muted-foreground">Failed Logins</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="admins" className="space-y-4">
        <TabsList>
          <TabsTrigger value="admins">Admin Users</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="security">Security Logs</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>2FA</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAdminUsers.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{admin.name}</div>
                          <div className="text-sm text-muted-foreground">{admin.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{admin.role}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(admin.status)}
                      </TableCell>
                      <TableCell>
                        {admin.twoFactorEnabled ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{admin.lastLogin}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {admin.permissions.slice(0, 2).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                          {admin.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{admin.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Suspend User
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
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Super Admin</h3>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">All Permissions</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Content Manager</h3>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">Content Management</Badge>
                      <Badge variant="outline" className="text-xs">User Management</Badge>
                      <Badge variant="outline" className="text-xs">Analytics</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Support Admin</h3>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">User Management</Badge>
                      <Badge variant="outline" className="text-xs">Session Management</Badge>
                      <Badge variant="outline" className="text-xs">Verifications</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Finance Admin</h3>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">Payment Management</Badge>
                      <Badge variant="outline" className="text-xs">Analytics</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permission Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Management</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Content Management</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Management</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Session Management</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Verification Management</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analytics & Reports</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Settings</span>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Settings</span>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSecurityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-medium">{log.user}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.action}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">{log.ip}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.location}</span>
                      </TableCell>
                      <TableCell>
                        {getLogStatusBadge(log.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{log.timestamp}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input id="sessionTimeout" type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input id="maxLoginAttempts" type="number" defaultValue="5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                  <Input id="lockoutDuration" type="number" defaultValue="15" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="require2FA">Require Two-Factor Authentication</Label>
                  <Switch id="require2FA" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="passwordComplexity">Enforce Password Complexity</Label>
                  <Switch id="passwordComplexity" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ipWhitelist">Enable IP Whitelist</Label>
                  <Switch id="ipWhitelist" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Monitoring & Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="failedLoginAlerts">Failed Login Alerts</Label>
                  <Switch id="failedLoginAlerts" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="suspiciousActivity">Suspicious Activity Detection</Label>
                  <Switch id="suspiciousActivity" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="adminActionLogs">Log All Admin Actions</Label>
                  <Switch id="adminActionLogs" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailAlerts">Email Security Alerts</Label>
                  <Switch id="emailAlerts" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alertEmail">Alert Email Address</Label>
                  <Input id="alertEmail" defaultValue="security@trpi.com" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
