import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' }
    })

    const byStatus = campaigns.reduce((acc: Record<string, number>, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    }, {})

    console.log('Raw campaign data from database:')
    campaigns.forEach((campaign, index) => {
      console.log(`Campaign ${index + 1}:`, {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        recipientType: campaign.recipientType,
        textContent: campaign.textContent,
        subject: campaign.subject,
        createdAt: campaign.createdAt
      })
    })

    return NextResponse.json({
      summary: {
        total: campaigns.length,
        byStatus
      },
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        recipientType: c.recipientType,
        textContent: c.textContent,
        subject: c.subject,
        createdAt: c.createdAt
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
} 