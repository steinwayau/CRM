import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

function startOfWeek(d = new Date()) {
	const day = d.getDay() || 7 // Sunday=0 → 7
	const start = new Date(d)
	start.setHours(0, 0, 0, 0)
	start.setDate(start.getDate() - (day - 1)) // Monday as start
	return start
}

export async function GET() {
	const prisma = new PrismaClient()
	try {
		const from = startOfWeek()
		const count = await prisma.enquiry.count({ where: { createdAt: { gte: from } } })
		return NextResponse.json({ from: from.toISOString(), count })
	} catch (e: any) {
		return NextResponse.json({ count: 0, error: e?.message || 'failed' }, { status: 200 })
	} finally {
		await prisma.$disconnect()
	}
} 