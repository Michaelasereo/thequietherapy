import { NextRequest, NextResponse } from 'next/server'

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number // Price in Naira
  description: string
  popular?: boolean
  features?: string[]
}

// Credit packages configuration
const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 50000, // ₦50,000
    description: 'Perfect for small teams getting started with therapy benefits',
    features: [
      '100 therapy session credits',
      'Basic analytics dashboard',
      'Email support',
      'CSV member upload'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 500,
    price: 200000, // ₦200,000
    description: 'Ideal for growing organizations with comprehensive mental health needs',
    popular: true,
    features: [
      '500 therapy session credits',
      'Advanced analytics & reporting',
      'Priority support',
      'CSV member upload',
      'Custom branding',
      'API access'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 1000,
    price: 350000, // ₦350,000
    description: 'Complete solution for large organizations with unlimited scalability',
    features: [
      '1000 therapy session credits',
      'Full analytics suite',
      'Dedicated account manager',
      'CSV member upload',
      'Custom branding',
      'API access',
      'Custom integrations',
      'SLA guarantee'
    ]
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    credits: -1, // Unlimited
    price: 500000, // ₦500,000
    description: 'Unlimited therapy sessions for enterprise-scale organizations',
    features: [
      'Unlimited therapy sessions',
      'Full analytics suite',
      'Dedicated account manager',
      'CSV member upload',
      'Custom branding',
      'API access',
      'Custom integrations',
      'SLA guarantee',
      'White-label solution'
    ]
  }
]

export async function GET(request: NextRequest) {
  try {
    console.log('📦 Fetching credit packages...')
    
    const { searchParams } = new URL(request.url)
    const packageId = searchParams.get('id')
    
    // If specific package requested
    if (packageId) {
      const package_ = CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
      
      if (!package_) {
        return NextResponse.json(
          { error: 'Credit package not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        package: package_
      })
    }
    
    // Return all packages
    return NextResponse.json({
      success: true,
      packages: CREDIT_PACKAGES,
      total: CREDIT_PACKAGES.length
    })
    
  } catch (error) {
    console.error('💥 Error fetching credit packages:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch credit packages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for creating custom packages (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, credits, price, description, features } = body
    
    // Validate required fields
    if (!name || !credits || !price || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, credits, price, description' },
        { status: 400 }
      )
    }
    
    // Validate data types
    if (typeof credits !== 'number' || typeof price !== 'number') {
      return NextResponse.json(
        { error: 'Credits and price must be numbers' },
        { status: 400 }
      )
    }
    
    // Create new package
    const newPackage: CreditPackage = {
      id: `custom-${Date.now()}`,
      name,
      credits,
      price,
      description,
      features: features || []
    }
    
    console.log('📦 Created custom credit package:', newPackage.id)
    
    // In a real implementation, you would save this to the database
    // For now, we'll just return the created package
    
    return NextResponse.json({
      success: true,
      package: newPackage,
      message: 'Custom credit package created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('💥 Error creating credit package:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create credit package',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
