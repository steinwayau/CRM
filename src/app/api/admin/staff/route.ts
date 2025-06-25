import { NextRequest, NextResponse } from 'next/server'
import { getStaffCredentials, updateStaffCredentials } from '../../auth/login/route'

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

// GET - List all staff
export async function GET() {
  try {
    const staffList = getStaffCredentials()
    
    // Return staff without passwords for security
    const safeStaffList = staffList.map(staff => ({
      id: staff.id,
      username: staff.username,
      name: staff.name,
      role: staff.role,
      active: staff.active
    }))

    return NextResponse.json({
      success: true,
      staff: safeStaffList
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
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

    const staffList = getStaffCredentials()
    const username = generateUsername(name.trim())
    const password = generatePassword()
    
    // Check if username already exists
    const existingStaff = staffList.find(staff => staff.username === username)
    if (existingStaff) {
      return NextResponse.json(
        { error: 'Staff member with this name already exists' },
        { status: 400 }
      )
    }

    // Create new staff member
    const newStaff = {
      id: Math.max(...staffList.map(s => s.id), 0) + 1,
      username,
      password,
      name: name.trim(),
      role: 'staff',
      active: true
    }

    const updatedStaffList = [...staffList, newStaff]
    updateStaffCredentials(updatedStaffList)

    return NextResponse.json({
      success: true,
      message: 'Staff member created successfully',
      staff: {
        id: newStaff.id,
        username: newStaff.username,
        password: newStaff.password, // Only return password when creating
        name: newStaff.name,
        role: newStaff.role,
        active: newStaff.active
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    )
  }
}

// PUT - Update staff member (activate/deactivate)
export async function PUT(request: NextRequest) {
  try {
    const { id, active, name } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const staffList = getStaffCredentials()
    const staffIndex = staffList.findIndex(staff => staff.id === id)

    if (staffIndex === -1) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Update staff member
    if (active !== undefined) {
      staffList[staffIndex].active = active
    }
    
    if (name && name.trim() !== '') {
      staffList[staffIndex].name = name.trim()
    }

    updateStaffCredentials(staffList)

    return NextResponse.json({
      success: true,
      message: `Staff member ${active ? 'activated' : 'deactivated'} successfully`,
      staff: {
        id: staffList[staffIndex].id,
        username: staffList[staffIndex].username,
        name: staffList[staffIndex].name,
        role: staffList[staffIndex].role,
        active: staffList[staffIndex].active
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

// DELETE - Remove staff member (soft delete by deactivating)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '')

    if (!id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const staffList = getStaffCredentials()
    const staffIndex = staffList.findIndex(staff => staff.id === id)

    if (staffIndex === -1) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Soft delete by deactivating
    staffList[staffIndex].active = false

    updateStaffCredentials(staffList)

    return NextResponse.json({
      success: true,
      message: 'Staff member deactivated successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    )
  }
} 