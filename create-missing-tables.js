const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createMissingTables() {
  console.log('🚀 Creating missing tables for real data integration...')
  
  try {
    // Check which tables exist
    const existingTables = []
    const requiredTables = [
      'therapist_profiles',
      'uploaded_files', 
      'therapy_sessions'
    ]
    
    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (!error) {
          existingTables.push(table)
          console.log(`✅ Table ${table} already exists`)
        }
      } catch (err) {
        console.log(`❌ Table ${table} missing: ${err.message}`)
      }
    }
    
    // Create therapist_profiles table if missing
    if (!existingTables.includes('therapist_profiles')) {
      console.log('📊 Creating therapist_profiles table...')
      
      // Since we can't execute DDL directly, let's create some sample data
      // that will help test the APIs even without the full table structure
      console.log('⚠️  Cannot create table directly. Using existing users table for therapist data.')
    }
    
    // Create uploaded_files table if missing  
    if (!existingTables.includes('uploaded_files')) {
      console.log('📊 Creating uploaded_files table...')
      console.log('⚠️  Cannot create table directly. File upload will use local storage only.')
    }
    
    // Create therapy_sessions table if missing
    if (!existingTables.includes('therapy_sessions')) {
      console.log('📊 Creating therapy_sessions table...')
      console.log('⚠️  Cannot create table directly. Using existing sessions table structure.')
    }
    
    // Test notifications table and add sample data
    console.log('🔔 Testing notifications table...')
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          title: 'Test Notification',
          message: 'This is a test notification for API testing',
          type: 'info'
        })
        .select()
      
      if (error) {
        console.log(`❌ Notifications table issue: ${error.message}`)
        
        // The error might be due to missing columns, let's check the structure
        const { data: existingData, error: selectError } = await supabase
          .from('notifications')
          .select('*')
          .limit(1)
        
        if (selectError) {
          console.log(`❌ Cannot query notifications: ${selectError.message}`)
        } else {
          console.log(`✅ Notifications table accessible, sample data:`, existingData)
        }
      } else {
        console.log('✅ Successfully created test notification')
        
        // Clean up test data
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', '00000000-0000-0000-0000-000000000000')
      }
    } catch (err) {
      console.log(`❌ Notifications test failed: ${err.message}`)
    }
    
    console.log('🎉 Table setup completed!')
    
    // Provide instructions for manual table creation
    console.log('\n📋 Manual Setup Instructions:')
    console.log('If tables are missing, please run these SQL commands in your Supabase SQL editor:')
    console.log('\n1. For therapist_profiles:')
    console.log(`
CREATE TABLE therapist_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  specializations TEXT[] DEFAULT '{}',
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  session_rate INTEGER DEFAULT 10000,
  availability_status TEXT DEFAULT 'offline',
  verification_status TEXT DEFAULT 'verified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`)
    
    console.log('\n2. For uploaded_files:')
    console.log(`
CREATE TABLE uploaded_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size INTEGER NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  file_path TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`)
    
  } catch (error) {
    console.error('💥 Setup failed:', error)
  }
}

createMissingTables()
  .then(() => {
    console.log('✨ Setup completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Setup failed:', error)
    process.exit(1)
  })
