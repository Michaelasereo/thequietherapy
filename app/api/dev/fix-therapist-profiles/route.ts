import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing therapist profiles for booking...')

    // Step 1: Get all approved therapists
    const { data: therapists, error: therapistsError } = await supabase
      .from('users')
      .select('id, email, full_name, is_verified, is_active')
      .eq('user_type', 'therapist')
      .eq('is_verified', true)
      .eq('is_active', true)

    if (therapistsError) {
      console.error('❌ Error fetching therapists:', therapistsError)
      return NextResponse.json({ error: 'Failed to fetch therapists' }, { status: 500 })
    }

    console.log(`📋 Found ${therapists?.length || 0} approved therapists`)

    const results = {
      updated: 0,
      created: 0,
      errors: [] as Array<{ email: string; error: string }>
    }

    // Step 2: Process each therapist
    for (const therapist of therapists || []) {
      try {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('therapist_profiles')
          .select('id, verification_status, is_verified')
          .eq('user_id', therapist.id)
          .single()

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from('therapist_profiles')
            .update({
              verification_status: 'approved',
              is_verified: true,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', therapist.id)

          if (updateError) {
            throw new Error(`Update failed: ${updateError.message}`)
          }

          results.updated++
          console.log(`✅ Updated profile for ${therapist.email}`)
        } else {
          // Create new profile
          const { error: insertError } = await supabase
            .from('therapist_profiles')
            .insert({
              user_id: therapist.id,
              verification_status: 'approved',
              is_verified: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (insertError) {
            throw new Error(`Insert failed: ${insertError.message}`)
          }

          results.created++
          console.log(`✅ Created profile for ${therapist.email}`)
        }
      } catch (error: any) {
        console.error(`❌ Error processing ${therapist.email}:`, error)
        results.errors.push({
          email: therapist.email,
          error: error.message
        })
      }
    }

    // Step 3: Verify the fix
    const { data: verifiedProfiles } = await supabase
      .from('therapist_profiles')
      .select('user_id, verification_status, is_verified')
      .eq('verification_status', 'approved')
      .eq('is_verified', true)

    return NextResponse.json({
      success: true,
      message: 'Therapist profiles fixed successfully',
      stats: {
        total: therapists?.length || 0,
        updated: results.updated,
        created: results.created,
        errors: results.errors.length,
        verified_bookable: verifiedProfiles?.length || 0
      },
      errors: results.errors.length > 0 ? results.errors : undefined
    })

  } catch (error: any) {
    console.error('❌ Fix therapist profiles error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fix therapist profiles' },
      { status: 500 }
    )
  }
}

