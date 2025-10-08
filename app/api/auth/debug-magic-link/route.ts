import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      email: email,
      
      // Environment variables check
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // Email service check
      hasBrevoUser: !!process.env.BREVO_SMTP_USER,
      hasBrevoPass: !!process.env.BREVO_SMTP_PASS,
      hasSenderEmail: !!process.env.SENDER_EMAIL,
      
      // App URL check
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      
      // Supabase connection test
      supabaseConnection: null,
      emailServiceStatus: null
    }

    // Test Supabase connection
    try {
      const { createServerClient } = await import('@/lib/supabase')
      const supabase = createServerClient()
      
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      diagnostics.supabaseConnection = {
        connected: !error,
        error: error?.message || null,
        hasData: !!data
      }
    } catch (error) {
      diagnostics.supabaseConnection = {
        connected: false,
        error: error.message,
        hasData: false
      }
    }

    // Test email service
    try {
      const { createTransporter } = await import('@/lib/email')
      const transporter = createTransporter()
      
      diagnostics.emailServiceStatus = {
        configured: !!transporter,
        error: transporter ? null : 'Email service not configured'
      }
    } catch (error) {
      diagnostics.emailServiceStatus = {
        configured: false,
        error: error.message
      }
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      recommendations: generateRecommendations(diagnostics)
    })

  } catch (error) {
    console.error('Magic link debug error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function generateRecommendations(diagnostics: any): string[] {
  const recommendations = []

  if (!diagnostics.hasSupabaseUrl) {
    recommendations.push('❌ NEXT_PUBLIC_SUPABASE_URL is missing from environment variables')
  }
  
  if (!diagnostics.hasSupabaseKey) {
    recommendations.push('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from environment variables')
  }
  
  if (!diagnostics.hasServiceRoleKey) {
    recommendations.push('❌ SUPABASE_SERVICE_ROLE_KEY is missing from environment variables')
  }
  
  if (!diagnostics.hasBrevoUser) {
    recommendations.push('❌ BREVO_SMTP_USER is missing from environment variables')
  }
  
  if (!diagnostics.hasBrevoPass) {
    recommendations.push('❌ BREVO_SMTP_PASS is missing from environment variables')
  }
  
  if (!diagnostics.hasSenderEmail) {
    recommendations.push('❌ SENDER_EMAIL is missing from environment variables')
  }
  
  if (!diagnostics.hasAppUrl) {
    recommendations.push('❌ NEXT_PUBLIC_APP_URL is missing from environment variables')
  }

  if (diagnostics.supabaseConnection && !diagnostics.supabaseConnection.connected) {
    recommendations.push('❌ Supabase connection failed: ' + diagnostics.supabaseConnection.error)
  }

  if (diagnostics.emailServiceStatus && !diagnostics.emailServiceStatus.configured) {
    recommendations.push('❌ Email service not configured: ' + diagnostics.emailServiceStatus.error)
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All systems appear to be configured correctly')
  }

  return recommendations
}
