import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database schema update for reminder system...')

    // Add reminder tracking columns to enquiries table
    await sql`
      ALTER TABLE enquiries 
      ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS reminder_sent_to VARCHAR(255)
    `

    console.log('Added reminder tracking columns to enquiries table')

    // Set up staff email addresses for reminder system
    console.log('Setting up staff email addresses...')
    
    const defaultStaff = [
      { name: "Abbey Landgren", email: "abbey@epgpianos.com.au" },
      { name: "Angela Liu", email: "angela@epgpianos.com.au" },
      { name: "Chris", email: "chris@epgpianos.com.au" },
      { name: "Mark", email: "mark@epgpianos.com.au" },
      { name: "Day", email: "day@epgpianos.com.au" },
      { name: "Hendra", email: "hendra@epgpianos.com.au" },
      { name: "June", email: "june@epgpianos.com.au" },
      { name: "Mike", email: "mike@epgpianos.com.au" },
      { name: "Alison", email: "alison@epgpianos.com.au" },
      { name: "Olivia", email: "olivia@epgpianos.com.au" },
      { name: "Louie", email: "louie@epgpianos.com.au" }
    ]

    let staffUpdated = 0
    for (const staff of defaultStaff) {
      try {
        // Insert into users table for reminder system
        await sql`
          INSERT INTO users (name, email, role, active) 
          VALUES (${staff.name}, ${staff.email}, 'staff', true)
          ON CONFLICT (email) 
          DO UPDATE SET 
            name = ${staff.name}, 
            active = true
        `
        staffUpdated++
      } catch (error) {
        console.error(`Error setting up ${staff.name}:`, error)
      }
    }

    console.log(`Set up ${staffUpdated} staff members with email addresses`)

    // Verify the columns were added
    const verifyResult = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'enquiries' 
      AND column_name IN ('reminder_sent', 'reminder_sent_at', 'reminder_sent_to')
      ORDER BY column_name
    `

    const addedColumns = verifyResult.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable
    }))

    console.log('Schema update completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Database schema updated successfully for reminder system',
      changes: [
        'Added reminder_sent BOOLEAN column to track if reminder email was sent',
        'Added reminder_sent_at TIMESTAMP column to track when reminder was sent',
        'Added reminder_sent_to VARCHAR(255) column to track which staff member received the reminder',
        `Set up ${staffUpdated} staff members with email addresses for reminder system`
      ],
      addedColumns,
      staffUpdated,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error updating database schema:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update database schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 