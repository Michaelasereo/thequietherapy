import { supabase } from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void
  }
}

export interface CreditTransaction {
  id: string
  user_id: string
  transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment'
  amount: number
  balance_before: number
  balance_after: number
  description: string
  created_at: string
  reference_id?: string
  payment_method?: string
  status: 'completed' | 'pending' | 'failed'
}

export interface PaymentRecord {
  id: string
  user_id: string
  session_id?: string
  amount: number
  currency: string
  payment_method: string
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  transaction_id: string
  created_at: string
  updated_at: string
  receipt_url?: string
  description: string
  user_name?: string
  user_email?: string
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  currency: string
  description: string
  is_active: boolean
  created_at: string
}

export interface UserCredits {
  user_id: string
  current_balance: number
  total_purchased: number
  total_used: number
  last_transaction_date: string
  user_name?: string
  user_email?: string
}

// Get user credits with real-time data
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  try {
    // Get user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return null
    }

    // Get credit transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (transactionsError) {
      console.error('Error fetching credit transactions:', transactionsError)
      return null
    }

    // Calculate credit balance
    let currentBalance = 0
    let totalPurchased = 0
    let totalUsed = 0
    let lastTransactionDate = ''

    transactions?.forEach(transaction => {
      if (transaction.transaction_type === 'purchase' || transaction.transaction_type === 'bonus') {
        currentBalance += transaction.amount
        if (transaction.transaction_type === 'purchase') {
          totalPurchased += transaction.amount
        }
      } else if (transaction.transaction_type === 'usage') {
        currentBalance -= transaction.amount
        totalUsed += transaction.amount
      }

      if (!lastTransactionDate || transaction.created_at > lastTransactionDate) {
        lastTransactionDate = transaction.created_at
      }
    })

    return {
      user_id: userId,
      current_balance: currentBalance,
      total_purchased: totalPurchased,
      total_used: totalUsed,
      last_transaction_date: lastTransactionDate,
      user_name: userData.full_name,
      user_email: userData.email
    }
  } catch (error) {
    console.error('Error getting user credits:', error)
    return null
  }
}

// Get credit transactions
export async function getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching credit transactions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting credit transactions:', error)
    return []
  }
}

// Get payment records
export async function getPaymentRecords(userId: string): Promise<PaymentRecord[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        users:user_id (
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payment records:', error)
      return []
    }

    return data?.map(payment => ({
      ...payment,
      user_name: payment.users?.full_name,
      user_email: payment.users?.email
    })) || []
  } catch (error) {
    console.error('Error getting payment records:', error)
    return []
  }
}

