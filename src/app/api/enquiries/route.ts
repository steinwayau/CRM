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
    
    // Convert to expected format for the frontend
    const formattedEnquiries = enquiries.map((enquiry) => ({
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
      followUpInfo: enquiry.followUpInfo,
      doNotEmail: enquiry.doNotEmail,
      hasFollowUp: !!(enquiry.bestTimeToFollowUp || enquiry.followUpInfo),
      createdAt: enquiry.createdAt,
      created_at: enquiry.createdAt,
      inputDate: enquiry.inputDate
    }))
    
    return NextResponse.json(formattedEnquiries)
  } catch (error) {
    console.error('Error fetching enquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enquiries from database' },
      { status: 500 }
    )
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

    // Combine eventSource and eventSourceOther if "Other" was selected
    const finalEventSource = data.eventSource === 'Other' && data.eventSourceOther 
      ? `Other: ${data.eventSourceOther}` 
      : data.eventSource

    // Convert product interest array to string for the interest field
    const productInterestString = Array.isArray(data.productInterest) 
      ? data.productInterest.join(', ') 
      : (data.productInterest || '')

    // Create new enquiry using Prisma
    const newEnquiry = await prisma.enquiry.create({
      data: {
        status: data.status || 'New',
        institutionName: data.institutionName || null,
        firstName: data.firstName,
        lastName: data.lastName || data.surname || '',
        email: data.email,
        phone: data.phone || null,
        nationality: data.nationality || 'English',
        state: data.state,
        suburb: data.suburb || null,
        productInterest: productInterestString,
        source: data.source || null,
        eventSource: finalEventSource || null,
        comments: data.comments || null,
        submittedBy: data.submittedBy || 'Online Form',
        customerRating: data.customerRating || 'N/A',
        stepProgram: data.stepProgram || 'N/A',
        salesManagerInvolved: data.salesManagerInvolved || 'No',
        doNotEmail: data.doNotEmail || false,
        inputDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    // Convert to expected format
    const formattedEnquiry = {
      id: newEnquiry.id,
      status: newEnquiry.status,
      firstName: newEnquiry.firstName,
      lastName: newEnquiry.lastName,
      email: newEnquiry.email,
      phone: newEnquiry.phone,
      nationality: newEnquiry.nationality,
      state: newEnquiry.state,
      suburb: newEnquiry.suburb,
      institutionName: newEnquiry.institutionName,
      productInterest: newEnquiry.productInterest || '',
      source: newEnquiry.source,
      eventSource: newEnquiry.eventSource,
      comments: newEnquiry.comments,
      submittedBy: newEnquiry.submittedBy,
      createdAt: newEnquiry.createdAt,
      created_at: newEnquiry.createdAt
    }
    
    console.log('Successfully created enquiry:', formattedEnquiry)
    return NextResponse.json(formattedEnquiry, { status: 201 })
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