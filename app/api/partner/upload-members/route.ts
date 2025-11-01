import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'
import { createServerClient } from '@/lib/supabase'
import { createMagicLinkForAuthType } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

// Type assertion for FormData to avoid TypeScript issues

const supabase = createServerClient()

export async function POST(request: NextRequest) {
  try {
    // SECURE Authentication Check - only partners can upload members
    const authResult = await requireApiAuth(['partner'])
    if ('error' in authResult) {
      return authResult.error
    }

    const { session } = authResult
    const partnerId = session.user.id // This is now TRUSTED and verified

    console.log('🔍 Partner CSV upload started for:', partnerId)

    let text: string
    
    // Check if it's a file upload or direct CSV content
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = (formData as any).get('file') as File | null
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }
      
      text = await file.text()
    } else {
      // Direct CSV content
      text = await request.text()
    }
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Validate required columns
    const requiredColumns = ['firstname', 'email', 'statustype', 'caderlevel']
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}. Required: firstname, email, statustype, caderlevel` 
      }, { status: 400 })
    }

    const members = []
    const errors = []
    let uploaded = 0

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim())
        const memberData: any = {
          partner_id: partnerId,
          first_name: values[headers.indexOf('firstname')] || '',
          email: values[headers.indexOf('email')] || '',
          status_type: values[headers.indexOf('statustype')] || '',
          cader_level: values[headers.indexOf('caderlevel')] || '',
          phone: values[headers.indexOf('phone')] || null,
          department: values[headers.indexOf('department')] || null,
          employee_id: values[headers.indexOf('employeeid')] || null,
          status: 'pending',
          credits_assigned: 0,
          created_at: new Date().toISOString()
        }

        // Validate required fields
        if (!memberData.first_name || !memberData.email || !memberData.status_type || !memberData.cader_level) {
          errors.push(`Row ${i + 1}: Missing required fields (firstname, email, statustype, caderlevel)`)
          continue
        }

        // Validate status type
        const validStatusTypes = ['doctor', 'student']
        if (!validStatusTypes.includes(memberData.status_type.toLowerCase())) {
          errors.push(`Row ${i + 1}: Invalid status type. Must be 'doctor' or 'student'`)
          continue
        }

        // Check if member already exists
        const { data: existingMember } = await supabase
          .from('partner_members')
          .select('id')
          .eq('email', memberData.email)
          .eq('partner_id', partnerId)
          .single()

        if (existingMember) {
          errors.push(`Row ${i + 1}: Member with email ${memberData.email} already exists`)
          continue
        }

        // Create member
        const { data: newMember, error: createError } = await supabase
          .from('partner_members')
          .insert(memberData)
          .select()
          .single()

        if (createError) {
          console.error('Error creating member:', createError)
          errors.push(`Row ${i + 1}: Failed to create member - ${createError.message}`)
          continue
        }

        // Create user account for the member with medical/educational details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            email: memberData.email,
            full_name: memberData.first_name,
            user_type: 'individual',
            is_verified: false,
            is_active: true,
            credits: 0,
            package_type: 'Partner Member',
            partner_member_id: newMember.id,
            // Store medical/educational details for biodata pre-population
            onboarding_data: {
              status_type: memberData.status_type,
              cader_level: memberData.cader_level,
              phone: memberData.phone,
              department: memberData.department,
              employee_id: memberData.employee_id,
              uploaded_by_partner: true,
              partner_id: partnerId
            }
          })
          .select()
          .single()

        if (userError) {
          console.error('Error creating user:', userError)
          errors.push(`Row ${i + 1}: Failed to create user account - ${userError.message}`)
          continue
        }

        // Send magic link
        try {
          const magicLinkResult = await createMagicLinkForAuthType(
            memberData.email,
            'individual',
            'login',
            {
              user_type: 'individual',
              user_id: userData.id,
              partner_member_id: newMember.id
            }
          )

          if (magicLinkResult.success) {
            uploaded++
            members.push({
              name: memberData.first_name,
              email: memberData.email,
              status_type: memberData.status_type,
              cader_level: memberData.cader_level,
              status: 'Magic link sent'
            })
          } else {
            errors.push(`Row ${i + 1}: Failed to send magic link - ${magicLinkResult.error}`)
          }
        } catch (magicLinkError) {
          console.error('Error sending magic link:', magicLinkError)
          errors.push(`Row ${i + 1}: Failed to send magic link`)
        }

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        errors.push(`Row ${i + 1}: Processing error`)
      }
    }

    return NextResponse.json({
      success: true,
      successfulRecords: uploaded,
      failedRecords: errors.length,
      total: lines.length - 1,
      uploaded,
      errors: errors.slice(0, 10), // Limit errors to first 10
      members: members.slice(0, 5) // Show first 5 successful uploads
    })

  } catch (error) {
    console.error('Error in CSV upload:', error)
    return NextResponse.json({ 
      error: 'Failed to process CSV file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
