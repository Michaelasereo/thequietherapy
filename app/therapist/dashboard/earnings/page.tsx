import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function TherapistEarningsPage() {
  // Default data in case imports are not available during build
  const therapistSummaryCards = [
    {
      title: "Total Earnings",
      value: "₦122,500"
    }
  ]

  const earningsTransactions = [
    {
      id: "t1",
      date: "2024-09-15",
      description: "CBT Session - Sarah Johnson",
      amount: 5000.00,
      type: "credit"
    },
    {
      id: "t2", 
      date: "2024-09-14",
      description: "Trauma Therapy - Michael Chen",
      amount: 5000.00,
      type: "credit"
    },
    {
      id: "t3",
      date: "2024-09-13", 
      description: "Mindfulness Session - Lisa Wang",
      amount: 5000.00,
      type: "credit"
    },
    {
      id: "t4",
      date: "2024-09-12",
      description: "Platform Fee",
      amount: 500.00,
      type: "debit"
    }
  ]

  const mtd = therapistSummaryCards.find((c) => c.title.includes("Earnings"))?.value ?? "₦0"

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
                    {t.type === "debit" ? "-" : "+"}₦{t.amount.toLocaleString()}
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


