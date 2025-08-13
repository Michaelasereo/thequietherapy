"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Search, MoreHorizontal, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, DollarSign, Users, CreditCard, TrendingUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Partner data - will be populated with real data
const mockPartners: any[] = []

export default function AdminPartnersPage() {
  const activePartners = mockPartners.filter(p => p.status === "Active")
  const verifiedPartners = mockPartners.filter(p => p.verificationStatus === "Verified")
  const pendingVerifications = mockPartners.filter(p => p.verificationStatus === "Pending")

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

  const getTypeBadge = (type: string) => {
    const colors = {
      "Hospital": "bg-red-100 text-red-800",
      "Clinic": "bg-blue-100 text-blue-800",
      "NGO": "bg-green-100 text-green-800",
      "School": "bg-purple-100 text-purple-800",
      "Corporate HR": "bg-orange-100 text-orange-800",
      "Government Agency": "bg-gray-100 text-gray-800"
    }
    return <Badge variant="outline" className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{type}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Partner Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all partner institutions</p>
        </div>
        <Button>
          <Building2 className="mr-2 h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{mockPartners.length}</div>
                <div className="text-sm text-muted-foreground">Total Partners</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{mockPartners.reduce((sum, p) => sum + p.totalMembers, 0)}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{mockPartners.reduce((sum, p) => sum + p.totalCredits, 0)}</div>
                <div className="text-sm text-muted-foreground">Total Credits</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">₦{mockPartners.reduce((sum, p) => sum + p.totalSpent, 0).toLocaleString()}</div>
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
                  placeholder="Search partners by name or email..."
                  className="pl-9"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="clinic">Clinic</SelectItem>
                <SelectItem value="ngo">NGO</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="corporate">Corporate HR</SelectItem>
              </SelectContent>
            </Select>
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
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Partners ({mockPartners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{partner.name}</div>
                      <div className="text-sm text-muted-foreground">{partner.email}</div>
                      <div className="text-xs text-muted-foreground">Joined: {partner.joinDate}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(partner.type)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(partner.status)}
                  </TableCell>
                  <TableCell>
                    {getVerificationBadge(partner.verificationStatus)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{partner.totalMembers}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{partner.totalCredits}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{partner.totalSessions}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">₦{partner.totalSpent.toLocaleString()}</div>
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
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Partner
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          View Members
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CreditCard className="mr-2 h-4 w-4" />
                          View Credits
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          View Reports
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

      {/* Partner Details and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Revenue Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPartners
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 5)
                .map((partner, index) => (
                  <div key={partner.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{partner.name}</div>
                        <div className="text-sm text-muted-foreground">{partner.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₦{partner.totalSpent.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{partner.totalMembers} members</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partner Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(
                mockPartners.reduce((acc, partner) => {
                  acc[partner.type] = (acc[partner.type] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(count / mockPartners.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockPartners.map((partner) => (
              <div key={partner.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">{partner.name}</h3>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>{partner.email}</div>
                  <div>{partner.phone}</div>
                  <div>{partner.address}</div>
                  <div className="text-primary">{partner.website}</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {getTypeBadge(partner.type)}
                  {getStatusBadge(partner.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
