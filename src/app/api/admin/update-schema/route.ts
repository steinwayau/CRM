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
        'Added reminder_sent_to VARCHAR(255) column to track which staff member received the reminder'
      ],
      addedColumns,
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