import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Database setup endpoint to create missing tables
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up database tables...')
    
    // Create email_campaigns table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS email_campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        template_id TEXT,
        subject TEXT,
        html_content TEXT,
        text_content TEXT,
        recipient_type TEXT,
        status TEXT DEFAULT 'draft',
        sent_count INTEGER DEFAULT 0,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    console.log('✅ email_campaigns table created/verified')

    // Create email_opens table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS email_opens (
        id SERIAL PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        recipient_id INTEGER,
        recipient_email TEXT NOT NULL,
        opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address TEXT,
        source TEXT DEFAULT 'pixel'
      );
    `
    console.log('✅ email_opens table created/verified')

    // Create email_clicks table if it doesn't exist  
    await sql`
      CREATE TABLE IF NOT EXISTS email_clicks (
        id SERIAL PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        recipient_id INTEGER,
        recipient_email TEXT NOT NULL,
        target_url TEXT NOT NULL,
        link_type TEXT DEFAULT 'text-link',
        clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address TEXT,
        source TEXT DEFAULT 'redirect'
      );
    `
    console.log('✅ email_clicks table created/verified')

    // Create email_bounces table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS email_bounces (
        id SERIAL PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        recipient_id INTEGER,
        recipient_email TEXT NOT NULL,
        bounce_type TEXT,
        reason TEXT,
        bounced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    console.log('✅ email_bounces table created/verified')

    // Verify tables exist and get counts
    const tableChecks = await Promise.all([
      sql`SELECT COUNT(*) as count FROM email_campaigns`.catch(() => ({ rows: [{ count: 'ERROR' }] })),
      sql`SELECT COUNT(*) as count FROM email_opens`.catch(() => ({ rows: [{ count: 'ERROR' }] })),
      sql`SELECT COUNT(*) as count FROM email_clicks`.catch(() => ({ rows: [{ count: 'ERROR' }] })),
      sql`SELECT COUNT(*) as count FROM email_bounces`.catch(() => ({ rows: [{ count: 'ERROR' }] }))
    ])

    const setup_summary = {
      timestamp: new Date().toISOString(),
      tables_created: [
        'email_campaigns',
        'email_opens', 
        'email_clicks',
        'email_bounces'
      ],
      table_counts: {
        email_campaigns: tableChecks[0].rows[0].count,
        email_opens: tableChecks[1].rows[0].count,
        email_clicks: tableChecks[2].rows[0].count,
        email_bounces: tableChecks[3].rows[0].count
      },
      success: true
    }

    console.log('🎉 Database setup complete:', setup_summary)
    
    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
      details: setup_summary
    })

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup database tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 