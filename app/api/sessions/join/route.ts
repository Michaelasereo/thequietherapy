import { NextRequest, NextResponse } from 'next/server';
import { joinSession } from '@/lib/session-management-server';
import { SessionManager } from '@/lib/session-manager';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get user from session using SessionManager
    const session = await SessionManager.getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.id;

    console.log('🔍 API: Joining session:', sessionId, 'for user:', userId);

    // Call your existing joinSession function
    const result = await joinSession(sessionId, userId);

    if (!result.success) {
      console.error('❌ API: Join session failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to join session' },
        { status: 403 }
      );
    }

    console.log('✅ API: Session joined successfully, room URL:', result.session_url);
    console.log('🔍 API: Meeting token generated:', result.meeting_token ? 'Yes' : 'No');

    // Return the URL in a consistent structure
    return NextResponse.json({
      success: true,
      data: {
        room_url: result.session_url, // Use consistent naming: 'room_url'
        room_name: result.room_name,
        meeting_token: result.meeting_token
      }
    });

  } catch (error) {
    console.error('❌ Join session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}