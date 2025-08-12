import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

// GET - Retrieve system settings
export async function GET() {
  try {
    const rows = await prisma.systemSetting.findMany({
      select: { key: true, value: true, type: true }
    })

    const settings: Record<string, any> = {}
    rows.forEach(({ key, value, type }) => {
      if (type === 'boolean') {
        settings[key] = value === 'true'
      } else if (type === 'number') {
        settings[key] = parseInt(value, 10)
      } else {
        settings[key] = value
      }
    })

    // Set defaults if not found
    const defaultSettings = {
      siteName: 'EPG CRM System',
      sessionTimeout: '30 minutes',
      maxFileSize: '10MB',
      emailNotifications: true,
      autoBackup: true,
      maintenanceMode: false,
      footerEnabled: false,
      footerLogoUrl: '',
      footerPhoneLabel: 'National Information Line 1300 199 589',
      footerFacebook: 'https://www.facebook.com/steinwayaustralia',
      footerInstagram: 'https://www.instagram.com/steinwaygalleriesaustralia/?hl=en',
      footerYouTube: 'https://www.youtube.com/@steinwaygalleriesaustralia8733/featured',
      facebookIconUrl: '',
      instagramIconUrl: '',
      youtubeIconUrl: ''
    }

    const finalSettings = { ...defaultSettings, ...settings }

    return NextResponse.json({
      success: true,
      settings: finalSettings
    })
  } catch (error) {
    console.error('Database error (GET /settings):', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings from database' },
      { status: 500 }
    )
  }
}

// POST - Save system settings
export async function POST(request: NextRequest) {
  try {
    const { settings } = await request.json()

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    const entries = Object.entries(settings) as Array<[string, unknown]>

    await prisma.$transaction(
      entries.map(([key, value]) => {
        const typeOf = typeof value
        const stringValue = String(value)
        return prisma.systemSetting.upsert({
          where: { key },
          update: { value: stringValue, type: typeOf },
          create: { key, value: stringValue, type: typeOf }
        })
      })
    )

    // Read back saved settings to confirm and return as source of truth
    const savedRows = await prisma.systemSetting.findMany({
      select: { key: true, value: true, type: true }
    })

    const saved: Record<string, any> = {}
    savedRows.forEach(({ key, value, type }) => {
      if (type === 'boolean') {
        saved[key] = value === 'true'
      } else if (type === 'number') {
        saved[key] = parseInt(value, 10)
      } else {
        saved[key] = value
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: saved
    })
  } catch (error) {
    console.error('Database error (POST /settings):', error)
    return NextResponse.json(
      { error: 'Failed to save settings to database' },
      { status: 500 }
    )
  }
} 