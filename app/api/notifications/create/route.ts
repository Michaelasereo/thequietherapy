import { NextRequest, NextResponse } from 'next/server'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, user_type, title, message, type, category, action_url, metadata } = body

    if (!user_id || !user_type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await createNotification({
      user_id,
      user_type,
      title,
      message,
      type: type || 'info',
      category: category || 'general',
      action_url,
      metadata
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        notification_id: result.notification_id
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Create notification API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
