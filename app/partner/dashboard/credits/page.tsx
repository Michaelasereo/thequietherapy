'use client';

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, DollarSign, Users, TrendingUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
}

interface CreditTransaction {
  id: string
  date: string
  type: 'purchase' | 'assignment' | 'usage'
  member?: string
  creditsIn: number
  creditsOut: number
  balanceAfter: number
}

interface PartnerMember {
  id: string
  name: string
  email: string
  creditsAssigned: number
}

export default function PartnerCreditsPage() {
  const [loading, setLoading] = useState(true)
  const [creditSummary, setCreditSummary] = useState({
    creditsRemaining: 0,
    totalCreditsPurchased: 0,
    totalCreditsUsed: 0
  })
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([])
  const [partnerMembers, setPartnerMembers] = useState<PartnerMember[]>([])
  const [creditPackages] = useState<CreditPackage[]>([
    { id: "1", name: "Starter", credits: 100, price: 500000 },
    { id: "2", name: "Professional", credits: 500, price: 2000000 },
    { id: "3", name: "Enterprise", credits: 1000, price: 4000000 }
  ])
  
  // Form states
  const [purchaseType, setPurchaseType] = useState("package")
  const [selectedPackage, setSelectedPackage] = useState("")
  const [customCredits, setCustomCredits] = useState(10)
  const [assignMember, setAssignMember] = useState("")
  const [assignAmount, setAssignAmount] = useState(10)
  const [memberCount, setMemberCount] = useState(1)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchCreditsData()
  }, [])

  const fetchCreditsData = async () => {
    try {
      setLoading(true)
      
      // Fetch credit summary
      const summaryResponse = await fetch('/api/partner/credits-summary')
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setCreditSummary(summaryData)
      }
      
      // Fetch credit history
      const historyResponse = await fetch('/api/partner/credits-history')
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setCreditHistory(historyData)
      }
      
      // Fetch partner members
      const membersResponse = await fetch('/api/partner/members')
      if (membersResponse.ok) {
        const membersData = await membersResponse.json()
        setPartnerMembers(membersData)
      }
      
    } catch (error) {
      console.error('Error fetching credits data:', error)
      toast({
        title: "Error",
        description: "Failed to load credits data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseCredits = async () => {
    try {
      const selectedPkg = creditPackages.find(p => p.id === selectedPackage)
      if (!selectedPkg) {
        toast({
          title: "Error",
          description: "Please select a package",
          variant: "destructive"
        })
        return
      }

      const totalCredits = selectedPkg.credits * memberCount
      const totalPrice = selectedPkg.price * memberCount

      const response = await fetch('/api/partner/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage,
          memberCount,
          totalCredits,
          totalPrice
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl
        } else {
          toast({
            title: "Success",
            description: "Credits purchased successfully"
          })
          fetchCreditsData()
        }
      } else {
        throw new Error('Purchase failed')
      }
    } catch (error) {
      console.error('Error purchasing credits:', error)
      toast({
        title: "Error",
        description: "Failed to purchase credits",
        variant: "destructive"
      })
    }
  }

  const handleAssignCredits = async () => {
    try {
      if (!assignMember || assignAmount <= 0) {
        toast({
          title: "Error",
          description: "Please select a member and enter amount",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/partner/assign-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: assignMember,
          credits: assignAmount
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${assignAmount} credits assigned successfully`
        })
        setAssignMember("")
        setAssignAmount(10)
        fetchCreditsData()
      } else {
        throw new Error('Assignment failed')
      }
    } catch (error) {
      console.error('Error assigning credits:', error)
      toast({
        title: "Error",
        description: "Failed to assign credits",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Credits</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading credits data...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Credits</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage credits and payments</p>
        </div>
      </div>

      {/* Credits Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditSummary.creditsRemaining}</div>
            <p className="text-xs text-muted-foreground">Available for distribution</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditSummary.totalCreditsPurchased}</div>
            <p className="text-xs text-muted-foreground">All time purchases</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditSummary.totalCreditsUsed}</div>
            <p className="text-xs text-muted-foreground">By members</p>
          </CardContent>
        </Card>
      </div>

      {/* Buy Credits */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Buy Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={purchaseType} onValueChange={setPurchaseType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="package" id="package" />
              <Label htmlFor="package">Buy Package</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom">Custom Amount</Label>
            </div>
          </RadioGroup>

          {purchaseType === "package" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="package-select">Select Package</Label>
                <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditPackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - {pkg.credits} credits (₦{pkg.price.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="member-count">Number of Members</Label>
                <Input 
                  id="member-count"
                  type="number" 
                  placeholder="Number of members" 
                  value={memberCount} 
                  onChange={(e) => setMemberCount(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
              
              {selectedPackage && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Package:</span>
                      <span>{creditPackages.find(p => p.id === selectedPackage)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits per package:</span>
                      <span>{creditPackages.find(p => p.id === selectedPackage)?.credits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Number of members:</span>
                      <span>{memberCount}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total Credits:</span>
                      <span>{(creditPackages.find(p => p.id === selectedPackage)?.credits || 0) * memberCount}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total Price:</span>
                      <span>₦{((creditPackages.find(p => p.id === selectedPackage)?.price || 0) * memberCount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={handlePurchaseCredits}
                disabled={!selectedPackage}
              >
                Pay with Paystack
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-credits">Number of Credits</Label>
                  <Input
                    id="custom-credits"
                    type="number"
                    min="1"
                    value={customCredits}
                    onChange={(e) => setCustomCredits(parseInt(e.target.value) || 0)}
                    placeholder="Enter number of credits"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Amount (₦)</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    value={customCredits * 5000}
                    readOnly
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Credits:</span>
                    <span>{customCredits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per credit:</span>
                    <span>₦5,000</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>₦{(customCredits * 5000).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={handlePurchaseCredits}
                disabled={customCredits <= 0}
              >
                Pay with Paystack
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Credits */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Assign Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="member-select">Select Member</Label>
              <Select value={assignMember} onValueChange={setAssignMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {partnerMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="credit-amount">Credits to Assign</Label>
              <Input 
                id="credit-amount"
                type="number" 
                value={assignAmount} 
                onChange={(e) => setAssignAmount(parseInt(e.target.value) || 0)}
                min="1"
                placeholder="Enter amount"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAssignCredits}
                disabled={!assignMember || assignAmount <= 0}
                className="w-full sm:w-auto"
              >
                Assign Credits
              </Button>
            </div>
          </div>
          
          {assignMember && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Member:</span>
                  <span>{partnerMembers.find(m => m.id === assignMember)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Credits:</span>
                  <span>{partnerMembers.find(m => m.id === assignMember)?.creditsAssigned || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credits to Assign:</span>
                  <span>{assignAmount}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>New Total:</span>
                  <span>{(partnerMembers.find(m => m.id === assignMember)?.creditsAssigned || 0) + assignAmount}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Credits In</TableHead>
                <TableHead>Credits Out</TableHead>
                <TableHead>Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditHistory.length > 0 ? (
                creditHistory.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <span className="capitalize">{transaction.type}</span>
                    </TableCell>
                    <TableCell>{transaction.member || "-"}</TableCell>
                    <TableCell className="text-green-600">
                      {transaction.creditsIn > 0 ? `+${transaction.creditsIn}` : "-"}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {transaction.creditsOut > 0 ? `-${transaction.creditsOut}` : "-"}
                    </TableCell>
                    <TableCell className="font-medium">{transaction.balanceAfter}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-center">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No credit history</h3>
                      <p className="text-muted-foreground">Credit transactions will appear here</p>
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


