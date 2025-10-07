/**
 * CRITICAL SECURITY & PRODUCTION ERROR HANDLER
 * Standardized error responses with Nigerian market optimization
 */

export interface AppErrorResponse {
  error: string;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
  userAction?: string; // Nigerian UX guidance
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly userAction?: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any,
    userAction?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.userAction = userAction || this.getDefaultUserAction(code);
  }

  private getDefaultUserAction(code: string): string {
    const actions: Record<string, string> = {
      'SESSION_CONFLICT': 'Please select a different time slot',
      'INSUFFICIENT_CREDITS': 'Add credits via bank transfer or card',
      'PAYMENT_FAILED': 'Try bank transfer instead - more reliable in Nigeria',
      'NETWORK_ERROR': 'Check internet connection - try again in 30 seconds',
      'TECHNICAL_ERROR': 'Contact WhatsApp support: +234 XXX XXX XXXX',
      'AI_SERVICE_DOWN': 'AI notes temporarily unavailable - try again later',
      'BOOKING_CLOSED': 'Booking window closed - try tomorrow',
      'THERAPIST_UNAVAILABLE': 'This therapist is currently unavailable'
    };
    return actions[code] || 'Please try again or contact support';
  }

  toJSON(): AppErrorResponse {
    return {
      error: this.message,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
      userAction: this.userAction
    };
  }
}

/**
 * CRITICAL: Standardized error handler with database constraint mapping
 */
export function handleDatabaseError(error: any): AppError {
  // Postgres constraint violations
  if (error.code === '23505') { // unique_violation
    switch (error.constraint) {
      case 'sessions_no_overlap_per_therapist':
        return new AppError(
          'SESSION_CONFLICT',
          'This time slot is no longer available',
          409,
          { constraint: error.constraint },
          'Please select a different time slot'
        );
      case 'therapist_availability_no_overlap':
        return new AppError(
          'DOUBLE_BOOKING',
          'Time slot already booked by therapist',
          409,
          { constraint: error.constraint }
        );
      case 'payment_events_pkey':
        return new AppError(
          'DUPLICATE_WEBHOOK',
          'Payment already processed',
          409,
          { constraint: error.constraint },
          'Refresh page to see updated status'
        );
    }
  }

  if (error.code === '23503') { // foreign_key_violation
    return new AppError(
      'REFERENCE_ERROR',
      'Invalid reference to related record',
      400,
      { constraint: error.constraint },
      'Please refresh and try again'
    );
  }

  if (error.code === '23514') { // check_violation
    return new AppError(
      'VALIDATION_ERROR',
      'Invalid data provided',
      400,
      { constraint: error.constraint },
      'Please check your input and try again'
    );
  }

  if (error.code === '40001') { // serialization_failure
    return new AppError(
      'CONCURRENT_MODIFICATION',
          'Transaction conflict - another booking in progress',
      409,
          {},
          'Wait 5 seconds then try again'
        );
  }

  // Default database error
  return new AppError(
    'DATABASE_ERROR',
    'Database operation failed',
    500,
    { code: error.code },
    'Please try again or contact support'
  );
}

/**
 * Handle application-specific errors
 */
export function handleApplicationError(error: any): AppError {
  // Booking-specific errors
  if (error.message === 'INSUFFICIENT_CREDITS') {
    return new AppError(
      'INSUFFICIENT_CREDITS',
      'Not enough credits to book session',
      402,
      { action: 'purchase_credits' },
      'Add credits via bank transfer or card'
    );
  }

  if (error.message === 'SESSION_CONFLICT' || error.message.includes('conflict')) {
    return new AppError(
      'SESSION_CONFLICT',
      'Time slot is no longer available',
      409,
      {},
      'Please select a different time slot'
    );
  }

  if (error.message.includes('paystack') || error.message.includes('PAYSTACK')) {
    return new AppError(
      'PAYMENT_SERVICE_ERROR',
      'Payment service temporarily unavailable',
      503,
      { service: 'paystack' },
      'Try bank transfer instead - more reliable in Nigeria'
    );
  }

  if (error.message.includes('AI') || error.message.includes('OpenAI') || error.message.includes('DeepSeek')) {
    return new AppError(
      'AI_SERVICE_DOWN',
      'AI service temporarily unavailable',
      503,
      { service: 'ai_provider' },
      'AI notes temporarily unavailable - try again later'
    );
  }

  if (error.message.includes('missing') || error.message.includes('invalid')) {
    return new AppError(
      'VALIDATION_ERROR',
      'Invalid or missing data',
      400,
      {},
      'Please check your input and try again'
    );
  }

  // Default application error
  return new AppError(
    'APPLICATION_ERROR',
    error.message || 'Application error occurred',
    500,
    {},
    'Please try again or contact support'
  );
}

/**
 * Main error handler - call this from API routes
 */
export function handleApiError(error: any, requestId?: string): Response {
  let appError: AppError;

  // Handle known app errors
  if (error instanceof AppError) {
    appError = error;
  } else if (error.code?.startsWith('23')) {
    // Database error
    appError = handleDatabaseError(error);
  } else {
    // Generic error - sanitize in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    appError = new AppError(
      'INTERNAL_ERROR',
      isDevelopment ? error.message : 'Internal server error',
      500,
      isDevelopment ? { stack: error.stack } : undefined,
      'Contact WhatsApp support: +234 XXX XXX XXXX'
    );
  }

  // Add request ID if provided
  if (requestId) {
    appError.details = { ...appError.details, requestId };
  }

  // Log error for monitoring (sanitized)
  console.error('API Error:', {
    code: appError.code,
    status: appError.statusCode,
    request: requestId,
    timestamp: new Date().toISOString(),
    // Don't log sensitive details in production
    ...(process.env.NODE_ENV !== 'production' && { originalError: error.message })
  });

  return new Response(JSON.stringify(appError.toJSON()), {
    status: appError.statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Nigerian-specific error messages for UX
 */
export const NigerianErrorMessages = {
  PAYMENT_FAILED: 'Payment failed. Try bank transfer - more reliable in Nigeria',
  NETWORK_SLOW: 'Slow connection detected. Video calls may have poor quality.',
  DATA_EXPENSIVE: 'Large file detected. WhatsApp delivery recommended.',
  BANKING_HOURS: 'Bank transfers only work during banking hours (9am-6pm)',
  WEEKEND_SESSIONS: 'Weekend sessions require advance notice',
  LOCAL_TIMEZONE: 'Times displayed in West Africa Time (WAT)'
};

/**
 * Rate limiting error for Nigerian context
 */
export function createRateLimitError(type: 'api' | 'booking' | 'payment'): AppError {
  return new AppError(
    'RATE_LIMIT_EXCEEDED',
    `Too many ${type} requests`,
    429,
    { retryAfter: '60' },
    'Please wait 1 minute before trying again. Poor network may cause multiple clicks.'
  );
}
