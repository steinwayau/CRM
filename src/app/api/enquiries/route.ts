import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for now (will reset on deployment)
let enquiries: any[] = [
  {
    id: 1,
    status: 'New',
    firstName: 'John',
    surname: 'Smith',
    email: 'john.smith@example.com',
    phone: '0412345678',
    nationality: 'English',
    state: 'New South Wales',
    suburb: 'Sydney',
    institutionName: 'Sydney Conservatorium',
    productInterest: ['Steinway', 'Boston'],
    source: 'Google',
    eventSource: 'Events - Steinway Gallery St Leonards',
    comments: 'Looking for a grand piano for home use',
    submittedBy: 'Online Form',
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    status: 'In Progress',
    firstName: 'Sarah',
    surname: 'Johnson',
    email: 'sarah.j@example.com',
    phone: '0423456789',
    nationality: 'Chinese',
    state: 'Victoria',
    suburb: 'Melbourne',
    institutionName: '',
    productInterest: ['Yamaha', 'Kawai'],
    source: 'Recommended by a friend',
    eventSource: 'Events - Steinway Gallery Melbourne',
    comments: 'Interested in upright piano for teaching',
    submittedBy: 'June',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
]

let nextId = 3

export async function GET(request: NextRequest) {
  try {
    // Sort by creation date, newest first
    const sortedEnquiries = [...enquiries].sort((a, b) => 
      new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()
    )
    return NextResponse.json(sortedEnquiries)
  } catch (error) {
    console.error('Error fetching enquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enquiries' },
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

    // Create new enquiry
    const newEnquiry = {
      id: nextId++,
      status: data.status || 'New',
      firstName: data.firstName,
      surname: data.lastName || data.surname || '',
      email: data.email,
      phone: data.phone || null,
      nationality: data.nationality || 'English',
      state: data.state,
      suburb: data.suburb || null,
      institutionName: data.institutionName || '',
      productInterest: Array.isArray(data.productInterest) ? data.productInterest : [data.productInterest].filter(Boolean),
      source: data.source || null,
      eventSource: data.eventSource || null,
      comments: data.comments || null,
      submittedBy: data.submittedBy || 'Online Form',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    
    // Add to in-memory storage
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