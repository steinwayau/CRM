import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start') || undefined
    const end = searchParams.get('end') || undefined

    const overall = await sql`SELECT COUNT(*) AS total, COUNT(DISTINCT campaign_id) AS campaigns FROM email_tracking`
    const range = await sql`SELECT MIN(created_at) AS earliest, MAX(created_at) AS latest FROM email_tracking`

    let filtered
    if (start && end) {
      filtered = await sql`
        SELECT COUNT(*) AS total, COUNT(DISTINCT campaign_id) AS campaigns
        FROM email_tracking et
        WHERE et.created_at >= ${start}::timestamptz AND et.created_at <= ${end}::timestamptz
      `
    } else if (start) {
      filtered = await sql`
        SELECT COUNT(*) AS total, COUNT(DISTINCT campaign_id) AS campaigns
        FROM email_tracking et
        WHERE et.created_at >= ${start}::timestamptz
      `
    } else if (end) {
      filtered = await sql`
        SELECT COUNT(*) AS total, COUNT(DISTINCT campaign_id) AS campaigns
        FROM email_tracking et
        WHERE et.created_at <= ${end}::timestamptz
      `
    } else {
      filtered = overall
    }

    return NextResponse.json({
      overall: overall.rows[0],
      range: range.rows[0],
      filtered: filtered.rows[0],
      start: start ?? null,
      end: end ?? null
    }, { headers: { 'Cache-Control': 'no-store' }})
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
} 