import { NextRequest, NextResponse } from 'next/server'

// Temporary in-memory storage for demo purposes
let enquiries: any[] = [
  {
    id: 1,
    status: 'New',
    firstName: 'John',
    surname: 'Smith',
    email: 'john@example.com',
    phone: '+61 2 1234 5678',
    state: 'NSW',
    suburb: 'Sydney',
    institutionName: 'ABC Music School',
    productInterest: ['Steinway', 'Boston'],
    createdAt: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    // Check if we have a database connection
    if (process.env.POSTGRES_URL) {
      // Use database if available
      const { sql } = await import('@vercel/postgres')
      const { rows } = await sql`SELECT * FROM enquiries ORDER BY created_at DESC`
      return NextResponse.json(rows)
    } else {
      // Use temporary storage for demo
      return NextResponse.json(enquiries)
    }
  } catch (error) {
    console.error('Error fetching enquiries:', error)
    // Fallback to temporary storage
    return NextResponse.json(enquiries)
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.firstName || !data.email || !data.state) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if we have a database connection
    if (process.env.POSTGRES_URL) {
      // Use database if available
      const { sql } = await import('@vercel/postgres')
      const { rows } = await sql`
        INSERT INTO enquiries (
          status, institution_name, first_name, surname, email, phone, 
          nationality, state, suburb, products, source, enquiry_source,
          comments, follow_up_info, follow_up_date, classification, 
          step_program, involving, not_involving_reason, newsletter, 
          call_taken_by, input_date, created_at, updated_at
        ) VALUES (
          ${data.status || 'New'},
          ${data.institutionName || ''},
          ${data.firstName},
          ${data.surname || data.lastName || ''},
          ${data.email},
          ${data.phone || ''},
          ${data.nationality || 'English'},
          ${data.state},
          ${data.suburb || ''},
          ${JSON.stringify(data.productInterest || [])},
          ${data.source || ''},
          ${data.eventSource || ''},
          ${data.comments || ''},
          ${data.followUpInfo || ''},
          ${data.bestTimeToFollowUp || null},
          ${data.customerRating || 'N/A'},
          ${data.stepProgram || 'N/A'},
          ${data.salesManagerInvolved || 'No'},
          ${data.notInvolvingReason || ''},
          ${data.doNotEmail ? 'No' : 'Yes'},
          ${data.submittedBy || 'Online Form'},
          NOW(),
          NOW(),
          NOW()
        ) RETURNING *
      `
      return NextResponse.json(rows[0], { status: 201 })
    } else {
      // Use temporary storage for demo
      const newEnquiry = {
        id: enquiries.length + 1,
        ...data,
        createdAt: new Date().toISOString()
      }
      enquiries.push(newEnquiry)
      return NextResponse.json(newEnquiry, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating enquiry:', error)
    return NextResponse.json(
      { error: 'Failed to create enquiry' },
      { status: 500 }
    )
  }
} 