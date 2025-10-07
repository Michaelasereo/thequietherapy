import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { partnerId, action, reason } = await request.json()

    if (!partnerId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['activate', 'deactivate', 'suspend', 'approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'activate':
        updateData = {
          ...updateData,
          is_active: true,
          partner_status: 'active',
          is_verified: true
        }
        break
      
      case 'deactivate':
        updateData = {
          ...updateData,
          is_active: false,
          partner_status: 'inactive'
        }
        break
      
      case 'suspend':
        updateData = {
          ...updateData,
          is_active: false,
          partner_status: 'suspended',
          suspension_reason: reason || 'Suspended by admin',
          suspension_date: new Date().toISOString()
        }
        break
      
      case 'approve':
        updateData = {
          ...updateData,
          partner_status: 'active',
          is_verified: true,
          is_active: true,
          approval_date: new Date().toISOString()
        }
        break
      
      case 'reject':
        updateData = {
          ...updateData,
          partner_status: 'rejected',
          is_verified: false,
          is_active: false,
          rejection_reason: reason || 'Rejected by admin',
          rejection_date: new Date().toISOString()
        }
        break
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', partnerId)
      .eq('user_type', 'partner')

    if (error) {
      console.error('Error updating partner state:', error)
      return NextResponse.json({ error: 'Failed to update partner state' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Partner ${action}ed successfully`,
      action,
      partnerId
    })

  } catch (error) {
    console.error('Error in partner-state:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 })
    }

    const { data: partner, error } = await supabase
      .from('users')
      .select('id, email, full_name, company_name, partner_status, is_active, is_verified, created_at, approval_date, suspension_date, rejection_date')
      .eq('id', partnerId)
      .eq('user_type', 'partner')
      .single()

    if (error) {
      console.error('Error fetching partner:', error)
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    return NextResponse.json(partner)

  } catch (error) {
    console.error('Error in partner-state GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
