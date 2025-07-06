import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await sql`
      SELECT id, name, email, active, created_at, updated_at
      FROM staff 
      ORDER BY id ASC
    `
    
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
      staff: staffList,
      message: "Working from staff-management endpoint"
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff from database' },
      { status: 500 }
    )
  }
}

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
        continue
      }

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
} // Force cache clear
