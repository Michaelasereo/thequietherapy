import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Headers debug endpoint',
    timestamp: new Date().toISOString(),
    note: 'Check the response headers in your browser dev tools to verify CSP and Permissions Policy are applied correctly'
  });
}
