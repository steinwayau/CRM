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
    
    // Also check if staff table exists and has any emails
    let staffTableResult = { rows: [] }
    try {
      staffTableResult = await sql`
        SELECT id, name, email, role, "isActive" as active 
        FROM staff 
        ORDER BY name ASC
      `
    } catch (error) {
      console.log('Staff table check failed:', error)
    }

    return NextResponse.json({
      success: true,
      usersWithEmails: usersResult.rows,
      staffTableData: staffTableResult.rows,
      message: `Found ${usersResult.rows.length} users and ${staffTableResult.rows.length} staff records`
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff data from database' },
      { status: 500 }
    )
  }
}

// POST - Set up staff email addresses for the reminder system
export async function POST() {
  try {
    // Default staff with their email addresses
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
    let errors = 0
    const errorDetails: string[] = []
    
    for (const staff of defaultStaff) {
      try {
        // Insert into users table (for reminder system)
        await sql`
          INSERT INTO users (name, email, role, active) 
          VALUES (${staff.name}, ${staff.email}, 'staff', ${staff.active})
          ON CONFLICT (email) 
          DO UPDATE SET 
            name = ${staff.name}, 
            active = ${staff.active}
        `
        
        // Also try to update staff table if it exists
        try {
          await sql`
            UPDATE staff 
            SET email = ${staff.email}, "isActive" = ${staff.active}
            WHERE name = ${staff.name}
          `
        } catch (error) {
          // Staff table might not exist or have different structure
          console.log(`Could not update staff table for ${staff.name}:`, error)
        }
        
        updated++
      } catch (error) {
        errorDetails.push(`Error setting up ${staff.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Set up ${updated} staff members with email addresses for reminder system`,
      updated,
      errors,
      staff: defaultStaff,
      ...(errorDetails.length > 0 && { errorDetails })
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to set up staff email addresses' },
      { status: 500 }
    )
  }
} 