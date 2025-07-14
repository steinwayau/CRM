import { NextRequest, NextResponse } from 'next/server'
import { createAutoBackup } from '@/lib/backup-utils'

export async function GET(request: NextRequest) {
  try {
    // This endpoint can be called by a cron job or external service
    // for scheduled backups (e.g., daily, hourly, etc.)
    
    const result = await createAutoBackup('Scheduled backup')
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Scheduled backup created successfully',
        backup: result.backup
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating scheduled backup:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create scheduled backup'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Allow manual triggering of scheduled backup with custom trigger message
    const { trigger = 'Manual scheduled backup' } = await request.json()
    
    const result = await createAutoBackup(trigger)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Scheduled backup created successfully',
        backup: result.backup
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating scheduled backup:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create scheduled backup'
    }, { status: 500 })
  }
} 