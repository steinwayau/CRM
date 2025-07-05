import { NextRequest, NextResponse } from 'next/server'
import { testEmailConfig, sendFollowUpReminder } from '@/lib/email-service'
import type { Enquiry, StaffMember } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { testType, testEmail } = await request.json()

    switch (testType) {
      case 'config':
        // Test basic email configuration
        const configResult = await testEmailConfig()
        return NextResponse.json({
          success: configResult.success,
          message: configResult.success 
            ? 'Email configuration is working correctly' 
            : 'Email configuration failed',
          ...(configResult.error && { error: configResult.error })
        })

      case 'reminder':
        // Test reminder email with sample data
        if (!testEmail) {
          return NextResponse.json(
            { success: false, error: 'Test email address is required for reminder test' },
            { status: 400 }
          )
        }

        const sampleEnquiry: Enquiry = {
          id: 999,
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          phone: '0412 345 678',
          state: 'New South Wales',
          suburb: 'Sydney',
          productInterest: ['steinway', 'boston'],
          source: 'Google',
          eventSource: 'Events - Steinway Gallery St Leonards',
          comments: 'Interested in a grand piano for home use. Looking at Steinway Model B.',
          submittedBy: 'Angela Liu',
          customerRating: 'Very interested but not ready to buy',
          bestTimeToFollowUp: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
          followUpNotes: 'Customer wants to visit showroom next weekend. Follow up on Friday to confirm appointment.',
          createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }

        const testStaff: StaffMember = {
          name: 'Test Staff Member',
          email: testEmail,
          isActive: true
        }

        const reminderResult = await sendFollowUpReminder(sampleEnquiry, testStaff)
        
        return NextResponse.json({
          success: reminderResult.success,
          message: reminderResult.success 
            ? `Test reminder email sent successfully to ${testEmail}` 
            : 'Failed to send test reminder email',
          ...(reminderResult.error && { error: reminderResult.error }),
          ...(reminderResult.messageId && { messageId: reminderResult.messageId })
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid test type. Use "config" or "reminder"' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in email test:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Email test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Quick config check
    const hasApiKey = !!process.env.RESEND_API_KEY
    const hasFromEmail = !!process.env.FROM_EMAIL

    return NextResponse.json({
      emailConfigured: hasApiKey && hasFromEmail,
      hasApiKey,
      hasFromEmail,
      fromEmail: process.env.FROM_EMAIL || 'Not configured',
      instructions: {
        config: 'POST with { "testType": "config" } to test email configuration',
        reminder: 'POST with { "testType": "reminder", "testEmail": "your@email.com" } to test reminder email'
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check email configuration' },
      { status: 500 }
    )
  }
} 