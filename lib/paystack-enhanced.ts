import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Server-side only
let paystack: any = null;

if (typeof window === 'undefined') {
  try {
    const Paystack = require('paystack');
    paystack = Paystack(process.env.PAYSTACK_SECRET_KEY || '');
  } catch (error) {
    console.warn('Paystack library not available on server-side');
  }
}

export interface PaymentData {
  amount: number; // Amount in Naira
  email: string;
  reference: string;
  callback_url?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // Price in Naira
  description: string;
  popular?: boolean;
}

export interface PaymentVerificationResult {
  success: boolean;
  data?: any;
  error?: string;
  shouldRetry?: boolean;
}

export interface WebhookData {
  event: string;
  data: {
    id: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: string;
    transfer_code: string;
    titan_code: string;
    created_at: string;
    updated_at: string;
    reference: string;
    metadata: any;
    [key: string]: any;
  };
}

// Initialize Supabase client (server-side only)
let supabase: any = null;

function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase client can only be used on server-side');
  }
  
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  
  return supabase;
}

/**
 * Initialize a payment with Paystack
 * Enhanced with proper error handling and logging
 */
export async function initializePayment(data: PaymentData): Promise<PaymentVerificationResult> {
  if (typeof window !== 'undefined') {
    throw new Error('initializePayment can only be called on server-side');
  }

  if (!paystack) {
    throw new Error('Paystack not initialized');
  }

  try {
    // Validate input data
    if (!data.amount || data.amount <= 0) {
      return {
        success: false,
        error: 'Invalid amount provided',
        shouldRetry: false
      };
    }

    if (!data.email || !data.reference) {
      return {
        success: false,
        error: 'Email and reference are required',
        shouldRetry: false
      };
    }

    // Convert amount to kobo (Paystack expects amount in kobo)
    const amountInKobo = Math.round(data.amount * 100);

    // Log payment initialization
    console.log(`Initializing payment: ${data.reference} for ${data.email}, Amount: ${data.amount} NGN`);

    const response = await paystack.transaction.initialize({
      amount: amountInKobo,
      email: data.email,
      reference: data.reference,
      callback_url: data.callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/verify`,
      metadata: {
        ...data.metadata,
        source: 'trpi_platform',
        timestamp: new Date().toISOString()
      }
    });

    // Store payment transaction in database
    await storePaymentTransaction({
      user_id: data.metadata?.user_id,
      user_type: data.metadata?.user_type || 'user',
      paystack_reference: data.reference,
      amount: data.amount,
      status: 'pending',
      metadata: data.metadata
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('Paystack initialization error:', error);
    
    // Determine if this is a retryable error
    const shouldRetry = isRetryableError(error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment initialization failed',
      shouldRetry
    };
  }
}

/**
 * Verify a payment with Paystack
 * Enhanced with retry logic and comprehensive verification
 */
export async function verifyPayment(reference: string, retryCount: number = 0): Promise<PaymentVerificationResult> {
  if (typeof window !== 'undefined') {
    throw new Error('verifyPayment can only be called on server-side');
  }

  if (!paystack) {
    throw new Error('Paystack not initialized');
  }

  try {
    console.log(`Verifying payment: ${reference} (attempt ${retryCount + 1})`);

    const response = await paystack.transaction.verify(reference);
    const paymentData = response.data;

    // Update payment transaction status
    await updatePaymentTransaction(reference, {
      status: paymentData.status,
      paystack_transaction_id: paymentData.id?.toString(),
      gateway_response: JSON.stringify(paymentData),
      updated_at: new Date().toISOString()
    });

    if (paymentData.status === 'success') {
      // Process successful payment
      await processSuccessfulPayment(paymentData);
      
      return {
        success: true,
        data: paymentData
      };
    } else if (paymentData.status === 'pending' && retryCount < 3) {
      // Retry pending payments
      console.log(`Payment ${reference} is pending, will retry...`);
      return {
        success: false,
        error: 'Payment is pending',
        shouldRetry: true
      };
    } else {
      return {
        success: false,
        error: `Payment failed with status: ${paymentData.status}`,
        shouldRetry: false
      };
    }

  } catch (error) {
    console.error('Paystack verification error:', error);
    
    const shouldRetry = isRetryableError(error) && retryCount < 3;
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed',
      shouldRetry
    };
  }
}

/**
 * Verify Paystack webhook signature
 * Enhanced security with proper HMAC verification
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return false;
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(payload)
      .digest('hex');

    return hash === signature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Process webhook data
 * Enhanced with comprehensive webhook handling
 */
export async function processWebhook(webhookData: WebhookData): Promise<boolean> {
  try {
    console.log(`Processing webhook: ${webhookData.event} for reference: ${webhookData.data.reference}`);

    // Store webhook for audit trail
    await storeWebhook({
      paystack_reference: webhookData.data.reference,
      webhook_type: webhookData.event,
      payload: webhookData,
      signature_hash: 'verified', // Already verified before calling this function
      is_verified: true,
      processing_status: 'processing'
    });

    // Handle different webhook events
    switch (webhookData.event) {
      case 'charge.success':
        return await handleSuccessfulCharge(webhookData.data);
      
      case 'transfer.success':
        return await handleSuccessfulTransfer(webhookData.data);
      
      case 'transfer.failed':
        return await handleFailedTransfer(webhookData.data);
      
      case 'refund.processed':
        return await handleRefundProcessed(webhookData.data);
      
      default:
        console.log(`Unhandled webhook event: ${webhookData.event}`);
        return true;
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Update webhook status to failed
    if (webhookData.data.reference) {
      await updateWebhookStatus(webhookData.data.reference, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
    
    return false;
  }
}

/**
 * Handle successful charge webhook
 */
async function handleSuccessfulCharge(data: any): Promise<boolean> {
  try {
    // Verify the payment again to ensure consistency
    const verification = await verifyPayment(data.reference);
    
    if (verification.success) {
      // Process successful payment
      await processSuccessfulPayment(data);
      
      // Update webhook status
      await updateWebhookStatus(data.reference, 'completed');
      
      return true;
    } else {
      console.error(`Payment verification failed for ${data.reference}`);
      return false;
    }
  } catch (error) {
    console.error('Error handling successful charge:', error);
    return false;
  }
}

/**
 * Process successful payment
 */
async function processSuccessfulPayment(paymentData: any): Promise<void> {
  try {
    const { reference, amount, metadata } = paymentData;
    
    // Update payment transaction status
    await updatePaymentTransaction(reference, {
      status: 'success',
      updated_at: new Date().toISOString()
    });

    // Handle credit purchase
    if (metadata?.type === 'credits' && metadata?.credits && metadata?.user_id) {
      await addUserCredits(
        metadata.user_id,
        metadata.user_type || 'user',
        metadata.credits,
        'purchase',
        reference,
        `Credit purchase via Paystack - ${metadata.credits} credits`,
        { payment_data: paymentData }
      );
    }

    // Handle session booking
    if (metadata?.type === 'session' && metadata?.session_id) {
      await processSessionPayment(paymentData);
    }

    console.log(`Successfully processed payment: ${reference}`);
  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

/**
 * Process session payment
 */
async function processSessionPayment(paymentData: any): Promise<void> {
  try {
    const { reference, amount, metadata } = paymentData;
    
    // Calculate earnings split (example: 80% therapist, 20% platform)
    const therapistEarnings = amount * 0.8;
    const platformFee = amount * 0.2;
    
    // Create session payment record
    const { error } = await supabase
      .from('session_payments')
      .insert({
        session_id: metadata.session_id,
        user_id: metadata.user_id,
        therapist_id: metadata.therapist_id,
        payment_transaction_id: reference,
        credits_used: metadata.credits_used || 1,
        amount_paid: amount,
        therapist_earnings: therapistEarnings,
        platform_fee: platformFee,
        status: 'completed'
      });

    if (error) {
      console.error('Error creating session payment:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error processing session payment:', error);
    throw error;
  }
}

/**
 * Add credits to user account
 */
async function addUserCredits(
  userId: string,
  userType: string,
  credits: number,
  transactionType: string,
  referenceId: string,
  description: string,
  metadata: any
): Promise<void> {
  try {
    const { data, error } = await getSupabaseClient().rpc('add_user_credits', {
      p_user_id: userId,
      p_user_type: userType,
      p_credits: credits,
      p_transaction_type: transactionType,
      p_reference_id: referenceId,
      p_description: description,
      p_metadata: metadata
    });

    if (error) {
      console.error('Error adding user credits:', error);
      throw error;
    }

    console.log(`Added ${credits} credits to user ${userId}`);
  } catch (error) {
    console.error('Error in addUserCredits:', error);
    throw error;
  }
}

/**
 * Store payment transaction in database
 */
async function storePaymentTransaction(data: any): Promise<void> {
  try {
    const { error } = await getSupabaseClient()
      .from('payment_transactions')
      .insert({
        user_id: data.user_id,
        user_type: data.user_type,
        paystack_reference: data.paystack_reference,
        amount: data.amount,
        status: data.status,
        metadata: data.metadata,
        ip_address: data.ip_address,
        user_agent: data.user_agent
      });

    if (error) {
      console.error('Error storing payment transaction:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in storePaymentTransaction:', error);
    throw error;
  }
}

/**
 * Update payment transaction
 */
async function updatePaymentTransaction(reference: string, updates: any): Promise<void> {
  try {
    const { error } = await getSupabaseClient()
      .from('payment_transactions')
      .update(updates)
      .eq('paystack_reference', reference);

    if (error) {
      console.error('Error updating payment transaction:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updatePaymentTransaction:', error);
    throw error;
  }
}

/**
 * Store webhook data
 */
async function storeWebhook(data: any): Promise<void> {
  try {
    const { error } = await getSupabaseClient()
      .from('payment_webhooks')
      .insert(data);

    if (error) {
      console.error('Error storing webhook:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in storeWebhook:', error);
    throw error;
  }
}

/**
 * Update webhook status
 */
async function updateWebhookStatus(reference: string, status: string, errorMessage?: string): Promise<void> {
  try {
    const updates: any = {
      processing_status: status,
      processed_at: new Date().toISOString()
    };

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    const { error } = await getSupabaseClient()
      .from('payment_webhooks')
      .update(updates)
      .eq('paystack_reference', reference);

    if (error) {
      console.error('Error updating webhook status:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateWebhookStatus:', error);
    throw error;
  }
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const retryableErrors = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'timeout',
    'network',
    'temporary'
  ];

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';

  return retryableErrors.some(retryableError => 
    errorMessage.includes(retryableError) || errorCode.includes(retryableError)
  );
}

/**
 * Format amount for display
 */
export function formatAmountForDisplay(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
}

/**
 * Format amount for Paystack (convert to kobo)
 */
export function formatAmountForPaystack(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Generate unique payment reference
 */
export function generatePaymentReference(prefix: string = 'TRPI'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

/**
 * Get credit packages from database
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching credit packages:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCreditPackages:', error);
    throw error;
  }
}

/**
 * Get user credits
 */
export async function getUserCredits(userId: string, userType: string): Promise<any> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user credits:', error);
      throw error;
    }

    return data || {
      user_id: userId,
      user_type: userType,
      credits_balance: 0,
      credits_purchased: 0,
      credits_used: 0,
      credits_expired: 0
    };
  } catch (error) {
    console.error('Error in getUserCredits:', error);
    throw error;
  }
}

/**
 * Get user credit transactions
 */
export async function getUserCreditTransactions(userId: string, userType: string, limit: number = 50): Promise<any[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching credit transactions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserCreditTransactions:', error);
    throw error;
  }
}