// Get credit packages
export async function getCreditPackages(): Promise<CreditPackage[]> {
  try {
    const { data, error } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('credits', { ascending: true })

    if (error) {
      console.error('Error fetching credit packages:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting credit packages:', error)
    return []
  }
}

// Purchase credits
export async function purchaseCredits(
  userId: string, 
  packageId: string, 
  paymentMethod: string,
  transactionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (packageError || !packageData) {
      return { success: false, error: 'Invalid package' }
    }

    // Get current user credits
    const currentCredits = await getUserCredits(userId)
    const balanceBefore = currentCredits?.current_balance || 0

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: packageData.price,
        currency: packageData.currency,
        payment_method: paymentMethod,
        status: 'completed',
        transaction_id: transactionId,
        description: `Purchase of ${packageData.credits} credits`,
        receipt_url: `receipts/${transactionId}.pdf`
      })

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      return { success: false, error: 'Failed to record payment' }
    }

    // Create credit transaction
    const { error: creditError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'purchase',
        amount: packageData.credits,
        balance_before: balanceBefore,
        balance_after: balanceBefore + packageData.credits,
        description: `Purchased ${packageData.credits} credits`,
        reference_id: transactionId,
        payment_method: paymentMethod,
        status: 'completed'
      })

    if (creditError) {
      console.error('Error creating credit transaction:', creditError)
      return { success: false, error: 'Failed to add credits' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error purchasing credits:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Use credits for session
export async function useCreditsForSession(
  userId: string, 
  sessionId: string, 
  creditsUsed: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user credits
    const currentCredits = await getUserCredits(userId)
    if (!currentCredits || currentCredits.current_balance < creditsUsed) {
      return { success: false, error: 'Insufficient credits' }
    }

    const balanceBefore = currentCredits.current_balance

    // Create credit transaction
    const { error: creditError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'usage',
        amount: creditsUsed,
        balance_before: balanceBefore,
        balance_after: balanceBefore - creditsUsed,
        description: `Used ${creditsUsed} credits for session`,
        reference_id: sessionId,
        status: 'completed'
      })

    if (creditError) {
      console.error('Error creating credit transaction:', creditError)
      return { success: false, error: 'Failed to deduct credits' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error using credits:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Generate PDF receipt
export async function generateReceiptPDF(payment: PaymentRecord): Promise<string> {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text('TRPI - Payment Receipt', 105, 20, { align: 'center' })
  
  // Company info
  doc.setFontSize(10)
  doc.text('The Quiet Therapy Platform', 20, 40)
  doc.text('Email: support@thequietherapy.live', 20, 50)
  doc.text('Website: https://thequietherapy.live', 20, 60)
  
  // Receipt details
  doc.setFontSize(12)
  doc.text('Receipt Details', 20, 80)
  
  const receiptData = [
    ['Receipt ID:', payment.transaction_id],
    ['Date:', new Date(payment.created_at).toLocaleDateString()],
    ['Customer:', payment.user_name || 'N/A'],
    ['Email:', payment.user_email || 'N/A'],
    ['Amount:', `${payment.currency} ${payment.amount.toLocaleString()}`],
    ['Payment Method:', payment.payment_method],
    ['Status:', payment.status.toUpperCase()],
    ['Description:', payment.description]
  ]
  
  doc.autoTable({
    startY: 90,
    head: [['Field', 'Value']],
    body: receiptData,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0] },
    styles: { fontSize: 10 }
  })
  
  // Footer
  doc.setFontSize(8)
  doc.text('Thank you for choosing TRPI!', 105, 250, { align: 'center' })
  doc.text('This is an automatically generated receipt.', 105, 255, { align: 'center' })
  
  // Convert to base64 for download
  const pdfBase64 = doc.output('datauristring')
  return pdfBase64
}

// Get payment details for receipt
export async function getPaymentDetails(paymentId: string): Promise<PaymentRecord | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        users:user_id (
          full_name,
          email
        )
      `)
      .eq('id', paymentId)
      .single()

    if (error) {
      console.error('Error fetching payment details:', error)
      return null
    }

    return {
      ...data,
      user_name: data.users?.full_name,
      user_email: data.users?.email
    }
  } catch (error) {
    console.error('Error getting payment details:', error)
    return null
  }
}

// Admin: Get all credit transactions
export async function getAllCreditTransactions(): Promise<CreditTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select(`
        *,
        users:user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all credit transactions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting all credit transactions:', error)
    return []
  }
}

// Admin: Get all payment records
export async function getAllPaymentRecords(): Promise<PaymentRecord[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        users:user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all payment records:', error)
      return []
    }

    return data?.map(payment => ({
      ...payment,
      user_name: payment.users?.full_name,
      user_email: payment.users?.email
    })) || []
  } catch (error) {
    console.error('Error getting all payment records:', error)
    return []
  }
}

// Admin: Manage credit allocation
export async function adjustUserCredits(
  userId: string,
  amount: number,
  reason: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user credits
    const currentCredits = await getUserCredits(userId)
    const balanceBefore = currentCredits?.current_balance || 0

    // Create credit transaction
    const { error: creditError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: amount > 0 ? 'bonus' : 'adjustment',
        amount: Math.abs(amount),
        balance_before: balanceBefore,
        balance_after: balanceBefore + amount,
        description: reason,
        reference_id: adminId,
        status: 'completed'
      })

    if (creditError) {
      console.error('Error creating credit adjustment:', creditError)
      return { success: false, error: 'Failed to adjust credits' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error adjusting credits:', error)
    return { success: false, error: 'Internal server error' }
  }
}
