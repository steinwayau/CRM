import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// DETAILED EMAIL ANALYTICS API - Click breakdowns by type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    
    if (campaignId) {
      // Get detailed analytics for specific campaign
      const detailedAnalytics = await getCampaignDetailedAnalytics(campaignId)
      return NextResponse.json(detailedAnalytics)
    } else {
      // Get overall detailed analytics for all campaigns
      const overallDetailed = await getOverallDetailedAnalytics()
      return NextResponse.json(overallDetailed)
    }
    
  } catch (error) {
    console.error('❌ DETAILED ANALYTICS: API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch detailed analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get detailed analytics for a specific campaign
async function getCampaignDetailedAnalytics(campaignId: string) {
  try {
    // Get click breakdown by type
    const clickBreakdown = await sql`
      SELECT 
        link_type,
        COUNT(*) as clicks,
        COUNT(DISTINCT recipient_email) as unique_users,
        array_agg(DISTINCT target_url) as sample_urls
      FROM email_tracking 
      WHERE campaign_id = ${campaignId} AND event_type = 'click'
      GROUP BY link_type
      ORDER BY clicks DESC
    `
    
    // Get recent activity
    const recentActivity = await sql`
      SELECT 
        event_type,
        link_type,
        target_url,
        recipient_email,
        created_at
      FROM email_tracking 
      WHERE campaign_id = ${campaignId}
      ORDER BY created_at DESC
      LIMIT 20
    `
    
    return {
      campaignId,
      clickBreakdown: clickBreakdown.rows.map(row => ({
        linkType: row.link_type || 'unknown',
        clicks: parseInt(row.clicks),
        uniqueUsers: parseInt(row.unique_users),
        sampleUrls: row.sample_urls || []
      })),
      recentActivity: recentActivity.rows.map(row => ({
        type: row.event_type,
        linkType: row.link_type,
        url: row.target_url,
        email: row.recipient_email,
        timestamp: row.created_at
      })),
      found: true
    }
    
  } catch (error) {
    console.error('❌ DETAILED ANALYTICS: Campaign error:', error)
    return {
      campaignId,
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get overall detailed analytics across all campaigns
async function getOverallDetailedAnalytics() {
  try {
    // Get overall click breakdown by type
    const overallClickBreakdown = await sql`
      SELECT 
        link_type,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT recipient_email) as unique_users,
        COUNT(DISTINCT campaign_id) as campaigns_with_type,
        array_agg(DISTINCT target_url) as sample_urls
      FROM email_tracking 
      WHERE event_type = 'click'
      GROUP BY link_type
      ORDER BY total_clicks DESC
    `
    
    // Get top clicked URLs
    const topUrls = await sql`
      SELECT 
        target_url,
        link_type,
        COUNT(*) as clicks,
        COUNT(DISTINCT recipient_email) as unique_users
      FROM email_tracking 
      WHERE event_type = 'click' AND target_url IS NOT NULL
      GROUP BY target_url, link_type
      ORDER BY clicks DESC
      LIMIT 10
    `
    
    return {
      summary: {
        clickBreakdown: overallClickBreakdown.rows.map(row => ({
          linkType: row.link_type || 'unknown',
          totalClicks: parseInt(row.total_clicks),
          uniqueUsers: parseInt(row.unique_users),
          campaignsWithType: parseInt(row.campaigns_with_type),
          sampleUrls: row.sample_urls || []
        })),
        topUrls: topUrls.rows.map(row => ({
          url: row.target_url,
          linkType: row.link_type,
          clicks: parseInt(row.clicks),
          uniqueUsers: parseInt(row.unique_users)
        }))
      },
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ DETAILED ANALYTICS: Overall error:', error)
    return {
      error: 'Failed to fetch overall detailed analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 