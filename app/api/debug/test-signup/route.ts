import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const diagnostics: any = {};
  
  try {
    // Check environment variables
    diagnostics.env_check = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      BREVO_API_KEY: !!process.env.BREVO_API_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    };
    
    // Try to create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    diagnostics.supabase_client = 'Created';
    
    // Try to query users table
    const testEmail = 'test@example.com';
    const { data, error } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('email', testEmail)
      .single();
    
    diagnostics.users_query = {
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null,
      data: data ? 'Found user' : 'No user found',
      error_code: error?.code
    };
    
    // Try to query magic_links table
    const { data: mlData, error: mlError } = await supabase
      .from('magic_links')
      .select('count')
      .limit(1);
    
    diagnostics.magic_links_table = {
      exists: !mlError,
      error: mlError ? mlError.message : null
    };
    
    // Try to query audit_logs table
    const { data: alData, error: alError } = await supabase
      .from('audit_logs')
      .select('count')
      .limit(1);
    
    diagnostics.audit_logs_table = {
      exists: !alError,
      error: alError ? alError.message : null
    };
    
    return NextResponse.json({
      success: true,
      message: 'Diagnostics completed',
      diagnostics
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      diagnostics
    }, { status: 500 });
  }
}

