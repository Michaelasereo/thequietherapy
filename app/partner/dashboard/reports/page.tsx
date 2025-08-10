import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export default function PartnerReportsPage() {
  // Default data in case imports are not available during build
  const sessionUsage = [
    {
      id: "1",
      memberName: "John Smith",
      sessionDate: "2024-09-15",
      therapist: "Dr. Emily White",
      creditsUsed: 5,
      status: "Completed"
    },
    {
      id: "2",
      memberName: "Sarah Johnson", 
      sessionDate: "2024-09-14",
      therapist: "Dr. Sarah Johnson",
      creditsUsed: 5,
      status: "Completed"
    },
    {
      id: "3",
      memberName: "Mike Chen",
      sessionDate: "2024-09-13",
      therapist: "Dr. Emily White",
      creditsUsed: 5,
      status: "Scheduled"
    }
  ]

  const partnerMembers = [
    { id: "1", name: "John Smith" },
    { id: "2", name: "Sarah Johnson" },
    { id: "3", name: "Mike Chen" }
  ]

  const member = "all"
  const from = ""
  const to = ""

  const filtered = sessionUsage.filter((s) => {
    if (member !== "all" && s.memberName !== partnerMembers.find((m) => m.id === member)?.name) return false
    if (from && new Date(s.sessionDate) < new Date(from)) return false
    if (to && new Date(s.sessionDate) > new Date(to)) return false
    return true
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Session Usage Reports</h2>
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <Input type="date" defaultValue={from} />
          <Input type="date" defaultValue={to} />
          <Select defaultValue={member}>
            <SelectTrigger><SelectValue placeholder="Member" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {partnerMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">Export CSV</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Report</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member Name</TableHead>
                <TableHead>Session Date</TableHead>
                <TableHead>Therapist</TableHead>
                <TableHead>Credits Used</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.memberName}</TableCell>
                  <TableCell>{r.sessionDate}</TableCell>
                  <TableCell>{r.therapist}</TableCell>
                  <TableCell>{r.creditsUsed}</TableCell>
                  <TableCell>{r.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


