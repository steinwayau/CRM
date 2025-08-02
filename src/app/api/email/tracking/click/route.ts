import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Email Click Tracking API
// Called when tracked links are clicked in emails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('c')
    const recipientId = searchParams.get('r')
    const targetUrl = searchParams.get('url')
    const linkType = searchParams.get('type') || 'text-link'
    const timestamp = new Date().toISOString()
    
    // If missing required parameters, redirect to target URL or home
    const redirectUrl = targetUrl ? decodeURIComponent(targetUrl) : 'https://crm.steinway.com.au'
    
    if (!campaignId || !recipientId || !targetUrl) {
      console.log('Email click tracking: Missing required parameters')
      return NextResponse.redirect(redirectUrl)
    }

    // ASYNC TRACKING: Track click in background, redirect user immediately
    // Don't await this - let it process while user gets redirected
    trackClickAsync(campaignId, recipientId, targetUrl, linkType, request).catch(error => {
      console.error('❌ Background click tracking failed:', error)
    })

    // Immediate redirect to target URL
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('❌ CRITICAL: Email click tracking endpoint error:', error)
    
    // Always redirect to target URL even on error
    const redirectUrl = request.nextUrl.searchParams.get('url') 
      ? decodeURIComponent(request.nextUrl.searchParams.get('url')!)
      : 'https://crm.steinway.com.au'
    
    return NextResponse.redirect(redirectUrl)
  }
}

// ASYNC FUNCTION: Track click in background without blocking redirect
async function trackClickAsync(
  campaignId: string, 
  recipientId: string, 
  targetUrl: string, 
  linkType: string,
  request: NextRequest
) {
  try {
    // Get recipient email from customer database
    let recipientEmail = ''
    if (recipientId && recipientId !== '-1') {
      try {
        const customerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://crm.steinway.com.au'}/api/enquiries`)
        if (customerResponse.ok) {
          const customers = await customerResponse.json()
          const customer = customers.find((c: any) => c.id.toString() === recipientId)
          if (customer) {
            recipientEmail = customer.email
          }
        }
      } catch (error) {
        console.error('Error fetching customer data:', error)
      }
    }
    
    // TRACKING FIX: For custom recipients, get email from campaign data
    if (!recipientEmail) {
      try {
        const campaignResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://crm.steinway.com.au'}/api/admin/campaigns`)
        if (campaignResponse.ok) {
          const campaigns = await campaignResponse.json()
          const campaign = campaigns.find((c: any) => c.id === campaignId)
          if (campaign && campaign.textContent) {
            // For custom campaigns, textContent contains the email addresses
            const emails = campaign.textContent.split(',').map((e: string) => e.trim())
            if (emails.length > 0) {
              recipientEmail = emails[0] // Use first email for tracking
            }
          }
        }
      } catch (error) {
        console.error('Error fetching campaign for custom recipient email:', error)
      }
    }
    
    // If no email found, skip tracking but log clearly
    if (!recipientEmail) {
      console.log('❌ Email click tracking SKIPPED - no recipient email found:', {
        campaignId,
        recipientId,
        targetUrl,
        linkType
      })
      return
    }

    // FIXED: Use raw SQL with snake_case columns to match actual database schema
    await sql`
      INSERT INTO email_clicks (campaign_id, recipient_email, target_url, link_type, user_agent, ip_address, clicked_at)
      VALUES (${campaignId}, ${recipientEmail}, ${decodeURIComponent(targetUrl)}, ${linkType}, ${request.headers.get('user-agent') || ''}, ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''}, NOW())
    `

    console.log(`✅ Email click tracked and saved to database:`, {
      campaignId,
      recipientId,
      recipientEmail,
      targetUrl: decodeURIComponent(targetUrl),
      linkType
    })

  } catch (error) {
    console.error('❌ CRITICAL: Email click tracking database error:', error)
    console.error('Full error details:', JSON.stringify(error, null, 2))
  }
} 