import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { ServerSessionManager } from '@/lib/server-session-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('📋 Medical history API called with userId:', userId);
    console.log('📋 Full URL:', request.url);

    if (!userId || userId.trim() === '') {
      console.error('❌ Medical history API: userId is missing or empty');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('patient_medical_history')
      .select('*')
      .eq('user_id', userId)
      .order('diagnosis_date', { ascending: false });

    if (error) {
      console.error('Error fetching patient medical history:', error);
      return NextResponse.json({ error: 'Failed to fetch medical history' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error in medical history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // SECURE Authentication - only therapists can update
    const session = await ServerSessionManager.getSession();
    if (!session || session.role !== 'therapist') {
      return NextResponse.json({ error: 'Unauthorized - Therapist access required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, condition, diagnosis_date, notes } = body;

    if (!id || !condition || !diagnosis_date) {
      return NextResponse.json({ error: 'ID, condition, and diagnosis_date are required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const therapistId = session.id;

    // Verify therapist has access to this medical history record
    const { data: existingRecord, error: fetchError } = await supabase
      .from('patient_medical_history')
      .select('therapist_id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Medical history record not found' }, { status: 404 });
    }

    if (existingRecord.therapist_id !== therapistId) {
      return NextResponse.json({ error: 'Unauthorized - You can only edit your own records' }, { status: 403 });
    }

    // Update the record
    const { data, error } = await supabase
      .from('patient_medical_history')
      .update({
        condition,
        diagnosis_date,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating patient medical history:', error);
      return NextResponse.json({ error: 'Failed to update medical history' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in medical history update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURE Authentication - only therapists can create
    const session = await ServerSessionManager.getSession();
    if (!session || session.role !== 'therapist') {
      return NextResponse.json({ error: 'Unauthorized - Therapist access required' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, condition, diagnosis_date, notes } = body;

    if (!user_id || !condition || !diagnosis_date) {
      return NextResponse.json({ error: 'user_id, condition, and diagnosis_date are required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const therapistId = session.id;

    console.log('➕ Creating medical history for user_id:', user_id, 'therapist_id:', therapistId);

    // Insert the new medical history record
    const { data, error } = await supabase
      .from('patient_medical_history')
      .insert({
        user_id,
        therapist_id: therapistId,
        condition,
        diagnosis_date,
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding patient medical history:', error);
      return NextResponse.json({ error: 'Failed to add medical history', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in medical history POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
