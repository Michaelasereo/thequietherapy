#!/usr/bin/env node

/**
 * Create therapist-documents storage bucket in Supabase
 * 
 * This script creates the storage bucket needed for ID document uploads
 * during therapist enrollment.
 * 
 * Usage:
 *   node scripts/create-therapist-documents-bucket.js
 * 
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBucket() {
  console.log('🔧 Creating therapist-documents storage bucket...\n')

  try {
    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      throw listError
    }

    const bucketExists = existingBuckets?.some(bucket => bucket.name === 'therapist-documents')
    
    if (bucketExists) {
      console.log('✅ Bucket "therapist-documents" already exists!')
      return
    }

    // Create the bucket using SQL (Supabase Storage API doesn't have direct bucket creation)
    // We'll use the REST API approach
    console.log('📦 Creating bucket via Supabase Management API...')

    // Create bucket via REST API
    const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        name: 'therapist-documents',
        public: false, // Private bucket for security
        file_size_limit: 10485760, // 10MB
        allowed_mime_types: [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp'
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error creating bucket:', response.status, errorText)
      
      // Try alternative method using SQL
      console.log('\n🔄 Trying alternative method via SQL...')
      await createBucketViaSQL()
      return
    }

    const result = await response.json()
    console.log('✅ Bucket created successfully!')
    console.log('   Name:', result.name)
    console.log('   Public:', result.public)
    console.log('   File Size Limit:', result.file_size_limit, 'bytes (10MB)')
    console.log('   Allowed MIME Types:', result.allowed_mime_types?.join(', ') || 'All')

  } catch (error) {
    console.error('❌ Error creating bucket:', error.message)
    
    // Try SQL method as fallback
    console.log('\n🔄 Trying alternative method via SQL...')
    await createBucketViaSQL()
  }
}

async function createBucketViaSQL() {
  console.log('📝 Creating bucket via SQL...')
  
  try {
    // Insert into storage.buckets table
    const { data, error } = await supabase.rpc('create_storage_bucket', {
      bucket_name: 'therapist-documents',
      public_bucket: false,
      file_size_limit: 10485760,
      allowed_mime_types: [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ]
    })

    if (error) {
      // If RPC doesn't exist, try direct SQL
      console.log('⚠️  RPC function not found, trying direct SQL insert...')
      console.log('\n📋 Please run this SQL in your Supabase SQL Editor:')
      console.log(`
-- Create therapist-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'therapist-documents',
  'therapist-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Verify bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'therapist-documents';
      `)
      throw new Error('Please create bucket manually using the SQL above')
    }

    console.log('✅ Bucket created via SQL!')
    
  } catch (error) {
    console.error('❌ SQL method also failed:', error.message)
    console.log('\n💡 Manual Creation Steps:')
    console.log('1. Go to Supabase Dashboard → Storage')
    console.log('2. Click "+ New bucket"')
    console.log('3. Configure:')
    console.log('   - Name: therapist-documents')
    console.log('   - Public: No (private)')
    console.log('   - File Size Limit: 10 MB')
    console.log('   - Allowed MIME Types: application/pdf, image/jpeg, image/jpg, image/png, image/webp')
    console.log('4. Click "Create bucket"')
  }
}

// Run the script
createBucket()
  .then(() => {
    console.log('\n✅ Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

