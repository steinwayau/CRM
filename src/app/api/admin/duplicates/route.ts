import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createAutoBackup } from '@/lib/backup-utils'

const prisma = new PrismaClient()

// GET - Find duplicate enquiries
export async function GET(request: NextRequest) {
  try {
    // Get all enquiries
    const allEnquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Group by potential duplicate criteria
    const duplicateGroups: any[] = []
    const processedIds = new Set()

    // Find duplicates by email (most reliable)
    const emailGroups = new Map()
    
    allEnquiries.forEach(enquiry => {
      if (enquiry.email && !processedIds.has(enquiry.id)) {
        const email = enquiry.email.toLowerCase().trim()
        if (!emailGroups.has(email)) {
          emailGroups.set(email, [])
        }
        emailGroups.get(email).push(enquiry)
      }
    })

    // Add email duplicates to results
    emailGroups.forEach((enquiries, email) => {
      if (enquiries.length > 1) {
        duplicateGroups.push({
          id: `email_${email}`,
          type: 'Email Match',
          criteria: `Email: ${email}`,
          count: enquiries.length,
          enquiries: enquiries.map((e: any) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            email: e.email,
            phone: e.phone,
            state: e.state,
            suburb: e.suburb,
            createdAt: e.createdAt,
            importSource: e.importSource
          })),
          recommended: enquiries.slice(1) // Keep first, suggest removing others
        })
        
        // Mark as processed
        enquiries.forEach((e: any) => processedIds.add(e.id))
      }
    })

    // Find duplicates by name + phone combination
    const namePhoneGroups = new Map()
    
    allEnquiries.forEach(enquiry => {
      if (!processedIds.has(enquiry.id) && enquiry.firstName && enquiry.phone) {
        const key = `${enquiry.firstName.toLowerCase().trim()}_${enquiry.lastName?.toLowerCase().trim() || ''}_${enquiry.phone.replace(/\s/g, '')}`
        if (!namePhoneGroups.has(key)) {
          namePhoneGroups.set(key, [])
        }
        namePhoneGroups.get(key).push(enquiry)
      }
    })

    // Add name+phone duplicates to results
    namePhoneGroups.forEach((enquiries, key) => {
      if (enquiries.length > 1) {
        const firstEnquiry = enquiries[0]
        duplicateGroups.push({
          id: `namephone_${key}`,
          type: 'Name + Phone Match',
          criteria: `${firstEnquiry.firstName} ${firstEnquiry.lastName || ''} + ${firstEnquiry.phone}`,
          count: enquiries.length,
          enquiries: enquiries.map((e: any) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            email: e.email,
            phone: e.phone,
            state: e.state,
            suburb: e.suburb,
            createdAt: e.createdAt,
            importSource: e.importSource
          })),
          recommended: enquiries.slice(1) // Keep first, suggest removing others
        })
      }
    })

    // Calculate statistics
    const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.count, 0)
    const duplicateIds = duplicateGroups.flatMap(group => group.enquiries.map((e: any) => e.id))
    const uniqueRecords = allEnquiries.length - duplicateIds.length + duplicateGroups.length

    return NextResponse.json({
      success: true,
      summary: {
        totalEnquiries: allEnquiries.length,
        duplicateGroups: duplicateGroups.length,
        totalDuplicates,
        uniqueRecords,
        potentialSavings: totalDuplicates - duplicateGroups.length
      },
      duplicateGroups
    })

  } catch (error) {
    console.error('Error finding duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to find duplicates' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Remove selected duplicates
export async function POST(request: NextRequest) {
  try {
    const { action, duplicateIds } = await request.json()

    if (action === 'remove' && Array.isArray(duplicateIds)) {
      // Create backup before removing duplicates
      await createAutoBackup(`Duplicate removal: ${duplicateIds.length} records`)

      // Remove the selected duplicate entries
      const result = await prisma.enquiry.deleteMany({
        where: {
          id: {
            in: duplicateIds
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: `Successfully removed ${result.count} duplicate entries`,
        removedCount: result.count,
        backupCreated: true
      })
    }

    return NextResponse.json(
      { error: 'Invalid action or missing duplicateIds' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error removing duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to remove duplicates' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 