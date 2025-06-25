import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

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

    // Update the enquiry in database using correct Prisma column names
    const result = await sql`
      UPDATE enquiries 
      SET status = ${updateData.status || 'New'},
          "institutionName" = ${updateData.institutionName || ''},
          "firstName" = ${updateData.firstName},
          "lastName" = ${updateData.lastName || updateData.surname || ''},
          email = ${updateData.email},
          phone = ${updateData.phone || ''},
          nationality = ${updateData.nationality || 'English'},
          state = ${updateData.state},
          suburb = ${updateData.suburb || ''},
          "productInterest" = ${JSON.stringify(Array.isArray(updateData.productInterest) ? updateData.productInterest : [updateData.productInterest].filter(Boolean))},
          source = ${updateData.source || ''},
          "eventSource" = ${finalEventSource || ''},
          comments = ${updateData.comments || ''},
          "submittedBy" = ${updateData.submittedBy || 'Online Form'},
          "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING id, status, "institutionName", "firstName", "lastName", email, phone, 
                nationality, state, suburb, "productInterest", source, "eventSource", 
                comments, "submittedBy", "createdAt", "updatedAt"
    `

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Enquiry not found' },
        { status: 404 }
      )
    }

    const updatedEnquiry = result.rows[0]
    
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
      productInterest: updatedEnquiry.productInterest || [],
      source: updatedEnquiry.source,
      eventSource: updatedEnquiry.eventSource,
      comments: updatedEnquiry.comments,
      submittedBy: updatedEnquiry.submittedBy,
      createdAt: updatedEnquiry.createdAt,
      created_at: updatedEnquiry.createdAt
    }

    console.log('Successfully updated enquiry:', formattedEnquiry)
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

    const result = await sql`
      DELETE FROM enquiries WHERE id = ${id}
      RETURNING id
    `

    if (result.rows.length > 0) {
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

    const result = await sql`
      SELECT id, status, "institutionName", "firstName", "lastName", email, phone, 
             nationality, state, suburb, "productInterest", source, "eventSource", 
             comments, "submittedBy", "createdAt", "updatedAt"
      FROM enquiries 
      WHERE id = ${id}
    `

    if (result.rows.length > 0) {
      const enquiry = result.rows[0]
      
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
        productInterest: enquiry.productInterest || [],
        source: enquiry.source,
        eventSource: enquiry.eventSource,
        comments: enquiry.comments,
        submittedBy: enquiry.submittedBy,
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