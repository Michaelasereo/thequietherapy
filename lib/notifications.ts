import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface NotificationData {
  user_id: string
  user_type: 'individual' | 'therapist' | 'partner' | 'admin'
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  category?: 'session_booking' | 'session_reminder' | 'session_cancelled' | 'payment_received' | 'payment_failed' | 'therapist_approved' | 'therapist_rejected' | 'new_client' | 'credits_low' | 'credits_added' | 'general'
  action_url?: string
  metadata?: any
}

// Create a notification
export async function createNotification(data: NotificationData): Promise<{ success: boolean; notification_id?: string; error?: string }> {
  try {
    console.log('📢 Creating notification:', data)

    const { data: notification, error } = await supabase.rpc('create_notification', {
      p_user_id: data.user_id,
      p_user_type: data.user_type,
      p_title: data.title,
      p_message: data.message,
      p_type: data.type || 'info',
      p_category: data.category || 'general',
      p_action_url: data.action_url,
      p_metadata: data.metadata
    })

    if (error) {
      console.error('❌ Error creating notification:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Notification created:', notification)
    return { success: true, notification_id: notification }
  } catch (error) {
    console.error('❌ createNotification error:', error)
    return { success: false, error: 'Failed to create notification' }
  }
}



// Create notification for specific events
export async function createSessionBookingNotification(userId: string, userType: string, sessionId: string, therapistName: string, sessionDate: string): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    user_id: userId,
    user_type: userType as any,
    title: 'Session Booked Successfully',
    message: `Your session with ${therapistName} has been booked for ${sessionDate}`,
    type: 'success',
    category: 'session_booking',
    action_url: `/dashboard/sessions/${sessionId}`,
    metadata: { session_id: sessionId, therapist_name: therapistName, session_date: sessionDate }
  })
}

export async function createSessionReminderNotification(userId: string, userType: string, sessionId: string, sessionDate: string): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    user_id: userId,
    user_type: userType as any,
    title: 'Session Reminder',
    message: `You have a session scheduled in 30 minutes`,
    type: 'info',
    category: 'session_reminder',
    action_url: `/dashboard/sessions/${sessionId}`,
    metadata: { session_id: sessionId, session_date: sessionDate }
  })
}

export async function createPaymentReceivedNotification(userId: string, userType: string, amount: number): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    user_id: userId,
    user_type: userType as any,
    title: 'Payment Received',
    message: `Payment of ₦${amount.toLocaleString()} has been received successfully`,
    type: 'success',
    category: 'payment_received',
    action_url: '/dashboard/credits',
    metadata: { amount, currency: 'NGN' }
  })
}

export async function createTherapistApprovedNotification(userId: string, therapistName: string): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    user_id: userId,
    user_type: 'therapist',
    title: 'Application Approved',
    message: `Congratulations! Your therapist application has been approved. You can now start accepting clients.`,
    type: 'success',
    category: 'therapist_approved',
    action_url: '/therapist/dashboard',
    metadata: { therapist_name: therapistName }
  })
}
