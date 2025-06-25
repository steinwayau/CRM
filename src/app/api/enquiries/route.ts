import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const enquiries = await prisma.enquiry.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(enquiries)
  } catch (error) {
    console.error('Error fetching enquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enquiries' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Received enquiry data:', data)
    
    // Validate required fields
    if (!data.firstName || !data.email || !data.state) {
      console.log('Validation failed:', { firstName: data.firstName, email: data.email, state: data.state })
      return NextResponse.json(
        { error: `Missing required fields. Received: firstName="${data.firstName}", email="${data.email}", state="${data.state}"` },
        { status: 400 }
      )
    }

    // Create enquiry in database
    const newEnquiry = await prisma.enquiry.create({
      data: {
        status: data.status || 'New',
        firstName: data.firstName,
        lastName: data.lastName || data.surname || '',
        email: data.email,
        phone: data.phone || null,
        nationality: data.nationality || 'English',
        state: data.state,
        suburb: data.suburb || null,
        institutionName: data.institutionName || null,
        productInterest: data.productInterest || [],
        source: data.source || null,
        eventSource: data.eventSource || null,
        comments: data.comments || null,
        followUpNotes: data.followUpNotes || null,
        bestTimeToFollowUp: data.bestTimeToFollowUp ? new Date(data.bestTimeToFollowUp) : null,
        customerRating: data.customerRating || 'N/A',
        stepProgram: data.stepProgram || 'N/A',
        submittedBy: data.submittedBy || 'Online Form',
        callTakenBy: data.callTakenBy || null,
        enquiryUpdatedBy: data.enquiryUpdatedBy || null,
        salesManagerInvolved: data.salesManagerInvolved || 'No',
        salesManagerExplanation: data.salesManagerExplanation || null,
        doNotEmail: data.doNotEmail || false,
        newsletter: data.doNotEmail ? 'No' : 'Yes',
        inputDate: new Date()
      }
    })
    
    console.log('Successfully created enquiry:', newEnquiry)
    return NextResponse.json(newEnquiry, { status: 201 })
  } catch (error) {
    console.error('Error creating enquiry:', error)
    return NextResponse.json(
      { error: `Failed to create enquiry: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 