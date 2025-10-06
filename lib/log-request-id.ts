import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export function createRequestId(): string {
  return randomUUID();
}

export function addRequestIdHeader(resp: NextResponse, reqId: string): NextResponse {
  resp.headers.set('X-Request-ID', reqId);
  return resp;
}

export function logWithRequestId(reqId: string, level: 'info' | 'warn' | 'error', message: string, meta?: object): void {
  if (process.env.NODE_ENV === 'production') {
    // Structured logging for production
    console[level](JSON.stringify({
      requestId: reqId,
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  } else {
    // Human readable for development
    console[level](`[${reqId}] ${message}`, meta ?? {});
  }
}
