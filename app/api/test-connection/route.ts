import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error.message
      });
    }
    
    console.log('✅ Supabase connected successfully');
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Unexpected connection error:', error);
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
