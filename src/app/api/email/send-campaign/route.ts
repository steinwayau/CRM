import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailRecipient {
  id: number
  firstName: string
  lastName: string
  email: string
  doNotEmail: boolean
}

// Template element interfaces for Gmail-compatible HTML generation
interface EditorElement {
  id: string
  type: 'text' | 'image' | 'video' | 'button' | 'divider' | 'heading'
  content: string
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  videoData?: {
    platform?: 'youtube' | 'vimeo' | 'facebook' | 'custom'
    url?: string
    videoId?: string
    thumbnailUrl?: string
    title?: string
  }
  style: {
    position: { x: number; y: number }
    width: number
    height: number
    fontSize?: number
    fontWeight?: string
    fontFamily?: string
    fontStyle?: 'normal' | 'italic'
    textDecoration?: 'none' | 'underline' | 'line-through'
    color?: string
    backgroundColor?: string
    padding?: number
    borderRadius?: number
    textAlign?: 'left' | 'center' | 'right'
  }
}

interface CanvasSettings {
  width: number
  height: number
  backgroundColor: string
}

interface CampaignRequest {
  name: string
  templateId: string
  templateName?: string
  subject: string
  htmlContent: string
  textContent: string
  recipientType: 'all' | 'filtered' | 'selected' | 'custom'
  customerIds?: number[]
  customEmails?: string
  // NEW: Template elements for Gmail-compatible HTML generation
  templateElements?: EditorElement[]
  canvasSettings?: CanvasSettings
  filters?: {
    state?: string
    rating?: string
    status?: string
    productInterest?: string
    nationality?: string
    source?: string
  }
}

// Email HTML Generation - CLIENT-SPECIFIC APPROACH
// GMAIL: Pure content extraction (no layout preservation)
// OTHER CLIENTS: Preserve visual layout at original dimensions

function generateEmailHtml(
  elements: EditorElement[], 
  canvasSettings: CanvasSettings,
  templateName: string = 'Email Template',
  forGmail: boolean = false
): string {
  // Sort elements by Y position to maintain reading order
  const sortedElements = [...elements].sort((a, b) => a.style.position.y - b.style.position.y)
  
  if (forGmail) {
    // GMAIL ONLY: Pure content extraction approach
    return generateGmailSpecificHtml(sortedElements, canvasSettings, templateName)
  } else {
    // ALL OTHER CLIENTS: Preserve original design dimensions
    return generateStandardEmailHtml(sortedElements, canvasSettings, templateName)
  }
}

