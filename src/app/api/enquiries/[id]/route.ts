import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createAutoBackup } from '@/lib/backup-utils'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const updateData = await request.json()
    
    console.log('Updating enquiry:', id, 'with data:', updateData)

    // Combine eventSource and eventSourceOther if "Other" was selected
    const finalEventSource = updateData.eventSource === 'Other' && updateData.eventSourceOther 
      ? `Other: ${updateData.eventSourceOther}` 
      : updateData.eventSource

    // Handle follow-up date conversion
    let followUpDate = null
    if (updateData.bestTimeToFollowUp) {
      followUpDate = new Date(updateData.bestTimeToFollowUp).toISOString()
    }

    // Update the enquiry in database using Prisma
    const updatedEnquiry = await prisma.enquiry.update({
      where: { id },
      data: {
        status: updateData.status || 'New',
        institutionName: updateData.institutionName || null,
        firstName: updateData.firstName,
        lastName: updateData.lastName || updateData.surname || '',
        email: updateData.email,
        phone: updateData.phone || null,
        nationality: updateData.nationality || 'English',
        state: updateData.state,
        suburb: updateData.suburb || null,
        productInterest: Array.isArray(updateData.productInterest) 
          ? updateData.productInterest.join(', ') 
          : (updateData.productInterest || ''),
        source: updateData.source || null,
        eventSource: finalEventSource || null,
        comments: updateData.comments || null,
        submittedBy: updateData.submittedBy || 'Online Form',
        bestTimeToFollowUp: followUpDate,
        customerRating: updateData.customerRating || 'N/A',
        stepProgram: updateData.stepProgram || 'N/A',
        salesManagerInvolved: updateData.salesManagerInvolved || 'No',
        salesManagerExplanation: updateData.salesManagerExplanation || null,
        followUpNotes: updateData.followUpNotes || null,
        doNotEmail: updateData.doNotEmail || false,
        updatedAt: new Date()
      }
    })
    
    // Convert to expected format
    const formattedEnquiry = {
      id: updatedEnquiry.id,
      status: updatedEnquiry.status,
      firstName: updatedEnquiry.firstName,
      lastName: updatedEnquiry.lastName,
      email: updatedEnquiry.email,
      phone: updatedEnquiry.phone,
      nationality: updatedEnquiry.nationality,
      state: updatedEnquiry.state,
      suburb: updatedEnquiry.suburb,
      institutionName: updatedEnquiry.institutionName,
      productInterest: updatedEnquiry.productInterest || '',
      source: updatedEnquiry.source,
      eventSource: updatedEnquiry.eventSource,
      comments: updatedEnquiry.comments,
      submittedBy: updatedEnquiry.submittedBy,
      bestTimeToFollowUp: updatedEnquiry.bestTimeToFollowUp,
      customerRating: updatedEnquiry.customerRating,
      stepProgram: updatedEnquiry.stepProgram,
      salesManagerInvolved: updatedEnquiry.salesManagerInvolved,
      salesManagerExplanation: updatedEnquiry.salesManagerExplanation,
      followUpNotes: updatedEnquiry.followUpNotes,
      doNotEmail: updatedEnquiry.doNotEmail,
      hasFollowUp: !!(updatedEnquiry.bestTimeToFollowUp || updatedEnquiry.followUpNotes),
      createdAt: updatedEnquiry.createdAt,
      created_at: updatedEnquiry.createdAt
    }

    console.log('Successfully updated enquiry:', formattedEnquiry)
    
    // Create automatic backup after successful enquiry update
    try {
      await createAutoBackup(`Enquiry update: #${id}`)
    } catch (backupError) {
      console.error('Warning: Auto backup failed after enquiry update:', backupError)
      // Don't fail the update if backup fails
    }
    
    return NextResponse.json(formattedEnquiry)
  } catch (error) {
    console.error('Error updating enquiry:', error)
    return NextResponse.json(
      { error: 'Failed to update enquiry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    await prisma.enquiry.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Enquiry deleted successfully' })
  } catch (error) {
    console.error('Error deleting enquiry:', error)
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Enquiry not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete enquiry' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const enquiry = await prisma.enquiry.findUnique({
      where: { id }
    })

    if (enquiry) {
      // Convert to expected format
      const formattedEnquiry = {
        id: enquiry.id,
        status: enquiry.status,
        firstName: enquiry.firstName,
        lastName: enquiry.lastName,
        email: enquiry.email,
        phone: enquiry.phone,
        nationality: enquiry.nationality,
        state: enquiry.state,
        suburb: enquiry.suburb,
        institutionName: enquiry.institutionName,
        productInterest: enquiry.productInterest || '',
        source: enquiry.source,
        eventSource: enquiry.eventSource,
        comments: enquiry.comments,
        submittedBy: enquiry.submittedBy,
        bestTimeToFollowUp: enquiry.bestTimeToFollowUp,
        customerRating: enquiry.customerRating,
        stepProgram: enquiry.stepProgram,
        salesManagerInvolved: enquiry.salesManagerInvolved,
        salesManagerExplanation: enquiry.salesManagerExplanation,
        followUpNotes: enquiry.followUpNotes,
        doNotEmail: enquiry.doNotEmail,
        hasFollowUp: !!(enquiry.bestTimeToFollowUp || enquiry.followUpNotes),
        createdAt: enquiry.createdAt,
        created_at: enquiry.createdAt
      }
      
      return NextResponse.json(formattedEnquiry)
    } else {
      return NextResponse.json(
        { error: 'Enquiry not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error fetching enquiry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enquiry' },
      { status: 500 }
    )
  }
} 