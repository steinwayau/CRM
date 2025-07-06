import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

// GET - Check current staff email setup
// COPIED EXACT WORKING CODE FROM /api/admin/staff
export async function GET() {
  try {
    const result = await sql`
      SELECT id, name, email, active, created_at, updated_at
      FROM staff 
      ORDER BY id ASC
    `
    
    // Use exact same format as working staff API
    const staffList = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email || '',
      role: 'staff',
      active: row.active,
      phone: '',
      position: '',
      department: ''
    }))
    
    return NextResponse.json({
      success: true,
      staff: staffList
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff from database' },
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
      createdCount,
      version: "2.0-fixed"
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to update staff email addresses' },
      { status: 500 }
    )
  }
} 