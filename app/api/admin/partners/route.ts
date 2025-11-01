import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch partners from users table
    const { data: partnerUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'partner')
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    // Transform the data to match the expected interface
    const transformedPartners = partnerUsers?.map(user => {
      return {
        id: user.id,
        name: user.full_name || user.company_name || 'Unknown Partner',
        email: user.email,
        phone: user.phone || null,
        memberCount: 0, // Will be calculated from partner members
        totalCredits: user.partner_credits || 0,
        usedCredits: 0, // Will be calculated from credit transactions
        status: user.partner_status || (user.is_active ? 'active' : 'inactive'),
        is_verified: user.is_verified || false,
        created_at: user.created_at,
        lastActivity: user.last_login_at || user.updated_at
      }
    }) || []

    return NextResponse.json(transformedPartners)
  } catch (error) {
    console.error('Error fetching partners:', error)
    return NextResponse.json([], { status: 500 })
  }
}
