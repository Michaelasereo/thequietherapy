import { Suspense } from 'react'
import PaymentHistoryContent from '@/components/payment-history-content'

export default function PaymentHistoryPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Payment History</h1>
        <p className="text-muted-foreground">
          View all your payments, receipts, and refund requests
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-8">Loading payments...</div>}>
        <PaymentHistoryContent />
      </Suspense>
    </div>
  )
}

