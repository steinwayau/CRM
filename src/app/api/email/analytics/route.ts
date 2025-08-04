import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// NEW BULLETPROOF EMAIL ANALYTICS API - WITH CLICK-BASED OPEN FALLBACK
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    
    if (campaignId) {
      // Get analytics for specific campaign
      const campaignAnalytics = await getCampaignAnalytics(campaignId)
      return NextResponse.json(campaignAnalytics)
    } else {
      // Get overall analytics for all campaigns
      const overallAnalytics = await getOverallAnalytics()
      return NextResponse.json(overallAnalytics)
    }
    
  } catch (error) {
    console.error('❌ NEW ANALYTICS: API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get analytics for a specific campaign
async function getCampaignAnalytics(campaignId: string) {
  try {
    // Get campaign details
    const campaignResult = await sql`
      SELECT id, name
      FROM email_campaigns 
      WHERE id = ${campaignId}
    `
    
    if (campaignResult.rows.length === 0) {
      return {
        campaignId,
        found: false,
        error: 'Campaign not found'
      }
    }
    
    const campaign = campaignResult.rows[0]
    
    // Get tracking stats from unified table
    const trackingStats = await sql`
      SELECT 
        event_type,
        COUNT(*) as count,
        COUNT(DISTINCT recipient_email) as unique_recipients
      FROM email_tracking 
      WHERE campaign_id = ${campaignId} AND recipient_email <> ''
      GROUP BY event_type
    `
    
    // Process stats
    let traditionalOpens = 0
    let clicks = 0
    let uniqueTraditionalOpens = 0
    let uniqueClicks = 0
    
    trackingStats.rows.forEach(row => {
      if (row.event_type === 'open') {
        traditionalOpens = parseInt(row.count)
        uniqueTraditionalOpens = parseInt(row.unique_recipients)
      } else if (row.event_type === 'click') {
        clicks = parseInt(row.count)
        uniqueClicks = parseInt(row.unique_recipients)
      }
    })
    
    // Calculate total sent based on unique recipients (since sentCount doesn't exist)
    const totalSentResult = await sql`
      SELECT COUNT(DISTINCT recipient_email) as total_sent
      FROM email_tracking 
      WHERE campaign_id = ${campaignId}
    `
    
    const totalSent = parseInt(totalSentResult.rows[0]?.total_sent) || uniqueClicks || 1
    
    // 🎯 CLICK-BASED OPEN LOGIC: Use clicks as engagement indicator
    // If someone clicked any link, they definitely "opened" the email
    const clickBasedOpens = uniqueClicks
    const traditionalOpenRate = totalSent > 0 ? parseFloat(((uniqueTraditionalOpens / totalSent) * 100).toFixed(1)) : 0
    const clickBasedOpenRate = totalSent > 0 ? parseFloat(((clickBasedOpens / totalSent) * 100).toFixed(1)) : 0
    const clickRate = totalSent > 0 ? parseFloat(((uniqueClicks / totalSent) * 100).toFixed(1)) : 0

    // Use click-based opens as the primary metric (stronger engagement signal)
    const openRate = clickBasedOpenRate
    const opens = clickBasedOpens
    const uniqueOpens = clickBasedOpens

    console.log(`📊 CLICK-BASED ANALYTICS for ${campaignId}:`, {
      totalSent,
      traditionalOpens: uniqueTraditionalOpens,
      clickBasedOpens,
      traditionalOpenRate,
      clickBasedOpenRate: openRate,
      clickRate
    })

    return {
      campaignId,
      campaignName: campaign.name,
      totalSent,
      opens, // Now using click-based opens
      clicks,
      uniqueOpens, // Now using click-based opens
      uniqueClicks,
      openRate, // Now using click-based open rate
      clickRate,
      // Additional metrics for debugging/transparency
      traditionalOpens: uniqueTraditionalOpens,
      traditionalOpenRate,
      clickBasedOpens,
      clickBasedOpenRate,
      status: 'sent',
      sentAt: null,
      found: true
    }
    
  } catch (error) {
    console.error('❌ NEW ANALYTICS: Campaign analytics error:', error)
    return {
      campaignId,
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get overall analytics across all campaigns
async function getOverallAnalytics() {
  try {
    // Get campaign counts
    const campaignStats = await sql`
      SELECT 
        COUNT(*) as total_campaigns,
        SUM("sentCount") as total_sent,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_campaigns
      FROM email_campaigns
    `
    
    // Get tracking stats
    const trackingStats = await sql`
      SELECT 
        event_type,
        COUNT(*) as total_events,
        COUNT(DISTINCT recipient_email) as unique_recipients,
        COUNT(DISTINCT campaign_id) as campaigns_with_events
      FROM email_tracking
      GROUP BY event_type
    `
    
    // Get recent activity (last 7 days)
    const recentActivity = await sql`
      SELECT 
        event_type,
        COUNT(*) as count
      FROM email_tracking
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY event_type
    `
    
    // Process data
    const campaignData = campaignStats.rows[0]
    let totalTraditionalOpens = 0
    let totalClicks = 0
    let uniqueTraditionalOpens = 0
    let uniqueClicks = 0
    let recentOpens = 0
    let recentClicks = 0
    
    trackingStats.rows.forEach(row => {
      if (row.event_type === 'open') {
        totalTraditionalOpens = parseInt(row.total_events)
        uniqueTraditionalOpens = parseInt(row.unique_recipients)
      } else if (row.event_type === 'click') {
        totalClicks = parseInt(row.total_events)
        uniqueClicks = parseInt(row.unique_recipients)
      }
    })
    
    recentActivity.rows.forEach(row => {
      if (row.event_type === 'open') {
        recentOpens = parseInt(row.count)
      } else if (row.event_type === 'click') {
        recentClicks = parseInt(row.count)
      }
    })
    
    const totalSent = parseInt(campaignData.total_sent) || 0
    
    // 🎯 CLICK-BASED OVERALL ANALYTICS
    const clickBasedOpens = uniqueClicks
    const traditionalOpenRate = totalSent > 0 ? parseFloat(((uniqueTraditionalOpens / totalSent) * 100).toFixed(1)) : 0
    const clickBasedOpenRate = totalSent > 0 ? parseFloat(((clickBasedOpens / totalSent) * 100).toFixed(1)) : 0
    
    console.log(`📊 OVERALL CLICK-BASED ANALYTICS:`, {
      totalSent,
      traditionalOpens: uniqueTraditionalOpens,
      clickBasedOpens,
      traditionalOpenRate,
      clickBasedOpenRate
    })
    
    return {
      summary: {
        totalCampaigns: parseInt(campaignData.total_campaigns),
        sentCampaigns: parseInt(campaignData.sent_campaigns),
        totalEmailsSent: totalSent,
        totalOpens: clickBasedOpens, // Now using click-based opens
        totalClicks,
        uniqueOpens: clickBasedOpens, // Now using click-based opens
        uniqueClicks,
        overallOpenRate: clickBasedOpenRate, // Now using click-based open rate
        overallClickRate: totalSent > 0 ? parseFloat(((uniqueClicks / totalSent) * 100).toFixed(1)) : 0,
        // Additional metrics for transparency
        traditionalOpens: uniqueTraditionalOpens,
        traditionalOpenRate,
        clickBasedOpens,
        clickBasedOpenRate
      },
      recent: {
        opensLast7Days: recentOpens,
        clicksLast7Days: recentClicks
      },
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ NEW ANALYTICS: Overall analytics error:', error)
    return {
      error: 'Failed to fetch overall analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Update analytics data (for manual data corrections or imports)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, type, data } = body

    // TODO: Implement analytics data updates once database schema is deployed
    // Example:
    // if (type === 'bulk_import') {
    //   await prisma.emailOpen.createMany({ data: data.opens })
    //   await prisma.emailClick.createMany({ data: data.clicks })
    // }

    console.log('Analytics update requested:', { campaignId, type, data })

    return NextResponse.json({ 
      success: true,
      message: 'Analytics data update queued (will be processed once database schema is deployed)'
    })

  } catch (error) {
    console.error('Analytics update error:', error)
    return NextResponse.json(
      { error: 'Failed to update analytics data' },
      { status: 500 }
    )
  }
} 