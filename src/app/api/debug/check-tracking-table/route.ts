import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    // Check all records in email_tracking table
    const result = await sql`
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
    
    return NextResponse.json({
      success: true,
      totalRecords: result.rows.length,
      records: result.rows,
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