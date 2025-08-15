import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
	const prisma = new PrismaClient()
	try {
		const count = await prisma.staff.count({ where: { isActive: true } })
		return NextResponse.json({ count })
	} catch (e: any) {
		return NextResponse.json({ count: 0, error: e?.message || 'failed' }, { status: 200 })
	} finally {
		await prisma.$disconnect()
	}
} 