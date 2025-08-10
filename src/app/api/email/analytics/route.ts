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
    const range = searchParams.get('range') || '30days'
    const { from, to } = parseRange(range)

    // Enquiries totals
    const total = await prisma.enquiry.count()
    const thisMonthCount = await prisma.enquiry.count({ where: { createdAt: { gte: from, lte: to } } })

    // Growth vs previous period
    const prevFrom = new Date(from)
    const prevTo = new Date(from)
    prevFrom.setDate(prevFrom.getDate() - (to.getTime() - from.getTime()) / (1000*60*60*24))
    const prevCount = await prisma.enquiry.count({ where: { createdAt: { gte: prevFrom, lt: from } } })
    const growth = prevCount === 0 ? 100 : Math.round(((thisMonthCount - prevCount) / Math.max(1, prevCount)) * 1000) / 10

    // Sources breakdown
    const rows = await prisma.enquiry.groupBy({ by: ['source'], _count: { _all: true } })
    const sourcesRaw = rows.map(r => ({ name: r.source || 'Unknown', count: r._count._all }))
    const sourcesTotal = sourcesRaw.reduce((s, r) => s + r.count, 0) || 1
    const sources = sourcesRaw
      .sort((a,b)=> b.count - a.count)
      .map(r => ({ ...r, percentage: Math.round((r.count / sourcesTotal) * 100) }))

    // Product interest breakdown (from productInterest string)
    const piRows = await prisma.enquiry.findMany({ select: { productInterest: true } })
    const productCounts: Record<string, number> = {}
    for (const row of piRows) {
      const interest = (row.productInterest || 'Other').split(',').map(s => s.trim()).filter(Boolean)
      if (interest.length === 0) interest.push('Other')
      for (const i of interest) productCounts[i] = (productCounts[i] || 0) + 1
    }
    const productsTotal = Object.values(productCounts).reduce((a,b)=>a+b,0) || 1
    const products = Object.entries(productCounts)
      .sort((a,b)=> b[1]-a[1])
      .slice(0,5)
      .map(([name,count]) => ({ name, count, percentage: Math.round((count/productsTotal)*100) }))

    // Staff performance: enquiries handled by submittedBy
    const staffRows = await prisma.enquiry.groupBy({ by: ['submittedBy'], _count: { _all: true } })
    const staff = staffRows
      .filter(r => r.submittedBy)
      .map(r => ({ name: r.submittedBy as string, enquiries: r._count._all, rating: 4.6 }))
      .sort((a,b)=> b.enquiries - a.enquiries)

    // Simple conversion rate: percentage of enquiries with status "Sold"
    const soldCount = await prisma.enquiry.count({ where: { status: 'Sold' } })
    const conversionRate = total === 0 ? 0 : Math.round((soldCount / total) * 1000) / 10

    return NextResponse.json({
      enquiries: { total, thisMonth: thisMonthCount, growth, conversionRate },
      sources,
      products,
      staff
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load analytics' }, { status: 500 })
  }
} 