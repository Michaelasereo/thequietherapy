// Server-side Paystack functions (only import on server)
let paystack: any = null;

// Only initialize Paystack on server-side
if (typeof window === 'undefined') {
  try {
    const Paystack = require('paystack');
    paystack = Paystack(process.env.PAYSTACK_SECRET_KEY || '');
  } catch (error) {
    console.warn('Paystack library not available on client-side');
  }
}

export interface PaymentData {
  amount: number; // Amount in kobo (smallest currency unit)
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

// Import existing credit packages from data.ts
import { userCreditPackages } from './data';

export const CREDIT_PACKAGES: CreditPackage[] = userCreditPackages.map(pkg => ({
  ...pkg,
  popular: pkg.id === 'standard' // Mark standard as popular
}));

export async function initializePayment(data: PaymentData) {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    throw new Error('initializePayment can only be called on server-side');
  }

  if (!paystack) {
    throw new Error('Paystack not initialized');
  }

  try {
    const response = await paystack.transaction.initialize({
      amount: data.amount,
      email: data.email,
      reference: data.reference,
      callback_url: data.callback_url,
      metadata: data.metadata
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Paystack initialization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment initialization failed'
    };
  }
}

export async function verifyPayment(reference: string) {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    throw new Error('verifyPayment can only be called on server-side');
  }

  if (!paystack) {
    throw new Error('Paystack not initialized');
  }

  try {
    const response = await paystack.transaction.verify(reference);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Paystack verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed'
    };
  }
}

export function formatAmount(amount: number): number {
  // Convert Naira to kobo (Paystack expects amount in kobo)
  return amount * 100;
}

export function formatAmountForDisplay(amount: number): string {
  // Format amount for display in Naira
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
}
