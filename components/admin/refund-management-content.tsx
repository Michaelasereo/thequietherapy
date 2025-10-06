'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  AlertCircle, 
  Eye,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { getAllRefunds, approveRefund, rejectRefund, formatRefundStatus, getRefundStatusColor, formatRefundReason } from '@/lib/refund-service'

interface Refund {
  id: string
  user_id: string
  payment_reference: string
  refund_type: string
  refund_amount_kobo: number
  net_refund_kobo: number
  status: string
  reason: string
  reason_details?: string
  rejection_reason?: string
  requested_at: string
  completed_at?: string
  user?: {
    full_name: string
    email: string
  }
  payment?: {
    package_type: string
    payment_method: string
  }
}

export default function RefundManagementContent() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [filteredRefunds, setFilteredRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const { toast } = useToast()

  useEffect(() => {
    fetchRefunds()
  }, [])

  useEffect(() => {
    filterRefunds()
  }, [refunds, activeTab])

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      const data = await getAllRefunds('all')
      setRefunds(data)
    } catch (error) {
      console.error('Error fetching refunds:', error)
      toast({
        title: 'Error',
        description: 'Failed to load refunds',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterRefunds = () => {
    let filtered = refunds
    if (activeTab !== 'all') {
      filtered = refunds.filter(r => r.status === activeTab)
    }
    setFilteredRefunds(filtered)
  }

  const handleViewDetails = (refund: Refund) => {
    setSelectedRefund(refund)
    setShowDetailsDialog(true)
  }

  const handleApprove = async (refund: Refund) => {
    setProcessing(true)
    try {
      const result = await approveRefund(refund.id)
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Refund approved and processing initiated'
        })
        await fetchRefunds()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to approve refund',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectClick = (refund: Refund) => {
    setSelectedRefund(refund)
    setShowRejectDialog(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedRefund || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive'
      })
      return
    }

    setProcessing(true)
    try {
      const result = await rejectRefund(selectedRefund.id, rejectionReason)
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Refund rejected'
        })
        setShowRejectDialog(false)
        setRejectionReason('')
        await fetchRefunds()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reject refund',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusCounts = () => {
    return {
      all: refunds.length,
      pending: refunds.filter(r => r.status === 'pending').length,
      approved: refunds.filter(r => r.status === 'approved').length,
      processing: refunds.filter(r => r.status === 'processing').length,
      completed: refunds.filter(r => r.status === 'completed').length,
      rejected: refunds.filter(r => r.status === 'rejected').length
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const counts = getStatusCounts()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{counts.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{counts.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{counts.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{counts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Refund Requests</CardTitle>
              <CardDescription>Manage refund requests from users</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRefunds}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
              <TabsTrigger value="processing">Processing ({counts.processing})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredRefunds.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No {activeTab === 'all' ? '' : activeTab} refunds found
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Payment Ref</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRefunds.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell className="text-sm">
                          {formatDate(refund.requested_at)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {refund.user?.full_name || 'Unknown'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {refund.user?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {refund.payment_reference}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatPrice(refund.refund_amount_kobo)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Net: {formatPrice(refund.net_refund_kobo)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatRefundReason(refund.reason)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRefundStatusColor(refund.status)}>
                            {formatRefundStatus(refund.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(refund)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {refund.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(refund)}
                                disabled={processing}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectClick(refund)}
                                disabled={processing}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Refund Details</DialogTitle>
            <DialogDescription>Complete information about this refund request</DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <div className="font-medium">{selectedRefund.user?.full_name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <div className="font-medium">{selectedRefund.user?.email}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Reference:</span>
                      <div className="font-mono text-xs">{selectedRefund.payment_reference}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Package:</span>
                      <div className="font-medium">{selectedRefund.payment?.package_type}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Refund Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refund Type:</span>
                    <span className="font-medium capitalize">{selectedRefund.refund_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Amount:</span>
                    <span className="font-medium">{formatPrice(selectedRefund.refund_amount_kobo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Refund:</span>
                    <span className="font-medium">{formatPrice(selectedRefund.net_refund_kobo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getRefundStatusColor(selectedRefund.status)}>
                      {formatRefundStatus(selectedRefund.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested:</span>
                    <span className="font-medium">{formatDate(selectedRefund.requested_at)}</span>
                  </div>
                  {selectedRefund.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-medium">{formatDate(selectedRefund.completed_at)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Reason for Refund</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Badge variant="secondary">{formatRefundReason(selectedRefund.reason)}</Badge>
                  </div>
                  {selectedRefund.reason_details && (
                    <p className="text-sm text-muted-foreground">
                      {selectedRefund.reason_details}
                    </p>
                  )}
                  {selectedRefund.rejection_reason && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Rejection Reason:</strong> {selectedRefund.rejection_reason}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this refund request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this refund request is being rejected..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectionReason('')
                }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRejectConfirm}
                disabled={processing || !rejectionReason.trim()}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Reject Refund'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

