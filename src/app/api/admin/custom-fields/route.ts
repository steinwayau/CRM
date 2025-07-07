import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all custom fields
export async function GET(request: NextRequest) {
  try {
    const customFields = await prisma.systemSetting.findMany({
      where: {
        key: {
          startsWith: 'custom_field_'
        }
      }
    })

    const fields = customFields.map(field => {
      const fieldName = field.key.replace('custom_field_', '')
      return {
        key: fieldName,
        label: field.value,
        required: false,
        isCustom: true
      }
    })

    return NextResponse.json({
      customFields: fields
    })

  } catch (error) {
    console.error('Error fetching custom fields:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom fields' },
      { status: 500 }
    )
  }
}

// Add a new custom field
export async function POST(request: NextRequest) {
  try {
    const { fieldName, fieldLabel } = await request.json()

    if (!fieldName || !fieldLabel) {
      return NextResponse.json(
        { error: 'Field name and label are required' },
        { status: 400 }
      )
    }

    // Clean field name (remove spaces, special chars)
    const cleanFieldName = fieldName.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim()

    if (!cleanFieldName) {
      return NextResponse.json(
        { error: 'Invalid field name' },
        { status: 400 }
      )
    }

    // Check if field already exists
    const existingField = await prisma.systemSetting.findUnique({
      where: {
        key: `custom_field_${cleanFieldName}`
      }
    })

    if (existingField) {
      return NextResponse.json(
        { error: 'Custom field already exists' },
        { status: 409 }
      )
    }

    // Create new custom field
    await prisma.systemSetting.create({
      data: {
        key: `custom_field_${cleanFieldName}`,
        value: fieldLabel.trim(),
        type: 'custom_field'
      }
    })

    return NextResponse.json({
      message: 'Custom field created successfully',
      field: {
        key: cleanFieldName,
        label: fieldLabel.trim(),
        required: false,
        isCustom: true
      }
    })

  } catch (error) {
    console.error('Error creating custom field:', error)
    return NextResponse.json(
      { error: 'Failed to create custom field' },
      { status: 500 }
    )
  }
}

// Delete a custom field
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fieldName = searchParams.get('fieldName')

    if (!fieldName) {
      return NextResponse.json(
        { error: 'Field name is required' },
        { status: 400 }
      )
    }

    await prisma.systemSetting.delete({
      where: {
        key: `custom_field_${fieldName}`
      }
    })

    return NextResponse.json({
      message: 'Custom field deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting custom field:', error)
    return NextResponse.json(
      { error: 'Failed to delete custom field' },
      { status: 500 }
    )
  }
} 