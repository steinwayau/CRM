import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Default classifications
const DEFAULT_CLASSIFICATIONS = [
  "N/A", "Ready to buy", "High Priority", "After Sale Follow Up", 
  "Very interested but not ready to buy", "Looking for information", 
  "Just browsing for now", "Cold", "Events"
]

// Get all available classifications (defaults + custom ones from database)
export async function GET(request: NextRequest) {
  try {
    // Get unique classifications from existing enquiries
    const uniqueClassifications = await prisma.enquiry.findMany({
      select: {
        customerRating: true
      },
      distinct: ['customerRating'],
      where: {
        customerRating: {
          not: null
        }
      }
    })

    // Extract unique values and filter out nulls
    const customClassifications = uniqueClassifications
      .map(e => e.customerRating)
      .filter(c => c && !DEFAULT_CLASSIFICATIONS.includes(c))

    // Combine defaults with custom ones
    const allClassifications = [...DEFAULT_CLASSIFICATIONS, ...customClassifications]

    return NextResponse.json({
      classifications: allClassifications,
      defaults: DEFAULT_CLASSIFICATIONS,
      custom: customClassifications
    })

  } catch (error) {
    console.error('Error fetching classifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classifications' },
      { status: 500 }
    )
  }
}

// Add a new classification (by creating a system setting)
export async function POST(request: NextRequest) {
  try {
    const { classification } = await request.json()

    if (!classification || typeof classification !== 'string') {
      return NextResponse.json(
        { error: 'Classification name is required' },
        { status: 400 }
      )
    }

    const trimmedClassification = classification.trim()

    // Check if already exists in defaults
    if (DEFAULT_CLASSIFICATIONS.includes(trimmedClassification)) {
      return NextResponse.json(
        { error: 'Classification already exists in defaults' },
        { status: 409 }
      )
    }

    // Store as a system setting for persistence
    await prisma.systemSetting.upsert({
      where: {
        key: `custom_classification_${trimmedClassification.toLowerCase().replace(/\s+/g, '_')}`
      },
      update: {
        value: trimmedClassification,
        type: 'string'
      },
      create: {
        key: `custom_classification_${trimmedClassification.toLowerCase().replace(/\s+/g, '_')}`,
        value: trimmedClassification,
        type: 'string'
      }
    })

    return NextResponse.json({
      message: 'Classification added successfully',
      classification: trimmedClassification
    })

  } catch (error) {
    console.error('Error adding classification:', error)
    return NextResponse.json(
      { error: 'Failed to add classification' },
      { status: 500 }
    )
  }
} 