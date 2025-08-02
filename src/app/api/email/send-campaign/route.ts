import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { PrismaClient } from '@prisma/client'

// Initialize Resend and Prisma
const resend = new Resend(process.env.RESEND_API_KEY)
const prisma = new PrismaClient()

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
    customThumbnail?: string
    title?: string
  }
  buttonData?: {
    url: string
    openInNewTab: boolean
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

// GMAIL-SPECIFIC: ICONSCOUT TABLE METHOD - Simple table rows, no positioning
function generateGmailSpecificHtml(
  sortedElements: EditorElement[],
  canvasSettings: CanvasSettings,
  templateName: string
): string {
  // GMAIL OPTIMIZATION: 750px width for better desktop viewing (like Elementor)
  const emailWidth = 750  // Optimized email width for larger Gmail display
  const emailHeight = canvasSettings.height || 800
  
  let html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateName}</title>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; min-height: ${emailHeight}px;">
    <tr>
      <td align="center" valign="top" style="padding: 20px 0;">
        <!-- Main email container - ICONSCOUT METHOD with full height -->
        <table border="0" cellpadding="0" cellspacing="0" width="${emailWidth}" style="margin: 0 auto; background-color: ${canvasSettings.backgroundColor || '#ffffff'}; min-height: ${emailHeight}px;">
`

  // IMPROVED APPROACH: Group elements by Y position for side-by-side layout
  html += `
          <tr>
            <td style="padding: 0; margin: 0; line-height: 1;" align="center" valign="top">`
            
  // Group elements by approximate Y position (increased tolerance for videos)
  const elementGroups: EditorElement[][] = []
  const rowTolerance = 30 // Conservative tolerance - only group truly side-by-side elements
  
  sortedElements.forEach((element) => {
    let foundGroup = false
    for (let i = 0; i < elementGroups.length; i++) {
      const groupY = elementGroups[i][0].style.position.y
      if (Math.abs(element.style.position.y - groupY) <= rowTolerance) {
        elementGroups[i].push(element)
        foundGroup = true
        break
      }
    }
    if (!foundGroup) {
      elementGroups.push([element])
    }
  })
  
  // SMART SIDE-BY-SIDE: Use the row groups we calculated above
  elementGroups.forEach((group, groupIndex) => {
    console.log(`Gmail Group ${groupIndex + 1}: ${group.length} elements`)
    
    if (group.length === 1) {
      // Single element: render normally
      const element = group[0]
      let elementMaxWidth = emailWidth
      if (element.type === 'button' || element.type === 'text' || element.type === 'heading') {
        const scaleRatio = emailWidth / 1000
        elementMaxWidth = Math.min(emailWidth, Math.round(element.style.width * scaleRatio))
      }
      
      html += `<div style="margin: 0; padding: 0; margin-bottom: 15px; width: 100%; text-align: center;">`
      html += generateGmailElementHtml(element, elementMaxWidth)
      html += `</div>`
    } else {
      // Multiple elements: render side-by-side using table cells
      html += `<table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 15px;">
        <tr>`
      
      const cellWidth = Math.floor(emailWidth / group.length)
      group.forEach((element) => {
        html += `<td style="width: ${cellWidth}px; text-align: center; vertical-align: top; padding: 0 10px;">`
        html += generateGmailElementHtml(element, cellWidth - 20) // -20 for proper spacing like template
        html += `</td>`
      })
      
      html += `</tr>
      </table>`
    }
  })
  
  html += `
            </td>
          </tr>`

  html += `
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return html
}

