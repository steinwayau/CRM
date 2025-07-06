import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

// GET - Check current staff email setup
export async function GET() {
  try {
    // Use EXACTLY the same query as the working /api/admin/staff endpoint
    const result = await sql`
      SELECT id, name, email, active, created_at, updated_at
      FROM staff 
      ORDER BY id ASC
    `
    
    console.log('Raw database result:', result.rows.length, 'rows')
    console.log('First row sample:', result.rows[0])
    
    // Map the database results to the expected format for staff management
    const staffWithDefaults = result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      email: row.email || '', // Default to empty string if null
      role: 'staff', // Default role since it doesn't exist in DB
      active: row.active,
      phone: '', // Default empty since column doesn't exist
      position: '', // Default empty since column doesn't exist
      department: '' // Default empty since column doesn't exist
    }))
    
    console.log('Mapped result:', staffWithDefaults.length, 'staff members')
    
    return NextResponse.json({
      success: true,
      staff: staffWithDefaults,
      message: `Found ${result.rows.length} staff members`,
      debug: {
        raw_count: result.rows.length,
        mapped_count: staffWithDefaults.length,
        sample_raw: result.rows[0] || null,
        sample_mapped: staffWithDefaults[0] || null
      }
    })
    
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch staff from database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Update staff email addresses
export async function POST(request: NextRequest) {
  try {
    const { staff } = await request.json()

    if (!staff || !Array.isArray(staff)) {
      return NextResponse.json(
        { error: 'Staff array is required' },
        { status: 400 }
      )
    }

    let updatedCount = 0
    let createdCount = 0

    for (const member of staff) {
      const { id, name, email, active } = member

      if (!name) {
        continue // Skip entries without names
      }

      // Check if this is a new staff member (ID starts with 'new-')
      if (id.toString().startsWith('new-')) {
        // Create new staff member
        await sql`
          INSERT INTO staff (name, email, active, created_at, updated_at)
          VALUES (${name}, ${email || null}, ${active !== false}, NOW(), NOW())
        `
        createdCount++
      } else {
        // Update existing staff member
        await sql`
          UPDATE staff 
          SET name = ${name}, 
              email = ${email || null}, 
              active = ${active !== false}, 
              updated_at = NOW()
          WHERE id = ${id}
        `
        updatedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} staff members, created ${createdCount} new staff members`,
      updatedCount,
      createdCount
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to update staff email addresses' },
      { status: 500 }
    )
  }
} 