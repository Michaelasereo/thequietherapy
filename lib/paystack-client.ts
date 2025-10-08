/**
 * Client-safe Paystack utilities
 * This file contains only utility functions that can be safely used on the client side
 * No server-only modules (like 'paystack' npm package) are imported here
 */

/**
 * Format amount for display in Nigerian Naira
 */
export function formatAmountForDisplay(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`
}

/**
 * Generate a unique payment reference
 */
export function generatePaymentReference(prefix: string = 'PAY'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Convert Naira to kobo (Paystack uses kobo)
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100)
}

/**
 * Convert kobo to Naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100
}

