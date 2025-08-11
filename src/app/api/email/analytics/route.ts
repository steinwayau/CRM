import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sql } from '@vercel/postgres'

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
      // Per-campaign analytics using tracking table (authoritative)
      const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } })
      const sentCount = campaign?.sentCount || 0
      const recipientCount = campaign?.recipientCount || 0

      // Distinct opens/clicks by recipient from email_tracking
      const openRows = await sql`
        SELECT DISTINCT recipient_email FROM email_tracking WHERE campaign_id = ${campaignId} AND event_type = 'open'
      `
      const clickRows = await sql`
        SELECT DISTINCT recipient_email FROM email_tracking WHERE campaign_id = ${campaignId} AND event_type = 'click'
      `
      const opens = openRows.rows.length
      const clicks = clickRows.rows.length

      const observedRecipients = new Set<string>([
        ...openRows.rows.map(r => r.recipient_email),
        ...clickRows.rows.map(r => r.recipient_email)
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

    // 1) Original enquiries-based analytics payload (backwards compatible for /admin/analytics)
    let enquiriesPayload: any = {}
    try {
      const total = await prisma.enquiry.count()
      const thisMonthCount = await prisma.enquiry.count({ where: { createdAt: { gte: from, lte: to } } })
      const prevFrom = new Date(from)
      const periodDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) || 30
      prevFrom.setDate(prevFrom.getDate() - periodDays)
      const prevCount = await prisma.enquiry.count({ where: { createdAt: { gte: prevFrom, lt: from } } })
      const growth = prevCount === 0 ? 100 : Math.round(((thisMonthCount - prevCount) / Math.max(1, prevCount)) * 1000) / 10

      const rows = await prisma.enquiry.groupBy({ by: ['source'], _count: { _all: true } })
      const sourcesRaw = rows.map(r => ({ name: (r as any).source || 'Unknown', count: (r as any)._count._all }))
      const sourcesTotal = sourcesRaw.reduce((s, r) => s + r.count, 0) || 1
      const sources = sourcesRaw
        .sort((a,b)=> b.count - a.count)
        .map(r => ({ ...r, percentage: Math.round((r.count / sourcesTotal) * 100) }))

      const piRows = await prisma.enquiry.findMany({ select: { productInterest: true } })
      const productCounts: Record<string, number> = {}
      for (const row of piRows) {
        const interest = ((row as any).productInterest || 'Other').split(',').map((s: string) => s.trim()).filter(Boolean)
        if (interest.length === 0) interest.push('Other')
        for (const i of interest) productCounts[i] = (productCounts[i] || 0) + 1
      }
      const productsTotal = Object.values(productCounts).reduce((a,b)=>a+b,0) || 1
      const products = Object.entries(productCounts)
        .sort((a,b)=> b[1]-a[1])
        .slice(0,5)
        .map(([name,count]) => ({ name, count, percentage: Math.round((Number(count)/productsTotal)*100) }))

      const staffRows = await prisma.enquiry.groupBy({ by: ['submittedBy'], _count: { _all: true } })
      const staff = staffRows
        .filter(r => r.submittedBy)
        .map(r => ({ name: r.submittedBy as string, enquiries: (r as any)._count._all, rating: 4.6 }))
        .sort((a,b)=> b.enquiries - a.enquiries)

      const soldCount = await prisma.enquiry.count({ where: { status: 'Sold' } })
      const conversionRate = total === 0 ? 0 : Math.round((soldCount / total) * 1000) / 10

      enquiriesPayload = { enquiries: { total, thisMonth: thisMonthCount, growth, conversionRate }, sources, products, staff }
    } catch (e) {
      // Fallback zeros if legacy enquiries DB is unavailable
      enquiriesPayload = { enquiries: { total: 0, thisMonth: 0, growth: 0, conversionRate: 0 }, sources: [], products: [], staff: [] }
    }

    // 2) Email-campaign summary for dashboard tiles (opens/clicks from tracking table)
    let totalEmailsSent = 0
    try {
      const sentCampaigns = await prisma.emailCampaign.findMany({ where: { status: 'sent' }, select: { sentCount: true } })
      totalEmailsSent = sentCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0)
    } catch {}

    const openOverall = await sql`SELECT COUNT(DISTINCT recipient_email) AS cnt FROM email_tracking WHERE event_type = 'open'`
    const clickOverall = await sql`SELECT COUNT(DISTINCT recipient_email) AS cnt FROM email_tracking WHERE event_type = 'click'`
    const uniqueOpens = parseInt((openOverall.rows[0] as any)?.cnt || '0')
    const uniqueClicks = parseInt((clickOverall.rows[0] as any)?.cnt || '0')

    const denom = Math.max(1, totalEmailsSent)
    const overallOpenRate = Math.round((uniqueOpens / denom) * 1000) / 10
    const overallClickRate = Math.round((uniqueClicks / denom) * 1000) / 10

    return NextResponse.json({
      ...enquiriesPayload,
      summary: { totalEmailsSent, overallOpenRate, overallClickRate },
      timestamp: new Date().toISOString()
    })
  } catch (e: any) {
    // Absolute fallback: never hard-fail UI
    return NextResponse.json({
      enquiries: { total: 0, thisMonth: 0, growth: 0, conversionRate: 0 },
      sources: [],
      products: [],
      staff: [],
      summary: { totalEmailsSent: 0, overallOpenRate: 0, overallClickRate: 0 },
      error: e.message || 'Failed to load analytics'
    })
  }
} 