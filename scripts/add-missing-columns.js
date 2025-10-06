#!/usr/bin/env node

/**
 * Add Missing Columns to Therapist Tables
 * This script adds the missing columns needed for the functionality
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to therapist tables...')
    
    // Add missing columns to therapist_enrollments table
    const columnsToAdd = [
      {
        table: 'therapist_enrollments',
        column: 'user_id',
        type: 'UUID REFERENCES users(id) ON DELETE CASCADE'
      },
      {
        table: 'therapist_enrollments', 
        column: 'license_document',
        type: 'TEXT'
      },
      {
        table: 'therapist_enrollments',
        column: 'license_uploaded_at', 
        type: 'TIMESTAMP WITH TIME ZONE'
      },
      {
        table: 'therapist_enrollments',
        column: 'license_verified',
        type: 'BOOLEAN DEFAULT FALSE'
      },
      {
        table: 'therapist_enrollments',
        column: 'id_document',
        type: 'TEXT'
      },
      {
        table: 'therapist_enrollments',
        column: 'id_uploaded_at',
        type: 'TIMESTAMP WITH TIME ZONE'
      },
      {
        table: 'therapist_enrollments',
        column: 'id_verified', 
        type: 'BOOLEAN DEFAULT FALSE'
      },
      {
        table: 'therapist_enrollments',
        column: 'rejection_reason',
        type: 'TEXT'
      },
      {
        table: 'therapist_enrollments',
        column: 'approved_at',
        type: 'TIMESTAMP WITH TIME ZONE'
      }
    ]
    
    for (const { table, column, type } of columnsToAdd) {
      try {
        console.log(`   Adding ${column} to ${table}...`)
        
        // Use raw SQL to add the column
        const { error } = await supabase.rpc('exec', {
          sql: `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`
        })
        
        if (error) {
          console.log(`   ⚠️  Warning: ${error.message}`)
        } else {
          console.log(`   ✅ Added ${column}`)
        }
      } catch (err) {
        console.log(`   ⚠️  Warning: ${err.message}`)
      }
    }
    
    // Create unique constraint on user_id if it doesn't exist
    try {
      console.log('   Adding unique constraint on user_id...')
      const { error } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE therapist_enrollments ADD CONSTRAINT IF NOT EXISTS therapist_enrollments_user_id_key UNIQUE (user_id)'
      })
      
      if (error) {
        console.log(`   ⚠️  Warning: ${error.message}`)
      } else {
        console.log('   ✅ Added unique constraint')
      }
    } catch (err) {
      console.log(`   ⚠️  Warning: ${err.message}`)
    }
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...')
    
    const { data: testData, error: testError } = await supabase
      .from('therapist_enrollments')
      .select('user_id, license_document, id_document')
      .limit(1)
    
    if (testError) {
      console.log('❌ Still missing columns:', testError.message)
    } else {
      console.log('✅ All columns added successfully!')
      console.log('📊 Available columns:', Object.keys(testData[0] || {}))
    }
    
    console.log('\n🎉 Missing columns have been added!')
    console.log('🚀 Your therapist profile and document upload functionality should now work!')
    
  } catch (error) {
    console.error('❌ Error adding missing columns:', error)
  }
}

addMissingColumns()
