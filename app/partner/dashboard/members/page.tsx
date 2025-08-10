"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { partnerMembers, type PartnerMember, partnerPackages } from "@/lib/partner-data"
import { Upload, Download, Users, Calendar, Clock, CreditCard } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import SummaryCard from "@/components/summary-card"

export default function PartnerMembersPage() {
  const { toast } = useToast()
  const [members, setMembers] = useState<PartnerMember[]>(partnerMembers)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [csvData, setCsvData] = useState<string>("")

  function addMember() {
    if (!name.trim() || !email.trim()) return
    setMembers((prev) => [{ id: `m-${Date.now()}`, name, email, creditsAssigned: 0, sessionsUsed: 0, status: "Active" }, ...prev])
    setName("")
    setEmail("")
  }

  function removeSelected() {
    setMembers((prev) => prev.filter((m) => !selected[m.id]))
    setSelected({})
  }

  function assignCredits(id: string, amount: number) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, creditsAssigned: m.creditsAssigned + amount } : m)))
  }

  function processCSV() {
    if (!selectedPackage || !csvData.trim()) {
      toast({
        title: "Missing data",
        description: "Please select a package and paste CSV data.",
        variant: "destructive",
      })
      return
    }

    const pkg = partnerPackages.find(p => p.id === selectedPackage)
    if (!pkg) return

    const lines = csvData.trim().split('\n')
    const newMembers: PartnerMember[] = []

    lines.forEach((line, index) => {
      const [name, email] = line.split(',').map(s => s.trim())
      if (name && email) {
        newMembers.push({
          id: `csv-${Date.now()}-${index}`,
          name,
          email,
          creditsAssigned: pkg.credits === -1 ? 999 : pkg.credits,
          sessionsUsed: 0,
          status: "Active"
        })
      }
    })

    if (newMembers.length > 0) {
      setMembers(prev => [...newMembers, ...prev])
      setCsvData("")
      setSelectedPackage(null)
      
      toast({
        title: "Members Added",
        description: `${newMembers.length} members added with ${pkg.name} package. Verification emails will be sent.`,
      })
    }
  }

  function downloadCSVTemplate() {
    const template = "Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com"
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'member_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Calculate summary data
  const totalMembers = members.length
  const activeMembers = members.filter(m => m.status === "Active").length
  const totalSessions = members.reduce((sum, m) => sum + m.sessionsUsed, 0)
  const totalCreditsAssigned = members.reduce((sum, m) => sum + m.creditsAssigned, 0)
  const upcomingSessions = 3 // Mock data - in real app this would come from API

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Members</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Members"
          value={totalMembers.toString()}
          description="All registered members"
          icon={Users}
        />
        <SummaryCard
          title="Active Members"
          value={activeMembers.toString()}
          description="Members with active status"
          icon={Users}
        />
        <SummaryCard
          title="Total Sessions"
          value={totalSessions.toString()}
          description="Sessions completed by members"
          icon={Calendar}
        />
        <SummaryCard
          title="Upcoming Sessions"
          value={upcomingSessions.toString()}
          description="Scheduled sessions this week"
          icon={Clock}
        />
      </div>

      {/* CSV Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Add Members via CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSVTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
          
          <div className="space-y-2">
            <Select value={selectedPackage ?? ""} onValueChange={setSelectedPackage}>
              <SelectTrigger>
                <SelectValue placeholder="Select package for all members" />
              </SelectTrigger>
              <SelectContent>
                {partnerPackages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name} - {pkg.credits === -1 ? "Unlimited" : `${pkg.credits} credits`} (₦{pkg.price.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">CSV Data (Name, Email format)</Label>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="John Doe,john@example.com&#10;Jane Smith,jane@example.com"
                className="w-full h-32 p-2 border rounded-md"
              />
            </div>
            
            <Button onClick={processCSV} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Process CSV & Send Verification Emails
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Add */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Add Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={addMember}>Add</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={removeSelected}>Bulk Remove</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Member List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Credits Assigned</TableHead>
                <TableHead>Sessions Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <input type="checkbox" checked={!!selected[m.id]} onChange={(e) => setSelected((s) => ({ ...s, [m.id]: e.target.checked }))} />
                  </TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.creditsAssigned}</TableCell>
                  <TableCell>{m.sessionsUsed}</TableCell>
                  <TableCell>{m.status}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => assignCredits(m.id, 10)}>Assign 10</Button>
                    <Button variant="destructive" size="sm" onClick={() => setMembers((prev) => prev.filter((x) => x.id !== m.id))}>Remove</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


