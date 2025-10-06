import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Individual Session API called for ID:', id);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialized');

    // Fetch session with therapist and user details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        therapist:therapist_id (
          id,
          email,
          full_name
        ),
        user:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq('id', id)
      .single();

    if (sessionError) {
      console.error('❌ Session fetch error:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('✅ Session fetched successfully:', session.id);

    return NextResponse.json({
      success: true,
      session: session
    });

  } catch (error) {
    console.error('Individual Session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}