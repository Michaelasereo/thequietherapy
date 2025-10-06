import { supabase } from '@/lib/supabase'

export interface RefundRequest {
  id: string
  user_id: string
  payment_reference: string
  refund_type: 'full_refund' | 'partial_refund' | 'credit_reversal' | 'cancellation_refund'
  refund_amount_kobo: number
  net_refund_kobo: number
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled' | 'failed'
  reason: string
  reason_details?: string
  rejection_reason?: string
  requested_at: string
  completed_at?: string
}

export interface RefundStats {
  total_refunds: number
  pending_refunds: number
  completed_refunds: number
  rejected_refunds: number
  total_refunded_kobo: number
  avg_processing_hours: number
}

// Create a refund request
export async function createRefundRequest(
  paymentReference: string,
  refundType: 'full_refund' | 'partial_refund' | 'credit_reversal' | 'cancellation_refund',
  reason: string,
  reasonDetails?: string,
  refundAmount?: number,
  sessionId?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const response = await fetch('/api/refunds/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_reference: paymentReference,
        refund_type: refundType,
        reason: reason,
        reason_details: reasonDetails,
        refund_amount_kobo: refundAmount,
        session_id: sessionId
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create refund request' }
    }

    return { 
      success: true, 
      refundId: data.data.refund_id 
    }
  } catch (error) {
    console.error('Error creating refund request:', error)
    return { success: false, error: 'Network error' }
  }
}

// Get user's refund requests
export async function getUserRefunds(): Promise<RefundRequest[]> {
  try {
    const response = await fetch('/api/refunds/request')
    const data = await response.json()

    if (!response.ok) {
      console.error('Failed to fetch refunds:', data.error)
      return []
    }

    return data.data.refunds || []
  } catch (error) {
    console.error('Error fetching refunds:', error)
    return []
  }
}

// Get refund statistics (admin only)
export async function getRefundStatistics(): Promise<RefundStats | null> {
  try {
    const { data, error } = await supabase
      .from('refund_statistics')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching refund statistics:', error)
      return null
    }

    return {
      total_refunds: data.total_refunds || 0,
      pending_refunds: data.pending_refunds || 0,
      completed_refunds: data.completed_refunds || 0,
      rejected_refunds: data.rejected_refunds || 0,
      total_refunded_kobo: data.total_refunded_kobo || 0,
      avg_processing_hours: data.avg_processing_hours || 0
    }
  } catch (error) {
    console.error('Error getting refund statistics:', error)
    return null
  }
}

// Admin: Get all refunds
export async function getAllRefunds(status: string = 'all'): Promise<any[]> {
  try {
    const response = await fetch(`/api/refunds/admin?status=${status}`)
    const data = await response.json()

    if (!response.ok) {
      console.error('Failed to fetch refunds:', data.error)
      return []
    }

    return data.data.refunds || []
  } catch (error) {
    console.error('Error fetching refunds:', error)
    return []
  }
}

// Admin: Approve refund
export async function approveRefund(refundId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/refunds/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refund_id: refundId,
        action: 'approve'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to approve refund' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error approving refund:', error)
    return { success: false, error: 'Network error' }
  }
}

// Admin: Reject refund
export async function rejectRefund(
  refundId: string, 
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/refunds/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refund_id: refundId,
        action: 'reject',
        rejection_reason: rejectionReason
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to reject refund' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error rejecting refund:', error)
    return { success: false, error: 'Network error' }
  }
}

// Cancel refund request (before it's processed)
export async function cancelRefundRequest(refundId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('refunds')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', refundId)
      .eq('status', 'pending')

    if (error) {
      return { success: false, error: 'Failed to cancel refund request' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error cancelling refund:', error)
    return { success: false, error: 'Network error' }
  }
}

// Format refund status for display
export function formatRefundStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pending Review',
    'approved': 'Approved',
    'processing': 'Processing',
    'completed': 'Completed',
    'rejected': 'Rejected',
    'cancelled': 'Cancelled',
    'failed': 'Failed'
  }
  return statusMap[status] || status
}

// Format refund reason for display
export function formatRefundReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    'session_cancelled': 'Session Cancelled',
    'service_issue': 'Service Issue',
    'technical_problem': 'Technical Problem',
    'duplicate_payment': 'Duplicate Payment',
    'unauthorized_charge': 'Unauthorized Charge',
    'customer_request': 'Customer Request',
    'admin_adjustment': 'Admin Adjustment',
    'other': 'Other'
  }
  return reasonMap[reason] || reason
}

// Get refund status color for UI
export function getRefundStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-blue-100 text-blue-800',
    'processing': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'cancelled': 'bg-gray-100 text-gray-800',
    'failed': 'bg-red-100 text-red-800'
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

