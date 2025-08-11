import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { PrismaClient } from '@prisma/client'
import { sql } from '@vercel/postgres'

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

// SAFE VIDEO THUMBNAIL GENERATOR WITH COMPREHENSIVE FALLBACK
// This function attempts to generate a composite thumbnail with play button
// If anything fails, it gracefully falls back to the original thumbnail
async function safeGenerateVideoThumbnail(originalThumbnailUrl: string): Promise<string> {
  try {
    console.log('🎬 Attempting to generate video thumbnail with play button')
    
    // Skip generation if no URL provided
    if (!originalThumbnailUrl) {
      console.log('⚠️ No thumbnail URL provided, using fallback')
      return originalThumbnailUrl
    }
    
    // Call our thumbnail generation API with timeout
    const apiUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/video/generate-thumbnail`
      : 'http://localhost:3000/api/video/generate-thumbnail'
      
    const response = await Promise.race([
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thumbnailUrl: originalThumbnailUrl })
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 5000)
      )
    ])
    
    if (!response.ok) {
      console.log('⚠️ Thumbnail API returned error, using original thumbnail')
      return originalThumbnailUrl
    }
    
    // Check if response is an image
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('image')) {
      // Convert response to data URL for inline usage
      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const dataUrl = `data:${contentType};base64,${base64}`
      
      console.log('✅ Successfully generated video thumbnail with play button')
      return dataUrl
    } else {
      console.log('⚠️ API response was not an image, using original thumbnail')
      return originalThumbnailUrl
    }
    
  } catch (error) {
    console.log('⚠️ Video thumbnail generation failed, using original:', error)
    return originalThumbnailUrl // Always fall back to original
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
    return generateStandardEmailHtml(templateName, sortedElements, canvasSettings)
  }
}

// GMAIL-SPECIFIC: Enhanced table-based layout optimized for Gmail
function generateGmailSpecificHtml(
  sortedElements: EditorElement[],
  canvasSettings: CanvasSettings,
  templateName: string
): string {
  // GMAIL OPTIMIZATION: 600px width for better mobile compatibility
  const emailWidth = 600  // Standard email width for Gmail mobile/desktop
  
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
      <td align="center" valign="top" style="padding: 20px 10px;">
        <!-- Main email container for Gmail -->
        <table border="0" cellpadding="0" cellspacing="0" style="
          width: 100%;
          max-width: ${emailWidth}px;
          background-color: ${canvasSettings.backgroundColor || '#ffffff'};
          margin: 0 auto;
        ">
          <tr>
            <td style="padding: 20px;">`

  // Group elements by their Y position for better layout
  const rows: EditorElement[][] = []
  let currentRow: EditorElement[] = []
  let currentY = -1
  const yTolerance = 15 // Slightly more tolerance for Gmail

  sortedElements.forEach((element) => {
    const elementY = element.style.position.y
    
    if (currentY === -1 || Math.abs(elementY - currentY) <= yTolerance) {
      currentRow.push(element)
      currentY = elementY
    } else {
      if (currentRow.length > 0) {
        rows.push([...currentRow])
      }
      currentRow = [element]
      currentY = elementY
    }
  })
  
  // Add the last row
  if (currentRow.length > 0) {
    rows.push(currentRow)
  }

  // Render each row optimized for Gmail
  rows.forEach((rowElements, rowIndex) => {
    // Sort elements in row by X position
    const sortedRowElements = rowElements.sort((a, b) => a.style.position.x - b.style.position.x)
    
    html += `
              <!-- Gmail Row ${rowIndex + 1} -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 0;">
                <tr>`

    sortedRowElements.forEach((element) => {
      const { style, content, type } = element
      
      // Calculate width percentage for Gmail
      const elementWidth = Math.min(100, Math.max(15, (style.width / emailWidth) * 100))
      
      html += `
                  <td style="
                    width: ${elementWidth}%;
                    vertical-align: top;
                    padding: 8px;
                    text-align: center;
                  ">`

      // Render Gmail-optimized content
      switch (type) {
        case 'text':
          html += `<div style="
            font-family: Arial, sans-serif;
            font-size: ${Math.max(14, style.fontSize || 16)}px;
            line-height: 1.4;
            color: ${style.color || '#333333'};
            ${style.fontWeight ? `font-weight: ${style.fontWeight};` : ''}
            ${style.backgroundColor && style.backgroundColor !== 'transparent' ? `background-color: ${style.backgroundColor}; padding: 10px;` : ''}
            ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
            margin: 0;
          ">${content}</div>`
          break
          
        case 'heading':
          const headingTag = `h${element.headingLevel || 1}`
          const gmailHeadingSize = element.headingLevel === 1 ? '22px' : element.headingLevel === 2 ? '18px' : '16px'
          html += `<${headingTag} style="
            font-family: Arial, sans-serif;
            font-size: ${style.fontSize ? Math.max(16, Math.min(style.fontSize, 22)) + 'px' : gmailHeadingSize};
            font-weight: bold;
            line-height: 1.2;
            color: ${style.color || '#333333'};
            margin: 0 0 10px 0;
            white-space: nowrap;
            ${style.backgroundColor && style.backgroundColor !== 'transparent' ? `background-color: ${style.backgroundColor}; padding: 10px;` : ''}
            ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
          ">${content}</${headingTag}>`
          break
          
        case 'image':
          // Gmail handles images better with external URLs
          let imageSrc = content
          if (content.startsWith('data:')) {
            console.log('WARNING: Data URL in Gmail - may not display properly')
            imageSrc = content // Keep as is, but warn
          }
          
          html += `<table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" style="padding: 0;">
                <img src="${imageSrc}" alt="Email Image" style="
                  width: 100%;
                  max-width: ${style.width}px;
                  height: auto;
                  display: block;
                  border: 0;
                  ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
                  margin: 0 auto;
                " />
              </td>
            </tr>
          </table>`
          break
          
        case 'video':
          const videoData = element.videoData
          const videoUrl = videoData?.url || content || ''
          let thumbnailUrl = videoData?.customThumbnail || videoData?.thumbnailUrl
          
          if (videoUrl && !thumbnailUrl) {
            const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
            if (youtubeMatch) {
              const videoId = youtubeMatch[1]
              thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
            }
          }
          
          if (!thumbnailUrl) {
            thumbnailUrl = 'https://via.placeholder.com/400x300/000000/FFFFFF/?text=▶+VIDEO'
          }
          
          // Generate composite image URL using our reliable API endpoint
          const encodedThumbnail = encodeURIComponent(thumbnailUrl)
          const compositeImageUrl = `https://crm.steinway.com.au/api/video/generate-thumbnail?url=${encodedThumbnail}&w=${style.width}&h=${Math.round(style.width * 0.6)}`
          
          html += `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0;">
            <tr>
              <td align="center" style="padding: 0; margin: 0; line-height: 0;">
                <a href="${videoUrl}" target="_blank" style="display: block; text-decoration: none; margin: 0; line-height: 0;">
                  <img src="${compositeImageUrl}" alt="Video Thumbnail" style="
                    width: 100%;
                    max-width: ${style.width}px;
                    height: auto;
                    display: block;
                    border: 0;
                    ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
                    margin: 0;
                    line-height: 0;
                    vertical-align: top;
                  " />
                </a>
              </td>
            </tr>
          </table>`
          break
          
        case 'button':
          const buttonUrl = element.buttonData?.url || '#'
          const buttonTarget = element.buttonData?.openInNewTab ? '_blank' : '_self'
          html += `<table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" style="padding: 10px 0;">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="
                      background-color: ${style.backgroundColor || '#007BFF'};
                      border-radius: ${style.borderRadius || 4}px;
                      text-align: center;
                    ">
                      <a href="${buttonUrl}" target="${buttonTarget}" style="
                        display: inline-block;
                        padding: 12px 24px;
                        color: ${style.color || '#FFFFFF'};
                        text-decoration: none;
                        font-family: Arial, sans-serif;
                        font-size: ${style.fontSize || 16}px;
                        font-weight: bold;
                        line-height: 1;
                      ">${content}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>`
          break
          
        case 'divider':
          html += `<hr style="
            border: none;
            height: ${style.height || 2}px;
            background-color: ${style.backgroundColor || '#CCCCCC'};
            margin: 20px 0;
            width: 100%;
          " />`
          break
      }

      html += `
                  </td>`
    })

    html += `
                </tr>
              </table>`
  })

  html += `
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return html
}

// STANDARD EMAIL CLIENTS: Preserve original design dimensions
function generateStandardEmailHtml(templateName: string, elements: any[], canvasSettings: any = {}) {
  const canvasWidth = canvasSettings.width || 1000
  const canvasHeight = canvasSettings.height || 800
  
  // Sort elements by their Y position (top to bottom) for table layout
  const sortedElements = [...elements].sort((a, b) => a.style.position.y - b.style.position.y)
  
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
        <td align="center" style="padding: 20px 10px;">
          <!-- Main email container table -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="
            width: 100%;
            max-width: 600px;
            background-color: ${canvasSettings.backgroundColor || '#ffffff'};
            margin: 0 auto;
          ">
            <tr>
              <td style="padding: 20px;">`

  // Group elements by their Y position to create rows
  const rows: any[][] = []
  let currentRow: any[] = []
  let currentY = -1
  const yTolerance = 10 // Group elements within 10px of each other

  sortedElements.forEach((element) => {
    const elementY = element.style.position.y
    
    if (currentY === -1 || Math.abs(elementY - currentY) <= yTolerance) {
      currentRow.push(element)
      currentY = elementY
    } else {
      if (currentRow.length > 0) {
        rows.push([...currentRow])
      }
      currentRow = [element]
      currentY = elementY
    }
  })
  
  // Add the last row
  if (currentRow.length > 0) {
    rows.push(currentRow)
  }

  // Render each row as a table
  rows.forEach((rowElements, rowIndex) => {
    // Sort elements in row by X position (left to right)
    const sortedRowElements = rowElements.sort((a, b) => a.style.position.x - b.style.position.x)
    
    html += `
                    <!-- Row ${rowIndex + 1} -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 0;">
                      <tr>`

    sortedRowElements.forEach((element) => {
      const { style, content, type } = element
      
      // Calculate relative width as percentage
      const elementWidth = Math.min(100, Math.max(10, (style.width / 600) * 100))
      
      html += `
                    <td style="
                      width: ${elementWidth}%;
                      vertical-align: top;
                      padding: 5px;
                      text-align: center;
                    ">`

      // Render element content based on type
      switch (type) {
        case 'text':
          html += `<div style="
            ${style.fontSize ? `font-size: ${Math.max(14, style.fontSize)}px;` : 'font-size: 16px;'}
            ${style.fontWeight ? `font-weight: ${style.fontWeight};` : ''}
            ${style.fontFamily ? `font-family: ${style.fontFamily}, Arial, sans-serif;` : 'font-family: Arial, sans-serif;'}
            ${style.fontStyle ? `font-style: ${style.fontStyle};` : ''}
            ${style.textDecoration ? `text-decoration: ${style.textDecoration};` : ''}
            ${style.color ? `color: ${style.color};` : 'color: #333333;'}
            ${style.backgroundColor && style.backgroundColor !== 'transparent' ? `background-color: ${style.backgroundColor};` : ''}
            ${style.padding ? `padding: ${style.padding}px;` : 'padding: 10px;'}
            ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
            line-height: 1.4;
            margin: 0;
          ">${content}</div>`
          break
          
        case 'heading':
          const headingTag = `h${element.headingLevel || 1}`
          const headingSize = element.headingLevel === 1 ? '28px' : element.headingLevel === 2 ? '24px' : '20px'
          html += `<${headingTag} style="
            margin: 0;
            ${style.fontSize ? `font-size: ${Math.max(18, style.fontSize)}px;` : `font-size: ${headingSize};`}
            ${style.fontWeight ? `font-weight: ${style.fontWeight};` : 'font-weight: bold;'}
            ${style.fontFamily ? `font-family: ${style.fontFamily}, Arial, sans-serif;` : 'font-family: Arial, sans-serif;'}
            ${style.color ? `color: ${style.color};` : 'color: #333333;'}
            ${style.backgroundColor && style.backgroundColor !== 'transparent' ? `background-color: ${style.backgroundColor};` : ''}
            ${style.padding ? `padding: ${style.padding}px;` : 'padding: 10px;'}
            ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
            line-height: 1.2;
            white-space: nowrap;
          ">${content}</${headingTag}>`
          break
          
        case 'image':
          let imageSrc = content
          if (content.startsWith('data:')) {
            imageSrc = content // Keep data URLs for Apple Mail
          }
          
          html += `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding: 0;">
                <img src="${imageSrc}" alt="Email Image" style="
                  width: 100%;
                  max-width: ${style.width}px;
                  height: auto;
                  display: block;
                  border: 0;
                  outline: none;
                  ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
                  margin: 0 auto;
                " />
              </td>
            </tr>
          </table>`
          break
          
        case 'video':
          const videoData = element.videoData
          const videoUrl = videoData?.url || content || ''
          let thumbnailUrl = videoData?.customThumbnail || videoData?.thumbnailUrl
          
          if (videoUrl && !thumbnailUrl) {
            const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
            if (youtubeMatch) {
              const videoId = youtubeMatch[1]
              thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
            }
          }
          
          if (!thumbnailUrl) {
            thumbnailUrl = 'https://via.placeholder.com/400x300/000000/FFFFFF/?text=▶+VIDEO'
          }
          
          // Generate composite image URL using our reliable API endpoint
          const encodedThumbnail = encodeURIComponent(thumbnailUrl)
          const compositeImageUrl = `https://crm.steinway.com.au/api/video/generate-thumbnail?url=${encodedThumbnail}&w=${style.width}&h=${Math.round(style.width * 0.6)}`
          
          html += `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0;">
            <tr>
              <td align="center" style="padding: 0; margin: 0; line-height: 0;">
                <a href="${videoUrl}" target="_blank" style="display: block; text-decoration: none; margin: 0; line-height: 0;">
                  <img src="${compositeImageUrl}" alt="Video Thumbnail" style="
                    width: 100%;
                    max-width: ${style.width}px;
                    height: auto;
                    display: block;
                    border: 0;
                    ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
                    margin: 0;
                    line-height: 0;
                    vertical-align: top;
                  " />
                </a>
              </td>
            </tr>
          </table>`
          break
          
        case 'button':
          const buttonUrl = element.buttonData?.url || '#'
          const buttonTarget = element.buttonData?.openInNewTab ? '_blank' : '_self'
          html += `<!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${buttonUrl}" style="height:40px;v-text-anchor:middle;width:150px;" arcsize="10%" stroke="f" fillcolor="${style.backgroundColor || '#007BFF'}">
              <w:anchorlock/>
              <center>
          <![endif]-->
          <a href="${buttonUrl}" target="${buttonTarget}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: ${style.backgroundColor || '#007BFF'};
            color: ${style.color || '#FFFFFF'};
            text-decoration: none;
            border-radius: ${style.borderRadius || 4}px;
            font-family: Arial, sans-serif;
            font-size: ${style.fontSize || 16}px;
            font-weight: ${style.fontWeight || 'bold'};
            text-align: center;
            line-height: 1;
            margin: 10px 0;
          ">${content}</a>
          <!--[if mso]>
              </center>
            </v:roundrect>
          <![endif]-->`
          break
          
        case 'divider':
          html += `<hr style="
            border: none; 
            height: ${style.height || 2}px; 
            background-color: ${style.backgroundColor || '#CCCCCC'}; 
            margin: 15px 0;
            width: 100%;
          " />`
          break
      }

      html += `
                    </td>`
    })

    html += `
                  </tr>
                </table>`
  })

  html += `
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`
  
  return html
}

// Helper: delay
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper: send one email with retry/backoff (handles Resend rate limits)
async function sendEmailWithRetry(sendFn: () => Promise<any>, maxAttempts: number = 3) {
  let attempt = 0
  let lastError: any = null
  while (attempt < maxAttempts) {
    try {
      const resp = await sendFn()
      // Resend returns { error } on soft failure
      if (resp && resp.error) {
        throw resp.error
      }
      return { status: 'fulfilled' as const, value: resp }
    } catch (err: any) {
      lastError = err
      const message = (err?.message || '').toLowerCase()
      const isRateLimit = message.includes('too many requests') || message.includes('rate') || err?.status === 429
      attempt += 1
      if (attempt >= maxAttempts || !isRateLimit) {
        return { status: 'rejected' as const, reason: err }
      }
      // Backoff: 1s, 2s, 4s
      await delay(1000 * Math.pow(2, attempt - 1))
    }
  }
  return { status: 'rejected' as const, reason: lastError }
}

// Helper: send a batch with limited concurrency
async function sendWithConcurrency<T>(
  tasks: Array<() => Promise<T>>, 
  concurrency: number = 5,
  maxAttempts: number = 3
) {
  const results: Array<{ status: 'fulfilled' | 'rejected'; value?: any; reason?: any }> = []
  let index = 0
  while (index < tasks.length) {
    const slice = tasks.slice(index, index + concurrency)
    const settled = await Promise.all(
      slice.map(fn => sendEmailWithRetry(fn, maxAttempts))
    )
    results.push(...settled)
    index += concurrency
  }
  return results
}

// Helper: rate-limited + concurrency window (msgs/sec)
async function sendWithRateLimitedConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
  msgsPerSecond: number,
  maxAttempts: number
) {
  const results: Array<{ status: 'fulfilled' | 'rejected'; value?: any; reason?: any }> = []
  let index = 0
  const windowSize = Math.max(1, Math.min(concurrency, msgsPerSecond))
  while (index < tasks.length) {
    const slice = tasks.slice(index, index + windowSize)
    const settled = await Promise.all(
      slice.map(fn => sendEmailWithRetry(fn, maxAttempts))
    )
    results.push(...settled)
    index += windowSize
    if (index < tasks.length) {
      await delay(1000) // next second
    }
  }
  return results
}

