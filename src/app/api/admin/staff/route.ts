import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Helper function to generate secure password
function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Helper function to generate username
function generateUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '.') + '.staff'
}

// Helper function to generate email
function generateEmail(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '.') + '@epgpianos.com.au'
}

// GET - List all staff
export async function GET() {
  try {
    const result = await sql`
      SELECT id, name, email, active, created_at, updated_at
      FROM staff 
      ORDER BY id ASC
    `
    
    // Convert database rows to the expected format with credentials
    const staffList = result.rows.map((row: any) => ({
      id: row.id,
      username: generateUsername(row.name),
      password: '••••••••••••', // Hidden for security
      name: row.name,
      role: 'staff',
      active: row.active
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

// POST - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Staff name is required' },
        { status: 400 }
      )
    }

    const staffName = name.trim()
    const email = generateEmail(staffName)
    const username = generateUsername(staffName)
    const password = generatePassword()
    
    // Check if staff member already exists
    const existingStaff = await sql`
      SELECT id FROM staff WHERE name = ${staffName} OR email = ${email}
    `
    
    if (existingStaff.rows.length > 0) {
      return NextResponse.json(
        { error: 'Staff member with this name already exists' },
        { status: 400 }
      )
    }

    // Insert new staff member into database
    const result = await sql`
      INSERT INTO staff (name, email, active, created_at, updated_at)
      VALUES (${staffName}, ${email}, true, NOW(), NOW())
      RETURNING id, name, email, active
    `

    const newStaff = result.rows[0]

    return NextResponse.json({
      success: true,
      message: 'Staff member created successfully',
      staff: {
        id: newStaff.id,
        username: username,
        password: password, // Only return password when creating
        name: newStaff.name,
        role: 'staff',
        active: newStaff.active
      }
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to create staff member in database' },
      { status: 500 }
    )
  }
}

// PUT - Update staff member (activate/deactivate or change name)
export async function PUT(request: NextRequest) {
  try {
    const { id, active, name } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    // Build dynamic update query
    let updateFields = []
    let updateValues = []
    
    if (active !== undefined) {
      updateFields.push('active = $' + (updateValues.length + 1))
      updateValues.push(active)
    }
    
    if (name && name.trim() !== '') {
      updateFields.push('name = $' + (updateValues.length + 1))
      updateValues.push(name.trim())
      
      // Also update email if name is changed
      updateFields.push('email = $' + (updateValues.length + 1))
      updateValues.push(generateEmail(name.trim()))
    }
    
    updateFields.push('updated_at = NOW()')
    updateValues.push(id) // ID is always the last parameter

    if (updateFields.length === 1) { // Only updated_at, no actual changes
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const query = `
      UPDATE staff 
      SET ${updateFields.join(', ')}
      WHERE id = $${updateValues.length}
      RETURNING id, name, email, active
    `

    const result = await sql.query(query, updateValues)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    const updatedStaff = result.rows[0]

    return NextResponse.json({
      success: true,
      message: `Staff member updated successfully`,
      staff: {
        id: updatedStaff.id,
        username: generateUsername(updatedStaff.name),
        name: updatedStaff.name,
        role: 'staff',
        active: updatedStaff.active
      }
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to update staff member in database' },
      { status: 500 }
    )
  }
}

// DELETE - Remove staff member (soft delete by deactivating OR permanent delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '')
    const permanent = searchParams.get('permanent') === 'true'

    if (!id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    if (permanent) {
      // Permanent delete - completely remove from database
      const result = await sql`
        DELETE FROM staff 
        WHERE id = ${id}
        RETURNING id, name
      `

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Staff member permanently deleted'
      })
    } else {
      // Soft delete by deactivating
      const result = await sql`
        UPDATE staff 
        SET active = false, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, name
      `

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Staff member deactivated successfully'
      })
    }

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff member from database' },
      { status: 500 }
    )
  }
} 