import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  console.log('🔍 Debug endpoint called:', envCheck);

  return NextResponse.json(envCheck);
}
