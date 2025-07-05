import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to prevent static optimization
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "Email endpoint is working!",
      timestamp: new Date().toISOString(),
      environment: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasFromEmail: !!process.env.FROM_EMAIL
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check email configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testType, testEmail } = await request.json()
    
    return NextResponse.json({
      success: true,
      message: `Email test endpoint received: ${testType}`,
      testEmail: testEmail || 'none provided',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Email test failed' },
      { status: 500 }
    )
  }
} 