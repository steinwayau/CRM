import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createAutoBackup } from '@/lib/backup-utils'

const prisma = new PrismaClient()

// POST - Perform database maintenance operations
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    switch (action) {
      case 'clean':
        return await cleanDatabase()
      case 'optimize':
        return await optimizeTables()
      case 'integrity':
        return await checkIntegrity()
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Database maintenance error:', error)
    return NextResponse.json(
      { error: 'Database maintenance failed' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function cleanDatabase() {
  try {
    // Create backup before cleaning
    await createAutoBackup('Database cleanup operation')

    let cleanupResults = {
      emptyRecords: 0,
      duplicateEntries: 0,
      invalidEmails: 0,
      totalCleaned: 0
    }

    // Clean up enquiries with completely empty critical fields
    const emptyEnquiries = await prisma.enquiry.findMany({
      where: {
        AND: [
          { firstName: { in: [''] } },
          { email: { in: [''] } },
          { phone: { in: [''] } }
        ]
      }
    })

    if (emptyEnquiries.length > 0) {
      await prisma.enquiry.deleteMany({
        where: {
          id: { in: emptyEnquiries.map(e => e.id) }
        }
      })
      cleanupResults.emptyRecords = emptyEnquiries.length
    }

    // Clean up invalid email addresses
    const invalidEmails = await prisma.enquiry.findMany({
      where: {
        email: {
          not: ''
        }
      }
    })

    let invalidEmailCount = 0
    for (const enquiry of invalidEmails) {
      if (enquiry.email && !isValidEmail(enquiry.email)) {
        await prisma.enquiry.update({
          where: { id: enquiry.id },
          data: { email: '' }
        })
        invalidEmailCount++
      }
    }
    cleanupResults.invalidEmails = invalidEmailCount

    // Find and clean duplicate entries by email
    const duplicateEmails = await prisma.enquiry.groupBy({
      by: ['email'],
      where: {
        email: {
          not: ''
        }
      },
      having: {
        email: {
          _count: {
            gt: 1
          }
        }
      }
    })

    let duplicateCount = 0
    for (const group of duplicateEmails) {
      if (group.email) {
        const duplicates = await prisma.enquiry.findMany({
          where: { email: group.email },
          orderBy: { createdAt: 'asc' }
        })
        
        // Keep the first one, delete the rest
        if (duplicates.length > 1) {
          const toDelete = duplicates.slice(1)
          await prisma.enquiry.deleteMany({
            where: {
              id: { in: toDelete.map(d => d.id) }
            }
          })
          duplicateCount += toDelete.length
        }
      }
    }
    cleanupResults.duplicateEntries = duplicateCount

    cleanupResults.totalCleaned = cleanupResults.emptyRecords + cleanupResults.duplicateEntries + cleanupResults.invalidEmails

    return NextResponse.json({
      success: true,
      message: `Database cleaned successfully! Removed ${cleanupResults.totalCleaned} problematic records.`,
      details: cleanupResults
    })

  } catch (error) {
    console.error('Database cleanup error:', error)
    return NextResponse.json(
      { error: 'Database cleanup failed' },
      { status: 500 }
    )
  }
}

async function optimizeTables() {
  try {
    // Create backup before optimization
    await createAutoBackup('Database optimization operation')

    // Get database statistics before optimization
    const beforeStats = await getDatabaseStats()

    // Run ANALYZE on all tables to update statistics
    await prisma.$executeRaw`ANALYZE;`

    // Get database statistics after optimization
    const afterStats = await getDatabaseStats()

    const improvement = {
      sizeBefore: beforeStats.size,
      sizeAfter: afterStats.size,
      spaceSaved: Math.max(0, beforeStats.size - afterStats.size),
      tablesOptimized: ['enquiries', 'staff', 'system_settings', 'import_logs', 'users'].length
    }

    return NextResponse.json({
      success: true,
      message: `Database optimized successfully! Processed ${improvement.tablesOptimized} tables.`,
      details: improvement
    })

  } catch (error) {
    console.error('Database optimization error:', error)
    return NextResponse.json(
      { error: 'Database optimization failed' },
      { status: 500 }
    )
  }
}

async function checkIntegrity() {
  try {
    const integrityResults = {
      totalEnquiries: 0,
      validEnquiries: 0,
      invalidEnquiries: 0,
      staffIntegrity: true,
      systemIntegrity: true,
      issues: [] as string[]
    }

    // Check enquiry data integrity
    const allEnquiries = await prisma.enquiry.findMany()
    integrityResults.totalEnquiries = allEnquiries.length

    let validCount = 0
    let invalidCount = 0

    for (const enquiry of allEnquiries) {
      let isValid = true

      // Check for critical missing data
      if (!enquiry.firstName || enquiry.firstName.trim() === '') {
        isValid = false
        integrityResults.issues.push(`Enquiry #${enquiry.id}: Missing first name`)
      }

      if (!enquiry.email && !enquiry.phone) {
        isValid = false
        integrityResults.issues.push(`Enquiry #${enquiry.id}: Missing both email and phone`)
      }

      // Check for invalid email format
      if (enquiry.email && !isValidEmail(enquiry.email)) {
        isValid = false
        integrityResults.issues.push(`Enquiry #${enquiry.id}: Invalid email format`)
      }

      if (isValid) {
        validCount++
      } else {
        invalidCount++
      }
    }

    integrityResults.validEnquiries = validCount
    integrityResults.invalidEnquiries = invalidCount

    // Check staff table integrity
    const allStaff = await prisma.staff.findMany()
    for (const staff of allStaff) {
      if (!staff.name || staff.name.trim() === '') {
        integrityResults.staffIntegrity = false
        integrityResults.issues.push(`Staff #${staff.id}: Missing name`)
      }
    }

    // Check system settings integrity
    const allSettings = await prisma.systemSetting.findMany()
    for (const setting of allSettings) {
      if (!setting.key || setting.key.trim() === '') {
        integrityResults.systemIntegrity = false
        integrityResults.issues.push(`System Setting #${setting.id}: Missing key`)
      }
    }

    const overallHealth = integrityResults.issues.length === 0 ? 'Excellent' : 
                         integrityResults.issues.length < 5 ? 'Good' : 
                         integrityResults.issues.length < 10 ? 'Fair' : 'Poor'

    return NextResponse.json({
      success: true,
      message: `Integrity check completed. Database health: ${overallHealth}`,
      details: integrityResults
    })

  } catch (error) {
    console.error('Integrity check error:', error)
    return NextResponse.json(
      { error: 'Integrity check failed' },
      { status: 500 }
    )
  }
}

async function getDatabaseStats() {
  try {
    const enquiryCount = await prisma.enquiry.count()
    const staffCount = await prisma.staff.count()
    const userCount = await prisma.user.count()
    const settingCount = await prisma.systemSetting.count()
    
    // Estimate database size (rough calculation)
    const estimatedSize = (enquiryCount * 2) + (staffCount * 1) + (userCount * 1) + (settingCount * 0.5) // KB
    
    return {
      enquiries: enquiryCount,
      staff: staffCount,
      users: userCount,
      settings: settingCount,
      size: estimatedSize
    }
  } catch (error) {
    return {
      enquiries: 0,
      staff: 0,
      users: 0,
      settings: 0,
      size: 0
    }
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
} 