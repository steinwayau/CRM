import { NextRequest, NextResponse } from 'next/server'
import { createCanvas, loadImage } from 'canvas'

// ULTRA-SAFE VIDEO THUMBNAIL GENERATOR
// This endpoint creates composite images with play button overlays
// Built with comprehensive error handling and graceful fallbacks

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

    // Generate composite image with play button
    const compositeImageBuffer = await generateThumbnailWithPlayButton(thumbnailUrl)
    
    if (!compositeImageBuffer) {
      console.log('⚠️ Image generation failed, suggesting fallback')
      return NextResponse.json({ 
        success: false, 
        error: 'Image generation failed',
        fallback: true,
        originalUrl: thumbnailUrl 
      }, { status: 500 })
    }

    console.log('✅ Video thumbnail generated successfully')
    
    // Return the generated image
    return new NextResponse(compositeImageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'X-Generated': 'true'
      }
    })

  } catch (error) {
    console.error('🚨 Video thumbnail generation error:', error)
    
    // GRACEFUL FALLBACK: Always suggest using original thumbnail
    return NextResponse.json({ 
      success: false, 
      error: 'Thumbnail generation failed',
      fallback: true,
      originalUrl: request.url 
    }, { status: 500 })
  }
}

// SAFE IMAGE PROCESSING WITH COMPREHENSIVE ERROR HANDLING
async function generateThumbnailWithPlayButton(thumbnailUrl: string): Promise<Buffer | null> {
  try {
    console.log('🖼️ Loading thumbnail image:', thumbnailUrl)
    
    // Load the original thumbnail with timeout
    const image = await Promise.race([
      loadImage(thumbnailUrl),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Image load timeout')), 10000)
      )
    ])
    
    console.log('📐 Image loaded, dimensions:', image.width, 'x', image.height)
    
    // Create canvas with original image dimensions
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')
    
    // Draw the original thumbnail
    ctx.drawImage(image, 0, 0)
    
    // Calculate play button size (responsive to image size)
    const buttonSize = Math.min(image.width, image.height) * 0.15 // 15% of smaller dimension
    const buttonX = (image.width - buttonSize) / 2
    const buttonY = (image.height - buttonSize) / 2
    
    // Draw play button background (semi-transparent circle)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.beginPath()
    ctx.arc(buttonX + buttonSize/2, buttonY + buttonSize/2, buttonSize/2, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw white border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = buttonSize * 0.05
    ctx.stroke()
    
    // Draw play triangle (white)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    const triangleSize = buttonSize * 0.35
    const triangleX = buttonX + buttonSize/2 - triangleSize/3
    const triangleY = buttonY + buttonSize/2 - triangleSize/2
    
    ctx.moveTo(triangleX, triangleY)
    ctx.lineTo(triangleX, triangleY + triangleSize)
    ctx.lineTo(triangleX + triangleSize, triangleY + triangleSize/2)
    ctx.closePath()
    ctx.fill()
    
    console.log('🎨 Play button overlay completed')
    
    // Convert to PNG buffer
    return canvas.toBuffer('image/png')
    
  } catch (error) {
    console.error('🚨 Image processing error:', error)
    return null // Graceful failure
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'Video Thumbnail Generator',
    timestamp: new Date().toISOString()
  })
} 