import { Suspense } from 'react'
import RefundManagementContent from '@/components/admin/refund-management-content'

export default function AdminRefundsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Refund Management</h1>
        <p className="text-muted-foreground">
          Review and process refund requests from users
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-8">Loading refunds...</div>}>
        <RefundManagementContent />
      </Suspense>
    </div>
  )
}

