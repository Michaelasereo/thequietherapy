#!/usr/bin/env node

/**
 * Check Current Table Structure
 * This script checks what columns exist in the therapist tables
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableStructure() {
  try {
    console.log('🔍 Checking current table structure...')
    
    // Check therapist_profiles table structure
    console.log('\n📋 therapist_profiles table:')
    const { data: profilesData, error: profilesError } = await supabase
      .from('therapist_profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Error accessing therapist_profiles:', profilesError.message)
    } else {
      console.log('✅ therapist_profiles table exists')
      if (profilesData && profilesData.length > 0) {
        console.log('📊 Sample record columns:', Object.keys(profilesData[0]))
      }
    }
    
    // Check therapist_enrollments table structure
    console.log('\n📋 therapist_enrollments table:')
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .limit(1)
    
    if (enrollmentsError) {
      console.error('❌ Error accessing therapist_enrollments:', enrollmentsError.message)
    } else {
      console.log('✅ therapist_enrollments table exists')
      if (enrollmentsData && enrollmentsData.length > 0) {
        console.log('📊 Sample record columns:', Object.keys(enrollmentsData[0]))
      }
    }
    
    // Try to get table schema information
    console.log('\n🔍 Getting detailed table information...')
    
    // Check if user_id column exists in therapist_enrollments
    const { data: testQuery, error: testError } = await supabase
      .from('therapist_enrollments')
      .select('user_id')
      .limit(1)
    
    if (testError) {
      console.log('❌ user_id column does not exist in therapist_enrollments')
      console.log('   Error:', testError.message)
    } else {
      console.log('✅ user_id column exists in therapist_enrollments')
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error)
  }
}

checkTableStructure()
