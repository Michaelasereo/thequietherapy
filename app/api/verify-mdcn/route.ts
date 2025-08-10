import { NextResponse } from "next/server"

// Simple mock verification for MDCN code.
// In production, integrate with MDCN API or your verification backend.
export async function POST(request: Request) {
  const { mdcnCode } = await request.json()

  if (!mdcnCode || typeof mdcnCode !== "string") {
    return NextResponse.json({ ok: false, reason: "Invalid MDCN code" }, { status: 400 })
  }

  // Mock rule: any code with length >= 5 and starts with "MDCN" is valid
  const isValid = mdcnCode.toUpperCase().startsWith("MDCN") && mdcnCode.length >= 5

  return NextResponse.json({ ok: isValid })
}