// GMAIL-SPECIFIC: Content extraction only
function generateGmailSpecificHtml(
  sortedElements: EditorElement[],
  canvasSettings: CanvasSettings,
  templateName: string
): string {
  let html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateName}</title>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" valign="top" style="padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: ${canvasSettings.backgroundColor || '#ffffff'}; margin: 0 auto;">`

  // Process each element in pure vertical order - no positioning, just content
  sortedElements.forEach((element) => {
    const { style, content, type } = element

    switch (type) {
      case 'text':
        const textColor = style.color || '#000000'
        const fontSize = Math.min(style.fontSize || 14, 18) // Cap for email safety
        
        html += `
          <tr>
            <td align="left" valign="top" style="padding: 15px 20px; font-family: Arial, sans-serif; font-size: ${fontSize}px; color: ${textColor}; line-height: 1.6;">
              ${content}
            </td>
          </tr>`
        break

      case 'heading':
        const headingLevel = element.headingLevel || 1
        const headingColor = style.color || '#000000'
        const headingSize = Math.min(style.fontSize || (24 - (headingLevel - 1) * 2), 28)
        
        html += `
          <tr>
            <td align="left" valign="top" style="padding: 20px 20px 10px 20px; font-family: Arial, sans-serif; font-size: ${headingSize}px; color: ${headingColor}; font-weight: bold; line-height: 1.3;">
              ${content}
            </td>
          </tr>`
        break

      case 'image':
        // Simple responsive image - max width 560px for Gmail
        const imgWidth = Math.min(style.width, 560)
        const imgHeight = Math.round((style.height / style.width) * imgWidth)
        
        html += `
          <tr>
            <td align="center" valign="top" style="padding: 15px 20px;">
              <img src="${content}" alt="Email Image" 
                   width="${imgWidth}" 
                   height="${imgHeight}"
                   style="display: block; max-width: 100%; height: auto; border: 0;" />
            </td>
          </tr>`
        break

      case 'video':
        // Extract proper YouTube thumbnail and URL
        const videoData = element.videoData
        const videoUrl = videoData?.url || content || ''
        let thumbnailUrl = videoData?.thumbnailUrl
        
        // Extract YouTube thumbnail if URL is provided
        if (videoUrl && !thumbnailUrl) {
          const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
          if (youtubeMatch) {
            const videoId = youtubeMatch[1]
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          }
        }
        
        // Fallback thumbnail
        if (!thumbnailUrl) {
          thumbnailUrl = 'https://via.placeholder.com/560x315/000000/FFFFFF/?text=▶+VIDEO'
        }
        
        const videoTitle = videoData?.title || 'Play Video'
        const videoWidth = Math.min(style.width, 560)
        const videoHeight = Math.round(videoWidth * 0.5625) // 16:9 aspect ratio
        
        html += `
          <tr>
            <td align="center" valign="top" style="padding: 15px 20px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${videoUrl}" target="_blank" style="display: block; text-decoration: none;">
                      <img src="${thumbnailUrl}" alt="${videoTitle}" 
                           width="${videoWidth}" 
                           height="${videoHeight}"
                           style="display: block; border: 3px solid #1a73e8; border-radius: 8px; max-width: 100%; height: auto;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <a href="${videoUrl}" target="_blank" style="font-family: Arial, sans-serif; font-size: 16px; color: #1a73e8; text-decoration: none; font-weight: bold;">
                      ▶ ${videoTitle}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
        break

      case 'button':
        // Simple Gmail-compatible button
        const buttonBg = style.backgroundColor || '#0073e6'
        const buttonColor = style.color || '#ffffff'
        const buttonText = content || 'Click Here'
        
        html += `
          <tr>
            <td align="center" valign="top" style="padding: 15px 20px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background-color: ${buttonBg}; border-radius: 6px; padding: 12px 24px;">
                    <a href="#" target="_blank" style="font-family: Arial, sans-serif; font-size: 16px; color: ${buttonColor}; text-decoration: none; font-weight: bold; display: inline-block;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
        break

      case 'divider':
        const dividerColor = style.backgroundColor || '#cccccc'
        
        html += `
          <tr>
            <td style="padding: 15px 20px;">
              <table border="0" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="border-top: 2px solid ${dividerColor}; font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>`
        break
    }
  })

  html += `
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return html
}

// STANDARD EMAIL CLIENTS: Preserve original design dimensions
function generateStandardEmailHtml(
  sortedElements: EditorElement[],
  canvasSettings: CanvasSettings,
  templateName: string
): string {
  // Use ORIGINAL canvas dimensions - NOT constrained to 600px
  const canvasWidth = canvasSettings.width || 1000
  const canvasHeight = canvasSettings.height || 800
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <center>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <div style="
            position: relative; 
            width: ${canvasWidth}px; 
            height: ${canvasHeight}px;
            max-width: ${canvasWidth}px; 
            background-color: ${canvasSettings.backgroundColor}; 
            margin: 0 auto;
            display: block;
          ">`

  // Render each element with its EXACT positioning and dimensions
  sortedElements.forEach((element) => {
    const { style, content, type } = element
    
    // Use exact positioning from the visual editor
    const elementHtml = `
            <div style="
              position: absolute;
              left: ${style.position.x}px;
              top: ${style.position.y}px;
              width: ${style.width}px;
              height: ${style.height}px;
              ${style.fontSize ? `font-size: ${style.fontSize}px;` : ''}
              ${style.fontWeight ? `font-weight: ${style.fontWeight};` : ''}
              ${style.fontFamily ? `font-family: ${style.fontFamily}, Arial, sans-serif;` : 'font-family: Arial, sans-serif;'}
              ${style.fontStyle ? `font-style: ${style.fontStyle};` : ''}
              ${style.textDecoration ? `text-decoration: ${style.textDecoration};` : ''}
              ${style.color ? `color: ${style.color};` : ''}
              ${style.backgroundColor && style.backgroundColor !== 'transparent' ? `background-color: ${style.backgroundColor};` : ''}
              ${style.padding ? `padding: ${style.padding}px;` : ''}
              ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
              ${style.textAlign ? `text-align: ${style.textAlign};` : ''}
              line-height: 1.4;
              box-sizing: border-box;
            ">`

    switch (type) {
      case 'text':
        html += elementHtml + content + '</div>'
        break
      case 'heading':
        const headingTag = `h${element.headingLevel || 1}`
        html += elementHtml + `<${headingTag} style="margin: 0; font-size: inherit; font-weight: inherit; color: inherit;">${content}</${headingTag}></div>`
        break
      case 'image':
        html += elementHtml + `<img src="${content}" alt="Email Image" style="
          width: ${style.width}px;
          height: ${style.height}px;
          display: block;
          border: 0;
          outline: none;
          object-fit: cover;
          ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
        " width="${style.width}" height="${style.height}" /></div>`
        break
      case 'video':
        const videoData = element.videoData
        const videoUrl = videoData?.url || content || ''
        let thumbnailUrl = videoData?.thumbnailUrl
        
        // Extract YouTube thumbnail if URL is provided
        if (videoUrl && !thumbnailUrl) {
          const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
          if (youtubeMatch) {
            const videoId = youtubeMatch[1]
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          }
        }
        
        // Fallback thumbnail
        if (!thumbnailUrl) {
          thumbnailUrl = 'https://via.placeholder.com/400x300/000000/FFFFFF/?text=▶+VIDEO'
        }
        
        const videoTitle = videoData?.title || 'Play Video'
        
        html += elementHtml + `
          <a href="${videoUrl}" target="_blank" style="display: block; text-decoration: none; position: relative; width: 100%; height: 100%;">
            <img src="${thumbnailUrl}" alt="${videoTitle}" style="
              width: ${style.width}px;
              height: ${style.height}px;
              display: block;
              border: 0;
              object-fit: cover;
              ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
            " width="${style.width}" height="${style.height}">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 48px;
              height: 48px;
              background-color: rgba(0, 0, 0, 0.7);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 0;
                height: 0;
                border-left: 16px solid white;
                border-top: 10px solid transparent;
                border-bottom: 10px solid transparent;
                margin-left: 4px;
              "></div>
            </div>
          </a>
        </div>`
        break
      case 'button':
        html += elementHtml + `
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="#" style="height:${style.height}px;v-text-anchor:middle;width:${style.width}px;" arcsize="${style.borderRadius ? Math.round((style.borderRadius / Math.min(style.width, style.height)) * 100) : 0}%" strokecolor="${style.backgroundColor}" fillcolor="${style.backgroundColor}">
            <w:anchorlock/>
            <center style="color:${style.color};font-family:Arial,sans-serif;font-size:${style.fontSize || 16}px;font-weight:${style.fontWeight || 'normal'};">${content}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="#" style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background-color: ${style.backgroundColor || '#007BFF'};
            color: ${style.color || '#FFFFFF'};
            text-decoration: none;
            border-radius: ${style.borderRadius || 4}px;
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            text-align: center;
            box-sizing: border-box;
          ">${content}</a>
          <!--<![endif]-->
        </div>`
        break
      case 'divider':
        html += elementHtml + `<hr style="
          border: none; 
          height: ${style.height || 1}px; 
          background-color: ${style.backgroundColor || '#CCCCCC'}; 
          margin: 0;
          width: 100%;
        " /></div>`
        break
    }
  })

  html += `
          </div>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`
  
  return html
}

