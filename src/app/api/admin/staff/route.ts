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

// GET - Retrieve all staff with email addresses
export async function GET_EMAILS() {
  try {
    const result = await sql`
      SELECT id, name, email, role, active 
      FROM users 
      WHERE role = 'staff' 
      ORDER BY name ASC
    `
    
    return NextResponse.json({
      success: true,
      staff: result.rows
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff from database' },
      { status: 500 }
    )
  }
}

// POST - Add or update staff email addresses
export async function POST_EMAILS(request: NextRequest) {
  try {
    const { staffUpdates } = await request.json()

    if (!staffUpdates || !Array.isArray(staffUpdates)) {
      return NextResponse.json(
        { error: 'staffUpdates array is required' },
        { status: 400 }
      )
    }

    let updated = 0
    let errors = 0
    const errorDetails: string[] = []

    for (const staff of staffUpdates) {
      try {
        if (!staff.name || !staff.email) {
          errorDetails.push(`Missing name or email for staff record`)
          errors++
          continue
        }

        // Update or insert staff member with email
        await sql`
          INSERT INTO users (name, email, role, active) 
          VALUES (${staff.name}, ${staff.email}, 'staff', ${staff.active !== false})
          ON CONFLICT (email) 
          DO UPDATE SET 
            name = ${staff.name}, 
            active = ${staff.active !== false}
        `
        
        updated++
      } catch (error) {
        errorDetails.push(`Error updating ${staff.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} staff members`,
      updated,
      errors,
      ...(errorDetails.length > 0 && { errorDetails })
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to update staff in database' },
      { status: 500 }
    )
  }
}

// PUT - Quick setup with default staff emails
export async function PUT_EMAILS() {
  try {
    const defaultStaff = [
      { name: "Abbey Landgren", email: "abbey@epgpianos.com.au", active: true },
      { name: "Angela Liu", email: "angela@epgpianos.com.au", active: true },
      { name: "Chris", email: "chris@epgpianos.com.au", active: true },
      { name: "Mark", email: "mark@epgpianos.com.au", active: true },
      { name: "Day", email: "day@epgpianos.com.au", active: true },
      { name: "Hendra", email: "hendra@epgpianos.com.au", active: true },
      { name: "June", email: "june@epgpianos.com.au", active: true },
      { name: "Mike", email: "mike@epgpianos.com.au", active: true },
      { name: "Alison", email: "alison@epgpianos.com.au", active: true },
      { name: "Olivia", email: "olivia@epgpianos.com.au", active: true },
      { name: "Louie", email: "louie@epgpianos.com.au", active: true }
    ]

    let updated = 0
    
    for (const staff of defaultStaff) {
      try {
        await sql`
          INSERT INTO users (name, email, role, active) 
          VALUES (${staff.name}, ${staff.email}, 'staff', ${staff.active})
          ON CONFLICT (email) 
          DO UPDATE SET 
            name = ${staff.name}, 
            active = ${staff.active}
        `
        updated++
      } catch (error) {
        console.error(`Error updating ${staff.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Set up ${updated} staff members with default email addresses`,
      updated,
      staff: defaultStaff
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to set up default staff emails' },
      { status: 500 }
    )
  }
} 