import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dtnrgayr5',
  api_key: '652476712988625',
  api_secret: 'rVz52kXoRTdhHtqzkrj--URBC10',
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'email-templates', // Organize uploads in a folder
          resource_type: 'auto',
          transformation: [
            { quality: 'auto:good' }, // Automatic quality optimization
            { fetch_format: 'auto' }  // Automatic format optimization
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    const uploadResult = result as any

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height
    })

  } catch (error: any) {
    console.error('Cloudinary upload error:', error)
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      cloudName: 'dinrgayr5'
    })
    return NextResponse.json(
      { 
        error: 'Failed to upload image', 
        details: error?.message || 'Unknown error',
        cloudName: 'dinrgayr5'
      }, 
      { status: 500 }
    )
  }
} 