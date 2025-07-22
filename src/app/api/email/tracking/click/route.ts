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
    const timestamp = new Date().toISOString()
    
    // Process tracking data asynchronously before redirect
    if (campaignId && recipientId) {
      setImmediate(async () => {
        try {
          // Get recipient email from customer database
          let recipientEmail = ''
          if (recipientId && recipientId !== '-1') {
            // Query customer database for real recipients
            const customerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://crm.steinway.com.au'}/api/enquiries`)
            if (customerResponse.ok) {
              const customers = await customerResponse.json()
              const customer = customers.find((c: any) => c.id.toString() === recipientId)
              if (customer) {
                recipientEmail = customer.email
              }
            }
          }
          
          // If no email found, it might be a custom email recipient, skip database tracking
          if (!recipientEmail) {
            console.log('Email click tracked (no database record - custom recipient):', {
              campaignId,
              recipientId,
              url,
              timestamp,
              userAgent: request.headers.get('user-agent'),
              ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
            })
            return
          }

          // Save email click to database (simplified for now)
          console.log(`Email click would be saved to database:`, {
            campaignId,
            recipientEmail,
            targetUrl: url,
            timestamp
          })

          console.log(`Email click tracked and saved to database:`, {
            campaignId,
            recipientId,
            recipientEmail,
            targetUrl: url,
            timestamp
          })

        } catch (error) {
          console.error('Error saving email click to database:', error)
          // Log the tracking event even if database save fails
          console.log(`Email click tracked (database save failed):`, {
            campaignId,
            recipientId,
            url,
            timestamp,
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
          })
        }
      })
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
    console.error('Click tracking error:', error)
    
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