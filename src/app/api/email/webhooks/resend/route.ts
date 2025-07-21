import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Resend Webhook Handler
// Handles email delivery events from Resend
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-resend-signature')
    
    // Verify webhook signature (recommended for production)
    // const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    // if (webhookSecret && signature) {
    //   const expectedSignature = crypto
    //     .createHmac('sha256', webhookSecret)
    //     .update(body)
    //     .digest('hex')
    //   
    //   if (signature !== expectedSignature) {
    //     console.error('Invalid webhook signature')
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    //   }
    // }

    const event = JSON.parse(body)
    console.log('Resend webhook received:', event)

    // Handle different event types
    switch (event.type) {
      case 'email.sent':
        await handleEmailSent(event)
        break
        
      case 'email.delivered':
        await handleEmailDelivered(event)
        break
        
      case 'email.delivery_delayed':
        await handleEmailDelayed(event)
        break
        
      case 'email.complained':
        await handleEmailComplained(event)
        break
        
      case 'email.bounced':
        await handleEmailBounced(event)
        break
        
      case 'email.opened':
        await handleEmailOpened(event)
        break
        
      case 'email.clicked':
        await handleEmailClicked(event)
        break
        
      default:
        console.log('Unknown event type:', event.type)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleEmailSent(event: any) {
  console.log('Email sent:', event.data)
  
  // TODO: Update campaign status
  // await db.emailDeliveries.create({
  //   data: {
  //     messageId: event.data.message_id,
  //     recipientEmail: event.data.to[0],
  //     status: 'sent',
  //     sentAt: new Date(event.created_at)
  //   }
  // })
}

async function handleEmailDelivered(event: any) {
  console.log('Email delivered:', event.data)
  
  // TODO: Update delivery status
  // await db.emailDeliveries.updateMany({
  //   where: { messageId: event.data.message_id },
  //   data: {
  //     status: 'delivered',
  //     deliveredAt: new Date(event.created_at)
  //   }
  // })
}

async function handleEmailDelayed(event: any) {
  console.log('Email delayed:', event.data)
  
  // TODO: Update delivery status
  // await db.emailDeliveries.updateMany({
  //   where: { messageId: event.data.message_id },
  //   data: {
  //     status: 'delayed',
  //     delayReason: event.data.reason
  //   }
  // })
}

async function handleEmailComplained(event: any) {
  console.log('Email complaint (spam):', event.data)
  
  // TODO: Mark recipient as complained and update lists
  // await db.customers.updateMany({
  //   where: { email: event.data.email },
  //   data: {
  //     emailStatus: 'complained',
  //     doNotEmail: true,
  //     complainedAt: new Date(event.created_at)
  //   }
  // })
  
  // TODO: Log complaint for campaign analytics
  // await db.emailComplaints.create({
  //   data: {
  //     messageId: event.data.message_id,
  //     recipientEmail: event.data.email,
  //     complainedAt: new Date(event.created_at)
  //   }
  // })
}

async function handleEmailBounced(event: any) {
  console.log('Email bounced:', event.data)
  
  const isHardBounce = event.data.bounce_type === 'hard'
  
  // TODO: Update recipient status based on bounce type
  // if (isHardBounce) {
  //   await db.customers.updateMany({
  //     where: { email: event.data.email },
  //     data: {
  //       emailStatus: 'bounced',
  //       doNotEmail: true,
  //       bouncedAt: new Date(event.created_at)
  //     }
  //   })
  // }
  
  // TODO: Log bounce for analytics
  // await db.emailBounces.create({
  //   data: {
  //     messageId: event.data.message_id,
  //     recipientEmail: event.data.email,
  //     bounceType: event.data.bounce_type,
  //     bounceReason: event.data.bounce_reason,
  //     bouncedAt: new Date(event.created_at)
  //   }
  // })
}

async function handleEmailOpened(event: any) {
  console.log('Email opened via webhook:', event.data)
  
  // TODO: Log email open (alternative to tracking pixel)
  // await db.emailOpens.create({
  //   data: {
  //     messageId: event.data.message_id,
  //     recipientEmail: event.data.email,
  //     openedAt: new Date(event.created_at),
  //     source: 'webhook'
  //   }
  // })
}

async function handleEmailClicked(event: any) {
  console.log('Email clicked via webhook:', event.data)
  
  // TODO: Log email click (alternative to redirect tracking)
  // await db.emailClicks.create({
  //   data: {
  //     messageId: event.data.message_id,
  //     recipientEmail: event.data.email,
  //     clickedUrl: event.data.url,
  //     clickedAt: new Date(event.created_at),
  //     source: 'webhook'
  //   }
  // })
} 