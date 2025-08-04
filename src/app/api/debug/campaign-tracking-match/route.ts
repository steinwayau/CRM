import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    // Get all campaign IDs from campaigns table
    const campaignsResult = await sql`
      SELECT id, name, status, "sentCount" 
      FROM email_campaigns 
      ORDER BY "createdAt" DESC
    `
    
    // Get all unique campaign IDs from tracking table
    const trackingResult = await sql`
      SELECT 
        campaign_id, 
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'open' THEN 1 END) as opens,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks
      FROM email_tracking 
      GROUP BY campaign_id
      ORDER BY total_events DESC
    `
    
    // Find matches and mismatches
    const campaigns = campaignsResult.rows
    const trackingByCampaign = trackingResult.rows
    
    const matches = []
    const orphanedTracking = []
    const campaignsWithoutTracking = []
    
    // Check each campaign for tracking data
    campaigns.forEach(campaign => {
      const tracking = trackingByCampaign.find(t => t.campaign_id === campaign.id)
      if (tracking) {
        matches.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          status: campaign.status,
          sentCount: campaign.sentCount,
          trackingEvents: tracking.total_events,
          opens: tracking.opens,
          clicks: tracking.clicks
        })
      } else {
        campaignsWithoutTracking.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          status: campaign.status
        })
      }
    })
    
    // Check for orphaned tracking data
    trackingByCampaign.forEach(tracking => {
      const campaign = campaigns.find(c => c.id === tracking.campaign_id)
      if (!campaign) {
        orphanedTracking.push({
          campaignId: tracking.campaign_id,
          trackingEvents: tracking.total_events,
          opens: tracking.opens,
          clicks: tracking.clicks
        })
      }
    })
    
    return NextResponse.json({
      summary: {
        totalCampaigns: campaigns.length,
        totalTrackingCampaigns: trackingByCampaign.length,
        matches: matches.length,
        orphanedTracking: orphanedTracking.length,
        campaignsWithoutTracking: campaignsWithoutTracking.length
      },
      matches,
      orphanedTracking,
      campaignsWithoutTracking,
      allCampaigns: campaigns,
      allTracking: trackingByCampaign
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 