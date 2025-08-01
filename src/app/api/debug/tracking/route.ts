import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sql } from '@vercel/postgres'

const prisma = new PrismaClient()

// Debug endpoint to check tracking data
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Checking tracking data in database...')
    
    // Check if tables exist and have data
    const [campaigns, opens, clicks] = await Promise.all([
      sql`SELECT id, name, "sentCount", status, "createdAt" FROM email_campaigns LIMIT 10`.catch((e: any) => ({ error: 'EmailCampaign table error', details: e.message })),
      
      // Use raw SQL since Prisma schema may not match database
      sql`SELECT id, campaign_id, recipient_email, opened_at FROM email_opens LIMIT 10`.catch((e: any) => ({ error: 'EmailOpen table error', details: e.message })),
      
      sql`SELECT id, campaign_id, recipient_email, target_url, clicked_at FROM email_clicks LIMIT 10`.catch((e: any) => ({ error: 'EmailClick table error', details: e.message }))
    ])

    // Count totals
    const [totalOpens, totalClicks] = await Promise.all([
      prisma.emailOpen.count().catch(() => 0),
      prisma.emailClick.count().catch(() => 0)
    ])

    const debugInfo = {
      timestamp: new Date().toISOString(),
      tables: {
        emailCampaigns: {
          count: (campaigns as any).rows ? (campaigns as any).rows.length : 'ERROR',
          data: (campaigns as any).rows || campaigns,
          error: !(campaigns as any).rows
        },
        emailOpens: {
          count: totalOpens,
          recent: (opens as any).rows || opens,
          error: !(opens as any).rows
        },
        emailClicks: {
          count: totalClicks,
          recent: (clicks as any).rows || clicks,
          error: !(clicks as any).rows
        }
      },
      summary: {
        campaignsInDB: (campaigns as any).rows ? (campaigns as any).rows.length : 0,
        totalOpens: totalOpens,
        totalClicks: totalClicks,
        trackingWorking: totalOpens > 0 || totalClicks > 0
      }
    }

    console.log('📊 TRACKING DEBUG RESULTS:', JSON.stringify(debugInfo, null, 2))
    
    return NextResponse.json(debugInfo)

  } catch (error) {
    console.error('❌ DEBUG ENDPOINT ERROR:', error)
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 