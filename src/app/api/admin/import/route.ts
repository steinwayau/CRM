import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createAutoBackup } from '@/lib/backup-utils'

const prisma = new PrismaClient()

interface FieldMapping {
  sourceField: string
  targetField: string
  isRequired: boolean
}

// Valid product IDs from your form
const VALID_PRODUCTS = ['steinway', 'boston', 'essex', 'kawai', 'yamaha', 'usedpiano', 'roland', 'ritmuller', 'ronisch', 'kurzweil', 'other']

// Valid nationalities from your form
const VALID_NATIONALITIES = ['English', 'Chinese', 'Korean', 'Japanese', 'Indian', 'Other']

// Valid Australian states from your form
const VALID_STATES = [
  "Australian Capital Territory", "New South Wales", "Northern Territory",
  "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"
]

// State abbreviation mapping for legacy data
const STATE_ABBREVIATIONS: { [key: string]: string } = {
  'ACT': 'Australian Capital Territory',
  'NSW': 'New South Wales', 
  'NT': 'Northern Territory',
  'QLD': 'Queensland',
  'SA': 'South Australia',
  'TAS': 'Tasmania',
  'VIC': 'Victoria',
  'WA': 'Western Australia'
}

// Valid customer ratings from your form
const VALID_RATINGS = [
  "N/A", "Ready to buy", "High Priority", "After Sale Follow Up", 
  "Very interested but not ready to buy", "Looking for information", 
  "Just browsing for now", "Cold", "Events", "Unknown"
]

// Valid classifications (same as ratings for now, but separate for flexibility)
const VALID_CLASSIFICATIONS = [
  "N/A", "Ready to buy", "High Priority", "After Sale Follow Up", 
  "Very interested but not ready to buy", "Looking for information", 
  "Just browsing for now", "Cold", "Events", "Unknown"
]

