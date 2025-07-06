import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    message: "Deployment test successful!",
    timestamp: new Date().toISOString(),
    deployment_id: "test-18d2161",
    test: "This endpoint confirms deployments are working"
  })
} 