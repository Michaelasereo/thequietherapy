import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/server-auth'
import { handleApiError, ValidationError, successResponse, validateRequired } from '@/lib/api-response'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Define CSV row interface
interface CSVRow {
  name: string
  email: string
  phone?: string
  department?: string
  position?: string
  credits?: string
  package?: string
}

// Define error interface
interface ProcessingError {
  row: number
  field?: string
  message: string
}

interface UploadResult {
  success: boolean
  uploadId: string
  totalRecords: number
  successfulRecords: number
  failedRecords: number
  errors?: ProcessingError[]
  message: string
}

// Helper function to parse CSV
function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row')
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row as CSVRow)
  }

  return rows
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Helper function to validate phone
function isValidPhone(phone: string): boolean {
  if (!phone) return true // Phone is optional
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
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

    console.log('🔍 Partner bulk upload started for:', partnerId)

    // Get request body
    const body = await request.text()
    if (!body) {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 })
    }

    const uploadId = uuidv4()
    let successfulRecords = 0
    const errors: ProcessingError[] = []

    // Check if partner exists and has credits
    const { data: partnerData, error: partnerError } = await supabase
      .from('users')
      .select('id, credits, user_type')
      .eq('id', partnerId)
      .eq('user_type', 'partner')
      .single()

    if (partnerError || !partnerData) {
      console.error('Partner not found:', partnerError)
      return NextResponse.json({ error: 'Partner account not found' }, { status: 400 })
    }

    const availableCredits = partnerData.credits || 0
    console.log('📊 Available partner credits:', availableCredits)

    // Parse CSV
    let records: CSVRow[]
    try {
      records = parseCSV(body)
      console.log('📄 Parsed CSV records:', records.length)
    } catch (parseError) {
      console.error('CSV parse error:', parseError)
      return NextResponse.json({ error: 'Invalid CSV format' }, { status: 400 })
    }

    // Validate and process each record
    let totalRequestedCredits = 0
    const validRecords: Array<CSVRow & { creditsToAssign: number }> = []
    
    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNumber = i + 2 // +2 because of header row and 0-based index
      
      console.log(`🔍 Processing row ${rowNumber}:`, row)
      
      // Validate required fields
      if (!row.name || !row.email) {
        errors.push({
          row: rowNumber,
          message: 'Missing required fields: name and email are required'
        })
        continue
      }

      // Validate email format
      if (!isValidEmail(row.email)) {
        errors.push({
          row: rowNumber,
          field: 'email',
          message: 'Invalid email format'
        })
        continue
      }

      // Validate phone format
      if (row.phone && !isValidPhone(row.phone)) {
        errors.push({
          row: rowNumber,
          field: 'phone',
          message: 'Invalid phone format'
        })
        continue
      }

      // Validate credits (if provided)
      let creditsToAssign = 5 // Default value
      if (row.credits) {
        const parsedCredits = parseInt(row.credits, 10)
        if (isNaN(parsedCredits) || parsedCredits < 0) {
          errors.push({
            row: rowNumber,
            field: 'credits',
            message: 'Credits must be a positive number'
          })
          continue
        }
        creditsToAssign = parsedCredits
      }

      totalRequestedCredits += creditsToAssign
      validRecords.push({ ...row, creditsToAssign })
    }

    console.log('💳 Total credits requested:', totalRequestedCredits)
    console.log('💳 Available credits:', availableCredits)

    // Check if partner has enough credits
    if (totalRequestedCredits > availableCredits) {
      return NextResponse.json({ 
        error: `Insufficient credits. Available: ${availableCredits}, Required: ${totalRequestedCredits}` 
      }, { status: 400 })
    }

    // Process valid records
    for (const record of validRecords) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', record.email.toLowerCase())
          .single()

        let userId = existingUser?.id

        if (!userId) {
          // Create new user (no credits assigned here - done via partner credits)
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: uuidv4(),
              email: record.email.toLowerCase(),
              full_name: record.name,
              user_type: 'individual',
              partner_id: partnerId,
              is_verified: false,
              is_active: true
            })
            .select('id')
            .single()

          if (createError) {
            console.error('Error creating user:', createError)
            errors.push({
              row: validRecords.indexOf(record) + 2,
              message: `Failed to create user: ${createError.message}`
            })
            continue
          }

          userId = newUser.id
          console.log('✅ Created new user:', userId)
        } else {
          // Update existing user to be part of this partner
          const { error: updateError } = await supabase
            .from('users')
            .update({
              partner_id: partnerId
            })
            .eq('id', userId)

          if (updateError) {
            console.error('Error updating user:', updateError)
            errors.push({
              row: validRecords.indexOf(record) + 2,
              message: `Failed to update user: ${updateError.message}`
            })
            continue
          }
          console.log('✅ Updated existing user:', userId)
        }

        // Allocate partner credits using the proper credit system
        const { error: creditError } = await supabase
          .rpc('allocate_partner_credit', {
            p_partner_id: partnerId,
            p_employee_email: record.email.toLowerCase(),
            p_employee_name: record.name,
            p_credits_count: record.creditsToAssign,
            p_expires_days: 90 // Credits expire in 90 days
          })

        if (creditError) {
          console.error('Error allocating partner credits:', creditError)
          errors.push({
            row: validRecords.indexOf(record) + 2,
            message: `User created but failed to allocate credits: ${creditError.message}`
          })
          continue
        }

        console.log(`✅ Allocated ${record.creditsToAssign} credits to user:`, userId)
        successfulRecords++
      } catch (recordError) {
        console.error('Error processing record:', recordError)
        errors.push({
          row: validRecords.indexOf(record) + 2,
          message: `System error: ${recordError instanceof Error ? recordError.message : 'Unknown error'}`
        })
      }
    }

    // Update partner's used credits
    if (successfulRecords > 0) {
      const creditsUsed = validRecords.slice(0, successfulRecords).reduce((sum, record) => sum + record.creditsToAssign, 0)
      
      const { error: creditUpdateError } = await supabase
        .from('users')
        .update({ credits: availableCredits - creditsUsed })
        .eq('id', partnerId)

      if (creditUpdateError) {
        console.error('Error updating partner credits:', creditUpdateError)
      } else {
        console.log('💳 Updated partner credits, used:', creditsUsed)
      }
    }

    // Prepare response
    const result: UploadResult = {
      success: true,
      uploadId,
      totalRecords: records.length,
      successfulRecords,
      failedRecords: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully processed ${successfulRecords} of ${records.length} records`
    }

    console.log('✅ Bulk upload completed:', result)
    return NextResponse.json(result)

  } catch (error) {
    return handleApiError(error)
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Set size limit for CSV files
    },
  },
}