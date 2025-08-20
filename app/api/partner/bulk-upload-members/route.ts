import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface MemberData {
  name: string
  email: string
  phone?: string
  department?: string
  position?: string
  credits?: number
  package?: string
}

interface UploadResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const { members } = await request.json()
    
    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: 'No members data provided' },
        { status: 400 }
      )
    }

    const result: UploadResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    // Process each member
    for (let i = 0; i < members.length; i++) {
      const member = members[i]
      const rowNumber = i + 2 // +2 because Excel is 1-indexed and has header

      try {
        // Validate required fields
        if (!member.name || !member.email) {
          result.failed++
          result.errors.push({
            row: rowNumber,
            field: !member.name ? 'name' : 'email',
            message: !member.name ? 'Name is required' : 'Email is required'
          })
          continue
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('global_users')
          .select('id')
          .eq('email', member.email)
          .single()

        if (existingUser) {
          result.failed++
          result.errors.push({
            row: rowNumber,
            field: 'email',
            message: 'User with this email already exists'
          })
          continue
        }

        // Create user record
        const { data: newUser, error: userError } = await supabase
          .from('global_users')
          .insert({
            email: member.email,
            full_name: member.name,
            phone: member.phone || null,
            user_type: 'individual',
            partner_id: null, // Will be set by partner context
            is_active: true,
            metadata: {
              department: member.department,
              position: member.position,
              uploaded_via: 'bulk_upload',
              upload_date: new Date().toISOString()
            }
          })
          .select()
          .single()

        if (userError) {
          result.failed++
          result.errors.push({
            row: rowNumber,
            field: 'general',
            message: `Failed to create user: ${userError.message}`
          })
          continue
        }

        // Assign credits if specified
        if (member.credits && member.credits > 0) {
          const { error: creditError } = await supabase.rpc('add_user_credits', {
            p_user_id: newUser.id,
            p_user_type: 'individual',
            p_credits: member.credits,
            p_transaction_type: 'bulk_upload',
            p_reference_id: `bulk_upload_${Date.now()}`,
            p_description: `Credits assigned via bulk upload by partner`,
            p_metadata: {
              package: member.package,
              department: member.department,
              position: member.position
            }
          })

          if (creditError) {
            console.error('Credit assignment error:', creditError)
            // Don't fail the entire upload for credit errors
            result.errors.push({
              row: rowNumber,
              field: 'credits',
              message: `User created but credit assignment failed: ${creditError.message}`
            })
          }
        }

        result.success++

      } catch (error) {
        console.error(`Error processing member ${i + 1}:`, error)
        result.failed++
        result.errors.push({
          row: rowNumber,
          field: 'general',
          message: 'Unexpected error occurred'
        })
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Bulk upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
