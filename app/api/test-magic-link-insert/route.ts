import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    // Try to insert a test magic link
    const testMagicLink = {
      email: 'test@example.com',
      token: randomUUID(),
      type: 'signup',
      metadata: { first_name: 'Test' },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    }

    const { data: insertedLink, error: insertError } = await supabase
      .from('magic_links')
      .insert(testMagicLink)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ 
        error: 'Failed to insert magic link', 
        details: insertError,
        testData: testMagicLink
      })
    }

    // If successful, let's delete the test record
    await supabase
      .from('magic_links')
      .delete()
      .eq('id', insertedLink.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Magic link insert test successful',
      insertedLink
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error 
    })
  }
}
