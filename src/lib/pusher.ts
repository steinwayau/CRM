import Pusher from 'pusher'

// Server-side Pusher instance for broadcasting updates
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// Channel names for different types of updates
export const CHANNELS = {
  ANALYTICS: 'analytics-updates',
  CAMPAIGNS: 'campaign-updates'
}

// Event types
export const EVENTS = {
  ANALYTICS_UPDATED: 'analytics-updated',
  CAMPAIGN_UPDATED: 'campaign-updated'
}

// Helper function to broadcast analytics updates
export async function broadcastAnalyticsUpdate(campaignId: string, analytics: any) {
  try {
    await pusher.trigger(CHANNELS.ANALYTICS, EVENTS.ANALYTICS_UPDATED, {
      campaignId,
      analytics,
      timestamp: new Date().toISOString()
    })
    console.log(`📡 REAL-TIME: Broadcasted analytics update for campaign ${campaignId}`)
  } catch (error) {
    console.error('❌ REAL-TIME: Failed to broadcast analytics update:', error)
  }
}

// Helper function to broadcast campaign updates
export async function broadcastCampaignUpdate(campaign: any) {
  try {
    await pusher.trigger(CHANNELS.CAMPAIGNS, EVENTS.CAMPAIGN_UPDATED, {
      campaign,
      timestamp: new Date().toISOString()
    })
    console.log(`📡 REAL-TIME: Broadcasted campaign update for ${campaign.id}`)
  } catch (error) {
    console.error('❌ REAL-TIME: Failed to broadcast campaign update:', error)
  }
} 