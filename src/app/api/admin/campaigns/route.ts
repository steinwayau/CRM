import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let data: any = null
  try {
    data = await request.json()
    
    const campaign = await prisma.emailCampaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        templateId: data.templateId,
        templateName: data.templateName || '',
        htmlContent: '',
        textContent: data.customEmails || '',
        recipientType: data.recipientType || 'all',
        status: data.status || 'draft',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdBy: 'system'
      }
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error creating campaign:', error)
    console.error('Full error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { 
        error: 'Failed to create campaign', 
        details: error instanceof Error ? error.message : 'Unknown error',
        data: data
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data
    
    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        ...updateData,
        scheduledAt: updateData.scheduledAt ? new Date(updateData.scheduledAt) : null,
        sentAt: updateData.sentAt ? new Date(updateData.sentAt) : null
      }
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
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
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    await prisma.emailCampaign.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
} 