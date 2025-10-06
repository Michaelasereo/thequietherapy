// Server-side Paystack functions (only import on server)
if (typeof window !== 'undefined') {
  throw new Error('Paystack module must only be imported on the server');
}

// Enforce required secrets
if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY environment variable is required');
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

let paystack: any = null;
try {
  const Paystack = require('paystack');
  paystack = Paystack(PAYSTACK_SECRET_KEY);
} catch (error) {
  throw new Error('Paystack initialization failed');
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
    const msg = error instanceof Error ? error.message : 'Payment initialization failed';
    throw new Error(`PAYSTACK_INIT_ERROR: ${msg}`);
  }
}

export async function verifyPayment(reference: string) {
  if (!paystack) {
    throw new Error('Paystack not initialized');
  }

  try {
    const response = await paystack.transaction.verify(reference);
    
    return {
      success: true,
      data: response.data,
      isSuccessful: response.data.status === 'success'
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Payment verification failed';
    throw new Error(`PAYSTACK_VERIFY_ERROR: ${msg}`);
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
