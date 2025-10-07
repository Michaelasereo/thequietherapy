import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get partner ID from session (you'll need to implement session handling)
    const { data: partner, error: partnerError } = await supabase
      .from('users')
      .select('id')
      .eq('user_type', 'partner')
      .single()

    if (partnerError) {
      console.error('Error fetching partner:', partnerError)
      return NextResponse.json([])
    }

    // Get partner members
    const { data: members, error: membersError } = await supabase
      .from('partner_members')
      .select(`
        id,
        name,
        email,
        credits_assigned,
        created_at
      `)
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return NextResponse.json([])
    }

    // Transform the data to match the expected interface
    const transformedMembers = members?.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      creditsAssigned: member.credits_assigned || 0
    })) || []

    return NextResponse.json(transformedMembers)

  } catch (error) {
    console.error('Error in partner members:', error)
    return NextResponse.json([], { status: 500 })
  }
}
