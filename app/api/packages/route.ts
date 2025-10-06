import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { handleApiError, successResponse } from '@/lib/api-response'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/packages
 * Returns all available packages for purchase
 */
export async function GET(request: NextRequest) {
  try {
    const { data: packages, error } = await supabase
      .from('package_definitions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching packages:', error)
      throw new Error('Failed to fetch packages')
    }

    return successResponse({
      packages: packages || []
    })

  } catch (error) {
    return handleApiError(error)
  }
}
