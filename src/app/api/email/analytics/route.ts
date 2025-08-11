import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function parseRange(range?: string) {
  const now = new Date()
  let from = new Date(now)
  switch (range) {
    case '7days': from.setDate(now.getDate() - 7); break
    case '90days': from.setDate(now.getDate() - 90); break
    case '1year': from.setFullYear(now.getFullYear() - 1); break
    case '30days':
    default: from.setDate(now.getDate() - 30); break
  }
  return { from, to: now }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId') || undefined
    if (campaignId) {
      // Per-campaign analytics (Golden-State compatible)
      const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } })
      const sentCount = campaign?.sentCount || 0
      const recipientCount = campaign?.recipientCount || 0

      // Unique opens and clicks by distinct recipientEmail
      const uniqueOpenEmails = await prisma.emailOpen.findMany({
        where: { campaignId },
        select: { recipientEmail: true },
        distinct: ['recipientEmail']
      })
      const uniqueClickEmails = await prisma.emailClick.findMany({
        where: { campaignId },
        select: { recipientEmail: true },
        distinct: ['recipientEmail']
      })
      const opens = uniqueOpenEmails.length
      const clicks = uniqueClickEmails.length

      // Robust denominator: prefer sentCount, then recipientCount, then distinct observed recipients
      const observedRecipients = new Set<string>([
        ...uniqueOpenEmails.map(r => r.recipientEmail),
        ...uniqueClickEmails.map(r => r.recipientEmail)
      ]).size
      const denom = Math.max(1, sentCount || recipientCount || observedRecipients)

      const openRate = Math.round((opens / denom) * 1000) / 10
      const clickRate = Math.round((clicks / denom) * 1000) / 10

      return NextResponse.json({
        campaignId,
        opens,
        clicks,
        openRate,
        clickRate,
        sentCount,
        recipientCount
      })
    }

    const range = searchParams.get('range') || '30days'
    const { from, to } = parseRange(range)

    // Overall email campaign analytics (Golden State behavior)
    const sentCampaigns = await prisma.emailCampaign.findMany({ where: { status: 'sent' }, select: { sentCount: true } })
    const totalEmailsSent = sentCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0)

    // Unique opens/clicks across all campaigns
    const uniqueOpenEmails = await prisma.emailOpen.findMany({ select: { recipientEmail: true }, distinct: ['recipientEmail'] })
    const uniqueClickEmails = await prisma.emailClick.findMany({ select: { recipientEmail: true }, distinct: ['recipientEmail'] })
    const uniqueOpens = uniqueOpenEmails.length
    const uniqueClicks = uniqueClickEmails.length

    const denom = Math.max(1, totalEmailsSent)
    const overallOpenRate = Math.round((uniqueOpens / denom) * 1000) / 10
    const overallClickRate = Math.round((uniqueClicks / denom) * 1000) / 10

    return NextResponse.json({
      summary: {
        totalEmailsSent,
        overallOpenRate,
        overallClickRate
      },
      timestamp: new Date().toISOString()
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load analytics' }, { status: 500 })
  }
} 