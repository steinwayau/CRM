import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST(request: NextRequest) {
  try {
    const { fromCampaignIds, toCampaignId } = await request.json()
    
    if (!fromCampaignIds || !toCampaignId) {
      return NextResponse.json(
        { error: 'fromCampaignIds and toCampaignId are required' },
        { status: 400 }
      )
    }
    
    // Update tracking data to point to the correct campaign
    const updateResults = []
    
    for (const fromId of fromCampaignIds) {
      const result = await sql`
        UPDATE email_tracking 
        SET campaign_id = ${toCampaignId}
        WHERE campaign_id = ${fromId}
      `
      
      updateResults.push({
        fromCampaignId: fromId,
        toCampaignId: toCampaignId,
        rowsUpdated: result.rowCount
      })
    }
    
    // Verify the update
    const verifyResult = await sql`
      SELECT 
        campaign_id, 
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'open' THEN 1 END) as opens,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks
      FROM email_tracking 
      WHERE campaign_id = ${toCampaignId}
      GROUP BY campaign_id
    `
    
    return NextResponse.json({
      success: true,
      updates: updateResults,
      newTrackingData: verifyResult.rows[0] || null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 