'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface EditorElement {
  id: string
  type: 'text' | 'heading' | 'image' | 'button' | 'video' | 'divider'
  content: string
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
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  videoData?: {
    title?: string
    thumbnailUrl?: string
  }
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  type: 'newsletter' | 'promotional' | 'event' | 'follow-up'
  htmlContent: string
  textContent: string
  elements: EditorElement[]
  canvasSettings: {
    width: number
    height: number
    backgroundColor: string
  }
  createdAt: string
}

export default function EmailPreviewPage() {
  const searchParams = useSearchParams()
  const templateId = searchParams.get('id')
  const client = (searchParams.get('client') as 'gmail' | 'outlook' | 'apple' | 'generic') || 'gmail'
  
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (templateId) {
      // Load template from localStorage
      const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]')
      const foundTemplate = savedTemplates.find((t: EmailTemplate) => t.id === templateId)
      
      if (foundTemplate) {
        setTemplate(foundTemplate)
      } else {
        console.error('Template not found:', templateId)
      }
    }
    setLoading(false)
  }, [templateId])

  const generateClientSpecificHtml = (template: EmailTemplate, client: 'gmail' | 'outlook' | 'apple' | 'generic') => {
    const editorElements = template.elements || []
    const canvasSettings = template.canvasSettings || { width: 600, height: 800, backgroundColor: '#ffffff' }
    
    // Sort elements by Y position to maintain proper stacking order
    const sortedElements = [...editorElements].sort((a, b) => a.style.position.y - b.style.position.y)
    
    // GMAIL: Return dramatically simplified version (strips all styling)  
    if (client === 'gmail') {
      let gmailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${template.name || 'Email Template'}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: white;">
  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: white;">
    <tr>
      <td style="background-color: #EA4335; color: white; padding: 15px; text-align: center; font-size: 14px; font-weight: bold;">
        📧 GMAIL - Strips All Styling, Text Only
      </td>
    </tr>`

      sortedElements.forEach((element) => {
        const { type, content } = element
        
        if (type === 'text' || type === 'heading') {
          gmailHtml += `
            <tr>
              <td style="padding: 20px; font-family: Arial, sans-serif; font-size: 14px; color: black; line-height: 1.6;">
                ${content}
              </td>
            </tr>`
        } else if (type === 'image') {
          gmailHtml += `
            <tr>
              <td style="padding: 20px; font-family: Arial, sans-serif; font-size: 14px; color: blue; text-decoration: underline;">
                [Image: Click to view - Gmail strips images]
              </td>
            </tr>`
        } else if (type === 'button') {
          gmailHtml += `
            <tr>
              <td style="padding: 20px;">
                <a href="#" style="color: blue; text-decoration: underline; font-family: Arial, sans-serif; font-size: 14px;">
                  ${content}
                </a>
              </td>
            </tr>`
        }
      })

      gmailHtml += `
  </table>
</body>
</html>`
      return gmailHtml
    }
    
    // OTHER CLIENTS: Use EXACT template layout with absolute positioning to preserve design
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name || 'Email Template'}</title>
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
        <td align="center" style="padding: 20px 0;">`

    // Add client-specific headers
    const clientHeaders = {
      outlook: '<div style="background-color: #0078D4; color: white; padding: 15px; text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 20px;">📧 OUTLOOK - Your Actual Template Design</div>',
      apple: '<div style="background-color: #34C759; color: white; padding: 15px; text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 20px;">📧 APPLE MAIL - Your Actual Template Design</div>',
      generic: '<div style="background-color: #6B7280; color: white; padding: 15px; text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 20px;">📧 GENERIC CLIENT - Your Actual Template Design</div>'
    }
    
    html += clientHeaders[client as keyof typeof clientHeaders] || ''

    html += `
          <div style="
            position: relative; 
            width: ${canvasSettings.width}px; 
            height: ${canvasSettings.height}px;
            max-width: ${canvasSettings.width}px; 
            background-color: ${canvasSettings.backgroundColor}; 
            margin: 0 auto;
            display: block;
          ">`

    // FIXED: Render each element with its EXACT positioning and dimensions from template editor
    sortedElements.forEach((element, index) => {
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
          // FIXED: Use exact dimensions from the element style to prevent stretching
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
          const thumbnailUrl = videoData?.thumbnailUrl || 'https://via.placeholder.com/400x300/000000/FFFFFF/?text=VIDEO'
          html += elementHtml + `
            <a href="${content}" style="display: block; text-decoration: none; position: relative; width: 100%; height: 100%;">
              <img src="${thumbnailUrl}" alt="${videoData?.title || 'Video'}" style="
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Template Not Found</h1>
          <p className="text-gray-600 mb-4">The requested template could not be found.</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close Window
          </button>
        </div>
      </div>
    )
  }

  const clientNames = {
    gmail: 'Gmail',
    outlook: 'Outlook',
    apple: 'Apple Mail',
    generic: 'Generic Client'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Email Preview: {template.name}
              </h1>
              <p className="text-sm text-gray-600">
                {clientNames[client]} • Subject: {template.subject}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Client Selector */}
              <select
                value={client}
                onChange={(e) => {
                  const newClient = e.target.value as 'gmail' | 'outlook' | 'apple' | 'generic'
                  const newUrl = new URL(window.location.href)
                  newUrl.searchParams.set('client', newClient)
                  window.location.href = newUrl.toString()
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="apple">Apple Mail</option>
                <option value="generic">Generic Client</option>
              </select>
              <button
                onClick={() => window.close()}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Preview */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            srcDoc={generateClientSpecificHtml(template, client)}
            className="w-full h-[800px] border-0"
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  )
} 