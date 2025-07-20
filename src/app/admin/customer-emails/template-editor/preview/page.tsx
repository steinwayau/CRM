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
    fontWeight?: 'normal' | 'bold'
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
  canvasSettings?: {
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
    
    // Sort elements by Y position to create proper email flow
    const sortedElements = [...editorElements].sort((a, b) => a.style.position.y - b.style.position.y)
    
    // Generate EMAIL-SAFE HTML using only tables and inline styles
    let html = `<!DOCTYPE html>
<html>
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
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="${canvasSettings.width}" cellspacing="0" cellpadding="0" border="0" style="background-color: ${canvasSettings.backgroundColor}; max-width: ${canvasSettings.width}px;">`

    // Add client indicator
    let clientColor = '#007acc'
    let clientText = 'GENERIC EMAIL CLIENT PREVIEW'
    
    if (client === 'gmail') {
      clientColor = '#ff6b6b'
      clientText = 'GMAIL PREVIEW: Limited CSS support'
    } else if (client === 'outlook') {
      clientColor = '#0078d4'
      clientText = 'OUTLOOK PREVIEW: Uses Word rendering engine'
    } else if (client === 'apple') {
      clientColor = '#34c759'
      clientText = 'APPLE MAIL PREVIEW: Full CSS support'
    }
    
    html += `
          <tr>
            <td style="background-color: ${clientColor}; color: white; padding: 10px; text-align: center; font-size: 12px; font-weight: bold;">
              ${clientText}
            </td>
          </tr>`

    // Process each element in email-safe table rows
    sortedElements.forEach((element, index) => {
      const { type, content, style } = element
      
      // Determine alignment based on element position relative to canvas center
      const canvasCenterX = canvasSettings.width / 2
      const elementCenterX = style.position.x + (style.width / 2)
      const elementAlignment = Math.abs(elementCenterX - canvasCenterX) < 20 ? 'center' : 
                               style.position.x < canvasCenterX ? 'left' : 'right'
      
      html += `
          <tr>
            <td style="padding: 0;">`

      switch (type) {
        case 'text':
          const textColor = style.color || '#000000'
          const textSize = style.fontSize || 16
          const bgColor = style.backgroundColor && style.backgroundColor !== 'transparent' ? style.backgroundColor : 'transparent'
          const padding = style.padding || 10
          
          html += `
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="${elementAlignment}" style="
                    font-family: Arial, sans-serif;
                    font-size: ${textSize}px;
                    color: ${textColor};
                    text-align: ${elementAlignment};
                    line-height: 1.5;
                    padding: ${padding}px;
                    ${bgColor !== 'transparent' ? `background-color: ${bgColor};` : ''}
                  ">${content}</td>
                </tr>
              </table>`
          break

        case 'heading':
          const headingLevel = element.headingLevel || 1
          const headingSize = style.fontSize || (32 - (headingLevel - 1) * 4)
          const headingColor = style.color || '#000000'
          const headingPadding = style.padding || 10
          
          html += `
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="${elementAlignment}" style="
                    font-family: Arial, sans-serif;
                    font-size: ${headingSize}px;
                    color: ${headingColor};
                    text-align: ${elementAlignment};
                    font-weight: bold;
                    padding: ${headingPadding}px;
                    margin: 0;
                    line-height: 1.2;
                  ">
                    ${content}
                  </td>
                </tr>
              </table>`
          break

        case 'image':
          const imagePadding = style.padding || 0
          
          html += `
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="${elementAlignment}" style="padding: ${imagePadding}px;">
                    <img src="${content}" alt="Image" style="
                      display: block;
                      max-width: ${style.width}px;
                      height: auto;
                      border: 0;
                    " width="${style.width}" />
                  </td>
                </tr>
              </table>`
          break

        case 'video':
          const videoData = element.videoData
          const thumbnailUrl = videoData?.thumbnailUrl || 'https://via.placeholder.com/400x300/000000/FFFFFF/?text=VIDEO'
          const videoAlign = style.textAlign || 'left'
          
          html += `
              <div style="text-align: ${videoAlign};">
                <a href="${content}" style="display: inline-block; text-decoration: none;">
                  <img src="${thumbnailUrl}" alt="Video Thumbnail" style="
                    max-width: 100%;
                    height: auto;
                    border: 2px solid #007acc;
                  " width="${style.width}" />
                  <div style="
                    background-color: #007acc;
                    color: white;
                    padding: 10px;
                    text-align: center;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                  ">▶ ${videoData?.title || 'Play Video'}</div>
                </a>
              </div>`
          break

        case 'button':
          const buttonBg = style.backgroundColor || '#007acc'
          const buttonColor = style.color || '#ffffff'
          const buttonText = content

          const buttonPadding = style.padding || 12
          const buttonBorderRadius = style.borderRadius || 4
          
          // Email-safe button with Outlook VML fallback
          if (client === 'outlook') {
            html += `
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="${elementAlignment}" style="padding: 10px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="#" style="height:${buttonPadding * 2 + 32}px;v-text-anchor:middle;width:${content.length * 12 + 60}px;" arcsize="${(buttonBorderRadius / (buttonPadding * 2 + 32)) * 100}%" fillcolor="${buttonBg}">
                      <w:anchorlock/>
                      <center style="color:${buttonColor};font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${buttonText}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="#" style="
                      background-color: ${buttonBg};
                      border: none;
                      border-radius: ${buttonBorderRadius}px;
                      color: ${buttonColor};
                      display: inline-block;
                      font-family: Arial, sans-serif;
                      font-size: 16px;
                      font-weight: bold;
                      line-height: 1;
                      padding: ${buttonPadding}px 30px;
                      text-align: center;
                      text-decoration: none;
                      -webkit-text-size-adjust: none;
                      mso-hide: all;
                    ">${buttonText}</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>`
          } else {
            html += `
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="${elementAlignment}" style="padding: 10px;">
                    <a href="#" style="
                      background-color: ${buttonBg};
                      border: none;
                      ${client === 'apple' ? `border-radius: ${buttonBorderRadius}px;` : ''}
                      color: ${buttonColor};
                      display: inline-block;
                      font-family: Arial, sans-serif;
                      font-size: 16px;
                      font-weight: bold;
                      line-height: 1;
                      padding: ${buttonPadding}px 30px;
                      text-align: center;
                      text-decoration: none;
                      -webkit-text-size-adjust: none;
                    ">${buttonText}</a>
                  </td>
                </tr>
              </table>`
          }
          break

        case 'divider':
          const dividerColor = style.backgroundColor || '#cccccc'
          const dividerHeight = style.height || 1
          const dividerAlign = style.textAlign || 'left'
          const dividerWidth = style.width ? `${style.width}px` : '100%'
          
          html += `
              <div style="text-align: ${dividerAlign};">
                <hr style="
                  border: none;
                  height: ${dividerHeight}px;
                  background-color: ${dividerColor};
                  margin: 20px 0;
                  width: ${dividerWidth};
                  ${dividerAlign === 'center' ? 'margin-left: auto; margin-right: auto;' : ''}
                  ${dividerAlign === 'right' ? 'margin-left: auto; margin-right: 0;' : ''}
                " />
              </div>`
          break
      }

      html += `
            </td>
          </tr>`
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