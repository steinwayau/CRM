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

    // Handle follow-up date conversion
    let followUpDate = null
    if (updateData.bestTimeToFollowUp) {
      followUpDate = new Date(updateData.bestTimeToFollowUp).toISOString()
    }

    // Update the enquiry in database using correct database column names
    const result = await sql`
      UPDATE enquiries 
      SET status = ${updateData.status || 'New'},
          institution_name = ${updateData.institutionName || null},
          first_name = ${updateData.firstName},
          surname = ${updateData.lastName || updateData.surname || ''},
          email = ${updateData.email},
          phone = ${updateData.phone || null},
          nationality = ${updateData.nationality || 'English'},
          state = ${updateData.state},
          suburb = ${updateData.suburb || null},
          products = ${Array.isArray(updateData.productInterest) ? updateData.productInterest : (updateData.productInterest ? [updateData.productInterest] : null)},
          source = ${updateData.source || null},
          enquiry_source = ${finalEventSource || null},
          comment = ${updateData.comments || null},
          call_taken_by = ${updateData.submittedBy || 'Online Form'},
          follow_up_date = ${followUpDate},
          classification = ${updateData.customerRating || 'N/A'},
          step_program = ${updateData.stepProgram || 'N/A'},
          involving = ${updateData.salesManagerInvolved || 'No'},
          not_involving_reason = ${updateData.salesManagerExplanation || null},
          follow_up_info = ${updateData.followUpNotes || null},
          newsletter = ${updateData.doNotEmail ? 'No' : 'Yes'},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status, institution_name, first_name, surname, email, phone, 
                nationality, state, suburb, products, source, enquiry_source, 
                comment, call_taken_by, follow_up_date, classification, step_program,
                involving, not_involving_reason, follow_up_info, newsletter,
                created_at, updated_at
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
      firstName: updatedEnquiry.first_name,
      lastName: updatedEnquiry.surname,
      email: updatedEnquiry.email,
      phone: updatedEnquiry.phone,
      nationality: updatedEnquiry.nationality,
      state: updatedEnquiry.state,
      suburb: updatedEnquiry.suburb,
      institutionName: updatedEnquiry.institution_name,
      productInterest: updatedEnquiry.products || [],
      source: updatedEnquiry.source,
      eventSource: updatedEnquiry.enquiry_source,
      comments: updatedEnquiry.comment,
      submittedBy: updatedEnquiry.call_taken_by,
      bestTimeToFollowUp: updatedEnquiry.follow_up_date,
      customerRating: updatedEnquiry.classification,
      stepProgram: updatedEnquiry.step_program,
      salesManagerInvolved: updatedEnquiry.involving,
      salesManagerExplanation: updatedEnquiry.not_involving_reason,
      followUpNotes: updatedEnquiry.follow_up_info,
      doNotEmail: updatedEnquiry.newsletter === 'No',
      hasFollowUp: !!(updatedEnquiry.follow_up_date || updatedEnquiry.follow_up_info),
      createdAt: updatedEnquiry.created_at,
      created_at: updatedEnquiry.created_at
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
      SELECT id, status, institution_name, first_name, surname, email, phone, 
             nationality, state, suburb, products, source, enquiry_source, 
             comment, call_taken_by, follow_up_date, classification, step_program,
             involving, not_involving_reason, follow_up_info, newsletter,
             created_at, updated_at
      FROM enquiries 
      WHERE id = ${id}
    `

    if (result.rows.length > 0) {
      const enquiry = result.rows[0]
      
      // Convert to expected format
      const formattedEnquiry = {
        id: enquiry.id,
        status: enquiry.status,
        firstName: enquiry.first_name,
        lastName: enquiry.surname,
        email: enquiry.email,
        phone: enquiry.phone,
        nationality: enquiry.nationality,
        state: enquiry.state,
        suburb: enquiry.suburb,
        institutionName: enquiry.institution_name,
        productInterest: enquiry.products || [],
        source: enquiry.source,
        eventSource: enquiry.enquiry_source,
        comments: enquiry.comment,
        submittedBy: enquiry.call_taken_by,
        bestTimeToFollowUp: enquiry.follow_up_date,
        customerRating: enquiry.classification,
        stepProgram: enquiry.step_program,
        salesManagerInvolved: enquiry.involving,
        salesManagerExplanation: enquiry.not_involving_reason,
        followUpNotes: enquiry.follow_up_info,
        doNotEmail: enquiry.newsletter === 'No',
        hasFollowUp: !!(enquiry.follow_up_date || enquiry.follow_up_info),
        createdAt: enquiry.created_at,
        created_at: enquiry.created_at
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