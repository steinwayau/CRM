import { NextRequest, NextResponse } from 'next/server'
import { getStaffCredentials } from '@/lib/staff-data'

// In-memory backup storage (in production this would be a real database/file system)
let backupStorage: Array<{
  id: number
  date: string
  size: string
  type: 'Auto' | 'Manual'
  status: 'Complete' | 'In Progress' | 'Failed'
  data: any
}> = [
  {
    id: 1,
    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    size: '2.4 MB',
    type: 'Auto',
    status: 'Complete',
    data: null
  }
]

// GET - List all backups
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      backups: backupStorage.map(backup => ({
        id: backup.id,
        date: backup.date,
        size: backup.size,
        type: backup.type,
        status: backup.status
      }))
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
    const { type = 'Manual' } = await request.json()
    
    // Get current data to backup
    const staffData = getStaffCredentials()
    
    // Create backup entry
    const newBackup = {
      id: Math.max(...backupStorage.map(b => b.id), 0) + 1,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      size: `${(JSON.stringify(staffData).length / 1024).toFixed(1)} KB`,
      type: type as 'Auto' | 'Manual',
      status: 'Complete' as const,
      data: {
        staff: staffData,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    }
    
    backupStorage.unshift(newBackup)
    
    // Keep only last 10 backups
    if (backupStorage.length > 10) {
      backupStorage = backupStorage.slice(0, 10)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        id: newBackup.id,
        date: newBackup.date,
        size: newBackup.size,
        type: newBackup.type,
        status: newBackup.status
      }
    })
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
    
    const backup = backupStorage.find(b => b.id === backupId)
    if (!backup) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      )
    }
    
    if (!backup.data) {
      return NextResponse.json(
        { error: 'Backup data is corrupted or missing' },
        { status: 400 }
      )
    }
    
    // In a real system, you would restore the data here
    // For now, we'll just simulate it
    
    return NextResponse.json({
      success: true,
      message: `Successfully restored from backup #${backupId}`,
      restoredData: {
        staffCount: backup.data.staff?.length || 0,
        backupDate: backup.date,
        version: backup.data.version
      }
    })
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
    
    const backupIndex = backupStorage.findIndex(b => b.id === backupId)
    if (backupIndex === -1) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      )
    }
    
    backupStorage.splice(backupIndex, 1)
    
    return NextResponse.json({
      success: true,
      message: `Backup #${backupId} deleted successfully`
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    )
  }
} 