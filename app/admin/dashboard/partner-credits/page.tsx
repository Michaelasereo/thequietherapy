"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreditCard, Search, Plus, Minus, Calendar, DollarSign, TrendingUp } from "lucide-react"
import { toast } from "sonner"

interface CreditTransaction {
  id: string
  date: string
  type: "purchase" | "assignment" | "deduction" | "refund"
  member?: string
  creditsIn: number
  creditsOut: number
  balanceAfter: number
  description: string
  amount?: number
}

export default function PartnerCreditsPage() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      // This would be replaced with actual API call
      const mockTransactions: CreditTransaction[] = [
        {
          id: "1",
          date: "2024-01-20T14:30:00Z",
          type: "purchase",
          creditsIn: 200,
          creditsOut: 0,
          balanceAfter: 800,
          description: "Credit package purchase",
          amount: 1000000
        },
        {
          id: "2",
          date: "2024-01-19T10:15:00Z",
          type: "assignment",
          member: "John Doe",
          creditsIn: 0,
          creditsOut: 20,
          balanceAfter: 780,
          description: "Credits assigned to John Doe"
        },
        {
          id: "3",
          date: "2024-01-18T16:45:00Z",
          type: "deduction",
          member: "John Doe",
          creditsIn: 0,
          creditsOut: 5,
          balanceAfter: 775,
          description: "Session booking - John Doe"
        },
        {
          id: "4",
          date: "2024-01-17T09:20:00Z",
          type: "assignment",
          member: "Jane Smith",
          creditsIn: 0,
          creditsOut: 15,
          balanceAfter: 760,
          description: "Credits assigned to Jane Smith"
        },
        {
          id: "5",
          date: "2024-01-16T11:30:00Z",
          type: "purchase",
          creditsIn: 100,
          creditsOut: 0,
          balanceAfter: 860,
          description: "Credit package purchase",
          amount: 500000
        }
      ]
      
      setTransactions(mockTransactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="default" className="bg-green-600">Purchase</Badge>
      case 'assignment':
        return <Badge variant="default" className="bg-blue-600">Assignment</Badge>
      case 'deduction':
        return <Badge variant="default" className="bg-red-600">Deduction</Badge>
      case 'refund':
        return <Badge variant="default" className="bg-yellow-600">Refund</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  // Filter transactions based on search
  const filteredTransactions = transactions.filter(transaction => 
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.member && transaction.member.toLowerCase().includes(searchTerm.toLowerCase())) ||
    transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const creditStats = {
    totalPurchased: transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.creditsIn, 0),
    totalAssigned: transactions.filter(t => t.type === 'assignment').reduce((sum, t) => sum + t.creditsOut, 0),
    totalDeducted: transactions.filter(t => t.type === 'deduction').reduce((sum, t) => sum + t.creditsOut, 0),
    currentBalance: transactions.length > 0 ? transactions[transactions.length - 1].balanceAfter : 0,
    totalSpent: transactions.filter(t => t.type === 'purchase' && t.amount).reduce((sum, t) => sum + (t.amount || 0), 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Partner Credits</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading credit data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div>
        <h1 className="text-2xl font-semibold">Partner Credits</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage credit transactions and balances</p>
      </div>

      {/* Credit Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditStats.currentBalance}</div>
            <p className="text-xs text-muted-foreground">Available credits</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditStats.totalPurchased}</div>
            <p className="text-xs text-muted-foreground">Credits bought</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditStats.totalAssigned}</div>
            <p className="text-xs text-muted-foreground">To members</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(creditStats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">On credits</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Purchase Credits
            </Button>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Assign Credits
            </Button>
            <Button variant="outline">
              <Minus className="h-4 w-4 mr-2" />
              Request Refund
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Search by description, member, or type</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Credit Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Credits In</TableHead>
                <TableHead>Credits Out</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(transaction.date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(transaction.type)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{transaction.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {transaction.member || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-green-600">
                      {transaction.creditsIn > 0 ? `+${transaction.creditsIn}` : "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-red-600">
                      {transaction.creditsOut > 0 ? `-${transaction.creditsOut}` : "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {transaction.balanceAfter}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {transaction.amount ? formatCurrency(transaction.amount) : "—"}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
