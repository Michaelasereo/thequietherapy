'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  Receipt, 
  CreditCard, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { createRefundRequest, getUserRefunds, formatRefundStatus, getRefundStatusColor } from '@/lib/refund-service'

interface Payment {
  id: string
  payment_reference: string
  package_type: string
  amount_kobo: number
  status: string
  payment_method: string
  created_at: string
}

interface Refund {
  id: string
  payment_reference: string
  refund_amount_kobo: number
  net_refund_kobo: number
  status: string
  reason: string
  reason_details?: string
  rejection_reason?: string
  requested_at: string
  completed_at?: string
}

export default function PaymentHistoryContent() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundDetails, setRefundDetails] = useState('')
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch payments
      const paymentsResponse = await fetch('/api/payments/history')
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        setPayments(paymentsData.data?.payments || [])
      }

      // Fetch refunds
      const refundsData = await getUserRefunds()
      setRefunds(refundsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRequestRefund = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowRefundDialog(true)
  }

  const handleSubmitRefund = async () => {
    if (!selectedPayment || !refundReason) {
      toast({
        title: 'Error',
        description: 'Please select a reason for the refund',
        variant: 'destructive'
      })
      return
    }

    setProcessing(true)
    try {
      const result = await createRefundRequest(
        selectedPayment.payment_reference,
        'full_refund',
        refundReason as any,
        refundDetails
      )

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Refund request submitted successfully. We will review it within 24-48 hours.'
        })
        setShowRefundDialog(false)
        setRefundReason('')
        setRefundDetails('')
        fetchData() // Refresh data
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit refund request',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const downloadReceipt = async (payment: Payment) => {
    try {
      const response = await fetch(`/api/payments/receipt?payment_id=${payment.id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `receipt-${payment.payment_reference}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to download receipt',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error',
        variant: 'destructive'
      })
    }
  }

  const formatPrice = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(kobo / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="payments" className="w-full">
        <TabsList>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="refunds">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refunds ({refunds.length})
          </TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                All your payment transactions and receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No payments found</AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">
                          {formatDate(payment.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {payment.payment_reference}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {payment.package_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(payment.amount_kobo)}
                        </TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            <span className="capitalize">{payment.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadReceipt(payment)}
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                          {payment.status === 'success' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestRefund(payment)}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Refund Requests</CardTitle>
              <CardDescription>
                Track the status of your refund requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {refunds.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No refund requests found</AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Requested</TableHead>
                      <TableHead>Payment Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell className="text-sm">
                          {formatDate(refund.requested_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {refund.payment_reference}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(refund.refund_amount_kobo)}
                          <div className="text-xs text-muted-foreground">
                            Net: {formatPrice(refund.net_refund_kobo)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{refund.reason}</div>
                            {refund.reason_details && (
                              <div className="text-xs text-muted-foreground">
                                {refund.reason_details}
                              </div>
                            )}
                            {refund.rejection_reason && (
                              <div className="text-xs text-red-600">
                                Rejected: {refund.rejection_reason}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRefundStatusColor(refund.status)}>
                            {formatRefundStatus(refund.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {refund.completed_at ? formatDate(refund.completed_at) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Request Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
            <DialogDescription>
              Please provide a reason for requesting a refund
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment:</span>
                      <span className="font-mono text-xs">{selectedPayment.payment_reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">{formatPrice(selectedPayment.amount_kobo)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Refund</Label>
                <Select value={refundReason} onValueChange={setRefundReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session_cancelled">Session Cancelled</SelectItem>
                    <SelectItem value="service_issue">Service Issue</SelectItem>
                    <SelectItem value="technical_problem">Technical Problem</SelectItem>
                    <SelectItem value="duplicate_payment">Duplicate Payment</SelectItem>
                    <SelectItem value="customer_request">Customer Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Additional Details (Optional)</Label>
                <Textarea
                  id="details"
                  value={refundDetails}
                  onChange={(e) => setRefundDetails(e.target.value)}
                  placeholder="Provide more information about your refund request..."
                  rows={4}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  A 2% processing fee will be deducted from your refund amount. 
                  Refunds are typically processed within 24-48 hours after approval.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRefundDialog(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitRefund}
                  disabled={processing || !refundReason}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