// Temporary in-memory storage (replace with database in production)
let importedData: any[] = []

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mappingsString = formData.get('mappings') as string
    const customFieldsString = formData.get('customFields') as string
    
    if (!file || !mappingsString) {
      return NextResponse.json({ error: 'File and mappings are required' }, { status: 400 })
    }

    const mappings: FieldMapping[] = JSON.parse(mappingsString)
    const customFields = customFieldsString ? JSON.parse(customFieldsString) : []
    const activeMappings = mappings.filter(m => m.targetField !== '')
    
    console.log('Custom fields received:', customFields)
    
    // Create a map of custom field keys for quick lookup
    const customFieldMap = customFields.reduce((map: any, field: any) => {
      map[field.key] = field
      return map
    }, {})
    
    // Process file content
    const text = await file.text()
    let rawData: any[] = []

    if (file.name.endsWith('.csv')) {
      rawData = parseCSV(text)
    } else if (file.name.endsWith('.json')) {
      const parsed = JSON.parse(text)
      rawData = Array.isArray(parsed) ? parsed : [parsed]
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Please use CSV or JSON.' }, { status: 400 })
    }

    // Process and validate data
    const results = {
      imported: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [] as string[]
    }

    for (let i = 0; i < rawData.length; i++) {
      const rowIndex = i + 1
      try {
        const row = rawData[i]
        
        // Skip empty rows
        if (!row || Object.values(row).every(val => !val || val === '')) {
          results.skipped++
          continue
        }

        // Map fields according to user's mapping
        const mappedData: any = {}
        const customFieldData: any = {}
        let hasRequiredFields = true
        const missingRequired: string[] = []

        for (const mapping of activeMappings) {
          const sourceValue = row[mapping.sourceField]
          
          if (mapping.targetField) {
            // Validate required fields
            if (mapping.isRequired && (!sourceValue || sourceValue === '')) {
              hasRequiredFields = false
              missingRequired.push(mapping.targetField)
              continue
            }

            // Check if this is a custom field
            if (customFieldMap[mapping.targetField]) {
              // Store custom field data
              customFieldData[mapping.targetField] = {
                label: customFieldMap[mapping.targetField].label,
                value: sourceValue || null
              }
            } else {
              // Process and validate standard field values
              const processedValue = processFieldValue(mapping.targetField, sourceValue)
              if (processedValue !== null) {
                mappedData[mapping.targetField] = processedValue
              }
            }
          }
        }

        if (!hasRequiredFields) {
          results.errors++
          results.errorDetails.push(`Row ${rowIndex}: Missing required fields: ${missingRequired.join(', ')}`)
          continue
        }

        // Set defaults
        if (!mappedData.status) mappedData.status = 'New'
        if (!mappedData.customerRating) mappedData.customerRating = 'N/A'
        if (!mappedData.classification) mappedData.classification = 'N/A'
        if (!mappedData.stepProgram) mappedData.stepProgram = 'N/A'
        if (!mappedData.salesManagerInvolved) mappedData.salesManagerInvolved = 'No'
        if (mappedData.doNotEmail === undefined) mappedData.doNotEmail = false

        // Map classification to customerRating if provided
        if (mappedData.classification && !mappedData.customerRating) {
          mappedData.customerRating = mappedData.classification
        }

        // Save to database using Prisma
        try {
          // Build dynamic data object based on mappings
          const prismaData: any = {
            // Always set these system fields
            createdAt: mappedData.createdAt ? new Date(mappedData.createdAt) : new Date(),
            updatedAt: new Date(),
            importSource: mappedData.importSource || `Import from ${file.name}`,
            originalId: mappedData.originalId || row.id || row.ID || `import_${Date.now()}_${i}`,
          }

          // Add required fields (must be present)
          prismaData.firstName = mappedData.firstName
          prismaData.lastName = mappedData.lastName
          prismaData.email = mappedData.email
          prismaData.state = mappedData.state
          
          // Add optional fields only if they exist
          if (mappedData.status) prismaData.status = mappedData.status
          if (mappedData.institutionName) prismaData.institutionName = mappedData.institutionName
          if (mappedData.phone) prismaData.phone = mappedData.phone
          if (mappedData.nationality) prismaData.nationality = mappedData.nationality
          if (mappedData.suburb) prismaData.suburb = mappedData.suburb
          if (mappedData.productInterest) prismaData.productInterest = mappedData.productInterest
          if (mappedData.source) prismaData.source = mappedData.source
          if (mappedData.eventSource) prismaData.eventSource = mappedData.eventSource
          if (mappedData.comments) prismaData.comments = mappedData.comments
          if (mappedData.others) prismaData.others = mappedData.others
          if (mappedData.submittedBy) prismaData.submittedBy = mappedData.submittedBy
          if (mappedData.customerRating) prismaData.customerRating = mappedData.customerRating
          if (mappedData.stepProgram) prismaData.stepProgram = mappedData.stepProgram
          if (mappedData.salesManagerInvolved) prismaData.salesManagerInvolved = mappedData.salesManagerInvolved
          if (mappedData.salesManagerExplanation) prismaData.salesManagerExplanation = mappedData.salesManagerExplanation
          if (mappedData.followUpNotes) prismaData.followUpNotes = mappedData.followUpNotes
          if (mappedData.bestTimeToFollowUp) prismaData.bestTimeToFollowUp = new Date(mappedData.bestTimeToFollowUp)
          if (mappedData.doNotEmail !== undefined) prismaData.doNotEmail = mappedData.doNotEmail
          
          // Additional old database fields
          if (mappedData.inputDate) prismaData.inputDate = new Date(mappedData.inputDate)
          if (mappedData.lastUpdate) prismaData.lastUpdate = new Date(mappedData.lastUpdate)
          if (mappedData.fupStatus) prismaData.fupStatus = mappedData.fupStatus
          if (mappedData.originalFupDate) prismaData.originalFupDate = new Date(mappedData.originalFupDate)
          if (mappedData.enquiryUpdatedBy) prismaData.enquiryUpdatedBy = mappedData.enquiryUpdatedBy

          // Store custom fields as JSON in followUpInfo field
          if (Object.keys(customFieldData).length > 0) {
            prismaData.followUpInfo = JSON.stringify(customFieldData)
          }

          await prisma.enquiry.create({
            data: prismaData
          })
          results.imported++
        } catch (dbError) {
          results.errors++
          results.errorDetails.push(`Row ${rowIndex}: Database error - ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`)
        }

      } catch (error) {
        results.errors++
        results.errorDetails.push(`Row ${rowIndex}: ${error instanceof Error ? error.message : 'Processing error'}`)
      }
    }

    // Log import results
    console.log(`Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors} errors`)
    console.log(`Custom fields processed: ${JSON.stringify(customFields)}`)

    // Create automatic backup after successful import (if any records were imported)
    if (results.imported > 0) {
      try {
        await createAutoBackup(`CSV import: ${results.imported} records from ${file.name}`)
      } catch (backupError) {
        console.error('Warning: Auto backup failed after import:', backupError)
        // Don't fail the import if backup fails
      }
    }

    return NextResponse.json({
      ...results,
      message: `Import completed. ${results.imported} records imported successfully.${customFields.length > 0 ? ` Custom fields: ${customFields.map((f: any) => f.label).join(', ')}` : ''}`,
      totalRecords: rawData.length
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

function parseCSV(text: string): any[] {
  // Parse the entire CSV text character by character to handle multi-line quoted fields
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0
  
  while (i < text.length) {
    const char = text[i]
    
    if (char === '"') {
      if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
        // Escaped quote within quoted field
        currentField += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator (only when not in quotes)
      currentRow.push(currentField.trim())
      currentField = ''
      i++
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row (only when not in quotes)
      currentRow.push(currentField.trim())
      if (currentRow.some(field => field !== '')) { // Only add non-empty rows
        rows.push(currentRow)
      }
      currentRow = []
      currentField = ''
      // Handle \r\n
      if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
        i += 2
      } else {
        i++
      }
    } else {
      // Regular character (including newlines within quotes)
      currentField += char
      i++
    }
  }
  
  // Add the last field and row if not empty
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some(field => field !== '')) {
      rows.push(currentRow)
    }
  }
  
  if (rows.length < 2) return []
  
  const headers = rows[0]
  const data = []
  
  // Convert remaining rows to objects
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i]
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    data.push(row)
  }
  
  return data
}

