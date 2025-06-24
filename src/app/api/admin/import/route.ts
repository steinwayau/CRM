import { NextRequest, NextResponse } from 'next/server'

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

// Valid customer ratings from your form
const VALID_RATINGS = [
  "N/A", "Ready to buy", "High Priority", "After Sale Follow Up", 
  "Very interested but not ready to buy", "Looking for information", 
  "Just browsing for now", "Cold", "Events"
]

// Temporary in-memory storage (replace with database in production)
let importedData: any[] = []

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mappingsString = formData.get('mappings') as string
    
    if (!file || !mappingsString) {
      return NextResponse.json({ error: 'File and mappings are required' }, { status: 400 })
    }

    const mappings: FieldMapping[] = JSON.parse(mappingsString)
    const activemappings = mappings.filter(m => m.targetField !== '')
    
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
        let hasRequiredFields = true
        const missingRequired: string[] = []

        for (const mapping of activemappings) {
          const sourceValue = row[mapping.sourceField]
          
          if (mapping.targetField) {
            // Validate required fields
            if (mapping.isRequired && (!sourceValue || sourceValue === '')) {
              hasRequiredFields = false
              missingRequired.push(mapping.targetField)
              continue
            }

            // Process and validate the field value
            const processedValue = processFieldValue(mapping.targetField, sourceValue)
            if (processedValue !== null) {
              mappedData[mapping.targetField] = processedValue
            }
          }
        }

        if (!hasRequiredFields) {
          results.errors++
          results.errorDetails.push(`Row ${rowIndex}: Missing required fields: ${missingRequired.join(', ')}`)
          continue
        }

        // Add system fields
        mappedData.importSource = `Import from ${file.name}`
        mappedData.originalId = row.id || row.ID || `import_${Date.now()}_${i}`
        mappedData.createdAt = mappedData.createdAt || new Date().toISOString()
        mappedData.updatedAt = new Date().toISOString()

        // Set defaults
        if (!mappedData.status) mappedData.status = 'New'
        if (!mappedData.customerRating) mappedData.customerRating = 'N/A'
        if (!mappedData.stepProgram) mappedData.stepProgram = 'N/A'
        if (!mappedData.salesManagerInvolved) mappedData.salesManagerInvolved = 'No'
        if (mappedData.doNotEmail === undefined) mappedData.doNotEmail = false

        // Add to our temporary storage (in production, save to database)
        importedData.push(mappedData)
        results.imported++

      } catch (error) {
        results.errors++
        results.errorDetails.push(`Row ${rowIndex}: ${error instanceof Error ? error.message : 'Processing error'}`)
      }
    }

    // Log import results
    console.log(`Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors} errors`)

    return NextResponse.json({
      ...results,
      message: `Import completed. ${results.imported} records imported successfully.`,
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
  const lines = text.split('\n').filter(line => line.trim() !== '')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const data = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    data.push(row)
  }

  return data
}

function processFieldValue(fieldName: string, value: any): any {
  if (!value || value === '') return null

  const stringValue = String(value).trim()

  switch (fieldName) {
    case 'productInterest':
      // Handle comma-separated products or JSON array
      if (stringValue.startsWith('[') && stringValue.endsWith(']')) {
        try {
          const parsed = JSON.parse(stringValue)
          return Array.isArray(parsed) ? parsed.filter(p => VALID_PRODUCTS.includes(p)) : []
        } catch {
          return []
        }
      } else {
        // Comma-separated string
        const products = stringValue.split(',').map(p => p.trim().toLowerCase())
        return products.filter(p => VALID_PRODUCTS.includes(p))
      }

    case 'doNotEmail':
      // Convert various boolean representations
      const lower = stringValue.toLowerCase()
      return lower === 'true' || lower === '1' || lower === 'yes'

    case 'createdAt':
    case 'bestTimeToFollowUp':
      // Handle date formats
      if (!stringValue) return null
      
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

    case 'status':
      // Validate status
      const validStatuses = ['New', 'Sold', 'Finalised']
      const foundStatus = validStatuses.find(s => 
        s.toLowerCase() === stringValue.toLowerCase()
      )
      return foundStatus || 'New'

    default:
      return stringValue
  }
}

// Export the imported data for other endpoints to access
export function getImportedData() {
  return importedData
} 