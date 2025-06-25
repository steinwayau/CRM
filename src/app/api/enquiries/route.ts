import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT id, status, "institutionName", "firstName", "lastName", email, phone, 
             nationality, state, suburb, "productInterest", source, "eventSource", 
             comments, "submittedBy", "createdAt", "updatedAt"
      FROM enquiries 
      ORDER BY "createdAt" DESC
    `
    
    // Convert database rows to expected format
    const enquiries = result.rows.map((row: any) => ({
      id: row.id,
      status: row.status,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      nationality: row.nationality,
      state: row.state,
      suburb: row.suburb,
      institutionName: row.institutionName,
      productInterest: row.productInterest || [],
      source: row.source,
      eventSource: row.eventSource,
      comments: row.comments,
      submittedBy: row.submittedBy,
      createdAt: row.createdAt,
      created_at: row.createdAt
    }))
    
    return NextResponse.json(enquiries)
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

    // Insert new enquiry into database using correct Prisma column names
    const result = await sql`
      INSERT INTO enquiries (
        status, "institutionName", "firstName", "lastName", email, phone, 
        nationality, state, suburb, "productInterest", source, "eventSource", 
        comments, "submittedBy", "createdAt", "updatedAt"
      ) VALUES (
        ${data.status || 'New'},
        ${data.institutionName || ''},
        ${data.firstName},
        ${data.lastName || data.surname || ''},
        ${data.email},
        ${data.phone || ''},
        ${data.nationality || 'English'},
        ${data.state},
        ${data.suburb || ''},
        ${JSON.stringify(Array.isArray(data.productInterest) ? data.productInterest : [data.productInterest].filter(Boolean))},
        ${data.source || ''},
        ${finalEventSource || ''},
        ${data.comments || ''},
        ${data.submittedBy || 'Online Form'},
        NOW(),
        NOW()
      )
      RETURNING id, status, "institutionName", "firstName", "lastName", email, phone, 
                nationality, state, suburb, "productInterest", source, "eventSource", 
                comments, "submittedBy", "createdAt", "updatedAt"
    `
    
    const newEnquiry = result.rows[0]
    
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
      productInterest: newEnquiry.productInterest || [],
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
  }
} 