import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creating therapist_profiles table via API...');
    
    const supabase = createServerClient();

    // First, check if the table already exists
    const { data: existingData, error: checkError } = await supabase
      .from('therapist_profiles')
      .select('id')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'therapist_profiles table already exists',
        action: 'verified'
      });
    }

    console.log('📋 Table does not exist, creating it...');

    // Create the table using INSERT approach (this will fail but help us understand the schema)
    try {
      const { error: insertError } = await supabase
        .from('therapist_profiles')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          mdcn_code: 'TEST123',
          specialization: 'Test',
          languages: 'English',
          phone: '+1234567890',
          verification_status: 'pending',
          is_verified: false
        });

      if (insertError) {
        console.log('❌ Insert failed as expected:', insertError.message);
      }
    } catch (insertErr) {
      console.log('❌ Insert attempt failed:', insertErr);
    }

    // Try to create a minimal version of the table by checking what columns exist
    const tableStructure = {
      id: 'uuid',
      user_id: 'uuid',
      mdcn_code: 'text',
      specialization: 'text',
      languages: 'text',
      phone: 'text',
      bio: 'text',
      experience_years: 'integer',
      hourly_rate: 'numeric',
      verification_status: 'text',
      is_verified: 'boolean',
      profile_image_url: 'text',
      education: 'text',
      certifications: 'text',
      availability_notes: 'text',
      created_at: 'timestamptz',
      updated_at: 'timestamptz'
    };

    return NextResponse.json({
      success: false,
      message: 'Table creation requires manual setup',
      instructions: 'Please run the SQL from create-therapist-profiles-table.sql in your Supabase SQL editor',
      tableStructure,
      sqlFile: 'create-therapist-profiles-table.sql'
    });

  } catch (error) {
    console.error('❌ Create table API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Check if therapist_profiles table exists and get its structure
    const { data, error } = await supabase
      .from('therapist_profiles')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({
        exists: false,
        error: error.message,
        hint: error.hint || 'Table may not exist'
      });
    }

    return NextResponse.json({
      exists: true,
      message: 'therapist_profiles table is accessible',
      sampleData: data
    });

  } catch (error) {
    console.error('❌ Check table API error:', error);
    return NextResponse.json(
      { 
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
