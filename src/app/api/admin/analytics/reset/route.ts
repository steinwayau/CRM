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
    const start = body?.start as string | undefined
    const end = body?.end as string | undefined

    let result
    if (start || end || campaignId) {
      result = await sql`
        DELETE FROM email_tracking et
        WHERE (COALESCE(${start ?? null}::timestamptz, '-infinity'::timestamptz) <= et.created_at)
          AND (COALESCE(${end ?? null}::timestamptz, 'infinity'::timestamptz) >= et.created_at)
          AND (COALESCE(${campaignId ?? null}::text, '') = '' OR et.campaign_id = ${campaignId ?? ''})
      `
    } else {
      result = await sql`TRUNCATE TABLE email_tracking`
    }

    const deleted = (result as any)?.rowCount ?? null
    return NextResponse.json({ ok: true, deleted, campaignId: campaignId || null, start: start || null, end: end || null })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
} 