import { NextRequest, NextResponse } from 'next/server'

// Temporary in-memory storage for demo purposes  
let enquiries: any[] = []

export async function GET(request: NextRequest) {
  try {
    // For now, use temporary storage (database setup comes later)
    const sortedEnquiries = enquiries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return NextResponse.json(sortedEnquiries)
  } catch (error) {
    console.error('Error fetching enquiries:', error)
    return NextResponse.json(enquiries)
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

    // For now, use temporary storage (database setup comes later)
    const newEnquiry = {
      id: enquiries.length + 1,
      status: data.status || 'New',
      institutionName: data.institutionName || '',
      firstName: data.firstName,
      lastName: data.lastName || '',
      surname: data.lastName || '',
      email: data.email,
      phone: data.phone || '',
      nationality: data.nationality || 'English',
      state: data.state,
      suburb: data.suburb || '',
      productInterest: data.productInterest || [],
      source: data.source || '',
      eventSource: data.eventSource || '',
      comments: data.comments || '',
      followUpInfo: data.followUpInfo || '',
      bestTimeToFollowUp: data.bestTimeToFollowUp || '',
      customerRating: data.customerRating || 'N/A',
      stepProgram: data.stepProgram || 'N/A',
      submittedBy: data.submittedBy || 'Online Form',
      salesManagerInvolved: data.salesManagerInvolved || 'No',
      doNotEmail: data.doNotEmail || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    enquiries.push(newEnquiry)
    console.log('Successfully created enquiry:', newEnquiry)
    return NextResponse.json(newEnquiry, { status: 201 })
  } catch (error) {
    console.error('Error creating enquiry:', error)
    return NextResponse.json(
      { error: `Failed to create enquiry: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 