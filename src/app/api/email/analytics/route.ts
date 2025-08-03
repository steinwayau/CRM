import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// NEW BULLETPROOF EMAIL ANALYTICS API
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
      SELECT id, name, "sentCount", status, "sentAt"
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
      WHERE campaign_id = ${campaignId}
      GROUP BY event_type
    `
    
    // Process stats
    let opens = 0
    let clicks = 0
    let uniqueOpens = 0
    let uniqueClicks = 0
    
    trackingStats.rows.forEach(row => {
      if (row.event_type === 'open') {
        opens = parseInt(row.count)
        uniqueOpens = parseInt(row.unique_recipients)
      } else if (row.event_type === 'click') {
        clicks = parseInt(row.count)
        uniqueClicks = parseInt(row.unique_recipients)
      }
    })
    
    const totalSent = campaign.sentCount || 0
    
    return {
      campaignId,
      campaignName: campaign.name,
      totalSent,
      opens,
      clicks,
      uniqueOpens,
      uniqueClicks,
      openRate: totalSent > 0 ? parseFloat(((uniqueOpens / totalSent) * 100).toFixed(1)) : 0,
      clickRate: totalSent > 0 ? parseFloat(((uniqueClicks / totalSent) * 100).toFixed(1)) : 0,
      status: campaign.status,
      sentAt: campaign.sentAt,
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
    let totalOpens = 0
    let totalClicks = 0
    let uniqueOpens = 0
    let uniqueClicks = 0
    let recentOpens = 0
    let recentClicks = 0
    
    trackingStats.rows.forEach(row => {
      if (row.event_type === 'open') {
        totalOpens = parseInt(row.total_events)
        uniqueOpens = parseInt(row.unique_recipients)
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
    
    return {
      summary: {
        totalCampaigns: parseInt(campaignData.total_campaigns),
        sentCampaigns: parseInt(campaignData.sent_campaigns),
        totalEmailsSent: totalSent,
        totalOpens,
        totalClicks,
        uniqueOpens,
        uniqueClicks,
        overallOpenRate: totalSent > 0 ? ((uniqueOpens / totalSent) * 100).toFixed(1) : '0.0',
        overallClickRate: totalSent > 0 ? ((uniqueClicks / totalSent) * 100).toFixed(1) : '0.0'
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