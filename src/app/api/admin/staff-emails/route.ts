import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

// GET - Check current staff email setup
export async function GET() {
  try {
    // Check users table for staff with emails
    const usersResult = await sql`
      SELECT id, name, email, role, active 
      FROM users 
      WHERE role = 'staff' 
      ORDER BY name ASC
    `
    
    return NextResponse.json({
      success: true,
      staff: usersResult.rows,
      message: `Found ${usersResult.rows.length} staff members`
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
      const { id, name, email, role, active } = member

      if (!name || !email) {
        continue // Skip incomplete entries
      }

      // Check if this is a new staff member (ID starts with 'new-')
      if (id.startsWith('new-')) {
        // Create new staff member
        await sql`
          INSERT INTO users (name, email, role, active, created_at, updated_at)
          VALUES (${name}, ${email}, ${role || 'staff'}, ${active}, NOW(), NOW())
        `
        createdCount++
      } else {
        // Update existing staff member
        await sql`
          UPDATE users 
          SET name = ${name}, email = ${email}, role = ${role || 'staff'}, active = ${active}, updated_at = NOW()
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