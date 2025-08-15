import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
	const prisma = new PrismaClient()
	try {
		const total = await prisma.enquiry.count()
		return NextResponse.json({ total })
	} catch (e: any) {
		return NextResponse.json({ total: 0, error: e?.message || 'failed' }, { status: 200 })
	} finally {
		await prisma.$disconnect()
	}
} 