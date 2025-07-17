import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email templates
export const EMAIL_TEMPLATES = {
  FOLLOW_UP_REMINDER: 'follow-up-reminder'
}

// Types
export interface Enquiry {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  state: string
  suburb?: string
  productInterest?: string[]
  source?: string
  eventSource?: string
  comments?: string
  submittedBy?: string
  customerRating?: string
  bestTimeToFollowUp?: string
  followUpNotes?: string
  createdAt: string
}

export interface StaffMember {
  name: string
  email: string
  isActive: boolean
}

/**
 * Send follow-up reminder email to staff member
 */
export async function sendFollowUpReminder(
  enquiry: Enquiry,
  staff: StaffMember
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    // Create product list for subject line
    const products = Array.isArray(enquiry.productInterest) 
      ? enquiry.productInterest.join(', ') 
      : enquiry.productInterest || 'Not specified'

    // Create professional email content
    const emailHtml = createFollowUpEmailTemplate(enquiry, staff, products)
    const emailText = createFollowUpEmailText(enquiry, staff, products)

    // Send email using Resend
    const result = await resend.emails.send({
      from: 'noreply@steinway.com.au',
      to: staff.email,
      subject: `⏰ Follow-up Reminder: ${enquiry.firstName} ${enquiry.lastName} - ${products}`,
      html: emailHtml,
      text: emailText,
      tags: [
        { name: 'type', value: 'follow-up-reminder' },
        { name: 'staff', value: staff.name },
        { name: 'enquiry-id', value: enquiry.id.toString() }
      ]
    })

    if (result.error) {
      console.error('Resend API error:', result.error)
      return { success: false, error: result.error.message }
    }

    console.log(`Follow-up reminder sent successfully to ${staff.email} for enquiry ${enquiry.id}`)
    return { success: true, messageId: result.data?.id }

  } catch (error) {
    console.error('Error sending follow-up reminder:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Create HTML email template for follow-up reminders
 */
function createFollowUpEmailTemplate(enquiry: Enquiry, staff: StaffMember, products: string): string {
  const reminderDate = enquiry.bestTimeToFollowUp 
    ? new Date(enquiry.bestTimeToFollowUp).toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Not specified'

  const enquiryDate = new Date(enquiry.createdAt).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Follow-up Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .customer-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
    .info-item { margin: 8px 0; }
    .label { font-weight: bold; color: #555; display: inline-block; min-width: 120px; }
    .value { color: #333; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .cta-button:hover { background: #5a6fd8; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Follow-up Reminder</h1>
    <p>Time to connect with your customer</p>
  </div>
  
  <div class="content">
    <p>Hello <strong>${staff.name}</strong>,</p>
    
    <p>This is your scheduled reminder to follow up with the customer below. The follow-up was scheduled for <strong>${reminderDate}</strong>.</p>
    
    <div class="customer-card">
      <h3>Customer Information</h3>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Name:</span>
          <span class="value">${enquiry.firstName} ${enquiry.lastName}</span>
        </div>
        <div class="info-item">
          <span class="label">Email:</span>
          <span class="value"><a href="mailto:${enquiry.email}">${enquiry.email}</a></span>
        </div>
        <div class="info-item">
          <span class="label">Phone:</span>
          <span class="value">${enquiry.phone || 'Not provided'}</span>
        </div>
        <div class="info-item">
          <span class="label">Location:</span>
          <span class="value">${enquiry.suburb ? `${enquiry.suburb}, ` : ''}${enquiry.state}</span>
        </div>
      </div>
      
      <div class="info-item">
        <span class="label">Product Interest:</span>
        <span class="value">${products}</span>
      </div>
      
      ${enquiry.source ? `
      <div class="info-item">
        <span class="label">Source:</span>
        <span class="value">${enquiry.source}</span>
      </div>
      ` : ''}
      
      ${enquiry.customerRating ? `
      <div class="info-item">
        <span class="label">Rating:</span>
        <span class="value">${enquiry.customerRating}</span>
      </div>
      ` : ''}
      
      <div class="info-item">
        <span class="label">Enquiry Date:</span>
        <span class="value">${enquiryDate}</span>
      </div>
      
      ${enquiry.followUpNotes ? `
      <div class="info-item">
        <span class="label">Previous Notes:</span>
        <span class="value">${enquiry.followUpNotes}</span>
      </div>
      ` : ''}
      
      ${enquiry.comments ? `
      <div class="info-item">
        <span class="label">Comments:</span>
        <span class="value">${enquiry.comments}</span>
      </div>
      ` : ''}
    </div>
    
    <p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-crm-domain.com'}/submitted-forms/enquiry-data/follow-up/${enquiry.id}" class="cta-button">
        📋 Open Customer Record
      </a>
    </p>
    
    <p><strong>Quick Actions:</strong></p>
    <ul>
      <li>📞 <a href="tel:${enquiry.phone}">${enquiry.phone ? 'Call customer' : 'No phone number provided'}</a></li>
      <li>📧 <a href="mailto:${enquiry.email}">Email customer</a></li>
      <li>📝 <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-crm-domain.com'}/submitted-forms/enquiry-data/follow-up/${enquiry.id}">Update follow-up notes</a></li>
    </ul>
  </div>
  
  <div class="footer">
    <p>Exclusive Piano Group CRM System<br>
    <em>This is an automated reminder. Please do not reply to this email.</em></p>
  </div>
</body>
</html>
  `
}

/**
 * Create plain text email template for follow-up reminders
 */
function createFollowUpEmailText(enquiry: Enquiry, staff: StaffMember, products: string): string {
  const reminderDate = enquiry.bestTimeToFollowUp 
    ? new Date(enquiry.bestTimeToFollowUp).toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Not specified'

  const enquiryDate = new Date(enquiry.createdAt).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `FOLLOW-UP REMINDER

Hello ${staff.name},

This is your scheduled reminder to follow up with the customer below. 
The follow-up was scheduled for ${reminderDate}.

CUSTOMER INFORMATION
===================
Name: ${enquiry.firstName} ${enquiry.lastName}
Email: ${enquiry.email}
Phone: ${enquiry.phone || 'Not provided'}
Location: ${enquiry.suburb ? `${enquiry.suburb}, ` : ''}${enquiry.state}
Product Interest: ${products}
${enquiry.source ? `Source: ${enquiry.source}\n` : ''}${enquiry.customerRating ? `Rating: ${enquiry.customerRating}\n` : ''}Enquiry Date: ${enquiryDate}

${enquiry.followUpNotes ? `Previous Notes: ${enquiry.followUpNotes}\n` : ''}${enquiry.comments ? `Comments: ${enquiry.comments}\n` : ''}

QUICK ACTIONS
============
📞 Call: ${enquiry.phone || 'No phone number provided'}
📧 Email: ${enquiry.email}
📝 Update record: ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-crm-domain.com'}/submitted-forms/enquiry-data/follow-up/${enquiry.id}

---
Exclusive Piano Group CRM System
This is an automated reminder. Please do not reply to this email.
  `
}

/**
 * Test email configuration
 */
export async function testEmailConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY environment variable is not set' }
    }

    // Test connection by sending a simple test email to the from address
    const result = await resend.emails.send({
      from: 'noreply@steinway.com.au',
      to: 'noreply@steinway.com.au', // Send to self for testing
      subject: 'Test Email Configuration',
      html: '<p>This is a test email to verify Resend configuration.</p>',
      text: 'This is a test email to verify Resend configuration.'
    })

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    return { success: true }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 