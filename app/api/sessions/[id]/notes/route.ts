import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Session Notes API called for Session ID:', id);

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

    // Fetch session notes
    const { data: notes, error: notesError } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', id)
      .single();

    if (notesError) {
      console.log('ℹ️ No session notes found for session:', id);
      return NextResponse.json({
        success: true,
        notes: null
      });
    }

    console.log('✅ Session notes fetched successfully for session:', params.id);

    return NextResponse.json({
      success: true,
      notes: notes
    });

  } catch (error) {
    console.error('Session Notes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
