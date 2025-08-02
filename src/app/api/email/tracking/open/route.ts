import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// NEW BULLETPROOF EMAIL OPEN TRACKING
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('c')
    const recipientEmail = searchParams.get('e') // Direct email instead of ID lookup
    
    // Create 1x1 transparent tracking pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
    // ASYNC TRACKING: Use setTimeout approach (same as working click tracking)
    if (campaignId && recipientEmail) {
      // Use setTimeout to process tracking async - don't block pixel response
      setTimeout(async () => {
        try {
          const decodedEmail = decodeURIComponent(recipientEmail)
          const userAgent = request.headers.get('user-agent') || ''
          const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
          
          console.log('🔍 ASYNC OPEN TRACKING: Parameters received:', {
            campaignId,
            recipientEmail,
            decodedEmail,
            userAgent: userAgent.substring(0, 50),
            ipAddress
          })
          
          await sql`
            INSERT INTO email_tracking (
              campaign_id, 
              recipient_email, 
              event_type, 
              user_agent, 
              ip_address
            ) VALUES (
              ${campaignId}, 
              ${decodedEmail}, 
              'open',
              ${userAgent},
              ${ipAddress}
            )
          `
          
          console.log(`✅ ASYNC TRACKING: Email open recorded - Campaign: ${campaignId}, Email: ${decodedEmail}`)
          
        } catch (error) {
          console.error('❌ ASYNC TRACKING: Open tracking failed:', error)
          console.error('Error details:', {
            campaignId,
            recipientEmail,
            decodedEmail: decodeURIComponent(recipientEmail),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }, 0)
    } else {
      console.log('❌ ASYNC TRACKING: Missing parameters:', { campaignId, recipientEmail })
    }
    
    // Return pixel immediately (tracking happens asynchronously)
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('❌ NEW TRACKING: Open endpoint error:', error)
    
    // Always return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
} 