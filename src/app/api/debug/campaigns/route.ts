import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('Raw campaign data from database:')
    campaigns.forEach((campaign, index) => {
      console.log(`Campaign ${index + 1}:`, {
        id: campaign.id,
        name: campaign.name,
        recipientType: campaign.recipientType,
        textContent: campaign.textContent, // Where we stored customEmails
        htmlContent: campaign.htmlContent,
        subject: campaign.subject
      })
    })

    return NextResponse.json({
      message: 'Debug data logged to console',
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        recipientType: c.recipientType,
        textContent: c.textContent,
        htmlContent: c.htmlContent,
        subject: c.subject,
        createdAt: c.createdAt
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
} 