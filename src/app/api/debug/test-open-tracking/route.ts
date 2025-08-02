import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// DEBUG: Test open tracking database operation
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Testing open tracking database operation...')
    
    const testCampaignId = 'test-campaign-debug'
    const testEmail = 'debug@test.com'
    
    // Test the exact same SQL operation as the open tracking endpoint
    const result = await sql`
      INSERT INTO email_tracking (
        campaign_id, 
        recipient_email, 
        event_type, 
        user_agent, 
        ip_address
      ) VALUES (
        ${testCampaignId}, 
        ${testEmail}, 
        'open',
        'test-user-agent',
        'test-ip'
      )
      RETURNING id, campaign_id, recipient_email, event_type, created_at
    `
    
    console.log('✅ DEBUG: Insert successful:', result.rows[0])
    
    // Verify the insert worked by querying
    const verification = await sql`
      SELECT * FROM email_tracking 
      WHERE campaign_id = ${testCampaignId} AND recipient_email = ${testEmail}
      ORDER BY created_at DESC
      LIMIT 1
    `
    
    return NextResponse.json({
      success: true,
      insert_result: result.rows[0],
      verification: verification.rows[0],
      message: 'Open tracking database operation test completed'
    })
    
  } catch (error) {
    console.error('❌ DEBUG: Database operation failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
} 