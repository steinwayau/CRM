import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    // Check all records in email_tracking table
    const trackingResult = await sql`
      SELECT 
        campaign_id, 
        recipient_email, 
        event_type, 
        created_at,
        user_agent,
        ip_address
      FROM email_tracking 
      ORDER BY created_at DESC 
      LIMIT 20
    `
    
    // Also check what campaigns exist
    const campaignsResult = await sql`
      SELECT id, name, status, "sentCount"
      FROM email_campaigns
      ORDER BY "createdAt" DESC
    `
    
    // Group tracking by campaign_id
    const trackingByCampaign: { [key: string]: any } = {}
    trackingResult.rows.forEach(row => {
      if (!trackingByCampaign[row.campaign_id]) {
        trackingByCampaign[row.campaign_id] = {
          campaignId: row.campaign_id,
          opens: 0,
          clicks: 0,
          totalEvents: 0
        }
      }
      trackingByCampaign[row.campaign_id].totalEvents++
      if (row.event_type === 'open') trackingByCampaign[row.campaign_id].opens++
      if (row.event_type === 'click') trackingByCampaign[row.campaign_id].clicks++
    })
    
    return NextResponse.json({
      success: true,
      totalRecords: trackingResult.rows.length,
      campaigns: campaignsResult.rows,
      trackingByCampaign: Object.values(trackingByCampaign),
      allTrackingRecords: trackingResult.rows,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
} 