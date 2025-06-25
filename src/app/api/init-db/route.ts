import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: NextRequest) {
  try {
    // Create enquiries table
    await sql`
      CREATE TABLE IF NOT EXISTS enquiries (
        id SERIAL PRIMARY KEY,
        status VARCHAR(50) DEFAULT 'New',
        institution_name VARCHAR(255),
        first_name VARCHAR(100) NOT NULL,
        surname VARCHAR(100),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        nationality VARCHAR(100) DEFAULT 'English',
        state VARCHAR(100) NOT NULL,
        suburb VARCHAR(100),
        products JSONB DEFAULT '[]',
        source VARCHAR(255),
        enquiry_source VARCHAR(255),
        comments TEXT,
        follow_up_info TEXT,
        follow_up_date TIMESTAMP,
        classification VARCHAR(100) DEFAULT 'N/A',
        step_program VARCHAR(100) DEFAULT 'N/A',
        involving VARCHAR(50) DEFAULT 'No',
        not_involving_reason TEXT,
        newsletter VARCHAR(10) DEFAULT 'Yes',
        call_taken_by VARCHAR(100) DEFAULT 'Online Form',
        original_follow_up_date TIMESTAMP,
        input_date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create staff table
    await sql`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'staff',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Insert default staff members with proper updated_at values
    await sql`
      INSERT INTO staff (name, email, created_at, updated_at) VALUES 
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
        ('Angela', 'angela@epgpianos.com.au', NOW(), NOW()),
        ('Olivia', 'olivia@epgpianos.com.au', NOW(), NOW()),
        ('Louie', 'louie@epgpianos.com.au', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
    `

    return NextResponse.json({ 
      message: 'Database initialized successfully',
      tables: ['enquiries', 'staff', 'users'],
      staff_added: 'Day and Hendra included in staff database'
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error },
      { status: 500 }
    )
  }
} 