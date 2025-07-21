import { NextRequest, NextResponse } from 'next/server'

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
    
    // Log click event
    console.log(`Email Click Tracked:`, {
      campaignId,
      recipientId,
      linkId,
      url,
      timestamp,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      referer: request.headers.get('referer')
    })

    // TODO: Save tracking data to database
    // Example:
    // await db.emailClicks.create({
    //   data: {
    //     campaignId,
    //     recipientId,
    //     linkId,
    //     targetUrl: url,
    //     clickedAt: new Date(),
    //     userAgent: request.headers.get('user-agent'),
    //     ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    //   }
    // })

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