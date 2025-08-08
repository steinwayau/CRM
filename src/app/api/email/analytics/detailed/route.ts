import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic and prevent caching
export const dynamic = 'force-dynamic'
const noStore = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
}

// Simple UA classifier
function classifyUA(ua: string) {
  const u = (ua || '').toLowerCase()
  const client = u.includes('applewebkit') && u.includes('mobile') ? 'Apple Mail (iOS)' :
    u.includes('iphone') ? 'Apple Mail (iPhone)' :
    u.includes('ipad') ? 'Apple Mail (iPad)' :
    u.includes('mac') && u.includes('mail') ? 'Apple Mail (Mac)' :
    u.includes('gmail') || u.includes('googleimageproxy') ? 'Gmail' :
    u.includes('outlook') ? 'Outlook' :
    u.includes('thunderbird') ? 'Thunderbird' :
    u.includes('android') ? 'Android Mail' : 'Other'
  const device = u.includes('iphone') || u.includes('android') || (u.includes('mobile') && !u.includes('ipad')) ? 'Mobile' :
    u.includes('ipad') ? 'Tablet' : 'Desktop'
  return { client, device }
}

// DETAILED EMAIL ANALYTICS API - Click breakdowns by type + clients/devices/domains/timeline
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const start = searchParams.get('start') || null
    const end = searchParams.get('end') || null
    const q = searchParams.get('q') || ''
    
    if (campaignId) {
      const detailedAnalytics = await getCampaignDetailedAnalytics(campaignId)
      return NextResponse.json(detailedAnalytics, { headers: noStore })
    } else {
      const overallDetailed = await getOverallDetailedAnalytics({ start, end, q })
      return NextResponse.json(overallDetailed, { headers: noStore })
    }
    
  } catch (error) {
    console.error('❌ DETAILED ANALYTICS: API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch detailed analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: noStore })
  }
}

