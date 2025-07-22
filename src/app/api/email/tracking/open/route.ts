import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    
    const pixelResponse = new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    // Return pixel immediately, process tracking async
    if (!campaignId || !recipientId) {
      console.log('Email open tracking: Missing campaignId or recipientId')
      return pixelResponse
    }

    // Process tracking data asynchronously (don't block pixel response)
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
          console.log('Email open tracked (no database record - custom recipient):', {
            campaignId,
            recipientId,
            timestamp,
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
          })
          return
        }

        // Save email open to database
        await prisma.emailOpen.create({
          data: {
            campaignId: campaignId,
            recipientEmail: recipientEmail,
            userAgent: request.headers.get('user-agent') || '',
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
          }
        })

        console.log(`Email open tracked and saved to database:`, {
          campaignId,
          recipientId,
          recipientEmail,
          timestamp
        })

      } catch (error) {
        console.error('Error saving email open to database:', error)
        // Log the tracking event even if database save fails
        console.log(`Email open tracked (database save failed):`, {
          campaignId,
          recipientId,
          timestamp,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })
      }
    })

    return pixelResponse
    
  } catch (error) {
    console.error('Email tracking error:', error)
    
    // Always return tracking pixel even on error
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