// Generate individual element HTML for Gmail table cells with CONSISTENT SCALING
function generateGmailElementHtml(element: EditorElement, maxWidth: number): string {
  const { content, type } = element
  
  // PROPORTIONAL SCALING: Scale from 1000px template to 750px Gmail
  const scaleRatio = 750 / 1000 // 75% scaling for optimal Gmail display
  const scaledWidth = Math.round(element.style.width * scaleRatio)
  const scaledHeight = Math.round(element.style.height * scaleRatio)
  const scaledFontSize = element.style.fontSize ? Math.round(element.style.fontSize * scaleRatio) : undefined
  
  switch (type) {
    case 'text':
      const textColor = element.style.color || '#000000'
      const fontSize = scaledFontSize || 14
      
      return `<div style="font-family: Arial, sans-serif; font-size: ${fontSize}px; color: ${textColor}; line-height: 1.4; text-align: ${element.style.textAlign || 'left'}; margin: 0; padding: 0; width: ${scaledWidth}px; ${element.style.fontWeight ? `font-weight: ${element.style.fontWeight};` : ''}">${content}</div>`

    case 'heading':
      const headingColor = element.style.color || '#000000'
      const headingSize = scaledFontSize || (24 - ((element.headingLevel || 1) - 1) * 2)
      
      return `<div style="font-family: Arial, sans-serif; font-size: ${headingSize}px; color: ${headingColor}; font-weight: bold; line-height: 1.2; text-align: ${element.style.textAlign || 'left'}; margin: 0; padding: 0; width: ${scaledWidth}px;">${content}</div>`

    case 'image':
      // CONSISTENT IMAGE SCALING - Apply to ALL images including logos
      let imageSrc = content
      if (content.startsWith('data:')) {
        console.log('WARNING: Legacy data URL detected, using fallback')
        imageSrc = 'https://via.placeholder.com/400x300/000000/FFFFFF/?text=LEGACY+IMAGE'
      }
      
      return `<img src="${imageSrc}" alt="Email Image" style="width: ${scaledWidth}px; height: ${scaledHeight}px; display: block; border: 0; margin: 0 auto; padding: 0;" width="${scaledWidth}" height="${scaledHeight}" />`

    case 'video':
      // CONSISTENT VIDEO SCALING - Videos now scale properly
      const videoData = element.videoData
      const videoUrl = videoData?.url || content || ''
      let thumbnailUrl = videoData?.customThumbnail || videoData?.thumbnailUrl
      
      if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
        console.log('WARNING: Legacy data URL detected in video thumbnail')
        thumbnailUrl = undefined
      }
      
      if (!thumbnailUrl) {
        thumbnailUrl = 'https://via.placeholder.com/400x300/000000/FFFFFF/?text=▶+VIDEO'
      }
      
      return `<a href="${videoUrl}" target="_blank" style="display: block; text-decoration: none; margin: 0 auto; padding: 0; width: ${scaledWidth}px; height: ${scaledHeight}px; overflow: hidden; border-radius: ${element.style.borderRadius || 0}px; position: relative;">
        <img src="${thumbnailUrl}" alt="Video" style="width: ${scaledWidth}px; height: ${scaledHeight}px; display: block; border: 0; margin: 0; padding: 0; object-fit: cover; object-position: center;" width="${scaledWidth}" height="${scaledHeight}" />
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: ${Math.round(48 * scaleRatio)}px; height: ${Math.round(48 * scaleRatio)}px; background-color: rgba(255,255,255,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <div style="width: 0; height: 0; border-left: ${Math.round(16 * scaleRatio)}px solid #333; border-top: ${Math.round(12 * scaleRatio)}px solid transparent; border-bottom: ${Math.round(12 * scaleRatio)}px solid transparent; margin-left: ${Math.round(4 * scaleRatio)}px;"></div>
          </div>
        </div>
      </a>`

    case 'button':
      // BUTTON OPTIMIZATION - Less aggressive scaling for better readability
      const buttonBg = element.style.backgroundColor || '#0073e6'
      const buttonColor = element.style.color || '#ffffff'
      const buttonText = content || 'Click Here'
      const buttonUrl = element.buttonData?.url || '#'
      const buttonTarget = element.buttonData?.openInNewTab ? '_blank' : '_self'
      // Use larger font size for buttons - minimal scaling for readability
      const buttonFontSize = element.style.fontSize ? Math.max(Math.round(element.style.fontSize * 0.9), 16) : 16
      
      return `<table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="background-color: ${buttonBg}; border-radius: ${element.style.borderRadius || 4}px; padding: 14px 28px; margin: 0; text-align: center;">
            <a href="${buttonUrl}" target="${buttonTarget}" style="color: ${buttonColor}; text-decoration: none; font-family: Arial, sans-serif; font-size: ${buttonFontSize}px; font-weight: ${element.style.fontWeight || 'normal'}; display: block; text-align: center; width: 100%;">${buttonText}</a>
          </td>
        </tr>
      </table>`

    case 'divider':
      // CONSISTENT DIVIDER SCALING
      const dividerColor = element.style.backgroundColor || '#cccccc'
      const dividerHeight = Math.max(Math.round(element.style.height * scaleRatio), 1)
      
      return `<div style="width: ${scaledWidth}px; height: ${dividerHeight}px; background-color: ${dividerColor}; border-radius: ${element.style.borderRadius || 0}px; margin: 0 auto; padding: 0;"></div>`

    default:
      return ''
  }
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
        // APPLE MAIL: Allow data URLs (they work perfectly!)
        // GMAIL: Force external URLs only
        let imageSrc = content
        
        // Only force fallback for Gmail users - Apple Mail handles data URLs fine!
        if (content.startsWith('data:')) {
          console.log('INFO: Data URL detected in Apple Mail - this is fine!')
          imageSrc = content // Keep original data URL for Apple Mail
        }
        
        html += elementHtml + `<img src="${imageSrc}" alt="Email Image" style="
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
        let thumbnailUrl = videoData?.customThumbnail || videoData?.thumbnailUrl
        
        // Extract YouTube thumbnail if URL is provided and no custom thumbnail
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
        
        html += elementHtml + `
          <a href="${videoUrl}" target="_blank" style="display: block; text-decoration: none; position: relative; width: 100%; height: 100%;">
            <img src="${thumbnailUrl}" alt="Video" style="
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
        const buttonUrl = element.buttonData?.url || '#'
        const buttonTarget = element.buttonData?.openInNewTab ? '_blank' : '_self'
        html += elementHtml + `
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${buttonUrl}" style="height:${style.height}px;v-text-anchor:middle;width:${style.width}px;" arcsize="${style.borderRadius ? Math.round((style.borderRadius / Math.min(style.width, style.height)) * 100) : 0}%" strokecolor="${style.backgroundColor}" fillcolor="${style.backgroundColor}">
            <w:anchorlock/>
            <center style="color:${style.color};font-family:Arial,sans-serif;font-size:${style.fontSize || 16}px;font-weight:${style.fontWeight || 'normal'};">${content}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${buttonUrl}" target="${buttonTarget}" style="
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
      campaignId,
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

    // Use campaignId if provided, otherwise fall back to templateId (for backwards compatibility)
    const updateCampaignId = campaignId || templateId

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
            
            // CRITICAL: Validate template elements have required data
            const validElements = templateElements.filter((el: EditorElement) => 
              el.type && el.style && el.style.position && 
              el.style.width > 0 && el.style.height > 0
            )
            
            if (validElements.length === 0) {
              console.log(`WARNING: No valid elements found for ${customer.email}, using fallback HTML`)
              emailHtml = htmlContent
            } else {
              // Generate appropriate HTML for email client
              emailHtml = generateEmailHtml(
                validElements, 
                canvasSettings, 
                templateName || name,
                isGmailUser // Only use Gmail generation for Gmail users
              )
            }
            
            console.log(`Generated ${isGmailUser ? 'Gmail-specific' : 'standard'} HTML for ${customer.email}`)
            
            // DEBUG: Log first 1000 characters of generated HTML for Gmail users
            if (isGmailUser) {
              console.log(`Gmail HTML Preview for ${customer.email}:`, emailHtml.substring(0, 1000) + '...')
            }
          } else {
            console.log(`Using fallback htmlContent for customer ${customer.email} - template elements not provided`)
            console.log(`Fallback HTML Preview for ${customer.email}:`, htmlContent.substring(0, 500) + '...')
          }
          
          const personalizedHtml = personalizeContent(emailHtml, customer)
          const personalizedText = personalizeContent(textContent, customer)
          
          // Add tracking to HTML email - NEW SYSTEM: Use email address directly
          const trackedHtml = addEmailTracking(personalizedHtml, updateCampaignId, customer.email)
          
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

    // Update campaign sentCount in database
    try {
      await prisma.emailCampaign.update({
        where: { id: updateCampaignId },
        data: { 
          sentCount: results.successCount,
          sentAt: new Date(),
          status: 'sent'
        }
      })
      console.log(`Campaign ${updateCampaignId} sentCount updated: ${results.successCount}`)
    } catch (dbError) {
      console.warn('Failed to update campaign sentCount:', dbError)
    }

    // Log campaign results
    console.log(`Campaign ${updateCampaignId} sent:`, results)

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

// Helper function to add email tracking (NEW SYSTEM - Uses email addresses directly)
function addEmailTracking(htmlContent: string, campaignId: string, recipientEmail: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm.steinway.com.au'
  
  // 1. Add tracking pixel for email opens - NEW: Direct email parameter
  const encodedEmail = encodeURIComponent(recipientEmail)
  const trackingPixelUrl = `${baseUrl}/api/email/tracking/open?c=${campaignId}&e=${encodedEmail}`
  const trackingPixel = `<img src="${trackingPixelUrl}" alt="" width="1" height="1" style="display:block;border:none;outline:none;text-decoration:none;" />`
  
  // 2. Convert all links to tracked links with enhanced type detection
  let trackedHtml = htmlContent.replace(
    /href=["']([^"']+)["']/gi,
    (match, url, offset) => {
      // Skip already tracked links and tracking pixels
      if (url.includes('/api/email/tracking/') || url.includes('mailto:') || url.startsWith('#')) {
        return match
      }
      
      // Detect link type based on context
      let linkType = 'link' // default
      const surroundingHtml = htmlContent.substring(Math.max(0, offset - 200), offset + 200)
      
      if (surroundingHtml.includes('<table') && surroundingHtml.includes('padding') && surroundingHtml.includes('border-radius')) {
        linkType = 'button'
      } else if (surroundingHtml.includes('youtube.com') || surroundingHtml.includes('youtu.be') || surroundingHtml.includes('play')) {
        linkType = 'video'
      } else if (url.includes('website') || url.includes('home') || url.includes('.com.au')) {
        linkType = 'website'
      }
      
      // Create enhanced tracked link - NEW: Direct email parameter
      const encodedUrl = encodeURIComponent(url)
      const trackedUrl = `${baseUrl}/api/email/tracking/click?c=${campaignId}&e=${encodedEmail}&url=${encodedUrl}&type=${linkType}`
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