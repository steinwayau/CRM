import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: NextRequest) {
  try {
    // Drop existing tables to ensure clean slate
    await sql`DROP TABLE IF EXISTS enquiries CASCADE`
    await sql`DROP TABLE IF EXISTS staff CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`
    await sql`DROP TABLE IF EXISTS system_settings CASCADE`
    await sql`DROP TABLE IF EXISTS import_logs CASCADE`

    // Create enquiries table with camelCase column names matching Prisma schema
    await sql`
      CREATE TABLE enquiries (
        id SERIAL PRIMARY KEY,
        status VARCHAR(50) DEFAULT 'New',
        "institutionName" VARCHAR(255),
        "firstName" VARCHAR(100) NOT NULL,
        "lastName" VARCHAR(100),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        nationality VARCHAR(100) DEFAULT 'English',
        state VARCHAR(100) NOT NULL,
        suburb VARCHAR(100),
        "productInterest" JSONB DEFAULT '[]',
        source VARCHAR(255),
        "eventSource" VARCHAR(255),
        comments TEXT,
        "followUpInfo" TEXT,
        "bestTimeToFollowUp" TIMESTAMP,
        "customerRating" VARCHAR(100) DEFAULT 'N/A',
        "stepProgram" VARCHAR(100) DEFAULT 'N/A',
        "salesManagerInvolved" VARCHAR(50) DEFAULT 'No',
        "salesManagerExplanation" TEXT,
        "followUpNotes" TEXT,
        "doNotEmail" BOOLEAN DEFAULT false,
        "submittedBy" VARCHAR(100) DEFAULT 'Online Form',
        "importSource" VARCHAR(255),
        "originalId" VARCHAR(255),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `

    // Create staff table with camelCase column names
    await sql`
      CREATE TABLE staff (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        role VARCHAR(50),
        "isActive" BOOLEAN DEFAULT true,
        phone VARCHAR(50),
        position VARCHAR(100),
        department VARCHAR(100),
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `

    // Create users table
    await sql`
      CREATE TABLE users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'staff',
        active BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `

    // Create system_settings table
    await sql`
      CREATE TABLE system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'string',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `

    // Create import_logs table
    await sql`
      CREATE TABLE import_logs (
        id SERIAL PRIMARY KEY,
        "fileName" VARCHAR(255) NOT NULL,
        "recordsImported" INTEGER DEFAULT 0,
        "recordsSkipped" INTEGER DEFAULT 0,
        "recordsErrored" INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "errorLog" TEXT,
        "importedBy" VARCHAR(100),
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `

    // Insert default staff members
    await sql`
      INSERT INTO staff (name, email, "createdAt", "updatedAt") VALUES 
        ('Abbey Landgren', 'abbey@epgpianos.com.au', NOW(), NOW()),
        ('Alexa Curtis', 'alexa@epgpianos.com.au', NOW(), NOW()),
        ('Angela Liu', 'angela@epgpianos.com.au', NOW(), NOW()),
        ('Chris', 'chris@epgpianos.com.au', NOW(), NOW()),
        ('Daryl', 'daryl@epgpianos.com.au', NOW(), NOW()),
        ('Jeremy', 'jeremy@epgpianos.com.au', NOW(), NOW()),
        ('Jessica Herz', 'jessica@epgpianos.com.au', NOW(), NOW()),
        ('Lucy', 'lucy@epgpianos.com.au', NOW(), NOW()),
        ('Mark', 'mark@epgpianos.com.au', NOW(), NOW()),
        ('Sargoon', 'sargoon@epgpianos.com.au', NOW(), NOW()),
        ('Teresa', 'teresa@epgpianos.com.au', NOW(), NOW()),
        ('Day', 'day@epgpianos.com.au', NOW(), NOW()),
        ('Hendra', 'hendra@epgpianos.com.au', NOW(), NOW()),
        ('June', 'june@epgpianos.com.au', NOW(), NOW()),
        ('Mike', 'mike@epgpianos.com.au', NOW(), NOW()),
        ('Alison', 'alison@epgpianos.com.au', NOW(), NOW()),
        ('Olivia', 'olivia@epgpianos.com.au', NOW(), NOW()),
        ('Louie', 'louie@epgpianos.com.au', NOW(), NOW())
    `

    // Insert sample enquiries with camelCase column names
    await sql`
      INSERT INTO enquiries (
        status, "firstName", "lastName", email, phone, 
        nationality, state, suburb, source, "eventSource", 
        "submittedBy", "createdAt", "updatedAt"
      ) VALUES 
        (
          'New',
          'John',
          'Smith',
          'john.smith@example.com',
          '0412345678',
          'English',
          'New South Wales',
          'Sydney',
          'Google',
          'Events - Steinway Gallery St Leonards',
          'Online Form',
          NOW() - INTERVAL '2 days',
          NOW() - INTERVAL '2 days'
        ),
        (
          'In Progress',
          'Sarah',
          'Johnson',
          'sarah.j@example.com',
          '0423456789',
          'Chinese',
          'Victoria',
          'Melbourne',
          'Recommended by a friend',
          'Events - Steinway Gallery Melbourne',
          'June',
          NOW() - INTERVAL '1 day',
          NOW() - INTERVAL '1 day'
        ),
        (
          'New',
          'Mike',
          'Chen',
          'mike.chen@example.com',
          '0434567890',
          'Chinese',
          'Victoria',
          'Croydon',
          'WeChat',
          'Other: Music teacher recommendation',
          'Angela Liu',
          NOW() - INTERVAL '6 hours',
          NOW() - INTERVAL '6 hours'
        )
    `

    return NextResponse.json({ 
      message: 'Database completely rebuilt with camelCase schema',
      tables: ['enquiries', 'staff', 'users', 'system_settings', 'import_logs'],
      staff_added: 'All staff members added with camelCase columns',
      enquiries_added: 'Sample enquiries with camelCase columns',
      schema_update: 'Tables dropped and recreated with correct Prisma schema'
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error },
      { status: 500 }
    )
  }
} 