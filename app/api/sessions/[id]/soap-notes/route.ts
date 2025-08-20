import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params

    const { data: notes, error } = await supabase
      .from('session_soap_notes')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching SOAP notes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch SOAP notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notes: notes || null })

  } catch (error) {
    console.error('Error in SOAP notes GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const soapNotes = await request.json()

    // Validate required fields
    if (!soapNotes.session_id || !soapNotes.therapist_id || !soapNotes.patient_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if notes already exist
    const { data: existingNotes } = await supabase
      .from('session_soap_notes')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    let result
    if (existingNotes) {
      // Update existing notes
      const { data, error } = await supabase
        .from('session_soap_notes')
        .update({
          ...soapNotes,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error updating SOAP notes:', error)
        return NextResponse.json(
          { error: 'Failed to update SOAP notes' },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Create new notes
      const { data, error } = await supabase
        .from('session_soap_notes')
        .insert({
          ...soapNotes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating SOAP notes:', error)
        return NextResponse.json(
          { error: 'Failed to create SOAP notes' },
          { status: 500 }
        )
      }

      result = data
    }

    return NextResponse.json({ notes: result })

  } catch (error) {
    console.error('Error in SOAP notes POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
