import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// EVIDENCE-BASED TEST: Use exact same setTimeout approach as working click tracking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('c') || 'test-campaign'
    const recipientEmail = searchParams.get('e') || 'test@example.com'
    
    // Create test pixel (same as open tracking)
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
    // EXACT SAME APPROACH AS WORKING CLICK TRACKING
    if (campaignId && recipientEmail) {
      // Use setTimeout to process tracking async (copying click tracking exactly)
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
              'test-open',
              ${request.headers.get('user-agent') || ''},
              ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''}
            )
          `
          
          console.log(`✅ TEST ASYNC: Open tracking recorded - Campaign: ${campaignId}, Email: ${decodeURIComponent(recipientEmail)}`)
          
        } catch (error) {
          console.error('❌ TEST ASYNC: Open tracking failed:', error)
        }
      }, 0)
    }
    
    // Return pixel immediately (same as click tracking returns redirect immediately)
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
    console.error('❌ TEST ASYNC: Endpoint error:', error)
    
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