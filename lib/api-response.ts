import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    public statusCode: number, 
    message: string, 
    public details?: any,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, details, 'VALIDATION_ERROR')
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, message, null, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, null, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, null, 'NOT_FOUND_ERROR')
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(409, message, details, 'CONFLICT_ERROR')
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(500, message, details, 'DATABASE_ERROR')
  }
}

/**
 * Standardized error response handler for API routes
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)
  
  // Handle our custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      { 
        error: error.message, 
        code: error.code,
        details: error.details 
      },
      { status: error.statusCode }
    )
  }
  
  // Handle Supabase/PostgreSQL errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as any
    
    // Common database error codes
    switch (dbError.code) {
      case '23505': // unique_violation
        return NextResponse.json(
          { error: 'Resource already exists', code: 'DUPLICATE_ERROR' },
          { status: 409 }
        )
      case '23503': // foreign_key_violation
        return NextResponse.json(
          { error: 'Referenced resource does not exist', code: 'FOREIGN_KEY_ERROR' },
          { status: 400 }
        )
      case '23514': // check_violation
        return NextResponse.json(
          { error: 'Invalid data provided', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      case 'PGRST116': // No rows returned
        return NextResponse.json(
          { error: 'Resource not found', code: 'NOT_FOUND_ERROR' },
          { status: 404 }
        )
      default:
        console.error('Unhandled database error:', dbError)
        return NextResponse.json(
          { error: 'Database error occurred', code: 'DATABASE_ERROR' },
          { status: 500 }
        )
    }
  }
  
  // Handle generic JavaScript errors
  if (error instanceof Error) {
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
  
  // Fallback for unknown errors
  return NextResponse.json(
    { error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' },
    { status: 500 }
  )
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Validation helper for request data
 */
export function validateRequired(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field])
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    )
  }
}

/**
 * Pagination helper
 */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100) // Max 100 items per page
  const offset = (page - 1) * limit
  
  return { page, limit, offset }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function paginatedResponse<T>(
  data: T[], 
  total: number, 
  page: number, 
  limit: number
): NextResponse {
  const totalPages = Math.ceil(total / limit)
  
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  })
}