// Get detailed analytics for a specific campaign
async function getCampaignDetailedAnalytics(campaignId: string) {
  try {
    // Click breakdown by type
    const clickBreakdown = await sql`
      SELECT 
        link_type,
        COUNT(*) as clicks,
        COUNT(DISTINCT recipient_email) as unique_users,
        array_agg(DISTINCT target_url) as sample_urls
      FROM email_tracking 
      WHERE campaign_id = ${campaignId} AND event_type = 'click'
      GROUP BY link_type
      ORDER BY clicks DESC
    `
    
    // Recent activity
    const recentActivity = await sql`
      SELECT 
        event_type,
        link_type,
        target_url,
        recipient_email,
        created_at,
        user_agent
      FROM email_tracking 
      WHERE campaign_id = ${campaignId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    // Domains (unique recipients by domain)
    const domainRows = await sql`
      SELECT 
        split_part(recipient_email, '@', 2) AS domain,
        COUNT(DISTINCT recipient_email) AS unique_users,
        COUNT(*) AS events
      FROM email_tracking
      WHERE campaign_id = ${campaignId} AND recipient_email <> ''
      GROUP BY domain
      ORDER BY unique_users DESC
      LIMIT 20
    `

    // Timeline by minute for last 24h
    const timelineRows = await sql`
      SELECT date_trunc('minute', created_at) AS ts,
             event_type,
             COUNT(*) AS count
      FROM email_tracking
      WHERE campaign_id = ${campaignId}
        AND created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY ts, event_type
      ORDER BY ts ASC
    `

    // Client/device breakdown from recent UA sample (last 500 events)
    const uaRows = await sql`
      SELECT user_agent
      FROM email_tracking
      WHERE campaign_id = ${campaignId}
      ORDER BY created_at DESC
      LIMIT 500
    `
    const clientCounts: Record<string, number> = {}
    const deviceCounts: Record<string, number> = {}
    uaRows.rows.forEach(r => {
      const { client, device } = classifyUA(r.user_agent || '')
      clientCounts[client] = (clientCounts[client] || 0) + 1
      deviceCounts[device] = (deviceCounts[device] || 0) + 1
    })

    return {
      campaignId,
      clickBreakdown: clickBreakdown.rows.map(row => ({
        linkType: row.link_type || 'unknown',
        clicks: parseInt(row.clicks),
        uniqueUsers: parseInt(row.unique_users),
        sampleUrls: row.sample_urls || []
      })),
      domains: domainRows.rows.map(row => ({
        domain: row.domain || 'unknown',
        uniqueUsers: parseInt(row.unique_users),
        events: parseInt(row.events)
      })),
      clients: Object.entries(clientCounts).map(([k, v]) => ({ client: k, events: v as number })).sort((a, b) => b.events - a.events),
      devices: Object.entries(deviceCounts).map(([k, v]) => ({ device: k, events: v as number })).sort((a, b) => b.events - a.events),
      timeline: timelineRows.rows.map(row => ({
        ts: row.ts,
        type: row.event_type,
        count: parseInt(row.count)
      })),
      recentActivity: recentActivity.rows.map(row => ({
        type: row.event_type,
        linkType: row.link_type,
        url: row.target_url,
        email: row.recipient_email,
        timestamp: row.created_at
      })),
      found: true
    }
    
  } catch (error) {
    console.error('❌ DETAILED ANALYTICS: Campaign error:', error)
    return {
      campaignId,
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get overall detailed analytics across all campaigns
async function getOverallDetailedAnalytics({ start, end, q }: { start: string | null, end: string | null, q: string }) {
  try {
    const filtersActive = !!(start || end || (q && q.trim() !== ''))
    if (!filtersActive) {
      // Legacy (unfiltered) behavior to guarantee historical visibility
      const overallClickBreakdown = await sql`
        SELECT 
          link_type,
          COUNT(*) as total_clicks,
          COUNT(DISTINCT recipient_email) as unique_users,
          COUNT(DISTINCT campaign_id) as campaigns_with_type,
          array_agg(DISTINCT target_url) as sample_urls
        FROM email_tracking 
        WHERE event_type = 'click'
        GROUP BY link_type
        ORDER BY total_clicks DESC
      `
      const topUrls = await sql`
        SELECT 
          target_url,
          link_type,
          COUNT(*) as clicks,
          COUNT(DISTINCT recipient_email) as unique_users
        FROM email_tracking 
        WHERE event_type = 'click' AND target_url IS NOT NULL
        GROUP BY target_url, link_type
        ORDER BY clicks DESC
        LIMIT 10
      `
      const overallDomains = await sql`
        SELECT 
          split_part(recipient_email, '@', 2) AS domain,
          COUNT(DISTINCT recipient_email) AS unique_users,
          COUNT(*) AS events
        FROM email_tracking
        WHERE recipient_email <> ''
        GROUP BY domain
        ORDER BY unique_users DESC
        LIMIT 20
      `
      const uaRows = await sql`
        SELECT user_agent
        FROM email_tracking
        ORDER BY created_at DESC
        LIMIT 1000
      `
      const clientCounts: Record<string, number> = {}
      const deviceCounts: Record<string, number> = {}
      uaRows.rows.forEach(r => {
        const { client, device } = classifyUA(r.user_agent || '')
        clientCounts[client] = (clientCounts[client] || 0) + 1
        deviceCounts[device] = (deviceCounts[device] || 0) + 1
      })
      const timelineRows = await sql`
        SELECT date_trunc('minute', created_at) AS ts,
               event_type,
               COUNT(*) AS count
        FROM email_tracking
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY ts, event_type
        ORDER BY ts ASC
      `
      return {
        summary: {
          clickBreakdown: overallClickBreakdown.rows.map(row => ({
            linkType: row.link_type || 'unknown',
            totalClicks: parseInt(row.total_clicks),
            uniqueUsers: parseInt(row.unique_users),
            campaignsWithType: parseInt(row.campaigns_with_type),
            sampleUrls: row.sample_urls || []
          })),
          topUrls: topUrls.rows.map(row => ({
            url: row.target_url,
            linkType: row.link_type,
            clicks: parseInt(row.clicks),
            uniqueUsers: parseInt(row.unique_users)
          })),
          domains: overallDomains.rows.map(row => ({
            domain: row.domain || 'unknown',
            uniqueUsers: parseInt(row.unique_users),
            events: parseInt(row.events)
          })),
          clients: Object.entries(clientCounts).map(([k, v]) => ({ client: k, events: v as number })).sort((a, b) => b.events - a.events),
          devices: Object.entries(deviceCounts).map(([k, v]) => ({ device: k, events: v as number })).sort((a, b) => b.events - a.events),
          timeline: timelineRows.rows.map(row => ({ ts: row.ts, type: row.event_type, count: parseInt(row.count) }))
        },
        timestamp: new Date().toISOString()
      }
    }
    // Overall click breakdown by type
    const overallClickBreakdown = await sql`
      SELECT 
        link_type,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT recipient_email) as unique_users,
        COUNT(DISTINCT campaign_id) as campaigns_with_type,
        array_agg(DISTINCT target_url) as sample_urls
      FROM email_tracking et
      WHERE et.event_type = 'click'
        AND (${start} IS NULL OR et.created_at >= ${start}::timestamptz)
        AND (${end} IS NULL OR et.created_at <= ${end}::timestamptz)
        AND (${q} = '' OR EXISTS (SELECT 1 FROM email_campaigns ec WHERE ec.id = et.campaign_id AND (ec.name ILIKE '%' || ${q} || '%' OR ec.subject ILIKE '%' || ${q} || '%')))
      GROUP BY link_type
      ORDER BY total_clicks DESC
    `
    
    // Top clicked URLs
    const topUrls = await sql`
      SELECT 
        target_url,
        link_type,
        COUNT(*) as clicks,
        COUNT(DISTINCT recipient_email) as unique_users
      FROM email_tracking et
      WHERE et.event_type = 'click' AND et.target_url IS NOT NULL
        AND (${start} IS NULL OR et.created_at >= ${start}::timestamptz)
        AND (${end} IS NULL OR et.created_at <= ${end}::timestamptz)
        AND (${q} = '' OR EXISTS (SELECT 1 FROM email_campaigns ec WHERE ec.id = et.campaign_id AND (ec.name ILIKE '%' || ${q} || '%' OR ec.subject ILIKE '%' || ${q} || '%')))
      GROUP BY target_url, link_type
      ORDER BY clicks DESC
      LIMIT 10
    `

    // Top domains overall
    const overallDomains = await sql`
      SELECT 
        split_part(recipient_email, '@', 2) AS domain,
        COUNT(DISTINCT recipient_email) AS unique_users,
        COUNT(*) AS events
      FROM email_tracking et
      WHERE et.recipient_email <> ''
        AND (${start} IS NULL OR et.created_at >= ${start}::timestamptz)
        AND (${end} IS NULL OR et.created_at <= ${end}::timestamptz)
        AND (${q} = '' OR EXISTS (SELECT 1 FROM email_campaigns ec WHERE ec.id = et.campaign_id AND (ec.name ILIKE '%' || ${q} || '%' OR ec.subject ILIKE '%' || ${q} || '%')))
      GROUP BY domain
      ORDER BY unique_users DESC
      LIMIT 20
    `

    // Client/device sample overall (last 1000 events)
    const uaRows = await sql`
      SELECT user_agent
      FROM email_tracking et
      WHERE (${start} IS NULL OR et.created_at >= ${start}::timestamptz)
        AND (${end} IS NULL OR et.created_at <= ${end}::timestamptz)
        AND (${q} = '' OR EXISTS (SELECT 1 FROM email_campaigns ec WHERE ec.id = et.campaign_id AND (ec.name ILIKE '%' || ${q} || '%' OR ec.subject ILIKE '%' || ${q} || '%')))
      ORDER BY et.created_at DESC
      LIMIT 1000
    `
    const clientCounts: Record<string, number> = {}
    const deviceCounts: Record<string, number> = {}
    uaRows.rows.forEach(r => {
      const { client, device } = classifyUA(r.user_agent || '')
      clientCounts[client] = (clientCounts[client] || 0) + 1
      deviceCounts[device] = (deviceCounts[device] || 0) + 1
    })

    // Overall timeline by minute (opens & clicks)
    const timelineRows = await sql`
      SELECT date_trunc('minute', created_at) AS ts,
             event_type,
             COUNT(*) AS count
      FROM email_tracking et
      WHERE (${start} IS NULL OR et.created_at >= ${start}::timestamptz)
        AND (${end} IS NULL OR et.created_at <= ${end}::timestamptz)
        AND (${q} = '' OR EXISTS (SELECT 1 FROM email_campaigns ec WHERE ec.id = et.campaign_id AND (ec.name ILIKE '%' || ${q} || '%' OR ec.subject ILIKE '%' || ${q} || '%')))
      GROUP BY ts, event_type
      ORDER BY ts ASC
    `

    return {
      summary: {
        clickBreakdown: overallClickBreakdown.rows.map(row => ({
          linkType: row.link_type || 'unknown',
          totalClicks: parseInt(row.total_clicks),
          uniqueUsers: parseInt(row.unique_users),
          campaignsWithType: parseInt(row.campaigns_with_type),
          sampleUrls: row.sample_urls || []
        })),
        topUrls: topUrls.rows.map(row => ({
          url: row.target_url,
          linkType: row.link_type,
          clicks: parseInt(row.clicks),
          uniqueUsers: parseInt(row.unique_users)
        })),
        domains: overallDomains.rows.map(row => ({
          domain: row.domain || 'unknown',
          uniqueUsers: parseInt(row.unique_users),
          events: parseInt(row.events)
        })),
        clients: Object.entries(clientCounts).map(([k, v]) => ({ client: k, events: v as number })).sort((a, b) => b.events - a.events),
        devices: Object.entries(deviceCounts).map(([k, v]) => ({ device: k, events: v as number })).sort((a, b) => b.events - a.events),
        timeline: timelineRows.rows.map(row => ({ ts: row.ts, type: row.event_type, count: parseInt(row.count) }))
      },
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ DETAILED ANALYTICS: Overall error:', error)
    return {
      error: 'Failed to fetch overall detailed analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 