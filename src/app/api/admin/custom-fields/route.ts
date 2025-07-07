import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Retrieve all custom fields
export async function GET() {
  try {
    console.log('GET /api/admin/custom-fields called');
    
    const customFields = await prisma.systemSetting.findMany({
      where: {
        key: {
          startsWith: 'custom_field_'
        }
      }
    });

    console.log('Found custom fields:', customFields);

    const formattedFields = customFields.map((field: any) => ({
      id: field.key,
      name: field.key.replace('custom_field_', ''),
      label: field.value,
      createdAt: field.createdAt
    }));

    return NextResponse.json(formattedFields);
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return NextResponse.json({ error: 'Failed to fetch custom fields' }, { status: 500 });
  }
}

// POST - Create a new custom field
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/custom-fields called');
    
    const { name, label } = await request.json();
    console.log('Received data:', { name, label });

    if (!name || !label) {
      console.log('Missing required fields');
      return NextResponse.json({ error: 'Name and label are required' }, { status: 400 });
    }

    // Clean the field name - allow alphanumeric, spaces, hyphens, underscores
    const cleanName = name.trim().replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_');
    
    if (!cleanName) {
      console.log('Invalid field name after cleaning:', name);
      return NextResponse.json({ error: 'Invalid field name. Use only letters, numbers, spaces, hyphens, and underscores.' }, { status: 400 });
    }

    const fieldKey = `custom_field_${cleanName}`;
    console.log('Creating custom field with key:', fieldKey);

    // Check if field already exists
    const existingField = await prisma.systemSetting.findUnique({
      where: { key: fieldKey }
    });

    if (existingField) {
      console.log('Field already exists:', fieldKey);
      return NextResponse.json({ error: 'A custom field with this name already exists' }, { status: 409 });
    }

    // Create the custom field
    const customField = await prisma.systemSetting.create({
      data: {
        key: fieldKey,
        value: label.trim(),
        type: 'string'
      }
    });

    console.log('Created custom field:', customField);

    return NextResponse.json({
      id: customField.key,
      name: cleanName,
      label: customField.value,
      createdAt: customField.createdAt
    });
  } catch (error) {
    console.error('Error creating custom field:', error);
    return NextResponse.json({ 
      error: 'Failed to create custom field', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// DELETE - Remove a custom field
export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/admin/custom-fields called');
    
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('id');
    
    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }

    console.log('Deleting custom field:', fieldId);

    // Delete the custom field
    await prisma.systemSetting.delete({
      where: { key: fieldId }
    });

    console.log('Deleted custom field:', fieldId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom field:', error);
    return NextResponse.json({ error: 'Failed to delete custom field' }, { status: 500 });
  }
} 