import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { sendFollowUpReminder } from '@/lib/email-service'
import type { Enquiry, StaffMember } from '@/lib/email-service'

export async function GET(request: NextRequest) {
  try {
    const currentTime = new Date()
    
    console.log(`Checking for due reminders at ${currentTime.toISOString()}`)

    // Find enquiries with follow-up dates that are due (past the reminder time)
    // and haven't had reminders sent yet
    const result = await sql`
      SELECT id, status, institutionname, firstname, surname, email, phone, 
             nationality, state, suburb, interest, source, enquirysource, 
             comment, calltakenby, fupdate, classification, stepprogram,
             involving, notinvolvingreason, followupinfo, newsletter,
             created_at, updated_at
      FROM enquiries 
      WHERE fupdate IS NOT NULL 
        AND fupdate <= ${currentTime.toISOString()}
        AND (reminder_sent IS NULL OR reminder_sent = false)
        AND newsletter != true
      ORDER BY fupdate ASC
    `

    const dueEnquiries = result.rows
    console.log(`Found ${dueEnquiries.length} enquiries with due reminders`)

    if (dueEnquiries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No due reminders found',
        processed: 0,
        sent: 0,
        errors: 0
      })
    }

    // Get all active staff members from users table
    const staffResult = await sql`
      SELECT name, email, active FROM users WHERE role = 'staff' AND active = true
    `
    const activeStaff = staffResult.rows

    let sent = 0
    let errors = 0
    const errorDetails: string[] = []

    // Process each due enquiry
    for (const enquiry of dueEnquiries) {
      try {
        // Convert database row to Enquiry type
        const enquiryData: Enquiry = {
          id: enquiry.id,
          firstName: enquiry.firstname,
          lastName: enquiry.surname,
          email: enquiry.email,
          phone: enquiry.phone,
          state: enquiry.state,
          suburb: enquiry.suburb,
          productInterest: enquiry.interest || [],
          source: enquiry.source,
          eventSource: enquiry.enquirysource,
          comments: enquiry.comment,
          submittedBy: enquiry.calltakenby,
          customerRating: enquiry.classification,
          bestTimeToFollowUp: enquiry.fupdate,
          followUpNotes: enquiry.followupinfo,
          createdAt: enquiry.created_at
        }

        // Find the staff member who should receive the reminder
        // Priority: 1) Original submitter if active, 2) First active staff member
        let targetStaff: StaffMember | null = null

        if (enquiry.calltakenby && enquiry.calltakenby !== 'Online Form') {
          // Try to find the original staff member
          const originalStaff = activeStaff.find(staff => 
            staff.name === enquiry.calltakenby
          )
          if (originalStaff) {
            targetStaff = {
              name: originalStaff.name,
              email: originalStaff.email,
              isActive: true
            }
          }
        }

        // If no original staff found or they're inactive, use first active staff
        if (!targetStaff && activeStaff.length > 0) {
          const firstActiveStaff = activeStaff[0]
          targetStaff = {
            name: firstActiveStaff.name,
            email: firstActiveStaff.email,
            isActive: true
          }
        }

        if (!targetStaff) {
          errorDetails.push(`Enquiry ${enquiry.id}: No active staff members found`)
          errors++
          continue
        }

        // Send the reminder email
        const emailResult = await sendFollowUpReminder(enquiryData, targetStaff)

        if (emailResult.success) {
          // Mark reminder as sent in database
          await sql`
            UPDATE enquiries 
            SET reminder_sent = true, 
                reminder_sent_at = NOW(),
                reminder_sent_to = ${targetStaff.email}
            WHERE id = ${enquiry.id}
          `
          
          sent++
          console.log(`Reminder sent successfully for enquiry ${enquiry.id} to ${targetStaff.email}`)
        } else {
          errorDetails.push(`Enquiry ${enquiry.id}: ${emailResult.error}`)
          errors++
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errorDetails.push(`Enquiry ${enquiry.id}: ${errorMessage}`)
        errors++
        console.error(`Error processing enquiry ${enquiry.id}:`, error)
      }
    }

    const response = {
      success: true,
      message: `Processed ${dueEnquiries.length} due reminders`,
      processed: dueEnquiries.length,
      sent,
      errors,
      timestamp: currentTime.toISOString(),
      ...(errorDetails.length > 0 && { errorDetails })
    }

    console.log('Reminder check completed:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error checking reminders:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for manual trigger (admin use)
export async function POST(request: NextRequest) {
  try {
    const { force = false } = await request.json()
    
    console.log('Manual reminder check triggered', { force })
    
    // Create a new request object for the GET method
    const getRequest = new NextRequest(request.url, { method: 'GET' })
    
    // Call the GET method to perform the check
    return await GET(getRequest)
    
  } catch (error) {
    console.error('Error in manual reminder check:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to trigger manual reminder check',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 