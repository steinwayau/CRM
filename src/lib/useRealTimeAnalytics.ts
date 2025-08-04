import { useEffect, useRef } from 'react'
import Pusher from 'pusher-js'

// Client-side Pusher configuration
const PUSHER_CONFIG = {
  key: 'dcf1eb82caa4023f89e2',
  cluster: 'ap1',
  forceTLS: true
}

const CHANNELS = {
  ANALYTICS: 'analytics-updates',
  CAMPAIGNS: 'campaign-updates'
}

const EVENTS = {
  ANALYTICS_UPDATED: 'analytics-updated',
  CAMPAIGN_UPDATED: 'campaign-updated'
}

export interface AnalyticsUpdate {
  campaignId: string
  analytics: any
  timestamp: string
}

export interface CampaignUpdate {
  campaign: any
  timestamp: string
}

export function useRealTimeAnalytics(
  onAnalyticsUpdate?: (update: AnalyticsUpdate) => void,
  onCampaignUpdate?: (update: CampaignUpdate) => void
) {
  const pusherRef = useRef<Pusher | null>(null)
  const analyticsChannelRef = useRef<any>(null)
  const campaignChannelRef = useRef<any>(null)

  useEffect(() => {
    // Initialize Pusher client
    pusherRef.current = new Pusher(PUSHER_CONFIG.key, {
      cluster: PUSHER_CONFIG.cluster,
      forceTLS: PUSHER_CONFIG.forceTLS
    })

    // Subscribe to analytics updates
    if (onAnalyticsUpdate) {
      analyticsChannelRef.current = pusherRef.current.subscribe(CHANNELS.ANALYTICS)
      analyticsChannelRef.current.bind(EVENTS.ANALYTICS_UPDATED, (data: AnalyticsUpdate) => {
        console.log('📡 REAL-TIME: Received analytics update:', data)
        onAnalyticsUpdate(data)
      })
    }

    // Subscribe to campaign updates
    if (onCampaignUpdate) {
      campaignChannelRef.current = pusherRef.current.subscribe(CHANNELS.CAMPAIGNS)
      campaignChannelRef.current.bind(EVENTS.CAMPAIGN_UPDATED, (data: CampaignUpdate) => {
        console.log('📡 REAL-TIME: Received campaign update:', data)
        onCampaignUpdate(data)
      })
    }

    console.log('🔌 REAL-TIME: Initializing Pusher connection...')
    
    // Add connection state logging
    pusherRef.current.connection.bind('connected', () => {
      console.log('✅ REAL-TIME: Successfully connected to Pusher!')
    })
    
    pusherRef.current.connection.bind('disconnected', () => {
      console.log('❌ REAL-TIME: Disconnected from Pusher')
    })
    
    pusherRef.current.connection.bind('failed', () => {
      console.log('❌ REAL-TIME: Failed to connect to Pusher')
    })
    
    console.log('🔌 REAL-TIME: Pusher initialized, waiting for connection...')

    // Cleanup function
    return () => {
      if (analyticsChannelRef.current) {
        analyticsChannelRef.current.unbind_all()
        pusherRef.current?.unsubscribe(CHANNELS.ANALYTICS)
      }
      if (campaignChannelRef.current) {
        campaignChannelRef.current.unbind_all()
        pusherRef.current?.unsubscribe(CHANNELS.CAMPAIGNS)
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect()
      }
      console.log('🔌 REAL-TIME: Disconnected from Pusher')
    }
  }, [onAnalyticsUpdate, onCampaignUpdate])

  return {
    isConnected: pusherRef.current?.connection.state === 'connected'
  }
} 