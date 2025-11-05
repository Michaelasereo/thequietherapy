import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Secure authentication check - only partners can assign credits
    const authResult = await requireApiAuth(['partner'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const partnerId = session.user.id

    // Get request body
    const body = await request.json()
    const { memberId, credits } = body

    // Validate required fields
    if (!memberId || !credits) {
      return NextResponse.json(
        { error: 'Member ID and credits are required' },
        { status: 400 }
      )
    }

    // Validate credits is a positive number
    const creditsToAssign = parseInt(String(credits), 10)
    if (isNaN(creditsToAssign) || creditsToAssign <= 0) {
      return NextResponse.json(
        { error: 'Credits must be a positive number' },
        { status: 400 }
      )
    }

    // Check if partner has enough credits
    const { data: partnerData, error: partnerError } = await supabase
      .from('users')
      .select('id, credits, user_type')
      .eq('id', partnerId)
      .eq('user_type', 'partner')
      .single()

    if (partnerError || !partnerData) {
      console.error('Partner not found:', partnerError)
      return NextResponse.json(
        { error: 'Partner account not found' },
        { status: 400 }
      )
    }

    const availableCredits = partnerData.credits || 0
    if (availableCredits < creditsToAssign) {
      return NextResponse.json(
        {
          error: `Insufficient credits. Available: ${availableCredits}, Required: ${creditsToAssign}`
        },
        { status: 400 }
      )
    }

    // Verify member belongs to this partner
    const { data: member, error: memberError } = await supabase
      .from('partner_members')
      .select('id, email, first_name, partner_id, credits_assigned')
      .eq('id', memberId)
      .eq('partner_id', partnerId)
      .single()

    if (memberError || !member) {
      console.error('Member not found or not associated with partner:', memberError)
      return NextResponse.json(
        { error: 'Member not found or does not belong to this partner' },
        { status: 404 }
      )
    }

    // Allocate credits using the database function (atomic operation)
    const { data: allocationResult, error: creditError } = await supabase
      .rpc('allocate_partner_credit', {
        p_partner_id: partnerId,
        p_employee_email: member.email.toLowerCase(),
        p_employee_name: member.first_name || member.email.split('@')[0],
        p_credits_count: creditsToAssign,
        p_expires_days: 90 // Credits expire in 90 days
      })

    if (creditError) {
      console.error('Error allocating partner credits:', creditError)
      return NextResponse.json(
        {
          error: 'Failed to allocate credits',
          details: creditError.message
        },
        { status: 500 }
      )
    }

    // Check if allocation was successful (returns boolean)
    if (!allocationResult) {
      return NextResponse.json(
        { error: 'Credit allocation failed. Insufficient credits or invalid partner.' },
        { status: 400 }
      )
    }

    // Update partner_members credits_assigned count
    const { error: updateError } = await supabase
      .from('partner_members')
      .update({
        credits_assigned: (member.credits_assigned || 0) + creditsToAssign,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)

    if (updateError) {
      console.error('Error updating member credits_assigned:', updateError)
      // Don't fail the request - credits were allocated successfully
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${creditsToAssign} credits to ${member.first_name || member.email}`,
      creditsAssigned: creditsToAssign,
      memberEmail: member.email
    })

  } catch (error) {
    console.error('Error in assign-credits:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

