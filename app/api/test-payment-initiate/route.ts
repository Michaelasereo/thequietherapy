import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { package_type } = await request.json()

    if (!package_type) {
      return NextResponse.json({ error: 'Package type is required' }, { status: 400 })
    }

    // Mock payment initialization for testing
    const mockPaymentData = {
      payment_url: 'https://checkout.paystack.com/test-payment-url',
      payment_reference: `test_${package_type}_${Date.now()}`,
      amount_naira: package_type === 'bronze' ? 135 : package_type === 'silver' ? 200 : 280,
      package_name: `${package_type.charAt(0).toUpperCase() + package_type.slice(1)} Package`,
      sessions_included: package_type === 'bronze' ? 3 : package_type === 'silver' ? 5 : 8
    }

    return NextResponse.json({
      success: true,
      ...mockPaymentData
    })

  } catch (error) {
    console.error('Test payment API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
