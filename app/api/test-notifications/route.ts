import { NextResponse } from 'next/server'
import { createNotification } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const { userId, userType, notificationType } = await request.json()

    if (!userId || !userType) {
      return NextResponse.json(
        { success: false, error: 'User ID and user type are required' },
        { status: 400 }
      )
    }

    console.log('📢 Creating test notification:', { userId, userType, notificationType })

    let notificationData: any = {}

    switch (notificationType) {
      case 'session_booking':
        notificationData = {
          user_id: userId,
          user_type: userType,
          title: 'Session Booked Successfully',
          message: 'Your therapy session with Dr. Sarah Johnson has been booked for tomorrow at 2:00 PM',
          type: 'success',
          category: 'session_booking',
          action_url: '/dashboard/sessions/123',
          metadata: { session_id: '123', therapist_name: 'Dr. Sarah Johnson', session_date: '2025-08-16T14:00:00Z' }
        }
        break

      case 'payment_received':
        notificationData = {
          user_id: userId,
          user_type: userType,
          title: 'Payment Received',
          message: 'Payment of ₦15,000 has been received successfully. Your credits have been updated.',
          type: 'success',
          category: 'payment_received',
          action_url: '/dashboard/credits',
          metadata: { amount: 15000, currency: 'NGN' }
        }
        break

      case 'session_reminder':
        notificationData = {
          user_id: userId,
          user_type: userType,
          title: 'Session Reminder',
          message: 'You have a therapy session scheduled in 30 minutes. Please join the video call.',
          type: 'info',
          category: 'session_reminder',
          action_url: '/dashboard/sessions/123',
          metadata: { session_id: '123', session_date: '2025-08-15T14:00:00Z' }
        }
        break

      case 'therapist_approved':
        notificationData = {
          user_id: userId,
          user_type: 'therapist',
          title: 'Application Approved',
          message: 'Congratulations! Your therapist application has been approved. You can now start accepting clients.',
          type: 'success',
          category: 'therapist_approved',
          action_url: '/therapist/dashboard',
          metadata: { therapist_name: 'Dr. Michael Smith' }
        }
        break

      case 'credits_low':
        notificationData = {
          user_id: userId,
          user_type: userType,
          title: 'Credits Running Low',
          message: 'You have only 2 credits remaining. Please purchase more credits to continue your therapy sessions.',
          type: 'warning',
          category: 'credits_low',
          action_url: '/dashboard/credits',
          metadata: { remaining_credits: 2 }
        }
        break

      default:
        notificationData = {
          user_id: userId,
          user_type: userType,
          title: 'Test Notification',
          message: 'This is a test notification to verify the real-time system is working.',
          type: 'info',
          category: 'general',
          action_url: '/dashboard',
          metadata: { test: true }
        }
    }

    const result = await createNotification(notificationData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test notification created successfully',
        notification_id: result.notification_id
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Test notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
