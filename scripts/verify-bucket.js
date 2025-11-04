#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyBucket() {
  console.log('🔍 Verifying therapist-documents bucket...\n')
  
  const { data: buckets, error } = await supabase.storage.listBuckets()
  
  if (error) {
    console.error('❌ Error listing buckets:', error)
    return
  }
  
  const bucket = buckets?.find(b => b.name === 'therapist-documents')
  
  if (bucket) {
    console.log('✅ Bucket found!')
    console.log('   Name:', bucket.name)
    console.log('   ID:', bucket.id)
    console.log('   Public:', bucket.public)
    console.log('   Created:', bucket.created_at)
  } else {
    console.log('❌ Bucket not found')
  }
}

verifyBucket()

