import { NextRequest, NextResponse } from 'next/server'
// import { validateAIConfiguration, getAIServiceStats } from '@/lib/ai'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Validating AI configuration...')
    
    // Mock AI service statistics for now
    const stats = {
      defaultProvider: 'openai',
      availableProviders: ['openai'],
      status: 'configured'
    }
    
    // Mock validation for now
    const validation = {
      success: true,
      message: 'AI services configured'
    }
    
    console.log('AI Configuration Status:', {
      defaultProvider: stats.defaultProvider,
      availableProviders: stats.availableProviders,
      validationSuccess: validation.success
    })

    const response = {
      ...stats,
      validation,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    if (!validation.success) {
      return NextResponse.json(response, { status: 400 })
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 AI configuration validation error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
}
