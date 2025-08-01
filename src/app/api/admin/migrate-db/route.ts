import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Check if email_campaigns table exists by trying to count records
    try {
      await prisma.emailCampaign.count()
      return NextResponse.json({ 
        message: 'Database tables already exist', 
        status: 'up-to-date' 
      })
    } catch (error) {
      // Table doesn't exist, need to create it
      console.log('Email campaigns table missing, running migration...')
    }

    // Use raw SQL to create the missing table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "email_campaigns" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "templateId" TEXT NOT NULL,
        "templateName" TEXT,
        "htmlContent" TEXT,
        "textContent" TEXT,
        "recipientType" TEXT NOT NULL,
        "recipientCount" INTEGER NOT NULL DEFAULT 0,
        "sentCount" INTEGER NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "scheduledAt" TIMESTAMP(3),
        "sentAt" TIMESTAMP(3),
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
      );
    `

    // Create other missing tables for email tracking
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "email_opens" (
        "id" TEXT NOT NULL,
        "campaignId" TEXT NOT NULL,
        "recipientId" TEXT,
        "recipientEmail" TEXT NOT NULL,
        "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT,

        CONSTRAINT "email_opens_pkey" PRIMARY KEY ("id")
      );
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "email_clicks" (
        "id" TEXT NOT NULL,
        "campaignId" TEXT NOT NULL,
        "recipientId" TEXT,
        "recipientEmail" TEXT NOT NULL,
        "clickedUrl" TEXT NOT NULL,
        "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,

        CONSTRAINT "email_clicks_pkey" PRIMARY KEY ("id")
      );
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "email_bounces" (
        "id" TEXT NOT NULL,
        "campaignId" TEXT NOT NULL,
        "recipientId" TEXT,
        "recipientEmail" TEXT NOT NULL,
        "bounceType" TEXT NOT NULL,
        "bounceReason" TEXT,
        "bouncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "email_bounces_pkey" PRIMARY KEY ("id")
      );
    `

    return NextResponse.json({ 
      message: 'Database migration completed successfully',
      status: 'migrated',
      tables: ['email_campaigns', 'email_opens', 'email_clicks', 'email_bounces']
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 