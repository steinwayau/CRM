import { NextResponse } from 'next/server'

// Force dynamic rendering to prevent static optimization
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ 
    message: "Simple test endpoint working!",
    timestamp: new Date().toISOString()
  })
} 