import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Upload, Download, Users, Calendar, Clock, CreditCard } from "lucide-react"

export default function PartnerMembersPage() {
  // Default data in case imports are not available during build
  const partnerMembers = [
    {
      id: "1",
      name: "John Smith",
      email: "john@company.com",
      creditsAssigned: 50,
      sessionsUsed: 5,
      status: "Active"
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah@company.com",
      creditsAssigned: 30,
      sessionsUsed: 3,
      status: "Active"
    },
    {
      id: "3",
      name: "Mike Chen",
      email: "mike@company.com",
      creditsAssigned: 20,
      sessionsUsed: 2,
      status: "Active"
    }
  ]

  const partnerPackages = [
    { id: "1", name: "Starter", credits: 100, price: 500000 },
    { id: "2", name: "Professional", credits: 500, price: 2000000 },
    { id: "3", name: "Enterprise", credits: -1, price: 10000000 }
  ]

  const members = partnerMembers
  const name = ""
  const email = ""
  const selected: Record<string, boolean> = {}
  const selectedPackage = ""
  const csvData = ""

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
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">All registered members</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">Members with active status</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">Sessions completed by members</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions}</div>
            <p className="text-xs text-muted-foreground">Scheduled sessions this week</p>
          </CardContent>
        </Card>
      </div>

      {/* CSV Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Add Members via CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
          
          <div className="space-y-2">
            <Select value={selectedPackage ?? ""}>
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
                defaultValue={csvData}
                placeholder="John Doe,john@example.com&#10;Jane Smith,jane@example.com"
                className="w-full h-32 p-2 border rounded-md"
              />
            </div>
            
            <Button className="w-full">
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
            <Input placeholder="Name" defaultValue={name} />
            <Input placeholder="Email" defaultValue={email} />
            <Button>Add</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline">Bulk Remove</Button>
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
                    <input type="checkbox" defaultChecked={!!selected[m.id]} />
                  </TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.creditsAssigned}</TableCell>
                  <TableCell>{m.sessionsUsed}</TableCell>
                  <TableCell>{m.status}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm">Assign 10</Button>
                    <Button variant="destructive" size="sm">Remove</Button>
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


