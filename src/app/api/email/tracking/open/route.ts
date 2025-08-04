import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { broadcastAnalyticsUpdate } from '@/lib/pusher'

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
    
    // SYNCHRONOUS TRACKING: Direct database insert (like professional email services)
    if (campaignId && recipientEmail) {
      try {
        const decodedEmail = decodeURIComponent(recipientEmail)
        const userAgent = request.headers.get('user-agent') || ''
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
        
        console.log('🔍 SYNC OPEN TRACKING: Parameters received:', {
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
        
        console.log(`✅ REAL-TIME TRACKING: Email open recorded - Campaign: ${campaignId}, Email: ${decodedEmail}`)
        
        // 📡 BROADCAST REAL-TIME UPDATE: Notify all connected clients instantly
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://crm.steinway.com.au'}/api/email/analytics?campaignId=${campaignId}`)
          if (response.ok) {
            const analytics = await response.json()
            await broadcastAnalyticsUpdate(campaignId, analytics)
            console.log(`📡 REAL-TIME: Analytics update broadcasted for campaign ${campaignId}`)
          }
        } catch (broadcastError) {
          console.error('❌ REAL-TIME: Failed to broadcast analytics update:', broadcastError)
        }
        
      } catch (error) {
        console.error('❌ SYNC TRACKING: Open tracking failed:', error)
        console.error('Error details:', {
          campaignId,
          recipientEmail,
          decodedEmail: decodeURIComponent(recipientEmail),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } else {
      console.log('❌ SYNC TRACKING: Missing parameters:', { campaignId, recipientEmail })
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