import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // For now, return localStorage-style data but from database
    // We'll need to add a template table later, but for immediate fix, 
    // let's create a simple storage approach
    
    // Templates will be stored as JSON in a simple config table
    const templates = await prisma.enquiry.findMany({
      where: {
        // Use a special email field to mark template records
        email: 'TEMPLATE_STORAGE'
      },
      select: {
        id: true,
        others: true // Store template data in others field as JSON
      }
    })

    // Extract template data from others field
    const templateData = templates.map(t => JSON.parse(t.others || '{}'))
    
    return NextResponse.json(templateData)
  } catch (error) {
    console.error('Error fetching templates:', error)
    // Fallback to empty array
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const templateData = await request.json()
    
    // Store template as a special enquiry record
    await prisma.enquiry.create({
      data: {
        firstName: 'TEMPLATE',
        lastName: 'STORAGE',
        email: 'TEMPLATE_STORAGE',
        phone: templateData.id || 'template-' + Date.now(),
        state: 'VIC',
        others: JSON.stringify(templateData)
      }
    })

    return NextResponse.json({ success: true, template: templateData })
  } catch (error) {
    console.error('Error saving template:', error)
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const templateData = await request.json()
    const { id } = templateData
    
    // Find existing template record
    const existingTemplate = await prisma.enquiry.findFirst({
      where: {
        email: 'TEMPLATE_STORAGE',
        phone: id
      }
    })

    if (existingTemplate) {
      await prisma.enquiry.update({
        where: { id: existingTemplate.id },
        data: {
          others: JSON.stringify(templateData)
        }
      })
    }

    return NextResponse.json({ success: true, template: templateData })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    await prisma.enquiry.deleteMany({
      where: {
        email: 'TEMPLATE_STORAGE',
        phone: id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
} 