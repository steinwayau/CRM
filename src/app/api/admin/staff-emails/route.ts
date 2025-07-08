import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

// GET - List all staff with email management format
// COPIED EXACT WORKING CODE FROM /api/admin/staff
export async function GET() {
  try {
    const result = await sql`
      SELECT id, name, email, active, created_at, updated_at
      FROM staff 
      ORDER BY id ASC
    `
    
    // Convert database rows to staff email management format
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

    for (const member of staff) {
      const { id, email } = member

      if (!id) {
        continue // Skip entries without IDs
      }

      // Update staff member email
      await sql`
        UPDATE staff 
        SET email = ${email || null}, 
            updated_at = NOW()
        WHERE id = ${id}
      `
      updatedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} staff email addresses`,
      updatedCount
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to update staff email addresses' },
      { status: 500 }
    )
  }
} 