export async function POST(request: NextRequest) {
  try {
    // Environment validation
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not configured')
      return NextResponse.json(
        { error: 'Email service not configured: Missing RESEND_API_KEY' },
        { status: 500 }
      )
    }

    const { 
      name, 
      templateId, 
      templateName, 
      subject, 
      htmlContent, 
      textContent, 
      recipientType, 
      customEmails, 
      customerIds, 
      filters,
      templateElements,
      canvasSettings 
    } = await request.json()
    
    // Validate required fields
    if (!name || !templateId || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required fields: name, templateId, subject, htmlContent' },
        { status: 400 }
      )
    }

    // Get customers from database based on recipient type
    const customers = await getCustomersForCampaign(recipientType, customerIds, filters, customEmails)
    
    // Filter out customers who opted out of emails
    const eligibleCustomers = customers.filter(customer => !customer.doNotEmail)
    
    if (eligibleCustomers.length === 0) {
      return NextResponse.json(
        { error: 'No eligible customers found for this campaign' },
        { status: 400 }
      )
    }

    // Check email limits 
    if (eligibleCustomers.length > 1000) {
      return NextResponse.json(
        { error: 'Campaign too large. Maximum 1000 recipients per campaign.' },
        { status: 400 }
      )
    }

    // Send emails in batches to avoid rate limits
    const batchSize = 100
    const batches = []
    
    for (let i = 0; i < eligibleCustomers.length; i += batchSize) {
      batches.push(eligibleCustomers.slice(i, i + batchSize))
    }

    const results = {
      totalRecipients: eligibleCustomers.length,
      successCount: 0,
      failureCount: 0,
      failures: [] as any[]
    }

    // Process each batch
    for (const batch of batches) {
      try {
        const batchEmails = batch.map(customer => {
          // INTELLIGENT EMAIL GENERATION: Use client-appropriate HTML
          let emailHtml = htmlContent // Fallback to original if no elements available
          
          if (templateElements && templateElements.length > 0 && canvasSettings) {
            // Detect email client from email address domain (simple heuristic)
            const isGmailUser = customer.email.toLowerCase().includes('@gmail.com')
            
            // Generate appropriate HTML for email client
            emailHtml = generateEmailHtml(
              templateElements, 
              canvasSettings, 
              templateName || name,
              isGmailUser // Only use Gmail generation for Gmail users
            )
            
            console.log(`Generated ${isGmailUser ? 'Gmail-specific' : 'standard'} HTML for ${customer.email}`)
          } else {
            console.log(`Using fallback htmlContent for customer ${customer.email} - template elements not provided`)
          }
          
          const personalizedHtml = personalizeContent(emailHtml, customer)
          const personalizedText = personalizeContent(textContent, customer)
          
          // Add tracking to HTML email
          const trackedHtml = addEmailTracking(personalizedHtml, templateId, customer.id)
          
          return {
            to: customer.email,
            subject: subject,
            html: trackedHtml,
            text: personalizedText,
            from: 'noreply@steinway.com.au',
            replyTo: process.env.REPLY_TO_EMAIL || 'info@steinway.com.au'
          }
        })

        // Send batch using Resend
        const batchResults = await Promise.allSettled(
          batchEmails.map(email => resend.emails.send(email))
        )

            // Process results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const response = result.value
            if (response.error) {
              console.error(`Email failed for ${batch[index].email}:`, response.error)
              results.failureCount++
              results.failures.push({
                email: batch[index].email,
                error: response.error.message || response.error
              })
            } else {
              console.log(`Email sent successfully to ${batch[index].email}, ID: ${response.data?.id}`)
              results.successCount++
            }
          } else {
            console.error(`Email failed for ${batch[index].email}:`, result.reason)
            results.failureCount++
            results.failures.push({
              email: batch[index].email,
              error: result.reason
            })
          }
        })

        // Add delay between batches to respect rate limits
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
        }

      } catch (error) {
        console.error('Batch sending error:', error)
        results.failureCount += batch.length
        batch.forEach(customer => {
          results.failures.push({
            email: customer.email,
            error: error
          })
        })
      }
    }

    // Log campaign results (in production, store in database)
    console.log(`Campaign ${templateId} sent:`, results)

    return NextResponse.json({
      success: true,
      results: results,
      message: `Campaign sent to ${results.successCount} of ${results.totalRecipients} recipients`
    })

  } catch (error) {
    console.error('Campaign sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    )
  }
}

