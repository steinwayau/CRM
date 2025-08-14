import { NextRequest, NextResponse } from 'next/server'
import { broadcastAnalyticsUpdate } from '@/lib/pusher'
import { sql } from '@vercel/postgres'

// Force dynamic route to prevent static generation errors
export const dynamic = 'force-dynamic'

// NEW BULLETPROOF EMAIL CLICK TRACKING
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('c')
    const recipientEmail = searchParams.get('e') // Direct email instead of ID lookup
    const targetUrl = searchParams.get('url')
    const linkType = searchParams.get('type') || 'link'
    const label = searchParams.get('label') || null
    
    // Determine redirect URL
    const redirectUrl = targetUrl ? decodeURIComponent(targetUrl) : 'https://crm.steinway.com.au'
    
    // 🚀 REAL-TIME TRACKING - Process immediately and broadcast
    if (campaignId && recipientEmail && targetUrl) {
      // Process tracking in background (non-blocking for redirect)
      setImmediate(async () => {
        try {
          // Insert tracking record
          await sql`
            INSERT INTO email_tracking (
              campaign_id, 
              recipient_email, 
              event_type,
              target_url,
              link_type,
              label,
              user_agent, 
              ip_address
            ) VALUES (
              ${campaignId}, 
              ${decodeURIComponent(recipientEmail)}, 
              'click',
              ${decodeURIComponent(targetUrl)},
              ${linkType},
              ${label},
              ${request.headers.get('user-agent') || ''},
              ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''}
            )
          `
          
          console.log(`✅ REAL-TIME TRACKING: Click recorded - Campaign: ${campaignId}, Email: ${decodeURIComponent(recipientEmail)}, URL: ${decodeURIComponent(targetUrl)}`)
          
          // 📡 BROADCAST REAL-TIME UPDATE: Notify all connected clients instantly
          // Avoid server-side self-fetch; let clients refetch analytics on event
          await broadcastAnalyticsUpdate(campaignId, { refresh: true })
          console.log(`📡 REAL-TIME: Broadcasted refresh event for campaign ${campaignId}`)
          
        } catch (error) {
          console.error('❌ REAL-TIME TRACKING: Click tracking failed:', error)
        }
      })
    } else {
      console.log('❌ NEW TRACKING: Missing required click parameters')
    }
    
    // Immediate redirect - user experience first
    const res = NextResponse.redirect(redirectUrl, 302)
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res
    
  } catch (error) {
    console.error('❌ NEW TRACKING: Click endpoint error:', error)
    
    // Always redirect even on error
    const fallbackUrl = request.nextUrl.searchParams.get('url') 
      ? decodeURIComponent(request.nextUrl.searchParams.get('url')!)
      : 'https://crm.steinway.com.au'
    const res = NextResponse.redirect(fallbackUrl, 302)
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res
  }
} 