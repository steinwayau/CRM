import { NextRequest, NextResponse } from 'next/server'

// Email Open Tracking API
// Called when tracking pixel is loaded in email clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('c')
    const recipientId = searchParams.get('r')
    const timestamp = new Date().toISOString()
    
    if (!campaignId || !recipientId) {
      // Return 1x1 transparent pixel even for invalid requests
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      )
      
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

    // Log email open event
    // In a real implementation, you'd save this to your database
    console.log(`Email Open Tracked:`, {
      campaignId,
      recipientId,
      timestamp,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      referer: request.headers.get('referer')
    })

    // TODO: Save tracking data to database
    // Example:
    // await db.emailOpens.create({
    //   data: {
    //     campaignId,
    //     recipientId,
    //     openedAt: new Date(),
    //     userAgent: request.headers.get('user-agent'),
    //     ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    //   }
    // })

    // Return 1x1 transparent tracking pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
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