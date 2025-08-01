import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Email Click Tracking API
// Called when tracked links are clicked in emails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('c')
    const recipientId = searchParams.get('r')
    const linkId = searchParams.get('l')
    const url = searchParams.get('url')
    const linkType = searchParams.get('type') || 'text-link'
    const timestamp = new Date().toISOString()
    
    // SYNC FIX: Process tracking synchronously before redirect
    if (campaignId && recipientId) {
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
            console.error('Error fetching customer data for click tracking:', error)
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
          console.log('❌ Email click tracking SKIPPED - no recipient email found:', {
            campaignId,
            recipientId,
            url,
            timestamp
          })
        } else {
          // Save email click to database - NOW SYNCHRONOUS
          await prisma.emailClick.create({
            data: {
              campaignId: campaignId,
              recipientEmail: recipientEmail,
              targetUrl: url || '',
              userAgent: request.headers.get('user-agent') || '',
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
            }
          })

          console.log(`✅ Email click tracked and saved to database:`, {
            campaignId,
            recipientId,
            recipientEmail,
            targetUrl: url,
            linkType,
            timestamp
          })
        }

      } catch (error) {
        console.error('❌ CRITICAL: Email click tracking database error:', error)
        console.error('Full error details:', JSON.stringify(error, null, 2))
      }
    }

    // Redirect to the intended URL
    if (url) {
      // Validate URL to prevent open redirects
      try {
        const targetUrl = new URL(decodeURIComponent(url))
        
        // Add domain whitelist validation if needed
        const allowedDomains = [
          'steinway.com.au',
          'epgpianos.com.au',
          'youtube.com',
          'vimeo.com'
        ]
        
        // For security, you might want to validate the domain
        // if (!allowedDomains.some(domain => targetUrl.hostname.includes(domain))) {
        //   return NextResponse.json({ error: 'Unauthorized redirect domain' }, { status: 403 })
        // }
        
        return NextResponse.redirect(targetUrl.toString(), 302)
      } catch (error) {
        console.error('Invalid URL for redirect:', url)
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
      }
    }

    // If no URL provided, return tracking confirmation
    return NextResponse.json({ 
      success: true, 
      message: 'Click tracked successfully',
      timestamp 
    })
    
  } catch (error) {
    console.error('❌ CRITICAL: Click tracking endpoint error:', error)
    
    // Try to redirect anyway if URL is provided
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (url) {
      try {
        return NextResponse.redirect(decodeURIComponent(url), 302)
      } catch {
        return NextResponse.json({ error: 'Tracking and redirect failed' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ error: 'Click tracking failed' }, { status: 500 })
  }
} 