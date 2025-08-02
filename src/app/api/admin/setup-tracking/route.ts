import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// NEW TRACKING SYSTEM - Unified table for all email tracking
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up NEW unified email tracking system...')
    
    // Drop old broken tracking tables if they exist
    await sql`DROP TABLE IF EXISTS email_opens CASCADE;`
    await sql`DROP TABLE IF EXISTS email_clicks CASCADE;`
    await sql`DROP TABLE IF EXISTS email_bounces CASCADE;`
    
    console.log('✅ Removed old broken tracking tables')
    
    // Create new unified tracking table - SIMPLE AND BULLETPROOF
    await sql`
      CREATE TABLE email_tracking (
        id SERIAL PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        event_type TEXT NOT NULL, -- 'open' or 'click'
        
        -- For click events
        target_url TEXT,
        link_type TEXT,
        
        -- Tracking metadata
        user_agent TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    
    // Create indexes separately with proper PostgreSQL syntax
    await sql`CREATE INDEX idx_campaign_tracking ON email_tracking (campaign_id, event_type);`
    await sql`CREATE INDEX idx_recipient_tracking ON email_tracking (recipient_email, event_type);`
    
    console.log('✅ Created unified email_tracking table')
    
    // Verify table exists and structure
    const tableCheck = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'email_tracking' 
      ORDER BY ordinal_position;
    `
    
    const setup_summary = {
      timestamp: new Date().toISOString(),
      action: 'NEW_TRACKING_SYSTEM',
      table_created: 'email_tracking',
      columns: tableCheck.rows.map(row => `${row.column_name}: ${row.data_type}`),
      old_tables_removed: ['email_opens', 'email_clicks', 'email_bounces'],
      success: true
    }

    console.log('🎉 NEW tracking system setup complete:', setup_summary)
    
    return NextResponse.json({
      success: true,
      message: 'NEW unified email tracking system created successfully',
      details: setup_summary
    })

  } catch (error) {
    console.error('❌ NEW tracking system setup failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup NEW tracking system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 