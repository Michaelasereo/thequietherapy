import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'
import { createServerClient } from '@/lib/supabase'

const supabase = createServerClient()

export async function GET() {
  try {
    // Secure authentication check
    const authResult = await requireApiAuth(['partner'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const partnerId = session.user.id // This is now TRUSTED and verified

    // Get partner members
    const { data: members, error: membersError } = await supabase
      .from('partner_members')
      .select(`
        id,
        first_name,
        email,
        credits_assigned,
        status,
        created_at
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return NextResponse.json([])
    }

    // Transform the data to match the expected interface
    const transformedMembers = members?.map(member => ({
      id: member.id,
      name: member.first_name,
      email: member.email,
      creditsAssigned: member.credits_assigned || 0,
      sessionsUsed: 0, // TODO: Get from sessions table
      status: member.status || 'pending',
      joinedAt: member.created_at
    })) || []

    console.log('📊 Returning members:', transformedMembers.length)
    return NextResponse.json(transformedMembers)

  } catch (error) {
    console.error('Error in partner members:', error)
    return NextResponse.json([], { status: 500 })
  }
}