// Helper function to get customers based on campaign criteria
async function getCustomersForCampaign(
  recipientType: string,
  customerIds?: number[],
  filters?: any,
  customEmails?: string
): Promise<EmailRecipient[]> {
  // Handle custom email list
  if (recipientType === 'custom' && customEmails) {
    const emailList = customEmails
      .split(/[,\n]/) // Split by comma or newline
      .map(email => email.trim()) // Remove whitespace
      .filter(email => email && email.includes('@')) // Filter valid emails
      .filter((email, index, arr) => arr.indexOf(email) === index) // Remove duplicates

    // Convert emails to customer format
    return emailList.map((email, index) => ({
      id: -(index + 1), // Use negative IDs for custom emails
      firstName: email.split('@')[0], // Use email prefix as first name
      lastName: '',
      email: email,
      doNotEmail: false
    }))
  }

  // For database customers, query the existing customer database
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/enquiries`)
    const enquiries = await response.json()
    
    // Transform enquiry data to customer format
    let customers: EmailRecipient[] = enquiries.map((enquiry: any) => ({
      id: enquiry.id,
      firstName: enquiry.firstName,
      lastName: enquiry.lastName || enquiry.surname,
      email: enquiry.email,
      doNotEmail: enquiry.doNotEmail || false
    }))

    // Apply filters based on recipient type
    if (recipientType === 'selected' && customerIds) {
      customers = customers.filter(customer => customerIds.includes(customer.id))
    } else if (recipientType === 'filtered' && filters) {
      // Apply filters (implement your filtering logic here)
      customers = customers.filter(customer => {
        // Add your filtering logic based on the filters object
        return true // Placeholder
      })
    }

    return customers
  } catch (error) {
    console.error('Error fetching customers:', error)
    return []
  }
}

// Helper function to add email tracking (open pixel + click tracking)
function addEmailTracking(htmlContent: string, campaignId: string, recipientId: number): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm.steinway.com.au'
  
  // 1. Add tracking pixel for email opens
  const trackingPixelUrl = `${baseUrl}/api/email/tracking/open?c=${campaignId}&r=${recipientId}&t=${Date.now()}`
  const trackingPixel = `<img src="${trackingPixelUrl}" alt="" width="1" height="1" style="display:block;border:none;outline:none;text-decoration:none;" />`
  
  // 2. Convert all links to tracked links
  let trackedHtml = htmlContent.replace(
    /href=["']([^"']+)["']/gi,
    (match, url) => {
      // Skip already tracked links and tracking pixels
      if (url.includes('/api/email/tracking/') || url.includes('mailto:') || url.startsWith('#')) {
        return match
      }
      
      // Create tracked link
      const encodedUrl = encodeURIComponent(url)
      const trackedUrl = `${baseUrl}/api/email/tracking/click?c=${campaignId}&r=${recipientId}&url=${encodedUrl}&t=${Date.now()}`
      return `href="${trackedUrl}"`
    }
  )
  
  // 3. Insert tracking pixel before closing body tag
  if (trackedHtml.includes('</body>')) {
    trackedHtml = trackedHtml.replace('</body>', `${trackingPixel}</body>`)
  } else {
    // If no body tag, append to end
    trackedHtml += trackingPixel
  }
  
  return trackedHtml
}

// Helper function to personalize email content
function personalizeContent(content: string, customer: EmailRecipient): string {
  return content
    .replace(/\{\{firstName\}\}/g, customer.firstName)
    .replace(/\{\{lastName\}\}/g, customer.lastName)
    .replace(/\{\{fullName\}\}/g, `${customer.firstName} ${customer.lastName}`)
    .replace(/\{\{email\}\}/g, customer.email)
}

// Test endpoint for email configuration
export async function GET() {
  try {
    // Test Resend configuration
    const testResult = await resend.emails.send({
      from: 'noreply@steinway.com.au',
      to: 'test@example.com',
      subject: 'Test Email Configuration',
      html: '<p>This is a test email to verify Resend configuration.</p>',
      text: 'This is a test email to verify Resend configuration.'
    })

    return NextResponse.json({
      success: true,
      message: 'Email configuration test successful',
      testResult: testResult
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Email configuration test failed',
      details: error
    })
  }
} 