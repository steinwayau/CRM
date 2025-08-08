import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const res = await fetch(`${request.nextUrl.origin}/api/auth/status`, { headers: { cookie: request.headers.get('cookie') || '' } })
    if (!res.ok) return false
    const data = await res.json()
    return !!(data?.authenticated && data?.role === 'admin')
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const campaignId = body?.campaignId as string | undefined

    let result
    if (campaignId) {
      result = await sql`DELETE FROM email_tracking WHERE campaign_id = ${campaignId}`
    } else {
      result = await sql`TRUNCATE TABLE email_tracking`
    }

    return NextResponse.json({ ok: true, campaignId: campaignId || null })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
} 