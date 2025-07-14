import { NextRequest, NextResponse } from 'next/server'
import { getBackups, createManualBackup, deleteBackup, getBackupData, restoreFromBackup } from '@/lib/backup-utils'

// GET - List all backups or download backup data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const backupId = searchParams.get('id')
    const action = searchParams.get('action')
    
    // Handle backup download
    if (backupId && action === 'download') {
      const id = parseInt(backupId)
      const result = await getBackupData(id)
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        )
      }
      
      // Return backup data as downloadable JSON
      const response = new NextResponse(JSON.stringify(result.data, null, 2))
      response.headers.set('Content-Type', 'application/json')
      response.headers.set('Content-Disposition', `attachment; filename="backup_${id}_${new Date().toISOString().split('T')[0]}.json"`)
      return response
    }
    
    // Default: return list of backups
    const backups = await getBackups()
    return NextResponse.json({
      success: true,
      backups
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch backups' },
      { status: 500 }
    )
  }
}

// POST - Create new backup
export async function POST(request: NextRequest) {
  try {
    const { trigger = 'Manual backup' } = await request.json()
    
    const result = await createManualBackup(trigger)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        backup: result.backup
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    )
  }
}

// PUT - Restore from backup
export async function PUT(request: NextRequest) {
  try {
    const { backupId } = await request.json()
    
    const result = await restoreFromBackup(backupId)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to restore backup' },
      { status: 500 }
    )
  }
}

// DELETE - Delete backup
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const backupId = parseInt(searchParams.get('id') || '')
    
    if (!backupId) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      )
    }
    
    // Actually delete the backup from storage
    const result = await deleteBackup(backupId)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    )
  }
} 

// PATCH - Automated backup endpoint (for cron jobs)
export async function PATCH(request: NextRequest) {
  try {
    // Verify this is an automated request (you could add API key verification here)
    const { trigger = 'Automated daily backup' } = await request.json()
    
    const result = await createManualBackup(trigger)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Automated backup created successfully',
        backup: result.backup,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create automated backup',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 