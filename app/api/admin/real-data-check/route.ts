import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Check all tables and their data
    const results: any = {}

    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10)

    results.users = {
      count: users?.length || 0,
      data: users || [],
      error: usersError?.message
    }

    // Check therapist_enrollments table
    const { data: therapistEnrollments, error: therapistError } = await supabase
      .from('therapist_enrollments')
      .select('*')
      .limit(10)

    results.therapistEnrollments = {
      count: therapistEnrollments?.length || 0,
      data: therapistEnrollments || [],
      error: therapistError?.message
    }

    // Check sessions table
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(10)

    results.sessions = {
      count: sessions?.length || 0,
      data: sessions || [],
      error: sessionsError?.message
    }

    // Check notifications table
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(10)

    results.notifications = {
      count: notifications?.length || 0,
      data: notifications || [],
      error: notificationsError?.message
    }

    // Check credit_transactions table
    const { data: creditTransactions, error: creditError } = await supabase
      .from('credit_transactions')
      .select('*')
      .limit(10)

    results.creditTransactions = {
      count: creditTransactions?.length || 0,
      data: creditTransactions || [],
      error: creditError?.message
    }

    // Check patient tables
    const { data: patientBiodata, error: biodataError } = await supabase
      .from('patient_biodata')
      .select('*')
      .limit(5)

    results.patientBiodata = {
      count: patientBiodata?.length || 0,
      data: patientBiodata || [],
      error: biodataError?.message
    }

    const { data: patientFamilyHistory, error: familyError } = await supabase
      .from('patient_family_history')
      .select('*')
      .limit(5)

    results.patientFamilyHistory = {
      count: patientFamilyHistory?.length || 0,
      data: patientFamilyHistory || [],
      error: familyError?.message
    }

    const { data: patientSocialHistory, error: socialError } = await supabase
      .from('patient_social_history')
      .select('*')
      .limit(5)

    results.patientSocialHistory = {
      count: patientSocialHistory?.length || 0,
      data: patientSocialHistory || [],
      error: socialError?.message
    }

    // Check other tables
    const { data: faqs, error: faqsError } = await supabase
      .from('faqs')
      .select('*')
      .limit(5)

    results.faqs = {
      count: faqs?.length || 0,
      data: faqs || [],
      error: faqsError?.message
    }

    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(5)

    results.blogPosts = {
      count: blogPosts?.length || 0,
      data: blogPosts || [],
      error: blogError?.message
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error checking real data:', error)
    return NextResponse.json({ error: 'Failed to check real data' }, { status: 500 })
  }
}
