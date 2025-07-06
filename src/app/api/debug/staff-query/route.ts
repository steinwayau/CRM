import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

// TEMPORARY DEBUGGING ENDPOINT - TO BE REMOVED AFTER ISSUE IS RESOLVED
export async function GET() {
  try {
    console.log('🔍 Starting debug query comparison...')
    
    // Test 1: Run the exact query from /api/admin/staff (the working one)
    console.log('📊 Running staff API query...')
    const staffQuery = await sql`
      SELECT id, name, email, active, created_at, updated_at
      FROM staff 
      ORDER BY id ASC
    `
    
    // Test 2: Run the exact query from /api/admin/staff-emails (the broken one)
    console.log('📊 Running staff-emails API query...')
    const staffEmailsQuery = await sql`
      SELECT id, name, email, active, created_at, updated_at
      FROM staff 
      ORDER BY name ASC
    `
    
    // Test 3: Check if there are any differences in the connection or context
    console.log('🔍 Checking database information...')
    const dbInfo = await sql`
      SELECT 
        current_database() as database_name,
        current_schema() as schema_name,
        current_user as user_name,
        NOW() as current_time
    `
    
    // Test 4: Get table structure
    console.log('📋 Checking table structure...')
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'staff'
      ORDER BY ordinal_position
    `
    
    console.log('✅ All debug queries completed successfully')
    
    return NextResponse.json({
      success: true,
      debug_info: {
        staff_api_query: {
          row_count: staffQuery.rows.length,
          sample_record: staffQuery.rows[0] || null,
          first_3_records: staffQuery.rows.slice(0, 3)
        },
        staff_emails_api_query: {
          row_count: staffEmailsQuery.rows.length,
          sample_record: staffEmailsQuery.rows[0] || null,
          first_3_records: staffEmailsQuery.rows.slice(0, 3)
        },
        database_info: dbInfo.rows[0],
        table_structure: tableInfo.rows,
        queries_identical: staffQuery.rows.length === staffEmailsQuery.rows.length,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('🚨 Debug query error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Debug query failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 