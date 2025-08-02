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
    
    // Always return pixel first - tracking happens in background
    const pixelResponse = new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    // Background tracking - don't block pixel delivery
    if (campaignId && recipientEmail) {
      // Use setTimeout to process tracking async
      setTimeout(async () => {
        try {
          await sql`
            INSERT INTO email_tracking (
              campaign_id, 
              recipient_email, 
              event_type, 
              user_agent, 
              ip_address
            ) VALUES (
              ${campaignId}, 
              ${decodeURIComponent(recipientEmail)}, 
              'open',
              ${request.headers.get('user-agent') || ''},
              ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''}
            )
          `
          
          console.log(`✅ NEW TRACKING: Email open recorded - Campaign: ${campaignId}, Email: ${decodeURIComponent(recipientEmail)}`)
          
        } catch (error) {
          console.error('❌ NEW TRACKING: Open tracking failed:', error)
        }
      }, 0)
    } else {
      console.log('❌ NEW TRACKING: Missing campaignId or recipientEmail')
    }
    
    return pixelResponse
    
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