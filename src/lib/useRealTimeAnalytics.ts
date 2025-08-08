import { useEffect, useRef, useState } from 'react'
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

  // Keep latest callbacks in refs to avoid resubscribe churn
  const analyticsCbRef = useRef<typeof onAnalyticsUpdate>()
  const campaignCbRef = useRef<typeof onCampaignUpdate>()
  analyticsCbRef.current = onAnalyticsUpdate
  campaignCbRef.current = onCampaignUpdate

  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize Pusher client once
    if (pusherRef.current) return

    const pusher = new Pusher(PUSHER_CONFIG.key, {
      cluster: PUSHER_CONFIG.cluster,
      forceTLS: PUSHER_CONFIG.forceTLS
    })
    pusherRef.current = pusher

    // Track connection state reactively
    const handleStateChange = () => {
      setIsConnected(pusher.connection.state === 'connected')
    }
    pusher.connection.bind('state_change', handleStateChange)

    // Subscribe to analytics updates
    analyticsChannelRef.current = pusher.subscribe(CHANNELS.ANALYTICS)
    analyticsChannelRef.current.bind(EVENTS.ANALYTICS_UPDATED, (data: AnalyticsUpdate) => {
      if (analyticsCbRef.current) {
        analyticsCbRef.current(data)
      }
    })

    // Subscribe to campaign updates
    campaignChannelRef.current = pusher.subscribe(CHANNELS.CAMPAIGNS)
    campaignChannelRef.current.bind(EVENTS.CAMPAIGN_UPDATED, (data: CampaignUpdate) => {
      if (campaignCbRef.current) {
        campaignCbRef.current(data)
      }
    })

    // Initial connection log
    pusher.connection.bind('connected', () => {
      setIsConnected(true)
      console.log('✅ REAL-TIME: Successfully connected to Pusher!')
    })
    pusher.connection.bind('disconnected', () => {
      setIsConnected(false)
      console.log('❌ REAL-TIME: Disconnected from Pusher')
    })
    pusher.connection.bind('failed', () => {
      setIsConnected(false)
      console.log('❌ REAL-TIME: Failed to connect to Pusher')
    })

    console.log('🔌 REAL-TIME: Pusher initialized, waiting for connection...')

    // Cleanup function
    return () => {
      if (analyticsChannelRef.current) {
        analyticsChannelRef.current.unbind_all()
        pusher.unsubscribe(CHANNELS.ANALYTICS)
      }
      if (campaignChannelRef.current) {
        campaignChannelRef.current.unbind_all()
        pusher.unsubscribe(CHANNELS.CAMPAIGNS)
      }
      pusher.connection.unbind('state_change', handleStateChange)
      pusher.disconnect()
      console.log('🔌 REAL-TIME: Disconnected from Pusher')
    }
  }, [])

  return {
    isConnected
  }
} 