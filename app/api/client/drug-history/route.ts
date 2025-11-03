import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { ServerSessionManager } from '@/lib/server-session-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('📋 Drug history API called with userId:', userId);
    console.log('📋 Full URL:', request.url);

    if (!userId || userId.trim() === '') {
      console.error('❌ Drug history API: userId is missing or empty');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('patient_drug_history')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching patient drug history:', error);
      return NextResponse.json({ error: 'Failed to fetch drug history' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error in drug history API:', error);
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
    const { id, medication_name, dosage, start_date, prescribing_doctor, duration_of_usage, notes } = body;

    if (!id || !medication_name || !dosage || !start_date) {
      return NextResponse.json({ error: 'ID, medication_name, dosage, and start_date are required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const therapistId = session.id;

    // Verify therapist has access to this drug history record
    const { data: existingRecord, error: fetchError } = await supabase
      .from('patient_drug_history')
      .select('therapist_id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Drug history record not found' }, { status: 404 });
    }

    if (existingRecord.therapist_id !== therapistId) {
      return NextResponse.json({ error: 'Unauthorized - You can only edit your own records' }, { status: 403 });
    }

    // Update the record
    const { data, error } = await supabase
      .from('patient_drug_history')
      .update({
        medication_name,
        dosage,
        start_date,
        prescribing_doctor: prescribing_doctor || null,
        duration_of_usage: duration_of_usage || null,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating patient drug history:', error);
      return NextResponse.json({ error: 'Failed to update drug history' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in drug history update API:', error);
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
    const { user_id, medication_name, dosage, start_date, prescribing_doctor, duration_of_usage, notes } = body;

    if (!user_id || !medication_name || !dosage || !start_date) {
      return NextResponse.json({ error: 'user_id, medication_name, dosage, and start_date are required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const therapistId = session.id;

    console.log('➕ Creating drug history for user_id:', user_id, 'therapist_id:', therapistId);

    // Insert the new drug history record
    const { data, error } = await supabase
      .from('patient_drug_history')
      .insert({
        user_id,
        therapist_id: therapistId,
        medication_name,
        dosage,
        start_date,
        prescribing_doctor: prescribing_doctor || null,
        duration_of_usage: duration_of_usage || null,
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding patient drug history:', error);
      return NextResponse.json({ error: 'Failed to add drug history', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in drug history POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
