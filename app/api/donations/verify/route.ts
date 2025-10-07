import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json({
        success: false,
        error: 'Payment reference is required'
      }, { status: 400 })
    }

    console.log('🔍 Verifying donation for reference:', reference)

    // Look up donation in database
    const { data: donation, error } = await supabase
      .from('donations')
      .select('*')
      .eq('paystack_reference', reference)
      .single()

    if (error) {
      console.error('❌ Error fetching donation:', error)
      return NextResponse.json({
        success: false,
        error: 'Donation not found'
      }, { status: 404 })
    }

    if (!donation) {
      return NextResponse.json({
        success: false,
        error: 'Donation not found'
      }, { status: 404 })
    }

    console.log('✅ Donation found:', {
      reference: donation.paystack_reference,
      amount: donation.amount,
      status: donation.status
    })

    return NextResponse.json({
      success: true,
      donation: {
        paystack_reference: donation.paystack_reference,
        amount: donation.amount,
        status: donation.status,
        donor_name: donation.donor_name,
        email: donation.email,
        created_at: donation.created_at,
        verified_at: donation.verified_at
      }
    })

  } catch (error) {
    console.error('❌ Donation verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
