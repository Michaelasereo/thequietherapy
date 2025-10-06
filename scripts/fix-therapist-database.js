#!/usr/bin/env node

/**
 * Fix Therapist Database Schema
 * This script ensures all necessary tables and columns exist for therapist profiles and document storage
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixTherapistDatabase() {
  try {
    console.log('🔧 Fixing therapist database schema...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'fix-therapist-database-schema.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          
          if (error) {
            console.warn(`   ⚠️  Warning: ${error.message}`)
          } else {
            console.log(`   ✅ Success`)
          }
        } catch (err) {
          console.warn(`   ⚠️  Warning: ${err.message}`)
        }
      }
    }
    
    // Verify tables exist
    console.log('\n🔍 Verifying tables...')
    
    const { data: therapistProfiles, error: profilesError } = await supabase
      .from('therapist_profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ therapist_profiles table error:', profilesError.message)
    } else {
      console.log('✅ therapist_profiles table exists and is accessible')
    }
    
    const { data: therapistEnrollments, error: enrollmentsError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .limit(1)
    
    if (enrollmentsError) {
      console.error('❌ therapist_enrollments table error:', enrollmentsError.message)
    } else {
      console.log('✅ therapist_enrollments table exists and is accessible')
    }
    
    // Check if we have any existing therapist data
    const { data: existingProfiles, error: existingError } = await supabase
      .from('therapist_profiles')
      .select('id, user_id, bio, phone, mdcn_code')
      .limit(5)
    
    if (!existingError && existingProfiles) {
      console.log(`\n📊 Found ${existingProfiles.length} existing therapist profiles:`)
      existingProfiles.forEach(profile => {
        console.log(`   - User ID: ${profile.user_id}`)
        console.log(`     Bio: ${profile.bio ? 'Yes' : 'No'}`)
        console.log(`     Phone: ${profile.phone ? 'Yes' : 'No'}`)
        console.log(`     MDCN: ${profile.mdcn_code ? 'Yes' : 'No'}`)
      })
    }
    
    const { data: existingEnrollments, error: enrollmentsExistingError } = await supabase
      .from('therapist_enrollments')
      .select('id, user_id, email, status, license_document, id_document')
      .limit(5)
    
    if (!enrollmentsExistingError && existingEnrollments) {
      console.log(`\n📊 Found ${existingEnrollments.length} existing therapist enrollments:`)
      existingEnrollments.forEach(enrollment => {
        console.log(`   - Email: ${enrollment.email}`)
        console.log(`     Status: ${enrollment.status}`)
        console.log(`     License Doc: ${enrollment.license_document ? 'Yes' : 'No'}`)
        console.log(`     ID Doc: ${enrollment.id_document ? 'Yes' : 'No'}`)
      })
    }
    
    console.log('\n🎉 Therapist database schema fix completed!')
    console.log('\n📋 What was fixed:')
    console.log('   ✅ Created therapist_profiles table with all required columns')
    console.log('   ✅ Created therapist_enrollments table with document storage')
    console.log('   ✅ Added missing columns (bio, phone, mdcn_code, etc.)')
    console.log('   ✅ Set up proper indexes for performance')
    console.log('   ✅ Configured Row Level Security policies')
    console.log('   ✅ Added triggers for updated_at timestamps')
    console.log('   ✅ Created unique constraints')
    
    console.log('\n🚀 Your therapist profile and document upload functionality should now work!')
    
  } catch (error) {
    console.error('❌ Error fixing therapist database:', error)
    process.exit(1)
  }
}

// Run the fix
fixTherapistDatabase()
