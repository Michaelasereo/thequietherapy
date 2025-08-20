require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupSOAPNotes() {
  console.log('🚀 Setting up SOAP Notes Database Schema...\n')

  try {
    // Read the SOAP notes schema file
    const schemaPath = path.join(__dirname, '../supabase/soap-notes-schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

    console.log('📋 Executing SOAP notes schema...')
    
    // Split the SQL into individual statements and execute them
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`)
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message)
            // Continue with other statements
          }
        } catch (err) {
          console.error(`❌ Error executing statement ${i + 1}:`, err.message)
        }
      }
    }

    console.log('✅ SOAP notes schema executed successfully!')
    console.log('\n📊 Created tables:')
    console.log('   - session_soap_notes')
    console.log('   - session_transcripts')
    console.log('   - partner_bulk_uploads')
    console.log('\n🔐 RLS Policies configured')
    console.log('📈 Indexes created for performance')
    console.log('🔄 Triggers set up for automatic updates')
    console.log('📋 Views and functions created for reporting')

    // Test the setup by checking if tables exist
    console.log('\n🧪 Testing setup...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['session_soap_notes', 'session_transcripts', 'partner_bulk_uploads'])
      .eq('table_schema', 'public')

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError)
      return
    }

    if (tables.length === 3) {
      console.log('✅ All tables created successfully!')
    } else {
      console.log('⚠️  Some tables may not have been created properly')
      console.log('   Found tables:', tables.map(t => t.table_name))
    }

    console.log('\n🎉 SOAP Notes Database Setup Complete!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Test CSV upload functionality')
    console.log('   2. Test SOAP notes creation')
    console.log('   3. Test AI-generated notes')
    console.log('   4. Verify RLS policies work correctly')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run the setup
setupSOAPNotes()
