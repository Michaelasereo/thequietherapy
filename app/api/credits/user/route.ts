import { NextRequest, NextResponse } from "next/server";
import { getUserCredits, getUserCreditTransactions } from "@/lib/paystack-enhanced";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header or session
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    let userType: string = 'user';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract user info from JWT token
      const token = authHeader.substring(7);
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          userId = user.id;
        }
      } catch (error) {
        console.error('Error extracting user from token:', error);
      }
    }

    // If no user from token, try to get from query params (for testing)
    if (!userId) {
      const { searchParams } = new URL(request.url);
      userId = searchParams.get('user_id');
      userType = searchParams.get('user_type') || 'user';
    }

    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User authentication required'
        },
        { status: 401 }
      );
    }

    // Get user credits
    const credits = await getUserCredits(userId, userType);

    // Get recent transactions
    const transactions = await getUserCreditTransactions(userId, userType, 10);

    return NextResponse.json({
      success: true,
      data: {
        credits: {
          balance: credits.credits_balance,
          purchased: credits.credits_purchased,
          used: credits.credits_used,
          expired: credits.credits_expired,
          last_purchase: credits.last_credit_purchase_date
        },
        transactions: transactions.map(tx => ({
          id: tx.id,
          type: tx.transaction_type,
          amount: tx.credits_amount,
          balance_before: tx.balance_before,
          balance_after: tx.balance_after,
          description: tx.description,
          reference: tx.reference_id,
          created_at: tx.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching user credits:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch user credits'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, user_type = 'user', credits, transaction_type, description, reference_id } = body;

    if (!user_id || !credits || !transaction_type) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: user_id, credits, transaction_type'
        },
        { status: 400 }
      );
    }

    // Call the database function to add credits
    const { data, error } = await supabase.rpc('add_user_credits', {
      p_user_id: user_id,
      p_user_type: user_type,
      p_credits: credits,
      p_transaction_type: transaction_type,
      p_reference_id: reference_id,
      p_description: description,
      p_metadata: { source: 'api' }
    });

    if (error) {
      console.error('Error adding credits:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to add credits'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        new_balance: data,
        message: `Successfully added ${credits} credits`
      }
    });

  } catch (error) {
    console.error('Error in credits POST:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
