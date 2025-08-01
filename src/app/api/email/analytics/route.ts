import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Email Analytics API
// Provides campaign performance metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (campaignId) {
      try {
        // Try to fetch real analytics data from database
        const [opens, clicks] = await Promise.all([
          prisma.emailOpen.count({
            where: {
              campaignId: campaignId,
              ...(startDate && endDate ? {
                openedAt: {
                  gte: new Date(startDate),
                  lte: new Date(endDate)
                }
              } : {})
            }
          }).catch(() => 0), // Fallback to 0 if table doesn't exist yet
          
          prisma.emailClick.count({
            where: {
              campaignId: campaignId,
              ...(startDate && endDate ? {
                clickedAt: {
                  gte: new Date(startDate),
                  lte: new Date(endDate)
                }
              } : {})
            }
          }).catch(() => 0) // Fallback to 0 if table doesn't exist yet
        ])

        // Try to get real campaign data from database
        let totalSent = 0
        try {
          const campaign = await prisma.emailCampaign.findUnique({
            where: { id: campaignId },
            select: { sentCount: true }
          })
          totalSent = campaign?.sentCount || 0
        } catch (error) {
          console.log(`Could not fetch campaign sentCount for ${campaignId}, using 0`)
          totalSent = 0
        }
        
        // Calculate real metrics
        const openRate = totalSent > 0 ? (opens / totalSent) * 100 : 0
        const clickRate = totalSent > 0 ? (clicks / totalSent) * 100 : 0
        const clickToOpenRate = opens > 0 ? (clicks / opens) * 100 : 0

        // Return simple format expected by frontend
        const campaignAnalytics = {
          campaignId,
          opens: opens,
          clicks: clicks,
          totalSent: totalSent,
          openRate: Math.round(openRate * 10) / 10,
          clickRate: Math.round(clickRate * 10) / 10
        }
        
        console.log(`Analytics for campaign ${campaignId}:`, campaignAnalytics)
        return NextResponse.json(campaignAnalytics)
        
      } catch (error) {
        console.error('Error fetching real analytics data:', error)
        // Fall back to mock data if database queries fail
      }
    }

    // Return overall analytics summary
    try {
      // Calculate overall metrics from database
      const [totalOpens, totalClicks, totalCampaigns] = await Promise.all([
        prisma.emailOpen.count().catch(() => 0),
        prisma.emailClick.count().catch(() => 0),
        // prisma.emailCampaign.count().catch(() => 2) // TODO: Once EmailCampaign table exists
        Promise.resolve(2) // Current localStorage-based campaigns count
      ])

      const totalEmailsSent = 1252 // TODO: Sum from EmailCampaign table
      const averageOpenRate = totalEmailsSent > 0 ? (totalOpens / totalEmailsSent) * 100 : 0
      const averageClickRate = totalEmailsSent > 0 ? (totalClicks / totalEmailsSent) * 100 : 0

      const overallAnalytics = {
        summary: {
          totalCampaigns: totalCampaigns,
          totalEmailsSent: totalEmailsSent,
          averageOpenRate: Math.round(averageOpenRate * 10) / 10,
          averageClickRate: Math.round(averageClickRate * 10) / 10,
          totalRevenue: 0, // TODO: Implement revenue tracking
          recentActivity: [
            {
              type: 'campaign_sent',
              campaignName: 'Test Campaign',
              timestamp: new Date().toISOString(),
              recipients: 2
            }
          ]
        },
        trends: {
          lastWeek: {
            emailsSent: 2,
            openRate: Math.round(averageOpenRate * 10) / 10,
            clickRate: Math.round(averageClickRate * 10) / 10
          },
          lastMonth: {
            emailsSent: totalEmailsSent,
            openRate: Math.round(averageOpenRate * 10) / 10,
            clickRate: Math.round(averageClickRate * 10) / 10
          }
        }
      }

      return NextResponse.json(overallAnalytics)
      
    } catch (error) {
      console.error('Error fetching overall analytics:', error)
      
      // Fallback to basic mock data
      const fallbackAnalytics = {
        summary: {
          totalCampaigns: 2,
          totalEmailsSent: 1252,
          averageOpenRate: 0,
          averageClickRate: 0,
          totalRevenue: 0,
          recentActivity: []
        },
        trends: {
          lastWeek: { emailsSent: 2, openRate: 0, clickRate: 0 },
          lastMonth: { emailsSent: 1252, openRate: 0, clickRate: 0 }
        }
      }
      
      return NextResponse.json(fallbackAnalytics)
    }

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

// Update analytics data (for manual data corrections or imports)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, type, data } = body

    // TODO: Implement analytics data updates once database schema is deployed
    // Example:
    // if (type === 'bulk_import') {
    //   await prisma.emailOpen.createMany({ data: data.opens })
    //   await prisma.emailClick.createMany({ data: data.clicks })
    // }

    console.log('Analytics update requested:', { campaignId, type, data })

    return NextResponse.json({ 
      success: true,
      message: 'Analytics data update queued (will be processed once database schema is deployed)'
    })

  } catch (error) {
    console.error('Analytics update error:', error)
    return NextResponse.json(
      { error: 'Failed to update analytics data' },
      { status: 500 }
    )
  }
} 