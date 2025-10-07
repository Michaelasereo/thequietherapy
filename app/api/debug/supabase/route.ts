import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const diagnostics = {
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV
    },
    supabase: {
      clientCreated: false,
      connectionTest: null,
      error: null
    }
  }

  try {
    // Test if we can create a client
    const supabase = createServerClient()
    diagnostics.supabase.clientCreated = true

    // Test simple query
    const { data, error } = await supabase
      .from('donations')
      .select('count')
      .limit(1)

    diagnostics.supabase.connectionTest = error ? 'failed' : 'success'
    diagnostics.supabase.error = error?.message

  } catch (error) {
    diagnostics.supabase.error = error.message
  }

  return NextResponse.json(diagnostics)
}
