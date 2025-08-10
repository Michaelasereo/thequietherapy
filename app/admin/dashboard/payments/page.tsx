"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Search, MoreHorizontal, Eye, Download, DollarSign, TrendingUp, Users, Clock, CheckCircle, XCircle, Receipt } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock payment data
const mockPayments = [
  {
    id: "p1",
    user: "John Doe",
    type: "Individual",
    paymentMethod: "Paystack",
    amount: 5000,
    credits: 1,
    status: "Completed",
    date: "2024-01-20",
    time: "10:30 AM",
    reference: "PS-123456789",
    partner: null
  },
  {
    id: "p2",
    user: "TechCorp Solutions",
    type: "Partner",
    paymentMethod: "Paystack",
    amount: 250000,
    credits: 50,
    status: "Completed",
    date: "2024-01-19",
    time: "2:15 PM",
    reference: "PS-987654321",
    partner: "TechCorp Solutions"
  },
  {
    id: "p3",
    user: "Jane Smith",
    type: "Individual",
    paymentMethod: "Credits",
    amount: 0,
    credits: 2,
    status: "Completed",
    date: "2024-01-19",
    time: "11:45 AM",
    reference: "CREDIT-001",
    partner: "TechCorp Solutions"
  },
  {
    id: "p4",
    user: "HealthCorp Ltd",
    type: "Partner",
    paymentMethod: "Paystack",
    amount: 180000,
    credits: 36,
    status: "Pending",
    date: "2024-01-18",
    time: "4:20 PM",
    reference: "PS-456789123",
    partner: "HealthCorp Ltd"
  },
  {
    id: "p5",
    user: "Mike Johnson",
    type: "Individual",
    paymentMethod: "Paystack",
    amount: 15000,
    credits: 3,
    status: "Failed",
    date: "2024-01-18",
    time: "9:10 AM",
    reference: "PS-789123456",
    partner: null
  },
  {
    id: "p6",
    user: "EduCare Foundation",
    type: "Partner",
    paymentMethod: "Paystack",
    amount: 450000,
    credits: 90,
    status: "Completed",
    date: "2024-01-17",
    time: "3:30 PM",
    reference: "PS-321654987",
    partner: "EduCare Foundation"
  }
]

export default function AdminPaymentsPage() {
  const completedPayments = mockPayments.filter(p => p.status === "Completed")
  const pendingPayments = mockPayments.filter(p => p.status === "Pending")
  const failedPayments = mockPayments.filter(p => p.status === "Failed")
  const individualPayments = mockPayments.filter(p => p.type === "Individual")
  const partnerPayments = mockPayments.filter(p => p.type === "Partner")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>
      case "Refunded":
        return <Badge variant="outline">Refunded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    return type === "Individual" ? 
      <Badge variant="secondary">Individual</Badge> : 
      <Badge variant="default">Partner</Badge>
  }

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      "Paystack": "bg-purple-100 text-purple-800",
      "Credits": "bg-blue-100 text-blue-800",
      "Bank Transfer": "bg-green-100 text-green-800"
    }
    return <Badge variant="outline" className={colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{method}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payments & Credits Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor all payments and credit transactions</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">₦{mockPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{mockPayments.reduce((sum, p) => sum + p.credits, 0)}</div>
                <div className="text-sm text-muted-foreground">Total Credits Sold</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{completedPayments.length}</div>
                <div className="text-sm text-muted-foreground">Successful Payments</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{pendingPayments.length}</div>
                <div className="text-sm text-muted-foreground">Pending Payments</div>
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
                  placeholder="Search payments by user or reference..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments ({mockPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">Payment #{payment.id}</div>
                      <div className="text-sm text-muted-foreground">{payment.reference}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.user}</div>
                      {payment.partner && (
                        <div className="text-xs text-muted-foreground">{payment.partner}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(payment.type)}
                  </TableCell>
                  <TableCell>
                    {getPaymentMethodBadge(payment.paymentMethod)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">₦{payment.amount.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{payment.credits} credits</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{payment.date}</div>
                      <div className="text-xs text-muted-foreground">{payment.time}</div>
                    </div>
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
                          <Receipt className="mr-2 h-4 w-4" />
                          Download Receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Export Data
                        </DropdownMenuItem>
                        {payment.status === "Failed" && (
                          <DropdownMenuItem className="text-red-600">
                            <XCircle className="mr-2 h-4 w-4" />
                            Mark as Failed
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(completedPayments.length / mockPayments.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{completedPayments.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(pendingPayments.length / mockPayments.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{pendingPayments.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Failed</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(failedPayments.length / mockPayments.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{failedPayments.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by User Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Individual Users</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(individualPayments.reduce((sum, p) => sum + p.amount, 0) / mockPayments.reduce((sum, p) => sum + p.amount, 0)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">₦{individualPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Partner Institutions</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${(partnerPayments.reduce((sum, p) => sum + p.amount, 0) / mockPayments.reduce((sum, p) => sum + p.amount, 0)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">₦{partnerPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Management */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium">Credit Packages</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Basic (10 credits)</span>
                  <span className="text-sm font-medium">₦50,000</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Standard (20 credits)</span>
                  <span className="text-sm font-medium">₦100,000</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Pro (Unlimited)</span>
                  <span className="text-sm font-medium">₦500,000</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Credit Statistics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Credits Sold</span>
                  <span className="text-sm font-medium">{mockPayments.reduce((sum, p) => sum + p.credits, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average Credits per Payment</span>
                  <span className="text-sm font-medium">{(mockPayments.reduce((sum, p) => sum + p.credits, 0) / mockPayments.length).toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Credits Used</span>
                  <span className="text-sm font-medium">1,245</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Quick Actions</h3>
              <div className="space-y-2">
                <Button size="sm" className="w-full">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Credit Usage
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Credit Report
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Credit Allocations
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
