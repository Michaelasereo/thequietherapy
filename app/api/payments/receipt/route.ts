import { NextRequest, NextResponse } from 'next/server'
import { getPaymentDetails, generateReceiptPDF } from '@/lib/credits-payments'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get payment details
    const payment = await getPaymentDetails(paymentId)
    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this payment
    if (payment.user_id !== session.userId && session.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to payment' },
        { status: 403 }
      )
    }

    // Generate PDF receipt
    const pdfBase64 = await generateReceiptPDF(payment)

    return NextResponse.json({
      success: true,
      receipt: pdfBase64,
      payment: payment
    })
  } catch (error) {
    console.error('Error generating receipt:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
