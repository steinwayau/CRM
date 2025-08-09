import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const overall = await sql`SELECT COUNT(*) AS total, COUNT(DISTINCT campaign_id) AS campaigns FROM email_tracking`
    const range = await sql`SELECT MIN(created_at) AS earliest, MAX(created_at) AS latest FROM email_tracking`

    const filtered = await sql`
      SELECT COUNT(*) AS total, COUNT(DISTINCT campaign_id) AS campaigns
      FROM email_tracking et
      WHERE (${start} IS NULL OR et.created_at >= ${start}::timestamptz)
        AND (${end} IS NULL OR et.created_at <= ${end}::timestamptz)
    `

    return NextResponse.json({
      overall: overall.rows[0],
      range: range.rows[0],
      filtered: filtered.rows[0],
      start,
      end
    }, { headers: { 'Cache-Control': 'no-store' }})
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
} 