// Helper to resolve base URL reliably in all environments
function getBaseUrl(): string {
  // Prefer Vercel-provided URL in serverless environment
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  // Fall back to explicit public app URL
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  // Final fallback: production custom domain
  return 'https://crm.steinway.com.au'
}

// Social links (defaults; can be overridden with env vars)
const SOCIAL_LINKS = {
  facebook: process.env.BRANDED_FOOTER_FACEBOOK || 'https://www.facebook.com/steinwayaustralia',
  instagram: process.env.BRANDED_FOOTER_INSTAGRAM || 'https://www.instagram.com/steinwaygalleriesaustralia/?hl=en',
  youtube: process.env.BRANDED_FOOTER_YOUTUBE || 'https://www.youtube.com/@steinwaygalleriesaustralia8733/featured'
}

async function getFooterSettings() {
  try {
    const res = await sql`SELECT key, value FROM system_settings WHERE key IN ('footerEnabled','footerLogoUrl','footerPhoneLabel','footerFacebook','footerInstagram','footerYouTube')`
    const out: Record<string,string> = {}
    res.rows.forEach((r:any)=>{ out[r.key] = r.value })
    return out
  } catch { return {} as any }
}

async function appendFooterAsync(html: string, recipientEmail: string): Promise<string> {
  const base = getBaseUrl()
  const unsub = `${base}/api/email/unsubscribe?e=${encodeURIComponent(recipientEmail)}`

  // Load settings; env is fallback
  const s = await getFooterSettings()
  const enableBrandedFlag = (s.footerEnabled ?? (process.env.ENABLE_BRANDED_FOOTER || 'false')).toString().toLowerCase() === 'true'
  const logoUrlFromSettings = s.footerLogoUrl || ''
  const enableBranded = enableBrandedFlag || !!logoUrlFromSettings || !!(s.facebookIconUrl || s.instagramIconUrl || s.youtubeIconUrl)
  const logoUrl = logoUrlFromSettings || `${base}/branding/logo.png`
  const phoneLabel = s.footerPhoneLabel || 'National Information Line 1300 199 589'
  const fb = s.footerFacebook || SOCIAL_LINKS.facebook
  const ig = s.footerInstagram || SOCIAL_LINKS.instagram
  const yt = s.footerYouTube || SOCIAL_LINKS.youtube
  const fbIcon = s.facebookIconUrl || ''
  const igIcon = s.instagramIconUrl || ''
  const ytIcon = s.youtubeIconUrl || ''

  // Simple circle “icons” (email-safe fallback without external images)
  const circle = (label: string) => 
    `<span style="display:inline-block;width:28px;height:28px;line-height:28px;border-radius:14px;border:1px solid #CBD5E1;font-family:Arial, sans-serif;font-size:12px;color:#111827;text-align:center;">${label}</span>`

  const signatureBlock = enableBranded ? `
    <tr>
      <td align="center" style="padding:22px 10px 6px 10px;">
        <img src="${logoUrl}" alt="Steinway Galleries Australia" width="220" style="display:block;max-width:220px;height:auto;border:0;outline:none;text-decoration:none;" />
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:4px 10px 0 10px;font-family:Arial, sans-serif;font-size:18px;color:#111827;font-weight:bold;">
        Steinway Galleries Australia
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:2px 10px 10px 10px;font-family:Arial, sans-serif;font-size:13px;color:#475569;">
        ${phoneLabel}
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:4px 10px 8px 10px;">
        <a href="${fb}" style="text-decoration:none;margin-right:8px" target="_blank" rel="noopener">
          ${fbIcon ? `<img src="${fbIcon}" alt="Facebook" width="28" height="28" style="display:inline-block;border:0;outline:none;vertical-align:middle;border-radius:14px;" />` : circle('F')}
        </a>
        <a href="${ig}" style="text-decoration:none;margin-right:8px" target="_blank" rel="noopener">
          ${igIcon ? `<img src="${igIcon}" alt="Instagram" width="28" height="28" style="display:inline-block;border:0;outline:none;vertical-align:middle;border-radius:14px;" />` : circle('IG')}
        </a>
        <a href="${yt}" style="text-decoration:none" target="_blank" rel="noopener">
          ${ytIcon ? `<img src="${ytIcon}" alt="YouTube" width="28" height="28" style="display:inline-block;border:0;outline:none;vertical-align:middle;border-radius:14px;" />` : circle('YT')}
        </a>
      </td>
    </tr>
  ` : ''

  // Centered unsubscribe block (always)
  const unsubscribeBlock = `
    <tr>
      <td align="center" style="padding:16px 10px 24px 10px;font-family:Arial, sans-serif;font-size:12px;color:#6b7280;">
        <p style="margin:0 0 6px 0;">You are receiving this email because you subscribed to our newsletter or joined our mailing list.</p>
        <p style="margin:0;">If you prefer not to receive these emails, you can <a href="${unsub}" style="color:#111827; text-decoration:underline;">unsubscribe here</a>.</p>
      </td>
    </tr>`

  const footer = `${signatureBlock}${unsubscribeBlock}`

  // Insert before closing container table if possible
  if (html.includes('</table>')) {
    const last = html.lastIndexOf('</table>')
    return html.slice(0, last) + footer + html.slice(last)
  }
  return html + footer
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

    // Persist initial sending state
    try {
      await prisma.emailCampaign.update({
        where: { id: updateCampaignId },
        data: {
          status: 'sending',
          recipientCount: eligibleCustomers.length,
          sentAt: null
        }
      })
    } catch (prepErr) {
      console.warn('Failed to set sending state:', prepErr)
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
        const batchEmails = await Promise.all(batch.map(async customer => {
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

          // Append standard footer with unsubscribe
          const finalHtml = await appendFooterAsync(trackedHtml, customer.email)
          
          return {
            to: customer.email,
            subject: subject,
            html: finalHtml,
            text: personalizedText,
            from: 'noreply@steinway.com.au',
            replyTo: process.env.REPLY_TO_EMAIL || 'info@steinway.com.au'
          }
        }))

        // Send batch using Resend with concurrency cap and backoff
        const RATE = Math.max(1, parseInt(process.env.EMAIL_RATE_PER_SEC || '5'))
        const CONCURRENCY = Math.min(RATE, 5)
        const batchResults = await sendWithRateLimitedConcurrency(
          batchEmails.map(email => () => resend.emails.send(email)),
          CONCURRENCY,
          RATE,
          3
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
              error: (result.reason?.message || result.reason || '').toString()
            })
          }
        })

        // Per-second pacing handled by sendWithRateLimitedConcurrency

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
    let updatedCampaign = null
    try {
      if (results.successCount > 0) {
        updatedCampaign = await prisma.emailCampaign.update({
          where: { id: updateCampaignId },
          data: { 
            sentCount: results.successCount,
            sentAt: new Date(),
            status: 'sent'
          }
        })
        console.log(`Campaign ${updateCampaignId} sentCount updated: ${results.successCount}`)
      } else {
        // No successes → revert to draft so UI shows Send Now consistently
        updatedCampaign = await prisma.emailCampaign.update({
          where: { id: updateCampaignId },
          data: { status: 'draft', sentAt: null }
        })
        console.log(`Campaign ${updateCampaignId} had no successful sends; reverted to draft`)
      }
    } catch (dbError) {
      console.warn('Failed to update campaign sentCount:', dbError)
    }

    // Log campaign results
    console.log(`Campaign ${updateCampaignId} sent:`, results)

    return NextResponse.json({
      success: results.successCount > 0,
      results: results,
      campaign: updatedCampaign, // Return the updated campaign for immediate UI update
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
    const response = await fetch(`${getBaseUrl()}/api/enquiries`)
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
  const baseUrl = getBaseUrl()
  
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
      
      // Detect link type based on URL and context
      let linkType = 'link' // default
      const surroundingHtml = htmlContent.substring(Math.max(0, offset - 200), offset + 200)
      
      // Check URL first for specific patterns
      if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('video')) {
        linkType = 'video'
      } else if (url.includes('.com.au') || url.includes('steinway.com') || url.includes('website') || url.includes('home')) {
        linkType = 'website'
      } else if (surroundingHtml.includes('<table') && surroundingHtml.includes('padding') && surroundingHtml.includes('border-radius')) {
        linkType = 'button'
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