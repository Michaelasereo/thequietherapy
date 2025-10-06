import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Paystack configuration...')
    
    const config = {
      hasSecretKey: !!process.env.PAYSTACK_SECRET_KEY,
      hasPublicKey: !!process.env.PAYSTACK_PUBLIC_KEY,
      secretKeyLength: process.env.PAYSTACK_SECRET_KEY?.length || 0,
      publicKeyLength: process.env.PAYSTACK_PUBLIC_KEY?.length || 0,
      environment: process.env.NODE_ENV,
      isValid: false,
      error: null as string | null,
      paystackLibrary: false
    }

    // Check if secret key is present
    if (!config.hasSecretKey) {
      config.error = 'PAYSTACK_SECRET_KEY is not set in environment variables'
      return NextResponse.json(config, { status: 400 })
    }

    // Check if public key is present
    if (!config.hasPublicKey) {
      config.error = 'PAYSTACK_PUBLIC_KEY is not set in environment variables'
      return NextResponse.json(config, { status: 400 })
    }

    // Check key format
    const secretKey = process.env.PAYSTACK_SECRET_KEY!
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY!

    if (!secretKey.startsWith('sk_')) {
      config.error = 'Invalid PAYSTACK_SECRET_KEY format (should start with sk_)'
      return NextResponse.json(config, { status: 400 })
    }

    if (!publicKey.startsWith('pk_')) {
      config.error = 'Invalid PAYSTACK_PUBLIC_KEY format (should start with pk_)'
      return NextResponse.json(config, { status: 400 })
    }

    // Check if Paystack library is available
    try {
      const Paystack = require('paystack')
      const paystackInstance = Paystack(secretKey)
      config.paystackLibrary = true
      
      // Test API connection by fetching banks (lightweight operation)
      console.log('🧪 Testing Paystack API connection...')
      
      const response = await paystackInstance.misc.list_banks()
      
      if (response.status) {
        config.isValid = true
        console.log('✅ Paystack API connection successful')
        
        return NextResponse.json({
          ...config,
          apiTest: {
            success: true,
            banksCount: response.data?.length || 0,
            message: 'Successfully connected to Paystack API'
          }
        })
      } else {
        config.error = 'Paystack API test failed'
        return NextResponse.json(config, { status: 400 })
      }
      
    } catch (error) {
      console.error('Paystack library or API error:', error)
      
      if (error.message?.includes('401')) {
        config.error = 'Invalid Paystack secret key (401 Unauthorized)'
      } else if (error.message?.includes('Cannot find module')) {
        config.error = 'Paystack library not installed (run: npm install paystack)'
      } else {
        config.error = `Paystack error: ${error.message}`
      }
      
      return NextResponse.json(config, { status: 400 })
    }

  } catch (error) {
    console.error('💥 Paystack configuration test error:', error)
    
    return NextResponse.json({
      hasSecretKey: !!process.env.PAYSTACK_SECRET_KEY,
      hasPublicKey: !!process.env.PAYSTACK_PUBLIC_KEY,
      isValid: false,
      error: `Configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
}
