import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasResendApiKey: !!process.env.RESEND_API_KEY,
    resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 8) + '...',
    hasFromEmail: !!process.env.FROM_EMAIL,
    fromEmail: process.env.FROM_EMAIL,
    hasReplyToEmail: !!process.env.REPLY_TO_EMAIL,
    replyToEmail: process.env.REPLY_TO_EMAIL,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
} 