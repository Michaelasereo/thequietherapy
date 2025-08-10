"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { sessionUsage, partnerMembers } from "@/lib/partner-data"

export default function PartnerReportsPage() {
  const [member, setMember] = useState<string | "all">("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

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
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select value={member} onValueChange={setMember}>
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


