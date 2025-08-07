import { NextRequest, NextResponse } from 'next/server'
import { createCanvas, loadImage } from 'canvas'

// ULTRA-SAFE VIDEO THUMBNAIL GENERATOR
// This endpoint creates composite images with play button overlays
// Built with comprehensive error handling and graceful fallbacks

export async function GET(request: NextRequest) {
  try {
    console.log('🎬 Video thumbnail generation started via GET')
    
    const { searchParams } = new URL(request.url)
    const thumbnailUrl = searchParams.get('url')
    const width = searchParams.get('w') || '600'
    const height = searchParams.get('h') || '400'
    
    // Input validation
    if (!thumbnailUrl) {
      console.log('❌ No thumbnail URL provided in GET request')
      return NextResponse.json({ 
        success: false, 
        error: 'Thumbnail URL required in url parameter' 
      }, { status: 400 })
    }

    // Decode the URL
    const decodedThumbnailUrl = decodeURIComponent(thumbnailUrl)
    console.log('📸 Processing thumbnail:', decodedThumbnailUrl)
    
    return await generateCompositeImage(decodedThumbnailUrl, parseInt(width), parseInt(height))
    
  } catch (error) {
    console.error('❌ GET request failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate thumbnail'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎬 Video thumbnail generation started')
    
    const { thumbnailUrl } = await request.json()
    
    // Input validation
    if (!thumbnailUrl) {
      console.log('❌ No thumbnail URL provided')
      return NextResponse.json({ 
        success: false, 
        error: 'Thumbnail URL required',
        fallback: true 
      }, { status: 400 })
    }
    
    return await generateCompositeImage(thumbnailUrl, 600, 400)
    
  } catch (error) {
    console.error('❌ POST request failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate thumbnail',
      fallback: true
    }, { status: 500 })
  }
}

async function generateCompositeImage(thumbnailUrl: string, width: number, height: number) {
  try {
    console.log(`🎨 Creating composite image: ${width}x${height}`)
    
    // Load the original thumbnail
    const img = await loadImage(thumbnailUrl)
    
    // Create canvas with specified dimensions
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    
    // Fill background (in case image doesn't cover fully)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)
    
    // Draw the thumbnail to fit the canvas
    ctx.drawImage(img, 0, 0, width, height)
    
    // Calculate play button size (responsive)
    const playButtonSize = Math.min(width, height) * 0.15 // 15% of smallest dimension
    const centerX = width / 2
    const centerY = height / 2
    
    // Draw semi-transparent dark circle background for play button
    ctx.globalAlpha = 0.8
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(centerX, centerY, playButtonSize, 0, 2 * Math.PI)
    ctx.fill()
    
    // Draw white play triangle
    ctx.globalAlpha = 1.0
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    
    // Triangle points (pointing right)
    const triangleSize = playButtonSize * 0.6
    const triangleLeft = centerX - triangleSize * 0.3
    const triangleRight = centerX + triangleSize * 0.7
    const triangleTop = centerY - triangleSize * 0.5
    const triangleBottom = centerY + triangleSize * 0.5
    
    ctx.moveTo(triangleLeft, triangleTop)
    ctx.lineTo(triangleRight, centerY)
    ctx.lineTo(triangleLeft, triangleBottom)
    ctx.closePath()
    ctx.fill()
    
    // Convert to buffer
    const buffer = canvas.toBuffer('image/png')
    
    console.log('✅ Composite image created successfully')
    
    // Return the image directly
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Content-Length': buffer.length.toString(),
      },
    })
    
  } catch (error) {
    console.error('❌ Image generation failed:', error)
    
    // Return error response
    return NextResponse.json({
      success: false,
      error: 'Failed to create composite image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 