import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Complete analytics fix - start fresh
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 FIXING ANALYTICS SYSTEM COMPLETELY...')
    
    // Step 1: Drop and recreate all tables with correct schema
    console.log('Step 1: Recreating database tables...')
    
    // Drop existing tables if they have issues
    await sql`DROP TABLE IF EXISTS email_clicks CASCADE;`
    await sql`DROP TABLE IF EXISTS email_opens CASCADE;`
    await sql`DROP TABLE IF EXISTS email_campaigns CASCADE;`
    
    // Create fresh email_campaigns table
    await sql`
      CREATE TABLE email_campaigns (
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
    
    // Create fresh tables with correct schema
    await sql`
      CREATE TABLE email_opens (
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
    
    await sql`
      CREATE TABLE email_clicks (
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
    
    console.log('✅ Tables recreated successfully')
    
    // Step 2: Test database connectivity
    console.log('Step 2: Testing database...')
    const testResults = await Promise.all([
      sql`SELECT COUNT(*) as count FROM email_campaigns`,
      sql`SELECT COUNT(*) as count FROM email_opens`, 
      sql`SELECT COUNT(*) as count FROM email_clicks`
    ])
    
    // Step 3: Create a test campaign
    console.log('Step 3: Creating test campaign...')
    await sql`
      INSERT INTO email_campaigns (id, name, template_id, subject, status, created_at) 
      VALUES ('test-campaign-001', 'Test Campaign', 'template-001', 'Test Subject', 'draft', CURRENT_TIMESTAMP)
    `
    console.log('✅ Test campaign created')
    
    const fixResults = {
      timestamp: new Date().toISOString(),
      steps_completed: [
        'All tables dropped and recreated with correct schema',
        'Database connectivity verified',
        'Test campaign created'
      ],
      final_counts: {
        campaigns: parseInt(testResults[0].rows[0].count as string) + 1,
        opens: testResults[1].rows[0].count,
        clicks: testResults[2].rows[0].count
      },
      success: true,
      next_steps: [
        '1. Send a new test campaign from the dashboard',
        '2. Open the email and click links', 
        '3. Check dashboard for real-time updates'
      ]
    }
    
    console.log('🎉 ANALYTICS SYSTEM FIXED:', fixResults)
    
    return NextResponse.json({
      success: true,
      message: 'Analytics system completely fixed and reset',
      details: fixResults
    })

  } catch (error) {
    console.error('❌ ANALYTICS FIX FAILED:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fix analytics system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 