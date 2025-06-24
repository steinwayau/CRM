import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // This will be replaced with actual Prisma queries
    const enquiries = [
      {
        id: 1,
        firstName: 'John',
        surname: 'Smith',
        email: 'john@example.com',
        phone: '+61 2 1234 5678',
        state: 'NSW',
        suburb: 'Sydney',
        status: 'New',
        institutionName: 'ABC Music School',
        products: ['Steinway', 'Boston'],
        createdAt: '2024-01-15T10:30:00Z'
      }
    ]

    return NextResponse.json(enquiries)
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
    
    // Validate required fields
    if (!data.firstName || !data.email || !data.state || !data.callTakenBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // This will be replaced with actual Prisma create
    const newEnquiry = {
      id: Date.now(), // Temporary ID
      ...data,
      createdAt: new Date().toISOString()
    }

    // TODO: Save to database using Prisma
    // TODO: Send email notifications
    // TODO: Integrate with MailChimp

    return NextResponse.json(newEnquiry, { status: 201 })
  } catch (error) {
    console.error('Error creating enquiry:', error)
    return NextResponse.json(
      { error: 'Failed to create enquiry' },
      { status: 500 }
    )
  }
} 