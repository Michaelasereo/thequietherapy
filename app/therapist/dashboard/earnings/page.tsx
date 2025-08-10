"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { earningsTransactions, therapistSummaryCards } from "@/lib/therapist-data"

export default function TherapistEarningsPage() {
  const mtd = therapistSummaryCards.find((c) => c.title.includes("Earnings"))?.value ?? "$0"

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Earnings</h2>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Month-to-Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{mtd}</div>
          <p className="text-muted-foreground">Based on completed sessions this month.</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earningsTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell className={`text-right ${t.type === "debit" ? "text-red-600" : "text-green-600"}`}>
                    {t.type === "debit" ? "-" : "+"}${t.amount.toFixed(2)}
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


