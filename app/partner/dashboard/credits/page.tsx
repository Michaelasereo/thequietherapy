"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { creditPackages, creditHistory, partnerMembers, partnerPackages, partnerSummary } from "@/lib/partner-data"
import { CreditCard } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function PartnerCreditsPage() {
  const { toast } = useToast()
  const [pkg, setPkg] = useState<string | null>(creditPackages[0]?.id ?? null)
  const [assignMember, setAssignMember] = useState<string | null>(partnerMembers[0]?.id ?? null)
  const [assignAmount, setAssignAmount] = useState<number>(10)
  const [purchaseType, setPurchaseType] = useState<"package" | "custom">("package")
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [customCredits, setCustomCredits] = useState<number>(10)
  const [memberCount, setMemberCount] = useState<number>(1)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Credits</h2>

      {/* Credits Balance Summary Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credits Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{partnerSummary.creditsRemaining} credits</div>
              <p className="text-sm text-muted-foreground">Available for distribution</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Purchased</div>
              <div className="text-lg font-semibold">{partnerSummary.totalCreditsPurchased} credits</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buy Credits */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Buy Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={purchaseType} onValueChange={(value: "package" | "custom") => setPurchaseType(value)}>
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
              <Select value={selectedPackage ?? ""} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {partnerPackages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} - {pkg.credits === -1 ? "Unlimited" : `${pkg.credits} credits`} (₦{pkg.price.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input 
                type="number" 
                placeholder="Number of members" 
                value={memberCount} 
                onChange={(e) => setMemberCount(Number(e.target.value))}
                min="1"
              />
              
              <Button className="w-full">Pay with Paystack</Button>
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
                    onChange={(e) => setCustomCredits(Number(e.target.value))}
                    placeholder="Enter number of credits"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Amount (₦)</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    value={customCredits * 5000}
                    onChange={(e) => {
                      const amount = Number(e.target.value)
                      setCustomCredits(Math.round(amount / 5000))
                    }}
                    placeholder="Enter amount"
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
              
              <Button className="w-full">Pay with Paystack</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Assign Credits</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Select value={assignMember ?? undefined} onValueChange={setAssignMember}>
            <SelectTrigger className="w-full sm:w-[260px]"><SelectValue placeholder="Select member" /></SelectTrigger>
            <SelectContent>
              {partnerMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" value={assignAmount} onChange={(e) => setAssignAmount(Number(e.target.value))} className="w-full sm:w-[160px]" />
          <Button>Assign</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Credit History</CardTitle></CardHeader>
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
              {creditHistory.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>{t.member ?? "-"}</TableCell>
                  <TableCell>{t.creditsIn}</TableCell>
                  <TableCell>{t.creditsOut}</TableCell>
                  <TableCell>{t.balanceAfter}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


