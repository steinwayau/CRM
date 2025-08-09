import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') || '20'))
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const where: any = { NOT: { status: 'deleted' } }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } }
      ]
    }
    if (start || end) {
      where.createdAt = {}
      if (start) (where.createdAt as any).gte = new Date(start)
      if (end) (where.createdAt as any).lte = new Date(end)
    }

    const [items, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, name: true, subject: true, status: true, sentCount: true, createdAt: true }
      }),
      prisma.emailCampaign.count({ where })
    ])

    return NextResponse.json({ items, total, page, pageSize })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 