import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT id, status, institution_name, first_name, surname, email, phone, 
             nationality, state, suburb, products, source, enquiry_source, 
             comment, call_taken_by, created_at, updated_at
      FROM enquiries 
      ORDER BY created_at DESC
    `
    
    // Convert database rows to expected format
    const enquiries = result.rows.map((row: any) => ({
      id: row.id,
      status: row.status,
      firstName: row.first_name,
      lastName: row.surname,
      email: row.email,
      phone: row.phone,
      nationality: row.nationality,
      state: row.state,
      suburb: row.suburb,
      institutionName: row.institution_name,
      productInterest: row.products || [],
      source: row.source,
      eventSource: row.enquiry_source,
      comments: row.comment,
      submittedBy: row.call_taken_by,
      createdAt: row.created_at,
      created_at: row.created_at
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

    // Insert new enquiry into database using correct database column names
    const result = await sql`
      INSERT INTO enquiries (
        status, institution_name, first_name, surname, email, phone, 
        nationality, state, suburb, products, source, enquiry_source, 
        comment, call_taken_by, input_date, created_at, updated_at, 
        classification, step_program, involving, newsletter
      ) VALUES (
        ${data.status || 'New'},
        ${data.institutionName || null},
        ${data.firstName},
        ${data.lastName || data.surname || ''},
        ${data.email},
        ${data.phone || null},
        ${data.nationality || 'English'},
        ${data.state},
        ${data.suburb || null},
        ${Array.isArray(data.productInterest) ? data.productInterest : (data.productInterest ? [data.productInterest] : null)},
        ${data.source || null},
        ${finalEventSource || null},
        ${data.comments || null},
        ${data.submittedBy || 'Online Form'},
        NOW(),
        NOW(),
        NOW(),
        ${data.customerRating || 'N/A'},
        ${data.stepProgram || 'N/A'},
        ${data.salesManagerInvolved || 'No'},
        ${data.doNotEmail ? 'No' : 'Yes'}
      )
      RETURNING id, status, institution_name, first_name, surname, email, phone, 
                nationality, state, suburb, products, source, enquiry_source, 
                comment, call_taken_by, created_at, updated_at
    `
    
    const newEnquiry = result.rows[0]
    
    // Convert to expected format
    const formattedEnquiry = {
      id: newEnquiry.id,
      status: newEnquiry.status,
      firstName: newEnquiry.first_name,
      lastName: newEnquiry.surname,
      email: newEnquiry.email,
      phone: newEnquiry.phone,
      nationality: newEnquiry.nationality,
      state: newEnquiry.state,
      suburb: newEnquiry.suburb,
      institutionName: newEnquiry.institution_name,
      productInterest: newEnquiry.products || [],
      source: newEnquiry.source,
      eventSource: newEnquiry.enquiry_source,
      comments: newEnquiry.comment,
      submittedBy: newEnquiry.call_taken_by,
      createdAt: newEnquiry.created_at,
      created_at: newEnquiry.created_at
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