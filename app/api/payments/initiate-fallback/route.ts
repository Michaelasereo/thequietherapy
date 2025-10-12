import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'
import { ValidationError, successResponse, validateRequired } from '@/lib/api-response'
import { handleApiError } from '@/lib/app-error-handler'

// Fallback package definitions if database table doesn't exist
const FALLBACK_PACKAGES = {
  single: {
    package_type: 'single',
    name: 'Pay-As-You-Go',
    description: 'Single therapy session',
    sessions_included: 1,
    price_kobo: 500000, // ₦5,000
    session_duration_minutes: 35,
    savings_kobo: 0,
    is_active: true,
    sort_order: 2
  },
  bronze: {
    package_type: 'bronze',
    name: 'Bronze Pack',
    description: 'Perfect for getting started',
    sessions_included: 3,
    price_kobo: 1350000, // ₦13,500
    session_duration_minutes: 35,
    savings_kobo: 150000, // Save ₦1,500
    is_active: true,
    sort_order: 3
  },
  silver: {
    package_type: 'silver',
    name: 'Silver Pack',
    description: 'Great value for regular therapy',
    sessions_included: 5,
    price_kobo: 2000000, // ₦20,000
    session_duration_minutes: 35,
    savings_kobo: 500000, // Save ₦5,000
    is_active: true,
    sort_order: 4
  },
  gold: {
    package_type: 'gold',
    name: 'Gold Pack',
    description: 'Best value for committed healing',
    sessions_included: 8,
    price_kobo: 2800000, // ₦28,000
    session_duration_minutes: 35,
    savings_kobo: 1200000, // Save ₦12,000
    is_active: true,
    sort_order: 5
  }
}

interface PaymentInitiationRequest {
  package_type: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. SECURE Authentication Check
    const authResult = await requireApiAuth(['individual'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const userId = session.user.id
    const userEmail = session.user.email
    const userName = session.user.full_name

    // 2. Parse and validate request
    const { package_type }: PaymentInitiationRequest = await request.json()
    validateRequired({ package_type }, ['package_type'])

    // 3. Get package details from fallback data
    const packageDef = FALLBACK_PACKAGES[package_type as keyof typeof FALLBACK_PACKAGES]
    
    if (!packageDef) {
      throw new ValidationError(`Package '${package_type}' not found`)
    }

    if (!packageDef.is_active) {
      throw new ValidationError(`Package '${package_type}' is not available`)
    }

    // Don't allow purchasing free packages
    if (packageDef.price_kobo === 0) {
      throw new ValidationError('Cannot purchase free packages')
    }

    // 4. Create payment reference
    const paymentReference = `trpi_${package_type}_${userId.slice(0, 8)}_${Date.now()}`

    // 5. For now, return a mock payment URL (you'll need to integrate with actual Paystack)
    const mockPaymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/book?payment=mock&reference=${paymentReference}&package=${package_type}`

    const responseData = {
      payment_url: mockPaymentUrl,
      payment_reference: paymentReference,
      amount_naira: packageDef.price_kobo / 100,
      package_name: packageDef.name,
      sessions_included: packageDef.sessions_included,
      note: "This is a fallback endpoint. Please run setup-package-definitions.sql in your database and use the main /api/payments/initiate endpoint."
    }

    return successResponse(responseData)

  } catch (error) {
    return handleApiError(error)
  }
}
