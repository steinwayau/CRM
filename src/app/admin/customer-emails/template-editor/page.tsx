'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  type: 'newsletter' | 'promotional' | 'event' | 'follow-up'
  htmlContent: string
  textContent: string
  createdAt: string
}

interface EditorElement {
  id: string
  type: 'text' | 'image' | 'video' | 'button' | 'divider'
  content: string
  style: {
    position: { x: number; y: number }
    width: number
    height: number
    fontSize?: number
    fontWeight?: string
    color?: string
    backgroundColor?: string
    padding?: number
    borderRadius?: number
    textAlign?: 'left' | 'center' | 'right'
  }
}

export default function TemplateEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get template ID from URL params if editing existing template
  const templateId = searchParams.get('id')
  const isEditing = !!templateId

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    type: 'newsletter' as EmailTemplate['type']
  })

  // Visual editor state
  const [editorElements, setEditorElements] = useState<EditorElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 })
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load existing template if editing
  useEffect(() => {
    if (isEditing && templateId) {
      // In a real app, you'd fetch from your API
      // For now, we'll use localStorage to simulate
      const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]')
      const template = savedTemplates.find((t: EmailTemplate) => t.id === templateId)
      
      if (template) {
        setTemplateForm({
          name: template.name,
          subject: template.subject,
          type: template.type
        })
        // Parse elements from HTML (simplified - in real app you'd store elements separately)
        loadElementsFromHtml(template.htmlContent)
      }
    }
  }, [isEditing, templateId])

  // Visual editor functions
  const addElement = (type: 'text' | 'image' | 'video' | 'button' | 'divider') => {
    const newElement: EditorElement = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      style: {
        position: { x: 50, y: 50 },
        width: type === 'divider' ? 500 : type === 'button' ? 200 : 300,
        height: type === 'text' ? 120 : type === 'divider' ? 2 : type === 'button' ? 40 : 200,
        fontSize: type === 'text' ? 16 : undefined,
        fontWeight: type === 'text' ? 'normal' : undefined,
        color: type === 'text' ? '#000000' : type === 'button' ? '#ffffff' : undefined,
        backgroundColor: type === 'button' ? '#3b82f6' : type === 'divider' ? '#e5e7eb' : type === 'text' ? '#f9fafb' : undefined,
        padding: type === 'text' || type === 'button' ? 10 : undefined,
        borderRadius: type === 'button' ? 6 : undefined,
        textAlign: type === 'text' ? 'left' as const : undefined
      }
    }
    setEditorElements([...editorElements, newElement])
  }

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text': return 'Enter your text here...'
      case 'image': return 'https://via.placeholder.com/300x200'
      case 'video': return 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      case 'button': return 'Click Here'
      case 'divider': return ''
      default: return ''
    }
  }

  const updateElement = (id: string, updates: Partial<EditorElement>) => {
    setEditorElements(editorElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
  }

  const deleteElement = (id: string) => {
    setEditorElements(editorElements.filter(el => el.id !== id))
    setSelectedElement(null)
  }

  const handleImageUpload = (elementId: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          // Create a data URL for the image
          const reader = new FileReader()
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string
            updateElement(elementId, { content: imageUrl })
          }
          reader.readAsDataURL(file)
        }
      }
      fileInputRef.current.click()
    }
  }

  const generateHtmlFromElements = () => {
    let html = `<div style="position: relative; width: ${canvasSize.width}px; min-height: ${canvasSize.height}px; background: #ffffff; font-family: Arial, sans-serif;">`
    
    editorElements.forEach(element => {
      const { style, content, type } = element
      const commonStyles = `
        position: absolute;
        left: ${style.position.x}px;
        top: ${style.position.y}px;
        width: ${style.width}px;
        height: ${style.height}px;
        ${style.fontSize ? `font-size: ${style.fontSize}px;` : ''}
        ${style.fontWeight ? `font-weight: ${style.fontWeight};` : ''}
        ${style.color ? `color: ${style.color};` : ''}
        ${style.backgroundColor ? `background-color: ${style.backgroundColor};` : ''}
        ${style.padding ? `padding: ${style.padding}px;` : ''}
        ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
        ${style.textAlign ? `text-align: ${style.textAlign};` : ''}
      `

      switch (type) {
        case 'text':
          html += `<div style="${commonStyles}">${content}</div>`
          break
        case 'image':
          html += `<img src="${content}" style="${commonStyles} object-fit: cover;" alt="Email Image" />`
          break
        case 'video':
          html += `<iframe src="${content}" style="${commonStyles}" frameborder="0" allowfullscreen></iframe>`
          break
        case 'button':
          html += `<a href="#" style="${commonStyles} display: flex; align-items: center; justify-content: center; text-decoration: none; border: none; cursor: pointer;">${content}</a>`
          break
        case 'divider':
          html += `<hr style="${commonStyles} border: none; background-color: ${style.backgroundColor};" />`
          break
      }
    })
    
    html += '</div>'
    return html
  }

  const generatePlainTextFromElements = () => {
    return editorElements
      .filter(el => el.type === 'text' || el.type === 'button')
      .map(el => el.content)
      .join('\n\n')
  }

  const loadElementsFromHtml = (html: string) => {
    // Simplified - in a real app you'd store elements separately
    if (!html || html.trim() === '') {
      setEditorElements([])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const templateData: EmailTemplate = {
        id: templateId || Date.now().toString(),
        name: templateForm.name,
        subject: templateForm.subject,
        type: templateForm.type,
        htmlContent: generateHtmlFromElements(),
        textContent: generatePlainTextFromElements(),
        createdAt: new Date().toISOString()
      }

      // Save to localStorage (in real app, you'd save to your API)
      const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]')
      
      if (isEditing) {
        const updatedTemplates = savedTemplates.map((t: EmailTemplate) => 
          t.id === templateId ? templateData : t
        )
        localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates))
      } else {
        localStorage.setItem('emailTemplates', JSON.stringify([templateData, ...savedTemplates]))
      }

      // Redirect back to templates page
      router.push('/admin/customer-emails?tab=templates')
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setSaving(false)
    }
  }

  const personalizeContent = (content: string) => {
    return content
      .replace(/\{\{firstName\}\}/g, 'John')
      .replace(/\{\{lastName\}\}/g, 'Smith')
      .replace(/\{\{fullName\}\}/g, 'John Smith')
      .replace(/\{\{email\}\}/g, 'john.smith@example.com')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/customer-emails?tab=templates')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Templates
              </button>
              <div className="h-6 border-l border-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Template' : 'Create New Template'}
                </h1>
                <p className="text-sm text-gray-500">Drag and drop elements to build your email template</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                disabled={editorElements.length === 0}
                className="px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50"
              >
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
              <button
                onClick={handleSave}
                disabled={!templateForm.name || !templateForm.subject || editorElements.length === 0 || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditing ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Settings */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
              <input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter template name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
              <input
                type="text"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter email subject line"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Type</label>
              <select
                value={templateForm.type}
                onChange={(e) => setTemplateForm({...templateForm, type: e.target.value as EmailTemplate['type']})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="newsletter">Newsletter</option>
                <option value="promotional">Promotional</option>
                <option value="event">Event</option>
                <option value="follow-up">Follow-up</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* Elements Sidebar */}
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Elements</h4>
            <div className="space-y-2">
              <button
                onClick={() => addElement('text')}
                className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="text-sm font-medium">Text Block</span>
                </div>
              </button>

              <button
                onClick={() => addElement('image')}
                className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Image</span>
                </div>
              </button>

              <button
                onClick={() => addElement('button')}
                className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span className="text-sm font-medium">Button</span>
                </div>
              </button>

              <button
                onClick={() => addElement('video')}
                className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Video</span>
                </div>
              </button>

              <button
                onClick={() => addElement('divider')}
                className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                  <span className="text-sm font-medium">Divider</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-white border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Canvas Size:</span>
                <select 
                  value={canvasSize.width}
                  onChange={(e) => setCanvasSize({...canvasSize, width: parseInt(e.target.value)})}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="600">600px (Mobile)</option>
                  <option value="800">800px (Tablet)</option>
                  <option value="1000">1000px (Desktop)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visual Canvas */}
          <div className="flex-1 bg-gray-100 overflow-auto p-8">
            <div 
              className="bg-white shadow-lg mx-auto relative"
              style={{ 
                width: `${canvasSize.width}px`, 
                minHeight: `${canvasSize.height}px`,
                border: '1px solid #e5e7eb'
              }}
              onClick={() => setSelectedElement(null)}
            >
              {editorElements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-move ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: element.style.position.x,
                    top: element.style.position.y,
                    width: element.style.width,
                    height: element.style.height,
                    zIndex: selectedElement === element.id ? 10 : 1
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedElement(element.id)
                  }}
                  onMouseDown={(e) => {
                    const startX = e.clientX - element.style.position.x
                    const startY = e.clientY - element.style.position.y
                    
                    const handleMouseMove = (e: MouseEvent) => {
                      const newX = Math.max(0, Math.min(canvasSize.width - element.style.width, e.clientX - startX))
                      const newY = Math.max(0, Math.min(canvasSize.height - element.style.height, e.clientY - startY))
                      
                      updateElement(element.id, {
                        style: {
                          ...element.style,
                          position: { x: newX, y: newY }
                        }
                      })
                    }
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }
                    
                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }}
                >
                  {element.type === 'text' && (
                    <div
                      style={{
                        fontSize: element.style.fontSize,
                        fontWeight: element.style.fontWeight,
                        color: element.style.color,
                        backgroundColor: element.style.backgroundColor,
                        padding: element.style.padding,
                        borderRadius: element.style.borderRadius,
                        textAlign: element.style.textAlign,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      {element.content}
                    </div>
                  )}
                  
                  {element.type === 'image' && (
                    <img 
                      src={element.content} 
                      alt="Template Image"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: element.style.borderRadius
                      }}
                    />
                  )}
                  
                  {element.type === 'button' && (
                    <div
                      style={{
                        backgroundColor: element.style.backgroundColor,
                        color: element.style.color,
                        padding: element.style.padding,
                        borderRadius: element.style.borderRadius,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: element.style.fontSize || 14,
                        fontWeight: element.style.fontWeight || 'medium'
                      }}
                    >
                      {element.content}
                    </div>
                  )}
                  
                  {element.type === 'video' && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #d1d5db',
                        borderRadius: element.style.borderRadius
                      }}
                    >
                      <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-500">Video Placeholder</p>
                      </div>
                    </div>
                  )}
                  
                  {element.type === 'divider' && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: element.style.backgroundColor,
                        borderRadius: element.style.borderRadius
                      }}
                    />
                  )}
                  
                  {selectedElement === element.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteElement(element.id)
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              
              {editorElements.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-gray-500 text-lg">Start by adding elements from the sidebar</p>
                    <p className="text-gray-400 text-sm mt-2">Drag and drop elements to build your email template</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedElement && (
          <div className="w-64 bg-white border-l overflow-y-auto">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Element Properties</h4>
              {(() => {
                const element = editorElements.find(el => el.id === selectedElement)
                if (!element) return null
                
                return (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      {element.type === 'text' || element.type === 'button' ? (
                        <textarea
                          value={element.content}
                          onChange={(e) => updateElement(element.id, { content: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          rows={3}
                        />
                      ) : element.type === 'image' ? (
                        <div className="space-y-2">
                          <input
                            type="url"
                            value={element.content}
                            onChange={(e) => updateElement(element.id, { content: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Enter image URL"
                          />
                          <button
                            onClick={() => handleImageUpload(element.id)}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                          >
                            Upload Image
                          </button>
                        </div>
                      ) : element.type === 'video' ? (
                        <input
                          type="url"
                          value={element.content}
                          onChange={(e) => updateElement(element.id, { content: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Enter video URL"
                        />
                      ) : null}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                        <input
                          type="number"
                          value={element.style.width}
                          onChange={(e) => updateElement(element.id, {
                            style: { ...element.style, width: parseInt(e.target.value) }
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                        <input
                          type="number"
                          value={element.style.height}
                          onChange={(e) => updateElement(element.id, {
                            style: { ...element.style, height: parseInt(e.target.value) }
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                    
                    {(element.type === 'text' || element.type === 'button') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                          <input
                            type="number"
                            value={element.style.fontSize || 16}
                            onChange={(e) => updateElement(element.id, {
                              style: { ...element.style, fontSize: parseInt(e.target.value) }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                          <input
                            type="color"
                            value={element.style.color || '#000000'}
                            onChange={(e) => updateElement(element.id, {
                              style: { ...element.style, color: e.target.value }
                            })}
                            className="w-full h-8 border border-gray-300 rounded-md"
                          />
                        </div>
                        
                        {element.type === 'text' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Text Align</label>
                            <select
                              value={element.style.textAlign || 'left'}
                              onChange={(e) => updateElement(element.id, {
                                style: { ...element.style, textAlign: e.target.value as any }
                              })}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        )}
                      </>
                    )}
                    
                    {(element.type === 'button' || element.type === 'divider') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                        <input
                          type="color"
                          value={element.style.backgroundColor || '#3b82f6'}
                          onChange={(e) => updateElement(element.id, {
                            style: { ...element.style, backgroundColor: e.target.value }
                          })}
                          className="w-full h-8 border border-gray-300 rounded-md"
                        />
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">{templateForm.name || 'Untitled Template'}</h3>
                <p className="text-sm text-gray-600">Subject: {templateForm.subject || 'No Subject'}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="border rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium">
                  Email Preview (with sample personalization)
                </div>
                <div className="p-4">
                  <div 
                    className="max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: personalizeContent(generateHtmlFromElements())
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />
    </div>
  )
} 