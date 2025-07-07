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
  videoData?: {
    platform: 'youtube' | 'vimeo' | 'facebook' | 'custom'
    url: string
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
  const [showColorPicker, setShowColorPicker] = useState<{elementId: string, property: string} | null>(null)
  const [propertiesPanelWidth, setPropertiesPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('templateEditorPanelWidth')
      return saved ? parseInt(saved) : 320
    }
    return 320
  })
  const [isResizing, setIsResizing] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [gridSize, setGridSize] = useState(10)
  const [showAlignmentGuides, setShowAlignmentGuides] = useState<{type: string, position: number, label: string}[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showColorPicker && !target.closest('.color-picker-container')) {
        setShowColorPicker(null)
      }
    }

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorPicker])

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX
        const clampedWidth = Math.max(280, Math.min(600, newWidth))
        setPropertiesPanelWidth(clampedWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing])

  // Save panel width to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('templateEditorPanelWidth', propertiesPanelWidth.toString())
    }
  }, [propertiesPanelWidth])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleResizeDoubleClick = () => {
    setPropertiesPanelWidth(320)
  }

  // Quick alignment actions
  const centerHorizontally = (elementId: string) => {
    const element = editorElements.find(el => el.id === elementId)
    if (element) {
      const newX = (canvasSize.width - element.style.width) / 2
      updateElement(elementId, {
        style: { ...element.style, position: { x: newX, y: element.style.position.y } }
      })
    }
  }

  const centerVertically = (elementId: string) => {
    const element = editorElements.find(el => el.id === elementId)
    if (element) {
      const newY = (canvasSize.height - element.style.height) / 2
      updateElement(elementId, {
        style: { ...element.style, position: { x: element.style.position.x, y: newY } }
      })
    }
  }

  const centerBoth = (elementId: string) => {
    const element = editorElements.find(el => el.id === elementId)
    if (element) {
      const newX = (canvasSize.width - element.style.width) / 2
      const newY = (canvasSize.height - element.style.height) / 2
      updateElement(elementId, {
        style: { ...element.style, position: { x: newX, y: newY } }
      })
    }
  }

  // Video utility functions
  const extractVideoData = (url: string) => {
    // YouTube patterns
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const youtubeMatch = url.match(youtubeRegex)
    if (youtubeMatch) {
      return {
        platform: 'youtube' as const,
        url,
        videoId: youtubeMatch[1],
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`,
        title: 'YouTube Video'
      }
    }

    // Vimeo patterns
    const vimeoRegex = /vimeo\.com\/(\d+)/
    const vimeoMatch = url.match(vimeoRegex)
    if (vimeoMatch) {
      return {
        platform: 'vimeo' as const,
        url,
        videoId: vimeoMatch[1],
        thumbnailUrl: `https://vumbnail.com/${vimeoMatch[1]}.jpg`,
        title: 'Vimeo Video'
      }
    }

    // Facebook patterns
    const facebookRegex = /facebook\.com\/.*\/videos\/(\d+)/
    const facebookMatch = url.match(facebookRegex)
    if (facebookMatch) {
      return {
        platform: 'facebook' as const,
        url,
        videoId: facebookMatch[1],
        title: 'Facebook Video'
      }
    }

    // Default/custom
    return {
      platform: 'custom' as const,
      url,
      title: 'Custom Video'
    }
  }

  const updateVideoElement = (elementId: string, videoUrl: string, platform?: 'youtube' | 'vimeo' | 'facebook' | 'custom') => {
    const videoData = platform ? 
      { platform, url: videoUrl, title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video` } :
      extractVideoData(videoUrl)
    
    updateElement(elementId, {
      content: videoUrl,
      videoData
    })
  }

  // Snap and alignment functions
  const snapToGridValue = (value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / gridSize) * gridSize
  }

  const getAlignmentGuides = (draggedElement: EditorElement, newX: number, newY: number) => {
    const guides = []
    const threshold = 5 // pixels
    const otherElements = editorElements.filter(el => el.id !== draggedElement.id)
    
    // Canvas center lines
    const canvasCenterX = canvasSize.width / 2
    const canvasCenterY = canvasSize.height / 2
    const elementCenterX = newX + draggedElement.style.width / 2
    const elementCenterY = newY + draggedElement.style.height / 2
    
    // Snap to canvas center
    if (Math.abs(elementCenterX - canvasCenterX) < threshold) {
      guides.push({ type: 'vertical', position: canvasCenterX, label: 'Center' })
    }
    if (Math.abs(elementCenterY - canvasCenterY) < threshold) {
      guides.push({ type: 'horizontal', position: canvasCenterY, label: 'Center' })
    }
    
    // Snap to other elements
    otherElements.forEach(element => {
      const elLeft = element.style.position.x
      const elRight = element.style.position.x + element.style.width
      const elTop = element.style.position.y
      const elBottom = element.style.position.y + element.style.height
      const elCenterX = element.style.position.x + element.style.width / 2
      const elCenterY = element.style.position.y + element.style.height / 2
      
      // Vertical alignment guides
      if (Math.abs(newX - elLeft) < threshold) {
        guides.push({ type: 'vertical', position: elLeft, label: 'Align Left' })
      }
      if (Math.abs(newX + draggedElement.style.width - elRight) < threshold) {
        guides.push({ type: 'vertical', position: elRight, label: 'Align Right' })
      }
      if (Math.abs(elementCenterX - elCenterX) < threshold) {
        guides.push({ type: 'vertical', position: elCenterX, label: 'Align Center' })
      }
      
      // Horizontal alignment guides
      if (Math.abs(newY - elTop) < threshold) {
        guides.push({ type: 'horizontal', position: elTop, label: 'Align Top' })
      }
      if (Math.abs(newY + draggedElement.style.height - elBottom) < threshold) {
        guides.push({ type: 'horizontal', position: elBottom, label: 'Align Bottom' })
      }
      if (Math.abs(elementCenterY - elCenterY) < threshold) {
        guides.push({ type: 'horizontal', position: elCenterY, label: 'Align Middle' })
      }
    })
    
    return guides
  }

  const snapPosition = (draggedElement: EditorElement, newX: number, newY: number) => {
    let snappedX = snapToGridValue(newX)
    let snappedY = snapToGridValue(newY)
    
    const guides = getAlignmentGuides(draggedElement, snappedX, snappedY)
    const threshold = 5
    
    // Apply snapping based on guides
    guides.forEach(guide => {
      if (guide.type === 'vertical') {
        const elementCenterX = snappedX + draggedElement.style.width / 2
        if (Math.abs(elementCenterX - guide.position) < threshold) {
          snappedX = guide.position - draggedElement.style.width / 2
        } else if (Math.abs(snappedX - guide.position) < threshold) {
          snappedX = guide.position
        } else if (Math.abs(snappedX + draggedElement.style.width - guide.position) < threshold) {
          snappedX = guide.position - draggedElement.style.width
        }
      } else if (guide.type === 'horizontal') {
        const elementCenterY = snappedY + draggedElement.style.height / 2
        if (Math.abs(elementCenterY - guide.position) < threshold) {
          snappedY = guide.position - draggedElement.style.height / 2
        } else if (Math.abs(snappedY - guide.position) < threshold) {
          snappedY = guide.position
        } else if (Math.abs(snappedY + draggedElement.style.height - guide.position) < threshold) {
          snappedY = guide.position - draggedElement.style.height
        }
      }
    })
    
    // Keep within canvas bounds
    snappedX = Math.max(0, Math.min(canvasSize.width - draggedElement.style.width, snappedX))
    snappedY = Math.max(0, Math.min(canvasSize.height - draggedElement.style.height, snappedY))
    
    return { x: snappedX, y: snappedY, guides }
  }

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
        fontFamily: type === 'text' ? 'Arial, sans-serif' : undefined,
        fontStyle: type === 'text' ? 'normal' : undefined,
        textDecoration: type === 'text' ? 'none' : undefined,
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
      case 'video': return ''
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
        ${style.fontFamily ? `font-family: ${style.fontFamily};` : ''}
        ${style.fontStyle ? `font-style: ${style.fontStyle};` : ''}
        ${style.textDecoration ? `text-decoration: ${style.textDecoration};` : ''}
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
          // Videos in emails need fallback images since most clients don't support video
          const videoData = element.videoData
          const thumbnailUrl = videoData?.thumbnailUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1IDEwTDE5LjU1MyA3LjcyNEExIDEgMCAwIDEgMjEgOC42MThWMTUuMzgyQTEgMSAwIDAgMSAxOS41NTMgMTYuMjc2TDE1IDE0TTE1IDE0VjhBMiAyIDAgMCAwIDEzIDZINUEyIDIgMCAwIDAgMyA4VjE2QTIgMiAwIDAgMCA1IDE4SDEzQTIgMiAwIDAgMCAxNSAxNlYxNFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'
          
          html += `
            <a href="${content}" style="${commonStyles.replace('position: absolute;', 'position: absolute; display: block; text-decoration: none;')}">
              <img src="${thumbnailUrl}" alt="${videoData?.title || 'Video'}" style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: ${style.borderRadius || 0}px;
                display: block;
              ">
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
              ${videoData?.platform ? `
                <div style="
                  position: absolute;
                  bottom: 8px;
                  left: 8px;
                  right: 8px;
                  background-color: rgba(0, 0, 0, 0.8);
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  text-align: center;
                ">
                  ${videoData.platform.toUpperCase()} • ${videoData.title}
                </div>
              ` : ''}
            </a>
          `
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

  // Predefined color palettes
  const colorPalettes = {
    common: [
      '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
      '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080'
    ],
    business: [
      '#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#eff6ff',
      '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5', '#f0fdf4'
    ],
    warm: [
      '#7c2d12', '#dc2626', '#ea580c', '#f59e0b', '#eab308', '#facc15', '#fde047', '#fef3c7',
      '#be123c', '#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecaca', '#fee2e2', '#fef7f7'
    ],
    cool: [
      '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9',
      '#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'
    ]
  }

  const ColorPicker = ({ elementId, property, currentColor, onClose }: {
    elementId: string
    property: string
    currentColor: string
    onClose: () => void
  }) => {
    const [hexInput, setHexInput] = useState(currentColor || '#000000')
    const [selectedPalette, setSelectedPalette] = useState<keyof typeof colorPalettes>(() => {
      // Maintain palette selection from localStorage
      const saved = localStorage.getItem('selectedColorPalette')
      return (saved as keyof typeof colorPalettes) || 'common'
    })

    const applyColor = (color: string) => {
      const element = editorElements.find(el => el.id === elementId)
      if (element) {
        updateElement(elementId, {
          style: { 
            ...element.style,
            [property]: color 
          }
        })
        setHexInput(color)
      }
    }

    const handleHexSubmit = () => {
      let color = hexInput.trim()
      if (!color.startsWith('#')) {
        color = '#' + color
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        applyColor(color)
      }
    }

    return (
      <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 color-picker-container">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-900">Color Picker</h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Hex Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hex Color</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              placeholder="#000000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={handleHexSubmit}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Palette Selector */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Color Palettes</label>
          <div className="flex gap-1 mb-3">
            {Object.keys(colorPalettes).map((palette) => (
              <button
                key={palette}
                onClick={() => {
                  const newPalette = palette as keyof typeof colorPalettes
                  setSelectedPalette(newPalette)
                  localStorage.setItem('selectedColorPalette', newPalette)
                }}
                className={`px-3 py-1 text-sm rounded ${
                  selectedPalette === palette
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {palette.charAt(0).toUpperCase() + palette.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Color Swatches */}
        <div className="grid grid-cols-8 gap-1 mb-4">
          {colorPalettes[selectedPalette].map((color) => (
            <button
              key={color}
              onClick={() => applyColor(color)}
              className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Current Color Display */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Current:</span>
          <div
            className="w-8 h-8 rounded border border-gray-300"
            style={{ backgroundColor: currentColor }}
          />
          <span className="text-sm text-gray-500">{currentColor}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isResizing ? 'select-none' : ''}`}>
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
        <div className="w-64 bg-white border-r overflow-y-auto flex-shrink-0">
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
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 bg-white border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Canvas Size:</span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Width:</span>
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
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Height:</span>
                    <select 
                      value={canvasSize.height}
                      onChange={(e) => setCanvasSize({...canvasSize, height: parseInt(e.target.value)})}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="600">600px (Short)</option>
                      <option value="800">800px (Medium)</option>
                      <option value="1000">1000px (Long)</option>
                      <option value="1200">1200px (Very Long)</option>
                      <option value="1500">1500px (Extra Long)</option>
                      <option value="2000">2000px (Newsletter)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1 text-sm">
                    <input
                      type="checkbox"
                      checked={snapToGrid}
                      onChange={(e) => setSnapToGrid(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Snap to Grid</span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1 text-sm">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Show Grid</span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Grid:</span>
                  <select 
                    value={gridSize}
                    onChange={(e) => setGridSize(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="5">5px</option>
                    <option value="10">10px</option>
                    <option value="20">20px</option>
                    <option value="25">25px</option>
                  </select>
                </div>
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
                border: '1px solid #e5e7eb',
                backgroundImage: showGrid ? 
                  `radial-gradient(circle, #e5e7eb 1px, transparent 1px)` : 'none',
                backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : 'auto'
              }}
              onClick={() => setSelectedElement(null)}
            >
              {/* Grid overlay */}
              {showGrid && (
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: `${gridSize}px ${gridSize}px`
                  }}
                />
              )}
              
              {/* Alignment guides */}
              {showAlignmentGuides.map((guide, index) => (
                <div
                  key={index}
                  className="absolute pointer-events-none z-50"
                  style={{
                    ...(guide.type === 'vertical' ? {
                      left: guide.position,
                      top: 0,
                      width: '1px',
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)'
                    } : {
                      left: 0,
                      top: guide.position,
                      width: '100%',
                      height: '1px',
                      backgroundColor: '#3b82f6',
                      boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)'
                    })
                  }}
                >
                  <div 
                    className="absolute bg-blue-600 text-white px-2 py-1 text-xs rounded"
                    style={{
                      ...(guide.type === 'vertical' ? {
                        left: '4px',
                        top: '10px'
                      } : {
                        left: '10px',
                        top: '-24px'
                      })
                    }}
                  >
                    {guide.label}
                  </div>
                </div>
              ))}
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
                    setIsDragging(true)
                    
                    const handleMouseMove = (e: MouseEvent) => {
                      const rawX = e.clientX - startX
                      const rawY = e.clientY - startY
                      
                      const { x: newX, y: newY, guides } = snapPosition(element, rawX, rawY)
                      
                      setShowAlignmentGuides(guides)
                      
                      updateElement(element.id, {
                        style: {
                          ...element.style,
                          position: { x: newX, y: newY }
                        }
                      })
                    }
                    
                    const handleMouseUp = () => {
                      setIsDragging(false)
                      setShowAlignmentGuides([])
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
                        fontFamily: element.style.fontFamily,
                        fontStyle: element.style.fontStyle,
                        textDecoration: element.style.textDecoration,
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
                        fontWeight: element.style.fontWeight || 'medium',
                        fontFamily: element.style.fontFamily,
                        fontStyle: element.style.fontStyle,
                        textDecoration: element.style.textDecoration
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
                        border: element.videoData?.thumbnailUrl ? 'none' : '2px dashed #d1d5db',
                        borderRadius: element.style.borderRadius,
                        overflow: 'hidden'
                      }}
                    >
                      {element.videoData?.thumbnailUrl ? (
                        <div className="relative w-full h-full">
                          <img
                            src={element.videoData.thumbnailUrl}
                            alt={element.videoData.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: element.style.borderRadius
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-opacity">
                            <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                              {element.videoData.platform?.toUpperCase()} • {element.videoData.title}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-500">Add Video URL</p>
                          <p className="text-xs text-gray-400">YouTube, Vimeo, Facebook</p>
                        </div>
                      )}
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

        {/* Resize Handle */}
        {selectedElement && (
          <div 
            className={`w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0 relative transition-colors ${
              isResizing ? 'bg-blue-500' : ''
            }`}
            onMouseDown={handleResizeStart}
            onDoubleClick={handleResizeDoubleClick}
            title="Drag to resize, double-click to reset"
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 opacity-0 hover:opacity-100 transition-opacity" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-300 rounded-full shadow-sm opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </div>
        )}

        {/* Properties Panel */}
        {selectedElement && (
          <div 
            className="bg-white border-l flex-shrink-0 overflow-hidden"
            style={{ width: propertiesPanelWidth }}
          >
            <div className="h-full overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 z-10">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Element Properties</h4>
                  <span className="text-xs text-gray-500">{propertiesPanelWidth}px</span>
                </div>
              </div>
              <div className="p-4">
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
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Video Platform</label>
                            <select
                              value={element.videoData?.platform || 'custom'}
                              onChange={(e) => {
                                const platform = e.target.value as 'youtube' | 'vimeo' | 'facebook' | 'custom'
                                updateVideoElement(element.id, element.content, platform)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="custom">Custom URL</option>
                              <option value="youtube">YouTube</option>
                              <option value="vimeo">Vimeo</option>
                              <option value="facebook">Facebook</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                            <input
                              type="url"
                              value={element.content}
                              onChange={(e) => updateVideoElement(element.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder={
                                element.videoData?.platform === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                                element.videoData?.platform === 'vimeo' ? 'https://vimeo.com/...' :
                                element.videoData?.platform === 'facebook' ? 'https://www.facebook.com/.../videos/...' :
                                'Enter video URL'
                              }
                            />
                          </div>
                          
                          {element.videoData?.platform && element.videoData.platform !== 'custom' && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              <strong>Tips for {element.videoData.platform.charAt(0).toUpperCase() + element.videoData.platform.slice(1)}:</strong>
                              <br />
                              {element.videoData.platform === 'youtube' && 'Use full YouTube URL (watch?v= or youtu.be/)'}
                              {element.videoData.platform === 'vimeo' && 'Use standard Vimeo URL (vimeo.com/video-id)'}
                              {element.videoData.platform === 'facebook' && 'Use Facebook video URL from the video page'}
                            </div>
                          )}
                          
                          {element.videoData?.thumbnailUrl && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Video Preview</label>
                              <div className="border border-gray-300 rounded-md p-2 bg-gray-50">
                                <img
                                  src={element.videoData.thumbnailUrl}
                                  alt="Video thumbnail"
                                  className="w-full h-20 object-cover rounded"
                                />
                                <p className="text-xs text-gray-600 mt-1">
                                  {element.videoData.platform?.toUpperCase()} • {element.videoData.title}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
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

                    {/* Quick Alignment Controls */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quick Alignment</label>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => centerHorizontally(element.id)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                          title="Center Horizontally"
                        >
                          ↔️ H
                        </button>
                        <button
                          onClick={() => centerVertically(element.id)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                          title="Center Vertically"
                        >
                          ↕️ V
                        </button>
                        <button
                          onClick={() => centerBoth(element.id)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                          title="Center Both"
                        >
                          ⊕ Both
                        </button>
                      </div>
                    </div>
                    
                    {(element.type === 'text' || element.type === 'button') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                          <select
                            value={element.style.fontFamily || 'Arial, sans-serif'}
                            onChange={(e) => updateElement(element.id, {
                              style: { ...element.style, fontFamily: e.target.value }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="Arial, sans-serif">Arial</option>
                            <option value="Helvetica, sans-serif">Helvetica</option>
                            <option value="Georgia, serif">Georgia</option>
                            <option value="'Times New Roman', serif">Times New Roman</option>
                            <option value="'Courier New', monospace">Courier New</option>
                            <option value="Verdana, sans-serif">Verdana</option>
                            <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                            <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                            <option value="Impact, sans-serif">Impact</option>
                            <option value="'Lucida Sans', sans-serif">Lucida Sans</option>
                          </select>
                        </div>

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

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Font Weight</label>
                            <select
                              value={element.style.fontWeight || 'normal'}
                              onChange={(e) => updateElement(element.id, {
                                style: { ...element.style, fontWeight: e.target.value }
                              })}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                              <option value="lighter">Lighter</option>
                              <option value="bolder">Bolder</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Font Style</label>
                            <select
                              value={element.style.fontStyle || 'normal'}
                              onChange={(e) => updateElement(element.id, {
                                style: { ...element.style, fontStyle: e.target.value as 'normal' | 'italic' }
                              })}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="normal">Normal</option>
                              <option value="italic">Italic</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Text Decoration</label>
                          <select
                            value={element.style.textDecoration || 'none'}
                            onChange={(e) => updateElement(element.id, {
                              style: { ...element.style, textDecoration: e.target.value as 'none' | 'underline' | 'line-through' }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="none">None</option>
                            <option value="underline">Underline</option>
                            <option value="line-through">Strike-through</option>
                          </select>
                        </div>
                        
                        <div className="relative color-picker-container">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                          <button
                            onClick={() => setShowColorPicker({elementId: element.id, property: 'color'})}
                            className="w-full h-8 border border-gray-300 rounded-md flex items-center justify-between px-3 hover:bg-gray-50 color-picker-container"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: element.style.color || '#000000' }}
                              />
                              <span className="text-sm">{element.style.color || '#000000'}</span>
                            </div>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showColorPicker?.elementId === element.id && showColorPicker?.property === 'color' && (
                            <div className="absolute top-full left-0 mt-1 z-50">
                              <ColorPicker
                                elementId={element.id}
                                property="color"
                                currentColor={element.style.color || '#000000'}
                                onClose={() => setShowColorPicker(null)}
                              />
                            </div>
                          )}
                        </div>

                        {element.type === 'text' && (
                          <>
                            <div className="relative color-picker-container">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                              <button
                                onClick={() => setShowColorPicker({elementId: element.id, property: 'backgroundColor'})}
                                className="w-full h-8 border border-gray-300 rounded-md flex items-center justify-between px-3 hover:bg-gray-50 color-picker-container"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300"
                                    style={{ backgroundColor: element.style.backgroundColor || '#f9fafb' }}
                                  />
                                  <span className="text-sm">{element.style.backgroundColor || '#f9fafb'}</span>
                                </div>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {showColorPicker?.elementId === element.id && showColorPicker?.property === 'backgroundColor' && (
                                <div className="absolute top-full left-0 mt-1 z-50">
                                  <ColorPicker
                                    elementId={element.id}
                                    property="backgroundColor"
                                    currentColor={element.style.backgroundColor || '#f9fafb'}
                                    onClose={() => setShowColorPicker(null)}
                                  />
                                </div>
                              )}
                            </div>
                            
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
                          </>
                        )}
                      </>
                    )}
                    
                    {(element.type === 'button' || element.type === 'divider') && (
                      <div className="relative color-picker-container">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                        <button
                          onClick={() => setShowColorPicker({elementId: element.id, property: 'backgroundColor'})}
                          className="w-full h-8 border border-gray-300 rounded-md flex items-center justify-between px-3 hover:bg-gray-50 color-picker-container"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: element.style.backgroundColor || '#3b82f6' }}
                            />
                            <span className="text-sm">{element.style.backgroundColor || '#3b82f6'}</span>
                          </div>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showColorPicker?.elementId === element.id && showColorPicker?.property === 'backgroundColor' && (
                          <div className="absolute top-full left-0 mt-1 z-50">
                            <ColorPicker
                              elementId={element.id}
                              property="backgroundColor"
                              currentColor={element.style.backgroundColor || '#3b82f6'}
                              onClose={() => setShowColorPicker(null)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
              </div>
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