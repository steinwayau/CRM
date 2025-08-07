import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const pusherConfig = {
      hasPusherAppId: !!process.env.PUSHER_APP_ID,
      hasPusherKey: !!process.env.PUSHER_KEY,
      hasPusherSecret: !!process.env.PUSHER_SECRET,
      hasPusherCluster: !!process.env.PUSHER_CLUSTER,
      
      // Show first few characters for verification (but not the full secrets)
      pusherAppIdPrefix: process.env.PUSHER_APP_ID ? process.env.PUSHER_APP_ID.substring(0, 4) + '...' : 'NOT_SET',
      pusherKeyPrefix: process.env.PUSHER_KEY ? process.env.PUSHER_KEY.substring(0, 8) + '...' : 'NOT_SET',
      pusherCluster: process.env.PUSHER_CLUSTER || 'NOT_SET',
      
      allConfigured: !!(
        process.env.PUSHER_APP_ID && 
        process.env.PUSHER_KEY && 
        process.env.PUSHER_SECRET && 
        process.env.PUSHER_CLUSTER
      ),
      
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(pusherConfig)
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check Pusher configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 