import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'
import { createServerClient } from '@/lib/supabase'
import { createMagicLinkForAuthType } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

// Type assertion for FormData to avoid TypeScript issues

const supabase = createServerClient()

// Process records in batches to avoid overwhelming the database
const BATCH_SIZE = 10

interface MemberData {
  rowNumber: number
  partner_id: string
  first_name: string
  email: string
  status_type: string
  cader_level: string
  phone: string | null
  department: string | null
  employee_id: string | null
}

async function processBatch(
  batch: MemberData[],
  partnerId: string
): Promise<{ success: number; errors: string[]; members: any[] }> {
  const errors: string[] = []
  const members: any[] = []
  let successCount = 0

  // Process all records in the batch in parallel
  const results = await Promise.allSettled(
    batch.map(async (memberData) => {
      try {
        // Check if member already exists
        const { data: existingMember } = await supabase
          .from('partner_members')
          .select('id')
          .eq('email', memberData.email.toLowerCase())
          .eq('partner_id', partnerId)
          .single()

        if (existingMember) {
          return {
            success: false,
            error: `Row ${memberData.rowNumber}: Member with email ${memberData.email} already exists`
          }
        }

        // Create member
        const memberInsert = {
          partner_id: memberData.partner_id,
          first_name: memberData.first_name,
          email: memberData.email.toLowerCase(),
          status_type: memberData.status_type,
          cader_level: memberData.cader_level,
          phone: memberData.phone,
          department: memberData.department,
          employee_id: memberData.employee_id,
          status: 'pending',
          credits_assigned: 0,
          created_at: new Date().toISOString()
        }

        const { data: newMember, error: createError } = await supabase
          .from('partner_members')
          .insert(memberInsert)
          .select()
          .single()

        if (createError) {
          console.error('Error creating member:', createError)
          return {
            success: false,
            error: `Row ${memberData.rowNumber}: Failed to create member - ${createError.message}`
          }
        }

        // Create user account for the member
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            id: uuidv4(),
            email: memberData.email.toLowerCase(),
            full_name: memberData.first_name,
            user_type: 'individual',
            is_verified: false,
            is_active: true,
            credits: 0,
            package_type: 'Partner Member',
            partner_member_id: newMember.id,
            partner_id: partnerId,
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
          // Rollback: delete member if user creation failed
          await supabase.from('partner_members').delete().eq('id', newMember.id)
          return {
            success: false,
            error: `Row ${memberData.rowNumber}: Failed to create user account - ${userError.message}`
          }
        }

        // Send magic link asynchronously (don't wait for it to complete)
        // This prevents blocking the upload process
        createMagicLinkForAuthType(
          memberData.email.toLowerCase(),
          'individual',
          'login',
          {
            user_type: 'individual',
            user_id: userData.id,
            partner_member_id: newMember.id,
            partner_id: partnerId
          }
        ).then((magicLinkResult) => {
          if (magicLinkResult.success) {
            console.log(`✅ Magic link sent to ${memberData.email}`)
          } else {
            console.error(`❌ Magic link failed for ${memberData.email}:`, magicLinkResult.error)
          }
        }).catch((error) => {
          console.error(`❌ Error sending magic link to ${memberData.email}:`, error)
        })

        return {
          success: true,
          member: {
            name: memberData.first_name,
            email: memberData.email,
            status_type: memberData.status_type,
            cader_level: memberData.cader_level,
            status: 'Created - magic link sending'
          }
        }
      } catch (error) {
        console.error(`Error processing row ${memberData.rowNumber}:`, error)
        return {
          success: false,
          error: `Row ${memberData.rowNumber}: Processing error - ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    })
  )

  // Process results
  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value.success) {
        successCount++
        if (result.value.member) {
          members.push(result.value.member)
        }
      } else {
        errors.push(result.value.error || 'Unknown error')
      }
    } else {
      errors.push(`Processing error: ${result.reason}`)
    }
  }

  return { success: successCount, errors, members }
}

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

    // Parse and validate all records first
    const validStatusTypes = ['doctor', 'student']
    const allRecords: MemberData[] = []
    const validationErrors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim())
        const rowData: MemberData = {
          rowNumber: i + 1,
          partner_id: partnerId,
          first_name: values[headers.indexOf('firstname')] || '',
          email: values[headers.indexOf('email')] || '',
          status_type: values[headers.indexOf('statustype')] || '',
          cader_level: values[headers.indexOf('caderlevel')] || '',
          phone: values[headers.indexOf('phone')] || null,
          department: values[headers.indexOf('department')] || null,
          employee_id: values[headers.indexOf('employeeid')] || null
        }

        // Validate required fields
        if (!rowData.first_name || !rowData.email || !rowData.status_type || !rowData.cader_level) {
          validationErrors.push(`Row ${rowData.rowNumber}: Missing required fields (firstname, email, statustype, caderlevel)`)
          continue
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(rowData.email)) {
          validationErrors.push(`Row ${rowData.rowNumber}: Invalid email format`)
          continue
        }

        // Validate status type
        if (!validStatusTypes.includes(rowData.status_type.toLowerCase())) {
          validationErrors.push(`Row ${rowData.rowNumber}: Invalid status type. Must be 'doctor' or 'student'`)
          continue
        }

        allRecords.push(rowData)
      } catch (error) {
        validationErrors.push(`Row ${i + 1}: Failed to parse row`)
      }
    }

    if (allRecords.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid records to process',
        errors: validationErrors
      }, { status: 400 })
    }

    console.log(`📄 Processing ${allRecords.length} valid records in batches of ${BATCH_SIZE}`)

    // Process records in batches
    const allMembers: any[] = []
    const allErrors: string[] = [...validationErrors]
    let totalSuccess = 0

    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
      const batch = allRecords.slice(i, i + BATCH_SIZE)
      console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records)`)
      
      const batchResult = await processBatch(batch, partnerId)
      totalSuccess += batchResult.success
      allMembers.push(...batchResult.members)
      allErrors.push(...batchResult.errors)
    }

    console.log(`✅ Upload completed: ${totalSuccess} successful, ${allErrors.length} errors`)

    return NextResponse.json({
      success: true,
      successfulRecords: totalSuccess,
      failedRecords: allErrors.length,
      total: lines.length - 1,
      uploaded: totalSuccess,
      errors: allErrors.slice(0, 10), // Limit errors to first 10
      members: allMembers.slice(0, 5) // Show first 5 successful uploads
    })

  } catch (error) {
    console.error('Error in CSV upload:', error)
    return NextResponse.json({ 
      error: 'Failed to process CSV file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
