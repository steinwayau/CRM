import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing email_campaigns table schema...')
    
    // Drop and recreate with correct column names to match Prisma expectations
    await sql`DROP TABLE IF EXISTS email_campaigns CASCADE;`
    
    await sql`
      CREATE TABLE email_campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        "templateId" TEXT NOT NULL,
        "templateName" TEXT,
        "htmlContent" TEXT,
        "textContent" TEXT,
        "recipientType" TEXT DEFAULT 'all',
        "recipientCount" INTEGER DEFAULT 0,
        "sentCount" INTEGER DEFAULT 0,
        status TEXT DEFAULT 'draft',
        "scheduledAt" TIMESTAMP,
        "sentAt" TIMESTAMP,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    
    console.log('✅ email_campaigns table recreated with correct schema')
    
    // Test the schema
    const testResult = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'email_campaigns' ORDER BY column_name;`
    
    return NextResponse.json({
      success: true,
      message: 'email_campaigns table schema fixed',
      columns: testResult.rows.map(row => row.column_name)
    })

  } catch (error) {
    console.error('❌ Schema fix failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fix schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 