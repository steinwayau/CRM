import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Email Open Tracking API
// Called when tracking pixel is loaded in email clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('c')
    const recipientId = searchParams.get('r')
    const timestamp = new Date().toISOString()
    
    // Create 1x1 transparent tracking pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
    // If missing parameters, return pixel immediately
    if (!campaignId || !recipientId) {
      console.log('Email open tracking: Missing campaignId or recipientId')
      return new NextResponse(pixel, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    // SYNC FIX: Process tracking synchronously but still return pixel fast
    let trackingResult = 'not_processed'
    
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
      
      // If still no email found, skip tracking but log clearly
      if (!recipientEmail) {
        console.log('❌ Email open tracking SKIPPED - no recipient email found:', {
          campaignId,
          recipientId,
          timestamp
        })
        trackingResult = 'skipped_no_email'
      } else {
        // FIXED: Use raw SQL with snake_case columns to match actual database schema
        await sql`
          INSERT INTO email_opens (campaign_id, recipient_email, user_agent, ip_address, opened_at)
          VALUES (${campaignId}, ${recipientEmail}, ${request.headers.get('user-agent') || ''}, ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''}, NOW())
        `

        console.log(`✅ Email open tracked and saved to database:`, {
          campaignId,
          recipientId,
          recipientEmail,
          timestamp
        })
        trackingResult = 'saved_successfully'
      }

    } catch (error) {
      console.error('❌ CRITICAL: Email open tracking database error:', error)
      console.error('Full error details:', JSON.stringify(error, null, 2))
      trackingResult = `database_error`
    }

    // Always return pixel with tracking result in headers for debugging
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Tracking-Result': trackingResult
      }
    })
    
  } catch (error) {
    console.error('❌ CRITICAL: Email tracking endpoint error:', error)
    
    // Always return tracking pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Tracking-Result': 'endpoint_error'
      }
    })
  }
} 