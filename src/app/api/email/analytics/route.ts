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
      SELECT id, name, "sentCount" AS sent_count
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
    
    // Determine total sent: prefer campaign.sentCount, fall back to distinct recipients observed
    let totalSent = parseInt(campaign.sent_count) || 0
    if (!totalSent) {
      const totalSentResult = await sql`
        SELECT COUNT(DISTINCT recipient_email) as total_sent
        FROM email_tracking 
        WHERE campaign_id = ${campaignId}
      `
      totalSent = parseInt(totalSentResult.rows[0]?.total_sent) || 0
    }
    
    // Adjusted opens: exclude known machine/proxy fetches (e.g., Gmail Image Proxy)
    const adjustedOpensResult = await sql`
      SELECT COUNT(DISTINCT recipient_email) AS adjusted_unique_opens
      FROM email_tracking
      WHERE campaign_id = ${campaignId}
        AND event_type = 'open'
        AND COALESCE(user_agent, '') NOT ILIKE '%GoogleImageProxy%'
    `
    const adjustedUniqueOpens = parseInt(adjustedOpensResult.rows[0]?.adjusted_unique_opens) || 0
    
    // Engagement metrics (click-based)
    const clickBasedOpens = uniqueClicks // keep for transparency
    
    // Rates
    const openRateTrue = totalSent > 0 ? parseFloat(((uniqueTraditionalOpens / totalSent) * 100).toFixed(1)) : 0
    const openRateAdjusted = totalSent > 0 ? parseFloat(((adjustedUniqueOpens / totalSent) * 100).toFixed(1)) : 0
    const engagedRate = totalSent > 0 ? parseFloat(((uniqueClicks / totalSent) * 100).toFixed(1)) : 0
    const clickRate = engagedRate
    const ctor = uniqueTraditionalOpens > 0 ? parseFloat(((uniqueClicks / uniqueTraditionalOpens) * 100).toFixed(1)) : 0
    
    // Preserve backward-compatible fields (opens/openRate now reflect TRUE opens)
    const opens = uniqueTraditionalOpens
    const uniqueOpens = uniqueTraditionalOpens
    const openRate = openRateTrue
    
    return {
      campaignId,
      campaignName: campaign.name,
      totalSent,
      opens, // true unique opens
      clicks,
      uniqueOpens, // true unique opens
      uniqueClicks,
      openRate, // true open rate
      clickRate, // clicks / sent
      // Additional enterprise metrics
      openRateAdjusted, // true opens excluding proxies
      engagedRate, // clicks / sent (what we previously surfaced as open rate)
      ctor, // click-to-open rate
      // Transparency fields retained from previous implementation
      traditionalOpens: uniqueTraditionalOpens,
      traditionalOpenRate: openRateTrue,
      clickBasedOpens,
      clickBasedOpenRate: engagedRate,
      adjustedUniqueOpens,
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
    
    // Get tracking stats - ONLY for existing campaigns
    const trackingStats = await sql`
      SELECT 
        event_type,
        COUNT(*) as total_events,
        COUNT(DISTINCT recipient_email) as unique_recipients,
        COUNT(DISTINCT campaign_id) as campaigns_with_events
      FROM email_tracking et
      WHERE EXISTS (
        SELECT 1 FROM email_campaigns ec 
        WHERE ec.id = et.campaign_id
      )
      GROUP BY event_type
    `
    
    // Get recent activity (last 7 days) - ONLY for existing campaigns
    const recentActivity = await sql`
      SELECT 
        event_type,
        COUNT(*) as count
      FROM email_tracking et
      WHERE created_at >= NOW() - INTERVAL '7 days'
        AND EXISTS (
          SELECT 1 FROM email_campaigns ec 
          WHERE ec.id = et.campaign_id
        )
      GROUP BY event_type
    `
    
    // Adjusted unique opens overall (exclude Gmail Image Proxy)
    const adjustedOverallOpens = await sql`
      SELECT COUNT(DISTINCT et.recipient_email) AS adjusted_unique_opens
      FROM email_tracking et
      WHERE et.event_type = 'open'
        AND COALESCE(et.user_agent, '') NOT ILIKE '%GoogleImageProxy%'
        AND EXISTS (SELECT 1 FROM email_campaigns ec WHERE ec.id = et.campaign_id)
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
    const adjustedUniqueOpensOverall = parseInt(adjustedOverallOpens.rows[0]?.adjusted_unique_opens) || 0
    
    // Metrics
    const openRateTrue = totalSent > 0 ? parseFloat(((uniqueTraditionalOpens / totalSent) * 100).toFixed(1)) : 0
    const openRateAdjusted = totalSent > 0 ? parseFloat(((adjustedUniqueOpensOverall / totalSent) * 100).toFixed(1)) : 0
    const engagedRate = totalSent > 0 ? parseFloat(((uniqueClicks / totalSent) * 100).toFixed(1)) : 0
    
    return {
      summary: {
        totalCampaigns: parseInt(campaignData.total_campaigns),
        sentCampaigns: parseInt(campaignData.sent_campaigns),
        totalEmailsSent: totalSent,
        totalOpens: uniqueTraditionalOpens, // true unique opens
        totalClicks,
        uniqueOpens: uniqueTraditionalOpens, // true unique opens
        uniqueClicks,
        overallOpenRate: openRateTrue, // true open rate
        overallClickRate: engagedRate, // clicks / sent
        // Additional metrics for transparency
        traditionalOpens: uniqueTraditionalOpens,
        traditionalOpenRate: openRateTrue,
        clickBasedOpens: uniqueClicks,
        clickBasedOpenRate: engagedRate,
        adjustedUniqueOpens: adjustedUniqueOpensOverall,
        adjustedOpenRate: openRateAdjusted
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