import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for demo - matches main route
// In production, this should use a proper database
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const updateData = await request.json()
    
    console.log('Updating enquiry:', id, 'with data:', updateData)

    // Find the enquiry to update
    const enquiryIndex = enquiries.findIndex(e => e.id === id)
    if (enquiryIndex === -1) {
      return NextResponse.json(
        { error: 'Enquiry not found' },
        { status: 404 }
      )
    }

    // Update the enquiry with new data
    enquiries[enquiryIndex] = {
      ...enquiries[enquiryIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    console.log('Successfully updated enquiry:', enquiries[enquiryIndex])
    return NextResponse.json(enquiries[enquiryIndex])
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

    const enquiryIndex = enquiries.findIndex(e => e.id === id)
    if (enquiryIndex > -1) {
      enquiries.splice(enquiryIndex, 1)
      return NextResponse.json({ message: 'Enquiry deleted successfully' })
    } else {
      return NextResponse.json(
        { error: 'Enquiry not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error deleting enquiry:', error)
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

    const enquiry = enquiries.find(e => e.id === id)
    if (enquiry) {
      return NextResponse.json(enquiry)
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