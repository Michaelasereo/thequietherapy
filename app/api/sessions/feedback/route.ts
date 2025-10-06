import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Submit session feedback
export async function POST(request: NextRequest) {
  try {
    const { 
      sessionId, 
      rating, 
      technicalQuality, 
      therapistQuality, 
      comments, 
      wouldRecommend 
    } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    console.log(`Submitting feedback for session: ${sessionId}`);

    // Verify session exists and is completed
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

    if (sessionData.status !== 'completed') {
      return NextResponse.json(
        { error: 'Feedback can only be submitted for completed sessions' },
        { status: 400 }
      );
    }

    // Check if feedback already exists
    const { data: existingFeedback, error: existingError } = await supabase
      .from('session_feedback')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback already submitted for this session' },
        { status: 400 }
      );
    }

    // Submit feedback
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('session_feedback')
      .insert({
        session_id: sessionId,
        user_id: sessionData.user_id,
        therapist_id: sessionData.therapist_id,
        rating,
        technical_quality: technicalQuality || rating,
        therapist_quality: therapistQuality || rating,
        comments: comments || '',
        would_recommend: wouldRecommend !== undefined ? wouldRecommend : rating >= 4,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error submitting feedback:', feedbackError);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    // Update therapist rating (calculate average)
    try {
      const { data: allFeedback, error: ratingError } = await supabase
        .from('session_feedback')
        .select('rating, therapist_quality')
        .eq('therapist_id', sessionData.therapist_id);

      if (!ratingError && allFeedback && allFeedback.length > 0) {
        const totalRating = allFeedback.reduce((sum, f) => sum + (f.rating || 0), 0);
        const totalTherapistQuality = allFeedback.reduce((sum, f) => sum + (f.therapist_quality || 0), 0);
        const avgRating = totalRating / allFeedback.length;
        const avgTherapistQuality = totalTherapistQuality / allFeedback.length;

        // Update therapist profile with new average ratings
        await supabase
          .from('users')
          .update({
            rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
            therapist_quality_rating: Math.round(avgTherapistQuality * 10) / 10,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionData.therapist_id)
          .eq('user_type', 'therapist');
      }
    } catch (ratingUpdateError) {
      console.error('Error updating therapist rating:', ratingUpdateError);
      // Don't fail the request if rating update fails
    }

    console.log('Feedback submitted successfully');

    return NextResponse.json({
      success: true,
      feedback: feedbackData,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error in feedback API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Fetch session feedback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const therapistId = searchParams.get('therapistId');

    if (!sessionId && !therapistId) {
      return NextResponse.json(
        { error: 'Session ID or Therapist ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('session_feedback')
      .select(`
        *,
        sessions:session_id(
          id,
          scheduled_date,
          scheduled_time,
          users:user_id(full_name, email)
        )
      `);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (therapistId) {
      query = query.eq('therapist_id', therapistId);
    }

    const { data: feedbackData, error: feedbackError } = await query
      .order('created_at', { ascending: false });

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: feedbackData,
      message: 'Feedback fetched successfully'
    });

  } catch (error) {
    console.error('Error in feedback GET API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch feedback',
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