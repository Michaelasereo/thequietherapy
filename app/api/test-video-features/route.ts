import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const results: any = {
      database_connection: false,
      session_notes_table: false,
      recent_transcriptions: [],
      session_count: 0,
      transcription_count: 0,
      errors: []
    };

    // Test 1: Database Connection
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      results.database_connection = true;
    } catch (error) {
      results.errors.push(`Database connection failed: ${error}`);
    }

    // Test 2: Check session_notes table
    try {
      const { data, error } = await supabase
        .from('session_notes')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      results.session_notes_table = true;
      results.transcription_count = data?.length || 0;
    } catch (error) {
      results.errors.push(`Session notes table check failed: ${error}`);
    }

    // Test 3: Check sessions table
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      results.session_count = data?.length || 0;
    } catch (error) {
      results.errors.push(`Sessions table check failed: ${error}`);
    }

    // Test 4: Get recent transcriptions
    try {
      const { data, error } = await supabase
        .from('session_notes')
        .select('id, session_id, transcript, ai_generated, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      results.recent_transcriptions = data || [];
    } catch (error) {
      results.errors.push(`Recent transcriptions check failed: ${error}`);
    }

    // Test 5: Check processing queue
    try {
      const { data, error } = await supabase
        .from('session_processing_queue')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      results.processing_queue_count = data?.length || 0;
    } catch (error) {
      results.errors.push(`Processing queue check failed: ${error}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Video features test completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in video features test:', error);
    return NextResponse.json({
      success: false,
      error: 'Video features test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