function processFieldValue(fieldName: string, value: any): any {
  if (!value || value === '' || String(value).trim() === '' || String(value).toUpperCase() === 'NULL') return null

  const stringValue = String(value).trim()

  switch (fieldName) {
    case 'productInterest':
      // Handle comma-separated products or JSON array
      let products: string[] = []
      
      if (stringValue.startsWith('[') && stringValue.endsWith(']')) {
        try {
          const parsed = JSON.parse(stringValue)
          products = Array.isArray(parsed) ? parsed.filter(p => VALID_PRODUCTS.includes(p.toLowerCase())) : []
        } catch {
          products = []
        }
      } else {
        // Comma-separated string - handle legacy format
        const splitProducts = stringValue.split(',').map(p => p.trim().toLowerCase())
        const validProducts = splitProducts.filter(p => VALID_PRODUCTS.includes(p))
        // If no valid products found, use the original value as a fallback
        products = validProducts.length > 0 ? validProducts : [stringValue.toLowerCase()]
      }
      
      // Convert array back to comma-separated string for database storage
      return products.length > 0 ? products.join(', ') : null

    case 'doNotEmail':
      // Convert various boolean representations
      const lower = stringValue.toLowerCase()
      return lower === 'true' || lower === '1' || lower === 'yes'

    case 'createdAt':
    case 'bestTimeToFollowUp':
    case 'inputDate':
    case 'lastUpdate':
    case 'originalFupDate':
      // Handle date formats
      if (!stringValue) return null
      
      // Skip invalid legacy dates
      if (stringValue.includes('0000-00-00') || stringValue.includes('1000-01-01')) {
        return null
      }
      
      let date: Date | null = null
      
      // Try DD/MM/YYYY format
      if (stringValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
        const [day, month, year] = stringValue.split('/')
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }
      // Try YYYY-MM-DD format
      else if (stringValue.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
        date = new Date(stringValue)
      }
      // Try YYYY-MM-DD HH:mm:ss format (common in database exports)
      else if (stringValue.match(/^\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}/)) {
        date = new Date(stringValue)
      }
      // Try to parse as general date
      else {
        date = new Date(stringValue)
      }
      
      return date && !isNaN(date.getTime()) ? date.toISOString() : null

    case 'nationality':
      // Validate nationality
      const foundNationality = VALID_NATIONALITIES.find(n => 
        n.toLowerCase() === stringValue.toLowerCase()
      )
      return foundNationality || stringValue

    case 'state':
      // Handle state abbreviations first
      const upperValue = stringValue.toUpperCase()
      if (STATE_ABBREVIATIONS[upperValue]) {
        return STATE_ABBREVIATIONS[upperValue]
      }
      
      // Validate Australian state
      const foundState = VALID_STATES.find(s => 
        s.toLowerCase() === stringValue.toLowerCase() ||
        s.toLowerCase().includes(stringValue.toLowerCase())
      )
      return foundState || stringValue

    case 'customerRating':
      // Validate customer rating
      const foundRating = VALID_RATINGS.find(r => 
        r.toLowerCase() === stringValue.toLowerCase()
      )
      return foundRating || 'N/A'

    case 'classification':
      // Validate classification - allow any value, but prefer known ones
      const foundClassification = VALID_CLASSIFICATIONS.find(c => 
        c.toLowerCase() === stringValue.toLowerCase()
      )
      return foundClassification || stringValue || 'N/A'

    case 'status':
      // Validate status - handle legacy spellings
      const validStatuses = ['New', 'Sold', 'Finalised', 'Finalized']
      const foundStatus = validStatuses.find(s => 
        s.toLowerCase() === stringValue.toLowerCase()
      )
      // Normalize "Finalized" to "Finalised"
      if (foundStatus === 'Finalized') return 'Finalised'
      return foundStatus || 'New'

    default:
      return stringValue
  }
}

// Helper function to get imported data (internal use only)
function getImportedData() {
  return importedData
} 