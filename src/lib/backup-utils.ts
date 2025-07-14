import { PrismaClient } from '@prisma/client'
import { getStaffCredentials } from './staff-data'

const prisma = new PrismaClient()

// Create backups table if it doesn't exist
async function ensureBackupsTable() {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS backups (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP DEFAULT NOW(),
        size_kb INTEGER,
        type VARCHAR(20) DEFAULT 'Auto',
        status VARCHAR(20) DEFAULT 'Complete',
        data JSONB,
        enquiry_count INTEGER DEFAULT 0,
        trigger_event VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
  } catch (error) {
    console.error('Error creating backups table:', error)
  }
}

// Function to create automatic backup with intelligent frequency
export async function createAutoBackup(trigger: string = 'Data update') {
  try {
    await ensureBackupsTable()
    
    // Check if we should create a backup based on intelligent rules
    if (!await shouldCreateBackup(trigger)) {
      return { success: true, skipped: true, reason: 'Backup not needed at this time' }
    }

    // Get current enquiry data
    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // Get staff data
    const staffData = getStaffCredentials()
    
    // Calculate backup size
    const backupData = {
      enquiries,
      staff: staffData,
      timestamp: new Date().toISOString(),
      version: '1.0',
      trigger
    }
    
    const backupSizeKB = Math.round(JSON.stringify(backupData).length / 1024)
    
    // Store backup in database
    const newBackup = await prisma.$executeRaw`
      INSERT INTO backups (size_kb, type, status, data, enquiry_count, trigger_event)
      VALUES (${backupSizeKB}, 'Auto', 'Complete', ${JSON.stringify(backupData)}::jsonb, ${enquiries.length}, ${trigger})
      RETURNING id
    `
    
    // Clean up old backups (keep only last 20)
    await prisma.$executeRaw`
      DELETE FROM backups 
      WHERE id NOT IN (
        SELECT id FROM backups 
        ORDER BY created_at DESC 
        LIMIT 20
      )
    `
    
    console.log(`🔄 Auto backup created: ${enquiries.length} enquiries, ${backupSizeKB} KB, trigger: ${trigger}`)
    
    return { success: true, backup: { enquiryCount: enquiries.length, size: `${backupSizeKB} KB` } }
  } catch (error) {
    console.error('Error creating auto backup:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Intelligent backup decision logic
async function shouldCreateBackup(trigger: string): Promise<boolean> {
  try {
    await ensureBackupsTable()
    
    const now = new Date()
    
    // Get last backup
    const lastBackupResult = await prisma.$queryRaw`
      SELECT created_at, trigger_event FROM backups 
      ORDER BY created_at DESC 
      LIMIT 1
    ` as any[]
    
    const lastBackup = lastBackupResult[0]
    
    // Always create backup for these critical operations
    const criticalTriggers = [
      'CSV import',
      'Duplicate removal',
      'Database cleanup',
      'Database optimization',
      'Manual backup'
    ]
    
    if (criticalTriggers.some(ct => trigger.includes(ct))) {
      return true
    }
    
    // Don't create backup for single form submissions more than once per hour
    if (trigger === 'New enquiry submission' && lastBackup) {
      const lastBackupTime = new Date(lastBackup.created_at)
      const hoursSinceLastBackup = (now.getTime() - lastBackupTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLastBackup < 1) {
        return false // Skip backup if less than 1 hour since last backup
      }
    }
    
    // Create backup for enquiry updates only once per 30 minutes
    if (trigger === 'Enquiry update' && lastBackup) {
      const lastBackupTime = new Date(lastBackup.created_at)
      const minutesSinceLastBackup = (now.getTime() - lastBackupTime.getTime()) / (1000 * 60)
      
      if (minutesSinceLastBackup < 30) {
        return false // Skip backup if less than 30 minutes since last backup
      }
    }
    
    return true
  } catch (error) {
    console.error('Error in shouldCreateBackup:', error)
    return true // Default to creating backup on error
  }
}

// Function to get all backups
export async function getBackups() {
  try {
    await ensureBackupsTable()
    
    const backups = await prisma.$queryRaw`
      SELECT id, date, size_kb, type, status, enquiry_count, trigger_event, created_at
      FROM backups 
      ORDER BY created_at DESC
    ` as any[]
    
    return backups.map(backup => ({
      id: backup.id,
      date: backup.created_at.toISOString().slice(0, 16).replace('T', ' '),
      size: backup.size_kb > 1024 ? `${(backup.size_kb / 1024).toFixed(1)} MB` : `${backup.size_kb} KB`,
      type: backup.type,
      status: backup.status,
      enquiryCount: backup.enquiry_count,
      trigger: backup.trigger_event
    }))
  } catch (error) {
    console.error('Error getting backups:', error)
    return []
  }
}

// Function to create manual backup
export async function createManualBackup(trigger: string = 'Manual backup') {
  try {
    await ensureBackupsTable()
    
    // Get current enquiry data
    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // Get staff data
    const staffData = getStaffCredentials()
    
    // Calculate backup size
    const backupData = {
      enquiries,
      staff: staffData,
      timestamp: new Date().toISOString(),
      version: '1.0',
      trigger
    }
    
    const backupSizeKB = Math.round(JSON.stringify(backupData).length / 1024)
    
    // Store backup in database
    await prisma.$executeRaw`
      INSERT INTO backups (size_kb, type, status, data, enquiry_count, trigger_event)
      VALUES (${backupSizeKB}, 'Manual', 'Complete', ${JSON.stringify(backupData)}::jsonb, ${enquiries.length}, ${trigger})
    `
    
    return { success: true, backup: { enquiryCount: enquiries.length, size: `${backupSizeKB} KB` } }
  } catch (error) {
    console.error('Error creating manual backup:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Function to delete a backup
export async function deleteBackup(backupId: number) {
  try {
    await ensureBackupsTable()
    
    const result = await prisma.$executeRaw`
      DELETE FROM backups WHERE id = ${backupId}
    `
    
    if (result) {
      console.log(`🗑️ Backup #${backupId} deleted successfully`)
      return { success: true, message: `Backup #${backupId} deleted successfully` }
    } else {
      return { success: false, error: 'Backup not found' }
    }
  } catch (error) {
    console.error('Error deleting backup:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Function to get backup data for download
export async function getBackupData(backupId: number) {
  try {
    await ensureBackupsTable()
    
    const backups = await prisma.$queryRaw`
      SELECT data FROM backups WHERE id = ${backupId}
    ` as any[]
    
    if (backups.length === 0) {
      return { success: false, error: 'Backup not found' }
    }
    
    return { success: true, data: backups[0].data }
  } catch (error) {
    console.error('Error getting backup data:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Function to restore from backup
export async function restoreFromBackup(backupId: number) {
  try {
    await ensureBackupsTable()
    
    // Get backup data
    const backups = await prisma.$queryRaw`
      SELECT data FROM backups WHERE id = ${backupId}
    ` as any[]
    
    if (backups.length === 0) {
      return { success: false, error: 'Backup not found' }
    }
    
    const backupData = backups[0].data
    
    // Create a backup of current state before restoring
    await createManualBackup('Pre-restore backup')
    
    // Clear existing data
    await prisma.enquiry.deleteMany({})
    
    // Restore enquiries
    if (backupData.enquiries && backupData.enquiries.length > 0) {
      for (const enquiry of backupData.enquiries) {
        await prisma.enquiry.create({
          data: {
            ...enquiry,
            id: undefined, // Let database generate new IDs
            createdAt: new Date(enquiry.createdAt),
            updatedAt: new Date(enquiry.updatedAt || enquiry.createdAt)
          }
        })
      }
    }
    
    return { 
      success: true, 
      message: `Restored ${backupData.enquiries?.length || 0} enquiries from backup #${backupId}` 
    }
  } catch (error) {
    console.error('Error restoring from backup:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
} 