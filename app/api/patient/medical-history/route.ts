import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
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
