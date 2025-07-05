import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// GET - Retrieve system settings
export async function GET() {
  try {
    const result = await sql`
      SELECT key, value, type FROM system_settings
    `
    
    const settings: Record<string, any> = {}
    result.rows.forEach((row: any) => {
      const { key, value, type } = row
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
      maintenanceMode: false
    }
    
    const finalSettings = { ...defaultSettings, ...settings }
    
    return NextResponse.json({
      success: true,
      settings: finalSettings
    })
  } catch (error) {
    console.error('Database error:', error)
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

    // Save each setting
    for (const [key, value] of Object.entries(settings)) {
      const type = typeof value
      const stringValue = String(value)
      
      // Upsert setting
      await sql`
        INSERT INTO system_settings (key, value, type, created_at, updated_at)
        VALUES (${key}, ${stringValue}, ${type}, NOW(), NOW())
        ON CONFLICT (key) 
        DO UPDATE SET value = ${stringValue}, type = ${type}, updated_at = NOW()
      `
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to save settings to database' },
      { status: 500 }
    )
  }
} 