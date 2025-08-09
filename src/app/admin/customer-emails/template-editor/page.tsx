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
  elements: EditorElement[] // Add elements storage
  canvasSettings: {
    width: number
    height: number
    backgroundColor: string
  }
  createdAt: string
}

interface EditorElement {
  id: string
  type: 'text' | 'image' | 'video' | 'button' | 'divider' | 'heading'
  content: string
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  videoData?: {
    platform: 'youtube' | 'vimeo' | 'facebook' | 'custom'
    url: string
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
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 800 })
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#ffffff')
  const [zoom, setZoom] = useState<number>(100)

  const [previewMode, setPreviewMode] = useState(false)
  const [selectedEmailClient, setSelectedEmailClient] = useState<'gmail' | 'outlook' | 'apple' | 'generic'>('gmail')
  const [showGmailConstraints, setShowGmailConstraints] = useState(true)
  const [gmailSafeMode, setGmailSafeMode] = useState(true)
  const [designWarnings, setDesignWarnings] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false)
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
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [isResizingElement, setIsResizingElement] = useState<{elementId: string, handle: string} | null>(null)
  
  // Add state for in-line text editing
  const [editingTextElement, setEditingTextElement] = useState<string | null>(null)
  const [tempTextContent, setTempTextContent] = useState<string>('')

  // Gmail design validation - Only show warnings when Gmail Safe Mode is enabled
  const validateGmailDesign = () => {
    if (!gmailSafeMode) {
      setDesignWarnings([])
      return
    }
    
    const warnings: string[] = []
    
    // Only check for side-by-side elements when Gmail Safe Mode is enabled
    const elementsByRow: { [key: number]: EditorElement[] } = {}
    editorElements.forEach(element => {
      const y = Math.round(element.style.position.y / 50) * 50 // Group by 50px rows
      if (!elementsByRow[y]) elementsByRow[y] = []
      elementsByRow[y].push(element)
    })
    
    Object.entries(elementsByRow).forEach(([y, elements]) => {
      if (elements.length > 1) {
        warnings.push(`${elements.length} elements side-by-side will stack vertically in Gmail`)
      }
    })
    
    setDesignWarnings(warnings)
  }

  // Run validation when elements or canvas change
  useEffect(() => {
    if (gmailSafeMode) {
      validateGmailDesign()
    }
  }, [editorElements, canvasSize, gmailSafeMode])
  
  // Use refs for drag state to avoid timing issues with state updates
  const dragStateRef = useRef({
    isDragging: false,
    dragStarted: false,
    elementId: null as string | null
  })
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastElementInteractionRef = useRef<number>(0)
  
  // Ref for the text editing textarea
  const textEditRef = useRef<HTMLTextAreaElement>(null)

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

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (editingTextElement && textEditRef.current) {
      // Immediate focus for better user experience
      textEditRef.current.focus()
      textEditRef.current.setSelectionRange(textEditRef.current.value.length, textEditRef.current.value.length)
    }
  }, [editingTextElement])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleResizeDoubleClick = () => {
    setPropertiesPanelWidth(320)
  }

  // Text editing functions
  const startEditingText = (elementId: string) => {
    const element = editorElements.find(el => el.id === elementId)
    if (element && (element.type === 'text' || element.type === 'heading' || element.type === 'button')) {
      setEditingTextElement(elementId)
      setTempTextContent(element.content)
      // Focus the textarea immediately and select all text for instant typing
      setTimeout(() => {
        if (textEditRef.current) {
          textEditRef.current.focus()
          textEditRef.current.select()
          // Ensure cursor is at the end for immediate typing without selection
          textEditRef.current.setSelectionRange(textEditRef.current.value.length, textEditRef.current.value.length)
        }
      }, 5) // Reduced delay for more immediate response
    }
  }

  const finishEditingText = () => {
    if (editingTextElement) {
      // Only update content - all style properties including textAlign should already be persisted
      updateElement(editingTextElement, { content: tempTextContent })
      setEditingTextElement(null)
      setTempTextContent('')
    }
  }

  const cancelEditingText = () => {
    setEditingTextElement(null)
    setTempTextContent('')
  }

  const handleTextEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      finishEditingText()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditingText()
    }
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
        title: ''
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
        title: ''
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
        title: ''
      }
    }

    // Default/custom
    return {
      platform: 'custom' as const,
      url,
      title: ''
    }
  }

  const updateVideoElement = (elementId: string, videoUrl: string, platform?: 'youtube' | 'vimeo' | 'facebook' | 'custom') => {
    const videoData = platform ? 
      { platform, url: videoUrl, title: '' } :
      extractVideoData(videoUrl)
    
    updateElement(elementId, {
      content: videoUrl,
      videoData
    })
  }

  // Context-aware positioning function to position new elements
  const getNextElementPosition = (elementType: 'text' | 'image' | 'video' | 'button' | 'divider' | 'heading') => {
    const defaultWidth = elementType === 'divider' ? 500 : elementType === 'button' ? 200 : 300
    
    if (editorElements.length === 0) {
      // First element - center horizontally, start at top with margin
      return {
        x: (canvasSize.width - defaultWidth) / 2,
        y: 30
      }
    }

    // If an element is selected, position below it
    if (selectedElement) {
      const selectedEl = editorElements.find(el => el.id === selectedElement)
      if (selectedEl) {
        return {
          x: (canvasSize.width - defaultWidth) / 2,
          y: selectedEl.style.position.y + selectedEl.style.height + 20
        }
      }
    }

    // Fallback: Find the lowest element (highest y + height value)
    let lowestY = 0
    editorElements.forEach(element => {
      const elementBottom = element.style.position.y + element.style.height
      if (elementBottom > lowestY) {
        lowestY = elementBottom
      }
    })

    // Position new element 20px below the lowest element, centered horizontally
    return {
      x: (canvasSize.width - defaultWidth) / 2,
      y: lowestY + 20
    }
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
    
    // Keep within canvas bounds with edge snapping
    const edgeThreshold = 5 // pixels from edge to trigger snapping
    
    // Snap to left edge
    if (snappedX <= edgeThreshold) {
      snappedX = 0
      guides.push({ type: 'vertical', position: 0, label: 'Left Edge' })
    }
    // Snap to right edge  
    else if (snappedX + draggedElement.style.width >= canvasSize.width - edgeThreshold) {
      snappedX = canvasSize.width - draggedElement.style.width
      guides.push({ type: 'vertical', position: canvasSize.width, label: 'Right Edge' })
    }
    
    // Snap to top edge
    if (snappedY <= edgeThreshold) {
      snappedY = 0
      guides.push({ type: 'horizontal', position: 0, label: 'Top Edge' })
    }
    // Snap to bottom edge
    else if (snappedY + draggedElement.style.height >= canvasSize.height - edgeThreshold) {
      snappedY = canvasSize.height - draggedElement.style.height
      guides.push({ type: 'horizontal', position: canvasSize.height, label: 'Bottom Edge' })
    }
    
    // Ensure elements stay within bounds
    snappedX = Math.max(0, Math.min(canvasSize.width - draggedElement.style.width, snappedX))
    snappedY = Math.max(0, Math.min(canvasSize.height - draggedElement.style.height, snappedY))
    
    return { x: snappedX, y: snappedY, guides }
  }

  // Create smooth resize handler
  const createResizeHandler = (elementId: string, handle: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    setIsResizingElement({ elementId, handle })
    
    let animationFrameId: number
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      
      animationFrameId = requestAnimationFrame(() => {
        const deltaX = e.clientX - startX
        const deltaY = e.clientY - startY
        handleElementResize(elementId, handle, deltaX, deltaY, e.shiftKey)
      })
    }
    
    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      setIsResizingElement(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Handle element resizing
  const handleElementResize = (elementId: string, handle: string, deltaX: number, deltaY: number, shiftKey: boolean = false) => {
    const element = editorElements.find(el => el.id === elementId)
    if (!element) return

    let newWidth = element.style.width
    let newHeight = element.style.height
    let newX = element.style.position.x
    let newY = element.style.position.y

    // Calculate aspect ratio for proportional resizing
    const aspectRatio = element.style.width / element.style.height

    // Calculate new dimensions based on handle
    switch (handle) {
      case 'nw': // Northwest corner - resize from northwest corner
        if (shiftKey) {
          // Shift key allows free resizing (distortion allowed)
          newWidth = Math.max(50, element.style.width - deltaX)
          newHeight = Math.max(50, element.style.height - deltaY)
          newX = element.style.position.x + deltaX
          newY = element.style.position.y + deltaY
        } else {
          // Default: Proportional resize from northwest corner
          // Use the delta that gives the larger change to determine scale
          const scaleFactorX = Math.abs(deltaX) / element.style.width
          const scaleFactorY = Math.abs(deltaY) / element.style.height
          const scaleFactor = Math.max(scaleFactorX, scaleFactorY)
          
          // Determine if we're making it bigger or smaller
          const isGrowing = (deltaX < 0 && deltaY < 0)
          const scaleDirection = isGrowing ? 1 + scaleFactor : 1 - scaleFactor
          
          newWidth = Math.max(50, element.style.width * scaleDirection)
          newHeight = Math.max(50, newWidth / aspectRatio)
          
          // Position stays anchored to the southeast corner (opposite of northwest)
          const seX = element.style.position.x + element.style.width
          const seY = element.style.position.y + element.style.height
          newX = seX - newWidth
          newY = seY - newHeight
        }
        break
      case 'ne': // Northeast corner - resize from northeast corner
        if (shiftKey) {
          // Shift key allows free resizing (distortion allowed)
          newWidth = Math.max(50, element.style.width + deltaX)
          newHeight = Math.max(50, element.style.height - deltaY)
          newY = element.style.position.y + deltaY
        } else {
          // Default: Proportional resize from northeast corner
          const scaleFactorX = Math.abs(deltaX) / element.style.width
          const scaleFactorY = Math.abs(deltaY) / element.style.height
          const scaleFactor = Math.max(scaleFactorX, scaleFactorY)
          
          const isGrowing = (deltaX > 0 && deltaY < 0)
          const scaleDirection = isGrowing ? 1 + scaleFactor : 1 - scaleFactor
          
          newWidth = Math.max(50, element.style.width * scaleDirection)
          newHeight = Math.max(50, newWidth / aspectRatio)
          
          // Position stays anchored to the southwest corner (opposite of northeast)
          const swY = element.style.position.y + element.style.height
          newY = swY - newHeight
        }
        break
      case 'sw': // Southwest corner - resize from southwest corner
        if (shiftKey) {
          // Shift key allows free resizing (distortion allowed)
          newWidth = Math.max(50, element.style.width - deltaX)
          newHeight = Math.max(50, element.style.height + deltaY)
          newX = element.style.position.x + deltaX
        } else {
          // Default: Proportional resize from southwest corner
          const scaleFactorX = Math.abs(deltaX) / element.style.width
          const scaleFactorY = Math.abs(deltaY) / element.style.height
          const scaleFactor = Math.max(scaleFactorX, scaleFactorY)
          
          const isGrowing = (deltaX < 0 && deltaY > 0)
          const scaleDirection = isGrowing ? 1 + scaleFactor : 1 - scaleFactor
          
          newWidth = Math.max(50, element.style.width * scaleDirection)
          newHeight = Math.max(50, newWidth / aspectRatio)
          
          // Position stays anchored to the northeast corner (opposite of southwest)
          const neX = element.style.position.x + element.style.width
          newX = neX - newWidth
        }
        break
      case 'se': // Southeast corner - resize from southeast corner
        if (shiftKey) {
          // Shift key allows free resizing (distortion allowed)
          newWidth = Math.max(50, element.style.width + deltaX)
          newHeight = Math.max(50, element.style.height + deltaY)
        } else {
          // Default: Proportional resize from southeast corner
          const scaleFactorX = Math.abs(deltaX) / element.style.width
          const scaleFactorY = Math.abs(deltaY) / element.style.height
          const scaleFactor = Math.max(scaleFactorX, scaleFactorY)
          
          const isGrowing = (deltaX > 0 && deltaY > 0)
          const scaleDirection = isGrowing ? 1 + scaleFactor : 1 - scaleFactor
          
          newWidth = Math.max(50, element.style.width * scaleDirection)
          newHeight = Math.max(50, newWidth / aspectRatio)
          
          // Position stays anchored to the northwest corner (position doesn't change)
          // newX and newY remain the same
        }
        break
      case 'n': // North edge
        if (shiftKey) {
          // Shift+drag maintains aspect ratio
          newHeight = Math.max(50, element.style.height - deltaY)
          newWidth = Math.max(50, newHeight * aspectRatio)
          newX = element.style.position.x - (newWidth - element.style.width) / 2
        } else {
          // Normal drag allows distortion
          newHeight = Math.max(50, element.style.height - deltaY)
        }
        newY = element.style.position.y + deltaY
        break
      case 's': // South edge
        if (shiftKey) {
          // Shift+drag maintains aspect ratio
          newHeight = Math.max(50, element.style.height + deltaY)
          newWidth = Math.max(50, newHeight * aspectRatio)
          newX = element.style.position.x - (newWidth - element.style.width) / 2
        } else {
          // Normal drag allows distortion
          newHeight = Math.max(50, element.style.height + deltaY)
        }
        break
      case 'w': // West edge
        if (shiftKey) {
          // Shift+drag maintains aspect ratio
          newWidth = Math.max(50, element.style.width - deltaX)
          newHeight = Math.max(50, newWidth / aspectRatio)
          newY = element.style.position.y - (newHeight - element.style.height) / 2
        } else {
          // Normal drag allows distortion
          newWidth = Math.max(50, element.style.width - deltaX)
        }
        newX = element.style.position.x + deltaX
        break
      case 'e': // East edge
        if (shiftKey) {
          // Shift+drag maintains aspect ratio
          newWidth = Math.max(50, element.style.width + deltaX)
          newHeight = Math.max(50, newWidth / aspectRatio)
          newY = element.style.position.y - (newHeight - element.style.height) / 2
        } else {
          // Normal drag allows distortion
          newWidth = Math.max(50, element.style.width + deltaX)
        }
        break
    }

    // Apply snapping to grid
    newWidth = snapToGridValue(newWidth)
    newHeight = snapToGridValue(newHeight)
    newX = snapToGridValue(newX)
    newY = snapToGridValue(newY)

    // Keep within canvas bounds
    newX = Math.max(0, Math.min(canvasSize.width - newWidth, newX))
    newY = Math.max(0, Math.min(canvasSize.height - newHeight, newY))
    newWidth = Math.min(newWidth, canvasSize.width - newX)
    newHeight = Math.min(newHeight, canvasSize.height - newY)

    updateElement(elementId, {
      style: {
        ...element.style,
        width: newWidth,
        height: newHeight,
        position: { x: newX, y: newY }
      }
    })
  }

  // Load existing template if editing
  useEffect(() => {
    if (isEditing && templateId) {
      // Load template from database first, fallback to localStorage
      const loadTemplate = async () => {
        try {
          // Try database first
          const response = await fetch('/api/admin/templates')
          if (response.ok) {
            const dbTemplates = await response.json()
            const template = dbTemplates.find((t: EmailTemplate) => t.id === templateId)
            
            if (template) {
              setTemplateForm({
                name: template.name,
                subject: template.subject,
                type: template.type
              })
              
              // Load elements directly if available, otherwise fallback to HTML parsing
              if (template.elements && Array.isArray(template.elements)) {
                setEditorElements(template.elements)
                
                // Load canvas settings if available
                if (template.canvasSettings) {
                  setCanvasSize({
                    width: template.canvasSettings.width,
                    height: template.canvasSettings.height
                  })
                  setCanvasBackgroundColor(template.canvasSettings.backgroundColor)
                }
              } else {
                // Fallback to HTML parsing for older templates
                loadElementsFromHtml(template.htmlContent)
              }
              return
            }
          }
        } catch (error) {
          console.error('Error loading template from database:', error)
        }
        
        // Fallback to localStorage if database fails
        const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]')
        const template = savedTemplates.find((t: EmailTemplate) => t.id === templateId)
        
        if (template) {
          setTemplateForm({
            name: template.name,
            subject: template.subject,
            type: template.type
          })
          
          // Load elements directly if available, otherwise fallback to HTML parsing
          if (template.elements && Array.isArray(template.elements)) {
            setEditorElements(template.elements)
            
            // Load canvas settings if available
            if (template.canvasSettings) {
              setCanvasSize({
                width: template.canvasSettings.width,
                height: template.canvasSettings.height
              })
              setCanvasBackgroundColor(template.canvasSettings.backgroundColor)
            }
          } else {
            // Fallback to HTML parsing for older templates
            loadElementsFromHtml(template.htmlContent)
          }
        }
      }
      
      loadTemplate()
    }
  }, [isEditing, templateId])

  // Visual editor functions
  const addElement = (type: 'text' | 'image' | 'video' | 'button' | 'divider' | 'heading') => {
    const position = getNextElementPosition(type)
    
    const newElement: EditorElement = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      headingLevel: type === 'heading' ? 1 : undefined,
      buttonData: type === 'button' ? { url: '#', openInNewTab: true } : undefined,
      style: {
        position: position,
        width: type === 'divider' ? 500 : type === 'button' ? 200 : 300,
        height: type === 'text' ? 120 : type === 'heading' ? 80 : type === 'divider' ? 2 : type === 'button' ? 40 : 200,
        fontSize: type === 'text' ? 16 : type === 'heading' ? 32 : undefined,
        fontWeight: type === 'text' ? 'normal' : type === 'heading' ? 'bold' : undefined,
        fontFamily: type === 'text' || type === 'heading' ? 'Arial, sans-serif' : undefined,
        fontStyle: type === 'text' || type === 'heading' ? 'normal' : undefined,
        textDecoration: type === 'text' || type === 'heading' ? 'none' : undefined,
        color: type === 'text' || type === 'heading' ? '#000000' : type === 'button' ? '#ffffff' : undefined,
        backgroundColor: type === 'button' ? '#3b82f6' : type === 'divider' ? '#e5e7eb' : type === 'text' ? '#f9fafb' : undefined,
        padding: type === 'text' || type === 'button' || type === 'heading' ? 10 : undefined,
        borderRadius: type === 'button' ? 6 : undefined,
        textAlign: type === 'text' ? 'left' as const : type === 'heading' ? 'center' as const : undefined
      }
    }
    setEditorElements([...editorElements, newElement])
    // Automatically select the new element to show properties panel
    setSelectedElement(newElement.id)
    
    // For text, heading and button elements, automatically enter edit mode for immediate typing
    if (type === 'text' || type === 'heading' || type === 'button') {
      // Use setTimeout to ensure element is rendered before starting edit mode
      setTimeout(() => {
        startEditingText(newElement.id)
      }, 10)
    }
  }

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text': return ''
      case 'heading': return ''
      case 'image': return 'https://via.placeholder.com/300x200'
      case 'video': return ''
      case 'button': return 'Click Here'
      case 'divider': return ''
      default: return ''
    }
  }

  const updateElement = (id: string, updates: Partial<EditorElement>) => {
    setEditorElements(prevElements => prevElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
    
    // If we're currently editing this element's text content, update the temp content too
    if (editingTextElement === id && updates.content !== undefined) {
      setTempTextContent(updates.content)
    }
  }

  const deleteElement = (id: string) => {
    setEditorElements(editorElements.filter(el => el.id !== id))
    setSelectedElement(null)
  }

  const handleImageUpload = async (elementId?: string, uploadType?: 'image' | 'thumbnail') => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          try {
            // Upload to Cloudinary instead of creating data URLs
            const formData = new FormData()
            formData.append('image', file)
            
            const response = await fetch('/api/upload/image', {
              method: 'POST',
              body: formData
            })
            
            if (!response.ok) {
              throw new Error('Upload failed')
            }
            
            const result = await response.json()
            const imageUrl = result.url // This is now a Cloudinary HTTPS URL!
            
            if (uploadType === 'thumbnail' && elementId) {
              // Update video thumbnail
              const element = editorElements.find(el => el.id === elementId)
              updateElement(elementId, {
                videoData: {
                  platform: element?.videoData?.platform || 'custom',
                  url: element?.videoData?.url || '',
                  ...element?.videoData,
                  customThumbnail: imageUrl
                }
              })
            } else {
              // Use Cloudinary dimensions or calculate from aspect ratio
              let width = result.width || 300
              let height = result.height || 200
              
              // Scale down if too large for editor
              const maxWidth = 400
              const maxHeight = 400
              
              if (width > maxWidth || height > maxHeight) {
                const scaleX = maxWidth / width
                const scaleY = maxHeight / height
                const scale = Math.min(scaleX, scaleY)
                width = Math.round(width * scale)
                height = Math.round(height * scale)
              }
              
              if (elementId) {
                // Update existing element
                updateElement(elementId, { content: imageUrl })
              } else {
                // Create new element with proper dimensions and FIXED centering
                const position = getNextElementPosition('image')
                const newElement: EditorElement = {
                  id: Date.now().toString(),
                  type: 'image',
                  content: imageUrl,
                  style: {
                    position: {
                      x: Math.round((canvasSize.width - width) / 2), // PROPERLY CENTERED
                      y: position.y
                    },
                    width: width,
                    height: height
                  }
                }
                setEditorElements([...editorElements, newElement])
                // Automatically select the new image to show properties panel
                setSelectedElement(newElement.id)
              }
            }
                      } catch (error) {
              console.error('Cloudinary upload failed, using fallback:', error)
              // FALLBACK: Use data URL if Cloudinary fails
              const reader = new FileReader()
              reader.onload = (e) => {
                const imageUrl = e.target?.result as string
                console.log('📁 Using data URL fallback (temporary)')
                
                if (uploadType === 'thumbnail' && elementId) {
                  const element = editorElements.find(el => el.id === elementId)
                  updateElement(elementId, {
                    videoData: {
                      platform: element?.videoData?.platform || 'custom',
                      url: element?.videoData?.url || '',
                      ...element?.videoData,
                      customThumbnail: imageUrl
                    }
                  })
                } else {
                  // Create a temporary image to get actual dimensions
                  const img = new Image()
                  img.onload = () => {
                    const aspectRatio = img.width / img.height
                    let width = 300
                    let height = width / aspectRatio
                    
                    if (height > 400) {
                      height = 400
                      width = height * aspectRatio
                    }
                    
                    if (elementId) {
                      updateElement(elementId, { content: imageUrl })
                    } else {
                      const position = getNextElementPosition('image')
                      const newElement: EditorElement = {
                        id: Date.now().toString(),
                        type: 'image',
                        content: imageUrl,
                        style: {
                          position: {
                            x: Math.round((canvasSize.width - Math.round(width)) / 2), // PROPERLY CENTERED
                            y: position.y
                          },
                          width: Math.round(width),
                          height: Math.round(height)
                        }
                      }
                      setEditorElements([...editorElements, newElement])
                      setSelectedElement(newElement.id)
                    }
                  }
                  img.src = imageUrl
                }
              }
              reader.readAsDataURL(file)
            }
        }
      }
      fileInputRef.current.click()
    }
  }

  const generateHtmlFromElements = () => {
    // Use table-based layout to match actual email output
    const sortedElements = [...editorElements].sort((a, b) => a.style.position.y - b.style.position.y)
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
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
            background-color: ${canvasBackgroundColor};
            margin: 0 auto;
          ">
            <tr>
              <td style="padding: 20px;">`

    // Group elements by their Y position to create rows (same as email generation)
    const rows: any[][] = []
    let currentRow: any[] = []
    let currentY = -1
    const yTolerance = 10

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

    // Render each row as a table (same logic as email generation)
    rows.forEach((rowElements, rowIndex) => {
      const sortedRowElements = rowElements.sort((a, b) => a.style.position.x - b.style.position.x)
      
      html += `
                <!-- Row ${rowIndex + 1} -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 10px;">
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
                      ${style.textAlign ? `text-align: ${style.textAlign};` : 'text-align: left;'}
                    ">`

        // Render element content (same logic as email generation)
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
            ">${content}</${headingTag}>`
            break
            
          case 'image':
            let imageSrc = content
            html += `<img src="${imageSrc}" alt="Email Image" style="
              width: 100%;
              max-width: ${style.width}px;
              height: auto;
              display: block;
              border: 0;
              outline: none;
              ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
              margin: 0 auto;
            " />`
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
            
            html += `<a href="${videoUrl}" target="_blank" style="display: block; text-decoration: none;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="position: relative; width: 100%;">
                <tr>
                  <td style="position: relative;">
                    <img src="${thumbnailUrl}" alt="Video" style="
                      width: 100%;
                      max-width: ${style.width}px;
                      height: auto;
                      display: block;
                      border: 0;
                      ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
                    " />
                    <div style="
                      margin-top: 10px;
                      background-color: rgba(0,0,0,0.7);
                      color: white;
                      padding: 10px 15px;
                      border-radius: 5px;
                      font-size: 14px;
                      text-align: center;
                    ">▶ Play Video</div>
                  </td>
                </tr>
              </table>
            </a>`
            break
            
          case 'button':
            const buttonUrl = element.url || '#'
            const buttonTarget = element.target || '_blank'
            html += `<a href="${buttonUrl}" target="${buttonTarget}" style="
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
            ">${content}</a>`
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

  // TRUE EMAIL CLIENT DIFFERENCES - GMAIL GETS PURE CONTENT EXTRACTION
  const generateClientSpecificHtml = (client: 'gmail' | 'outlook' | 'apple' | 'generic') => {
    const sortedElements = [...editorElements].sort((a, b) => a.style.position.y - b.style.position.y)
    
    // GMAIL: TRUE MAILCHIMP APPROACH - Pure content extraction, no layout preservation
    if (client === 'gmail') {
      let gmailHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateForm.name || 'Email Template'}</title>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" valign="top" style="padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: ${canvasBackgroundColor}; margin: 0 auto;">
          <!-- Gmail Preview Header -->
          <tr>
            <td align="center" valign="top" style="background-color: #EA4335; color: white; padding: 12px 20px; font-size: 13px; font-weight: bold; font-family: Arial, sans-serif;">
              📧 GMAIL - Mailchimp-style content extraction (no layout preservation)
            </td>
          </tr>`

      if (sortedElements.length === 0) {
        gmailHtml += `
          <tr>
            <td align="center" valign="top" style="padding: 40px; color: #666666; font-family: Arial, sans-serif; font-size: 16px;">
              Your template is empty<br>
              <span style="font-size: 14px;">Add elements to see Gmail rendering</span>
            </td>
          </tr>`
      } else {
        // Process each element in pure vertical order - like reading a document
        sortedElements.forEach((element) => {
          const { type, content, style } = element
          
          switch (type) {
            case 'text':
              gmailHtml += `
          <tr>
            <td align="left" valign="top" style="padding: 15px 20px; font-family: Arial, sans-serif; font-size: ${Math.min(style.fontSize || 14, 18)}px; color: ${style.color || '#000000'}; line-height: 1.6;">
              ${content}
            </td>
          </tr>`
              break
              
                         case 'heading':
               const headingSize = Math.min(style.fontSize || (24 - ((element.headingLevel || 1) - 1) * 2), 28)
              gmailHtml += `
          <tr>
            <td align="left" valign="top" style="padding: 20px 20px 10px 20px; font-family: Arial, sans-serif; font-size: ${headingSize}px; color: ${style.color || '#000000'}; font-weight: bold; line-height: 1.3;">
              ${content}
            </td>
          </tr>`
              break
              
            case 'image':
              const imgWidth = Math.min(style.width, 560) // Max width for Gmail
              const imgHeight = Math.round((style.height / style.width) * imgWidth)
              
              gmailHtml += `
          <tr>
            <td align="center" valign="top" style="padding: 15px 20px;">
              <img src="${content}" alt="Email Image" width="${imgWidth}" height="${imgHeight}" style="display: block; max-width: 100%; height: auto; border: 0;">
            </td>
          </tr>`
              break
              
            case 'video':
              // Extract proper YouTube thumbnail and URL
              const videoUrl = element.videoData?.url || content || ''
              let thumbnailUrl = element.videoData?.customThumbnail || element.videoData?.thumbnailUrl
              
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
              
              const videoWidth = Math.min(style.width, 560)
              const videoHeight = Math.round(videoWidth * 0.5625) // 16:9 aspect ratio
              
              gmailHtml += `
          <tr>
            <td align="center" valign="top" style="padding: 15px 20px;">
              <a href="${videoUrl}" target="_blank" style="display: block; text-decoration: none;">
                <img src="${thumbnailUrl}" alt="Video" width="${videoWidth}" height="${videoHeight}" style="display: block; border: 3px solid #1a73e8; border-radius: 8px; max-width: 100%; height: auto;">
              </a>
            </td>
          </tr>`
              break
              
            case 'button':
              const buttonBg = style.backgroundColor || '#0073e6'
              const buttonColor = style.color || '#ffffff'
              const buttonText = content || 'Click Here'
              const buttonUrl = element.buttonData?.url || '#'
              const buttonTarget = element.buttonData?.openInNewTab ? '_blank' : '_self'
              
              gmailHtml += `
          <tr>
            <td align="center" valign="top" style="padding: 15px 20px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background-color: ${buttonBg}; border-radius: 6px; padding: 12px 24px;">
                    <a href="${buttonUrl}" target="${buttonTarget}" style="font-family: Arial, sans-serif; font-size: 16px; color: ${buttonColor}; text-decoration: none; font-weight: bold; display: inline-block;">
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
              
              gmailHtml += `
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
      }

      gmailHtml += `
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      return gmailHtml
    }
    
    // OTHER CLIENTS: Use actual template design with client header
    let actualTemplate = generateHtmlFromElements()
    
    // Add client headers
    const clientHeaders = {
      outlook: '<tr><td style="background-color: #0078D4; color: white; padding: 15px; text-align: center; font-size: 14px; font-weight: bold;">📧 OUTLOOK - Your Actual Template Design</td></tr>',
      apple: '<tr><td style="background-color: #34C759; color: white; padding: 15px; text-align: center; font-size: 14px; font-weight: bold;">📧 APPLE MAIL - Your Actual Template Design</td></tr>',
      generic: '<tr><td style="background-color: #6B7280; color: white; padding: 15px; text-align: center; font-size: 14px; font-weight: bold;">📧 GENERIC CLIENT - Your Actual Template Design</td></tr>'
    }
    
    const headerHtml = clientHeaders[client as keyof typeof clientHeaders] || ''
    const insertAfter = '<td style="padding: 0; position: relative; min-height:'
    const insertPos = actualTemplate.indexOf(insertAfter)
    
    if (insertPos !== -1 && headerHtml) {
      const afterPos = actualTemplate.indexOf('>', insertPos) + 1
      actualTemplate = actualTemplate.slice(0, afterPos) + '\n                ' + headerHtml + actualTemplate.slice(afterPos)
    }
    
    return actualTemplate
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
        elements: editorElements,
        canvasSettings: {
          width: canvasSize.width,
          height: canvasSize.height,
          backgroundColor: canvasBackgroundColor
        },
        createdAt: new Date().toISOString()
      }

      // Save to database first
      try {
        const method = isEditing ? 'PUT' : 'POST'
        const response = await fetch('/api/admin/templates', {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData)
        })

        if (!response.ok) {
          throw new Error('Database save failed')
        }
      } catch (dbError) {
        console.error('Database save failed, falling back to localStorage:', dbError)
        
        // Fallback to localStorage if database fails
        const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]')
        
        if (isEditing) {
          const updatedTemplates = savedTemplates.map((t: EmailTemplate) => 
            t.id === templateId ? templateData : t
          )
          localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates))
        } else {
          localStorage.setItem('emailTemplates', JSON.stringify([templateData, ...savedTemplates]))
        }
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
      if (elementId === 'canvas' && property === 'backgroundColor') {
        setCanvasBackgroundColor(color)
        setHexInput(color)
      } else {
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
                onClick={() => addElement('heading')}
                className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2m-6 12V8m0 0L8 8m4 0l4 0" />
                  </svg>
                  <span className="text-sm font-medium">Heading</span>
                </div>
              </button>

              <button
                onClick={() => handleImageUpload()}
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

              {/* Email Client Preview Button */}
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`w-full p-3 text-left border rounded-md hover:shadow-sm transition-all ${
                  previewMode 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {previewMode ? 'Exit Preview' : 'Email Preview'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 bg-white border-b">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600">Canvas Size:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Width:</span>
                    <select 
                      value={canvasSize.width}
                      onChange={(e) => setCanvasSize({...canvasSize, width: parseInt(e.target.value)})}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="600">600px (Compact)</option>
                      <option value="800">800px (Standard)</option>
                      <option value="1000">1000px (Professional)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
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

                {/* Gmail Constraints Toggle */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showGmailConstraints}
                      onChange={(e) => setShowGmailConstraints(e.target.checked)}
                      className="rounded"
                      title="Toggle Gmail preview zone width overlay"
                    />
                                         <span className="text-sm text-gray-600">Gmail Preview Zone</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={gmailSafeMode}
                      onChange={(e) => setGmailSafeMode(e.target.checked)}
                      className="rounded"
                      title="Enable Gmail-safe hints and warnings"
                    />
                    <span className="text-sm text-gray-600">Gmail Safe Mode</span>
                  </label>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Design Warnings */}
                {designWarnings.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs border border-orange-200">
                      ⚠️ {designWarnings.length} Gmail issue{designWarnings.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 relative">
                  <span className="text-sm text-gray-600">Background:</span>
                  <button
                    onClick={() => setShowColorPicker({elementId: 'canvas', property: 'backgroundColor'})}
                    className="h-8 px-3 border border-gray-300 rounded-md flex items-center gap-2 hover:bg-gray-50"
                  >
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: canvasBackgroundColor }}
                    />
                    <span className="text-sm">{canvasBackgroundColor}</span>
                  </button>
                  {showColorPicker?.elementId === 'canvas' && showColorPicker?.property === 'backgroundColor' && (
                    <div className="absolute top-full left-0 mt-1 z-50">
                      <ColorPicker
                        elementId="canvas"
                        property="backgroundColor"
                        currentColor={canvasBackgroundColor}
                        onClose={() => setShowColorPicker(null)}
                      />
                    </div>
                  )}
                  {/* Properties panel toggle (always accessible) */}
                  <button
                    type="button"
                    onClick={() => setPropertiesCollapsed(prev => !prev)}
                    className="h-8 px-3 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    title={propertiesCollapsed ? 'Show properties panel' : 'Hide properties panel'}
                  >
                    {propertiesCollapsed ? 'Show Properties' : 'Hide Properties'}
                  </button>
                  {/* Zoom control */}
                  <label className="flex items-center gap-1 text-sm ml-2">
                    <span className="text-sm text-gray-600">Zoom:</span>
                    <select
                      value={zoom}
                      onChange={(e)=>setZoom(parseInt(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      title="Change canvas preview zoom"
                    >
                      <option value={50}>50%</option>
                      <option value={75}>75%</option>
                      <option value={100}>100%</option>
                      <option value={125}>125%</option>
                    </select>
                  </label>
                </div>
                
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
            {previewMode ? (
              /* Email Client Preview Mode */
              <div className="w-full h-full">
                <div className="bg-white h-full flex flex-col">
                  <div className="bg-gray-50 px-4 py-3 border-b flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedEmailClient.charAt(0).toUpperCase() + selectedEmailClient.slice(1)} Preview
                        </h3>
                        <p className="text-sm text-gray-600">
                          {templateForm.name || 'Untitled Template'} • Subject: {templateForm.subject || 'No Subject'}
                        </p>
                      </div>
                      <button
                        onClick={() => setPreviewMode(false)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Back to Editor
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
                    <div className="bg-white h-full rounded border shadow-sm overflow-hidden">
                      <iframe
                        srcDoc={generateClientSpecificHtml(selectedEmailClient)}
                        className="w-full h-full border-0"
                        title={`${selectedEmailClient} Email Preview`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Regular Template Editor Mode */
              <div className="mx-auto" style={{ transform: `scale(${zoom/100})`, transformOrigin: 'top center' }}>
                <div 
                  className={`shadow-lg relative ${zoom !== 100 ? 'pointer-events-none select-none' : ''}`}
                  style={{ 
                    width: `${canvasSize.width}px`, 
                    minHeight: `${canvasSize.height}px`,
                    backgroundColor: canvasBackgroundColor,
                    border: '1px solid #e5e7eb',
                    backgroundImage: showGrid ? 
                      `radial-gradient(circle, #e5e7eb 1px, transparent 1px)` : 'none',
                    backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : 'auto'
                  }}
                  onClick={(e) => {
                    // Only clear selection if this was an actual canvas click, not just a mouse release after element interaction
                    const timeSinceLastInteraction = Date.now() - lastElementInteractionRef.current
                    const wasRecentlyInteractingWithElement = timeSinceLastInteraction < 100 // 100ms threshold
                    const isCurrentlyDragging = dragStateRef.current.dragStarted || dragStateRef.current.isDragging
                    
                    // Don't clear selection if we just interacted with an element or are currently dragging
                    if (!wasRecentlyInteractingWithElement && !isCurrentlyDragging) {
                      setSelectedElement(null)
                      if (editingTextElement) {
                        finishEditingText()
                      }
                    }
                  }}
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

                {/* Gmail 600px Constraint Overlay */}
                {showGmailConstraints && canvasSize.width > 600 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Gmail Safe Zone (600px centered) */}
                    <div 
                      className="absolute top-0 bg-blue-100 bg-opacity-30 border-2 border-blue-400 border-dashed"
                      style={{
                        left: `${(canvasSize.width - 600) / 2}px`,
                        width: '600px',
                        height: `${canvasSize.height}px`
                      }}
                    >
                                         <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                       Gmail Preview Zone (Auto-scales to 600px)
                     </div>
                    </div>
                    
                    {/* Side margins that will auto-scale in Gmail */}
                    <div 
                      className="absolute top-0 left-0 bg-green-100 bg-opacity-30"
                      style={{
                        width: `${(canvasSize.width - 600) / 2}px`,
                        height: `${canvasSize.height}px`
                      }}
                    >
                                         <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded rotate-90 origin-bottom-left">
                       Auto-scales to fit
                     </div>
                    </div>
                    <div 
                      className="absolute top-0 right-0 bg-green-100 bg-opacity-30"
                      style={{
                        width: `${(canvasSize.width - 600) / 2}px`,
                        height: `${canvasSize.height}px`
                      }}
                    >
                                         <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded -rotate-90 origin-bottom-right">
                       Auto-scales to fit
                     </div>
                    </div>
                  </div>
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
                    className={`absolute cursor-move transition-shadow ${
                      selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                    } ${
                      draggedElement === element.id ? 'shadow-lg opacity-80' : ''
                    }`}
                    style={{
                      left: element.style.position.x,
                      top: element.style.position.y,
                      width: element.style.width,
                      height: element.style.height,
                      zIndex: selectedElement === element.id ? 10 : 1,
                      userSelect: 'none'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Track element interaction time
                      lastElementInteractionRef.current = Date.now()
                      // Only handle click if we haven't dragged
                      if (!dragStateRef.current.isDragging && !dragStateRef.current.dragStarted) {
                        setSelectedElement(element.id)
                      }
                    }}
                    onMouseDown={(e) => {
                      // Don't start dragging if we're resizing
                      if (isResizingElement) return
                      
                      e.preventDefault()
                      e.stopPropagation()
                      // Track element interaction time
                      lastElementInteractionRef.current = Date.now()
                      setSelectedElement(element.id)
                      
                      // Reset drag state
                      dragStateRef.current = {
                        isDragging: false,
                        dragStarted: false,
                        elementId: element.id
                      }
                      
                      // Clear any existing timeout
                      if (dragTimeoutRef.current) {
                        clearTimeout(dragTimeoutRef.current)
                      }
                      
                      const startX = e.clientX - element.style.position.x
                      const startY = e.clientY - element.style.position.y
                      const startMouseX = e.clientX
                      const startMouseY = e.clientY
                      
                      let animationFrameId: number
                      
                      const handleMouseMove = (e: MouseEvent) => {
                        e.preventDefault()
                        
                        // Calculate how far mouse has moved
                        const deltaX = Math.abs(e.clientX - startMouseX)
                        const deltaY = Math.abs(e.clientY - startMouseY)
                        
                        // Only start dragging if mouse has moved more than 3 pixels
                        if (!dragStateRef.current.dragStarted && (deltaX > 3 || deltaY > 3)) {
                          dragStateRef.current.dragStarted = true
                          dragStateRef.current.isDragging = true
                          setIsDragging(true)
                          setDraggedElement(element.id)
                        }
                        
                        if (dragStateRef.current.dragStarted) {
                          // Use requestAnimationFrame for smoother performance
                          if (animationFrameId) {
                            cancelAnimationFrame(animationFrameId)
                          }
                          
                          animationFrameId = requestAnimationFrame(() => {
                            const rawX = e.clientX - startX
                            const rawY = e.clientY - startY
                            
                            // Constrain to canvas bounds
                            const constrainedX = Math.max(0, Math.min(rawX, canvasSize.width - element.style.width))
                            const constrainedY = Math.max(0, Math.min(rawY, canvasSize.height - element.style.height))
                            
                            const { x: newX, y: newY, guides } = snapPosition(element, constrainedX, constrainedY)
                            
                            setShowAlignmentGuides(guides)
                            
                            updateElement(element.id, {
                              style: {
                                ...element.style,
                                position: { x: newX, y: newY }
                              }
                            })
                          })
                        }
                      }
                      
                      const handleMouseUp = () => {
                        if (animationFrameId) {
                          cancelAnimationFrame(animationFrameId)
                        }
                        // Track element interaction time
                        lastElementInteractionRef.current = Date.now()
                        setIsDragging(false)
                        setDraggedElement(null)
                        setShowAlignmentGuides([])
                        document.removeEventListener('mousemove', handleMouseMove)
                        document.removeEventListener('mouseup', handleMouseUp)
                        
                        // Reset drag state after a delay to allow click handler to check it
                        dragTimeoutRef.current = setTimeout(() => {
                          dragStateRef.current = {
                            isDragging: false,
                            dragStarted: false,
                            elementId: null
                          }
                        }, 50)
                      }
                      
                      document.addEventListener('mousemove', handleMouseMove)
                      document.addEventListener('mouseup', handleMouseUp)
                    }}
                  >
                    {element.type === 'text' && (
                      <>
                        {editingTextElement === element.id ? (
                          <textarea
                            ref={textEditRef}
                            value={tempTextContent}
                            onChange={(e) => setTempTextContent(e.target.value)}
                            onKeyDown={handleTextEditKeyDown}
                            onBlur={finishEditingText}
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
                              border: '2px solid #3b82f6',
                              outline: 'none',
                              resize: 'none',
                              overflow: 'hidden'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        ) : (
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
                              justifyContent: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                              border: '1px solid #e5e7eb',
                              cursor: 'text'
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              // Start editing immediately on single click, but only if not dragging
                              if (!dragStateRef.current.isDragging && !dragStateRef.current.dragStarted) {
                                startEditingText(element.id)
                              }
                            }}
                          >
                            {element.content}
                          </div>
                        )}
                      </>
                    )}
                    
                    {element.type === 'heading' && (
                      <>
                        {editingTextElement === element.id ? (
                          <textarea
                            ref={textEditRef}
                            value={tempTextContent}
                            onChange={(e) => setTempTextContent(e.target.value)}
                            onKeyDown={handleTextEditKeyDown}
                            onBlur={finishEditingText}
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
                              border: '2px solid #3b82f6',
                              outline: 'none',
                              resize: 'none',
                              overflow: 'hidden'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        ) : (
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
                              justifyContent: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                              border: '1px solid #e5e7eb',
                              cursor: 'text'
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              // Start editing immediately on single click, but only if not dragging
                              if (!dragStateRef.current.isDragging && !dragStateRef.current.dragStarted) {
                                startEditingText(element.id)
                              }
                            }}
                          >
                            {element.content}
                          </div>
                        )}
                      </>
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
                      <>
                        {editingTextElement === element.id ? (
                          <textarea
                            ref={textEditRef}
                            value={tempTextContent}
                            onChange={(e) => setTempTextContent(e.target.value)}
                            onKeyDown={handleTextEditKeyDown}
                            onBlur={finishEditingText}
                            style={{
                              backgroundColor: element.style.backgroundColor,
                              color: element.style.color,
                              padding: element.style.padding,
                              borderRadius: element.style.borderRadius,
                              width: '100%',
                              height: '100%',
                              fontSize: element.style.fontSize || 14,
                              fontWeight: element.style.fontWeight || 'medium',
                              fontFamily: element.style.fontFamily,
                              fontStyle: element.style.fontStyle,
                              textDecoration: element.style.textDecoration,
                              border: '2px solid #3b82f6',
                              outline: 'none',
                              resize: 'none',
                              overflow: 'hidden',
                              textAlign: 'center'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        ) : (
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
                              cursor: 'text',
                              fontSize: element.style.fontSize || 14,
                              fontWeight: element.style.fontWeight || 'medium',
                              fontFamily: element.style.fontFamily,
                              fontStyle: element.style.fontStyle,
                              textDecoration: element.style.textDecoration
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              startEditingText(element.id)
                            }}
                          >
                            {element.content}
                          </div>
                        )}
                      </>
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
                        {(element.videoData?.thumbnailUrl || element.videoData?.customThumbnail) ? (
                          <div className="relative w-full h-full">
                            <img
                              src={element.videoData.customThumbnail || element.videoData.thumbnailUrl}
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
                            {/* Removed video platform/title labels */}
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
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteElement(element.id)
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs z-20"
                        >
                          ×
                        </button>
                        
                        {/* Resize handles for all elements */}
                        <>
                          {/* Corner handles */}
                          <div
                            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-nw-resize z-10"
                            style={{ top: -6, left: -6 }}
                            onMouseDown={createResizeHandler(element.id, 'nw')}
                          />
                          
                          <div
                            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-ne-resize z-10"
                            style={{ top: -6, right: -6 }}
                            onMouseDown={createResizeHandler(element.id, 'ne')}
                          />
                          
                          <div
                            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-sw-resize z-10"
                            style={{ bottom: -6, left: -6 }}
                            onMouseDown={createResizeHandler(element.id, 'sw')}
                          />
                          
                          <div
                            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize z-10"
                            style={{ bottom: -6, right: -6 }}
                            onMouseDown={createResizeHandler(element.id, 'se')}
                          />
                          
                          {/* Edge handles */}
                          <div
                            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-n-resize z-10"
                            style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }}
                            onMouseDown={createResizeHandler(element.id, 'n')}
                          />
                          
                          <div
                            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-s-resize z-10"
                            style={{ bottom: -6, left: '50%', transform: 'translateX(-50%)' }}
                            onMouseDown={createResizeHandler(element.id, 's')}
                          />
                          
                          <div
                            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-w-resize z-10"
                            style={{ top: '50%', left: -6, transform: 'translateY(-50%)' }}
                            onMouseDown={createResizeHandler(element.id, 'w')}
                          />
                          
                          <div
                            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-e-resize z-10"
                            style={{ top: '50%', right: -6, transform: 'translateY(-50%)' }}
                            onMouseDown={createResizeHandler(element.id, 'e')}
                          />
                        </>
                      </>
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

            {/* Floating expand button when collapsed */}
            {propertiesCollapsed && (
              <button
                type="button"
                onClick={() => setPropertiesCollapsed(false)}
                className="fixed right-2 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-300 shadow-sm rounded px-2 py-1 text-xs hover:bg-gray-50"
                title="Expand properties panel"
              >
                Expand
              </button>
            )}

            {/* Properties Panel */}
            {/* Always show properties panel */}
            {true && (
              <div 
                className="bg-white border-l flex-shrink-0 overflow-hidden"
                style={{ width: propertiesCollapsed ? 28 : propertiesPanelWidth }}
              >
                <div className="h-full overflow-y-auto">
                  <div className={`sticky top-0 bg-white border-b p-3 z-10 ${propertiesCollapsed ? 'hidden' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-gray-900">Element Properties</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 hidden sm:inline">{propertiesPanelWidth}px</span>
                        <button
                          type="button"
                          onClick={() => setPropertiesCollapsed(prev => !prev)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                          title="Collapse/expand properties"
                        >
                          {propertiesCollapsed ? 'Expand' : 'Collapse'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 transition-[max-height,opacity] duration-200 ease-out ${propertiesCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[calc(100vh-6rem)] opacity-100'}`}>
                    {/* Gmail Design Warnings Panel */}
                    {gmailSafeMode && designWarnings.length > 0 && (
                      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <h5 className="font-medium text-orange-800 mb-2 flex items-center">
                          ⚠️ Gmail Compatibility Issues
                        </h5>
                        <div className="space-y-2">
                          {designWarnings.map((warning, index) => (
                            <div key={index} className="text-sm text-orange-700 flex items-start">
                              <span className="text-orange-500 mr-2">•</span>
                              <span>{warning}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-orange-600">
                          💡 Tip: Side-by-side elements will stack vertically in Gmail. Consider vertical layouts for critical content.
                        </div>
                      </div>
                    )}

                    {/* Gmail Safe Design Tips */}
                    {gmailSafeMode && designWarnings.length === 0 && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-2 flex items-center">
                          ✅ Gmail-Safe Design
                        </h5>
                        <div className="text-sm text-green-700">
                          Your template follows Gmail-friendly design patterns!
                        </div>
                      </div>
                    )}

                  {previewMode ? (
                    /* Email Client Selection in Preview Mode */
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Email Client Preview</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Select an email client to see how your template will render:
                      </p>
                      <div className="space-y-2">
                        {[
                          { id: 'gmail', name: 'Gmail', description: 'Limited CSS support, strips many styles' },
                          { id: 'outlook', name: 'Outlook', description: 'Uses Word engine, requires VML for advanced features' },
                          { id: 'apple', name: 'Apple Mail', description: 'Full CSS support, best rendering' },
                          { id: 'generic', name: 'Generic Client', description: 'Standard email client rendering' }
                        ].map((client) => (
                          <label key={client.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="emailClient"
                              value={client.id}
                              checked={selectedEmailClient === client.id}
                              onChange={(e) => setSelectedEmailClient(e.target.value as any)}
                              className="mt-1 w-4 h-4 text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">{client.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{client.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="text-xs text-blue-700">
                          <strong>Current Preview:</strong> {selectedEmailClient.charAt(0).toUpperCase() + selectedEmailClient.slice(1)} rendering. 
                          Button positioning and styles will vary between clients.
                        </div>
                      </div>
                    </div>
                  ) : selectedElement ? (() => {
                    const element = editorElements.find(el => el.id === selectedElement)
                    if (!element) return null
                    
                    return (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                          {element.type === 'text' || element.type === 'heading' ? (
                            <textarea
                              value={element.content}
                              onChange={(e) => updateElement(element.id, { content: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              rows={3}
                            />
                          ) : element.type === 'button' ? (
                            <input
                              type="text"
                              value={element.content}
                              onChange={(e) => updateElement(element.id, { content: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Button text"
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
                                      src={element.videoData.customThumbnail || element.videoData.thumbnailUrl}
                                      alt="Video thumbnail"
                                      className="w-full h-20 object-cover rounded"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">
                                      {element.videoData.platform?.toUpperCase()} Video
                                      {element.videoData.customThumbnail && (
                                        <span className="text-green-600 ml-1">(Custom thumbnail)</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Thumbnail (Optional)</label>
                                <div className="space-y-2">
                                  <input
                                    type="url"
                                    value={element.videoData?.customThumbnail || ''}
                                    onChange={(e) => updateElement(element.id, {
                                      videoData: {
                                        platform: element.videoData?.platform || 'custom',
                                        url: element.videoData?.url || '',
                                        ...element.videoData,
                                        customThumbnail: e.target.value
                                      }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="https://example.com/custom-thumbnail.jpg"
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleImageUpload(element.id, 'thumbnail')}
                                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                      Upload Image
                                    </button>
                                    {element.videoData?.customThumbnail && (
                                      <button
                                        onClick={() => updateElement(element.id, {
                                          videoData: {
                                            platform: element.videoData?.platform || 'custom',
                                            url: element.videoData?.url || '',
                                            ...element.videoData,
                                            customThumbnail: undefined
                                          }
                                        })}
                                        className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                        
                        {/* Button Link Properties */}
                        {element.type === 'button' && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Button URL</label>
                              <input
                                type="url"
                                value={element.buttonData?.url || ''}
                                onChange={(e) => updateElement(element.id, { 
                                  buttonData: { 
                                    ...element.buttonData,
                                    url: e.target.value,
                                    openInNewTab: element.buttonData?.openInNewTab ?? true
                                  } 
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="https://example.com"
                              />
                            </div>
                            
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={element.buttonData?.openInNewTab ?? true}
                                onChange={(e) => updateElement(element.id, { 
                                  buttonData: { 
                                    ...element.buttonData,
                                    url: element.buttonData?.url || '#',
                                    openInNewTab: e.target.checked
                                  } 
                                })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <label className="ml-2 text-sm text-gray-700">Open in new tab</label>
                            </div>
                          </div>
                        )}
                        
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


                        
                        {element.type === 'heading' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Heading Level</label>
                            <select
                              value={element.headingLevel || 1}
                              onChange={(e) => updateElement(element.id, {
                                headingLevel: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6
                              })}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            >
                              <option value={1}>H1 - Main Heading</option>
                              <option value={2}>H2 - Section Heading</option>
                              <option value={3}>H3 - Sub Heading</option>
                              <option value={4}>H4 - Minor Heading</option>
                              <option value={5}>H5 - Small Heading</option>
                              <option value={6}>H6 - Smallest Heading</option>
                            </select>
                          </div>
                        )}
                        
                        {(element.type === 'text' || element.type === 'heading' || element.type === 'button') && (
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

                            {(element.type === 'text' || element.type === 'heading') && (
                              <>
                                <div className="relative color-picker-container">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                                  <div className="space-y-2">
                                    {/* Transparency toggle */}
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`transparent-${element.id}`}
                                        checked={element.style.backgroundColor === 'transparent'}
                                        onChange={(e) => updateElement(element.id, {
                                          style: { ...element.style, backgroundColor: e.target.checked ? 'transparent' : '#f9fafb' }
                                        })}
                                        className="w-4 h-4"
                                      />
                                      <label htmlFor={`transparent-${element.id}`} className="text-sm text-gray-700">
                                        Transparent background
                                      </label>
                                    </div>
                                    
                                    {/* Color picker (only show if not transparent) */}
                                    {element.style.backgroundColor !== 'transparent' && (
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
                                    )}
                                  </div>
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
                            <div className="space-y-2">
                              {/* Transparency toggle for buttons and dividers */}
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`transparent-${element.id}`}
                                  checked={element.style.backgroundColor === 'transparent'}
                                  onChange={(e) => updateElement(element.id, {
                                    style: { ...element.style, backgroundColor: e.target.checked ? 'transparent' : (element.type === 'button' ? '#3b82f6' : '#e5e7eb') }
                                  })}
                                  className="w-4 h-4"
                                />
                                <label htmlFor={`transparent-${element.id}`} className="text-sm text-gray-700">
                                  Transparent background
                                </label>
                              </div>
                              
                              {/* Color picker (only show if not transparent) */}
                              {element.style.backgroundColor !== 'transparent' && (
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
                              )}
                            </div>
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

                        {/* Precise Positioning Controls */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Precise Positioning</label>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">X Position</label>
                              <input
                                type="number"
                                value={element.style.position.x}
                                onChange={(e) => updateElement(element.id, {
                                  style: { ...element.style, position: { ...element.style.position, x: parseInt(e.target.value) || 0 } }
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                min="0"
                                max={canvasSize.width - element.style.width}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Y Position</label>
                              <input
                                type="number"
                                value={element.style.position.y}
                                onChange={(e) => updateElement(element.id, {
                                  style: { ...element.style, position: { ...element.style.position, y: parseInt(e.target.value) || 0 } }
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                min="0"
                                max={canvasSize.height - element.style.height}
                              />
                            </div>
                          </div>
                          
                          {/* Edge Alignment Buttons */}
                          <div className="grid grid-cols-3 gap-1 mb-2">
                            <button
                              onClick={() => updateElement(element.id, {
                                style: { ...element.style, position: { ...element.style.position, x: 0 } }
                              })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                              title="Align to Left Edge"
                            >
                              ← Left
                            </button>
                            <button
                              onClick={() => updateElement(element.id, {
                                style: { ...element.style, position: { ...element.style.position, x: (canvasSize.width - element.style.width) / 2 } }
                              })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                              title="Center Horizontally"
                            >
                              ↔️ Center
                            </button>
                            <button
                              onClick={() => updateElement(element.id, {
                                style: { ...element.style, position: { ...element.style.position, x: canvasSize.width - element.style.width } }
                              })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                              title="Align to Right Edge"
                            >
                              Right →
                            </button>
                            
                            <button
                              onClick={() => updateElement(element.id, {
                                style: { ...element.style, position: { ...element.style.position, y: 0 } }
                              })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                              title="Align to Top Edge"
                            >
                              ↑ Top
                            </button>
                            <button
                              onClick={() => updateElement(element.id, {
                                style: { ...element.style, position: { ...element.style.position, y: (canvasSize.height - element.style.height) / 2 } }
                              })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                              title="Center Vertically"
                            >
                              ↕️ Middle
                            </button>
                            <button
                              onClick={() => updateElement(element.id, {
                                style: { ...element.style, position: { ...element.style.position, y: canvasSize.height - element.style.height } }
                              })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                              title="Align to Bottom Edge"
                            >
                              ↓ Bottom
                            </button>
                          </div>
                          
                          {/* Stretch to Edges */}
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              onClick={() => updateElement(element.id, {
                                style: { 
                                  ...element.style, 
                                  position: { ...element.style.position, x: 0 },
                                  width: canvasSize.width
                                }
                              })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                              title="Stretch Full Width"
                            >
                              ↔️ Full Width
                            </button>
                            <button
                              onClick={() => updateElement(element.id, {
                                style: { 
                                  ...element.style, 
                                  position: { ...element.style.position, y: 0 },
                                  height: canvasSize.height
                                }
                              })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                              title="Stretch Full Height"
                            >
                              ↕️ Full Height
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })() : (
                  /* Empty state when no element is selected */
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Element Selected</h4>
                    <p className="text-sm text-gray-500 mb-4 max-w-xs">
                      Click on any element in the canvas to view and edit its properties.
                    </p>
                    <div className="text-xs text-gray-400">
                      <p>Available elements:</p>
                      <p>Text • Heading • Image • Video • Button • Divider</p>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>



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