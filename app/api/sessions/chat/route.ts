import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Send a chat message
export async function POST(request: NextRequest) {
  try {
    const { sessionId, message, senderId, senderName, senderType } = await request.json();

    if (!sessionId || !message || !senderId || !senderName) {
      return NextResponse.json(
        { error: 'Session ID, message, sender ID, and sender name are required' },
        { status: 400 }
      );
    }

    console.log(`Sending chat message for session: ${sessionId}`);

    // Verify session exists and is active
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('id, user_id, therapist_id, status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('Error fetching session data:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!['scheduled', 'in_progress'].includes(sessionData.status)) {
      return NextResponse.json(
        { error: 'Chat is only available during scheduled or active sessions' },
        { status: 400 }
      );
    }

    // Verify sender is either the patient or therapist for this session
    if (senderId !== sessionData.user_id && senderId !== sessionData.therapist_id) {
      return NextResponse.json(
        { error: 'Unauthorized to send messages in this session' },
        { status: 403 }
      );
    }

    // Store chat message
    const { data: chatData, error: chatError } = await supabase
      .from('session_chat')
      .insert({
        session_id: sessionId,
        sender_id: senderId,
        sender_name: senderName,
        sender_type: senderType || (senderId === sessionData.therapist_id ? 'therapist' : 'patient'),
        message: message.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (chatError) {
      console.error('Error storing chat message:', chatError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    console.log('Chat message sent successfully');

    return NextResponse.json({
      success: true,
      message: chatData,
      messageId: chatData.id,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error in chat POST API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Fetch chat messages for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching chat messages for session: ${sessionId}`);

    // Verify session exists
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('id, user_id, therapist_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('Error fetching session data:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Fetch chat messages
    const { data: chatData, error: chatError } = await supabase
      .from('session_chat')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (chatError) {
      console.error('Error fetching chat messages:', chatError);
      return NextResponse.json(
        { error: 'Failed to fetch chat messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: chatData || [],
      session: sessionData,
      message: 'Chat messages fetched successfully'
    });

  } catch (error) {
    console.error('Error in chat GET API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch chat messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
