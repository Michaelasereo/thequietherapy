import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // First, let's check if the magic_links table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('magic_links')
      .select('*', { count: 'exact' })
      .limit(1)

    if (tableError) {
      // Table doesn't exist, let's create it
      console.log('Magic links table does not exist, creating it...')
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS magic_links (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) UNIQUE NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'signup',
          metadata JSONB,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
        CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
        CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);
        
        -- Enable RLS
        ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own magic links" ON magic_links
          FOR SELECT USING (auth.email() = email);
        
        CREATE POLICY "Users can insert their own magic links" ON magic_links
          FOR INSERT WITH CHECK (auth.email() = email);
        
        CREATE POLICY "Users can update their own magic links" ON magic_links
          FOR UPDATE USING (auth.email() = email);
      `

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      
      if (createError) {
        return NextResponse.json({ 
          error: 'Failed to create magic_links table', 
          details: createError 
        })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Magic links table created successfully' 
      })
    }

    // Table exists, let's check its structure
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'magic_links' })

    return NextResponse.json({
      tableExists: true,
      columns: columns || 'Could not fetch columns',
      count: tableExists?.length || 0
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error 
    })
  }
}
