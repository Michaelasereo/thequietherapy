import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get the first session to see the structure
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch sessions',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session_data: data,
      message: 'Sessions table structure retrieved'
    });

  } catch (error) {
    console.error('Error checking sessions structure:', error);
    return NextResponse.json({
      error: 'Failed to check sessions structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
