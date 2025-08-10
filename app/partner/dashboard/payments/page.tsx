import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default function PartnerPaymentsPage() {
  // Default data in case imports are not available during build
  const payments = [
    {
      id: "1",
      date: "2024-09-15",
      method: "Paystack",
      creditsBought: 1000,
      amountPaid: 5000000,
      status: "Completed"
    },
    {
      id: "2",
      date: "2024-09-10",
      method: "Paystack",
      creditsBought: 500,
      amountPaid: 2500000,
      status: "Completed"
    },
    {
      id: "3",
      date: "2024-09-05",
      method: "Paystack",
      creditsBought: 200,
      amountPaid: 1000000,
      status: "Pending"
    }
  ]
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payment History</h2>
      <Card>
        <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Credits Bought</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.date}</TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell>{p.creditsBought}</TableCell>
                  <TableCell>₦{p.amountPaid.toLocaleString()}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm">Download</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


