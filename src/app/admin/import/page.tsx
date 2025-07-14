'use client'

import { useState, useEffect } from 'react'

interface FieldMapping {
  sourceField: string
  targetField: string
  isRequired: boolean
}

interface ImportPreview {
  headers: string[]
  sampleRows: any[][]
  totalRows: number
}

const FORM_FIELDS = [
  { key: 'status', label: 'Status', required: false, default: 'New' },
  { key: 'institutionName', label: 'Institution Name', required: false },
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'nationality', label: 'Nationality', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'suburb', label: 'Suburb', required: false },
  { key: 'productInterest', label: 'Product Interest', required: false, note: 'Comma-separated list or JSON array' },
  { key: 'source', label: 'Source (Where did you hear about us)', required: false },
  { key: 'eventSource', label: 'Event Source (Where did enquiry come from)', required: false },
  { key: 'comments', label: 'Comments', required: false },
  { key: 'submittedBy', label: 'Submitted By (Staff)', required: false },
  { key: 'customerRating', label: 'Customer Rating', required: false },
  { key: 'doNotEmail', label: 'Do Not Email', required: false, note: 'true/false or 1/0' },
  { key: 'createdAt', label: 'Original Date Created', required: false, note: 'Date format: YYYY-MM-DD or DD/MM/YYYY' },
  
  // Additional fields from old database
  { key: 'others', label: 'Others', required: false, note: 'Additional interests/comments' },
  { key: 'followUpNotes', label: 'Follow Up Notes', required: false },
  { key: 'inputDate', label: 'Input Date', required: false },
  { key: 'lastUpdate', label: 'Last Update', required: false },
  { key: 'fupDate', label: 'Follow Up Date', required: false },
  { key: 'fupStatus', label: 'Follow Up Status', required: false },
  { key: 'originalFupDate', label: 'Original Follow Up Date', required: false },
  { key: 'stepProgram', label: 'Step Program', required: false },
  { key: 'involving', label: 'Sales Manager Involved', required: false },
  { key: 'notInvolvingReason', label: 'Not Involving Reason', required: false },
  { key: 'enquiryUpdatedBy', label: 'Enquiry Updated By', required: false }
]

const PRODUCT_OPTIONS = ['steinway', 'boston', 'essex', 'kawai', 'yamaha', 'usedpiano', 'roland', 'ritmuller', 'ronisch', 'kurzweil', 'other']

// Default classifications - these can be extended dynamically
const DEFAULT_CLASSIFICATIONS = [
  "N/A", "Ready to buy", "High Priority", "After Sale Follow Up", 
  "Very interested but not ready to buy", "Looking for information", 
  "Just browsing for now", "Cold", "Events"
]

// Proper CSV line parser that respects quoting rules
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote within quoted field
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator (only when not in quotes)
      result.push(current.trim())
      current = ''
      i++
    } else {
      // Regular character
      current += char
      i++
    }
  }
  
  // Add the last field
  result.push(current.trim())
  
  return result
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle')
  const [importResults, setImportResults] = useState<any>(null)
  const [errorLog, setErrorLog] = useState<string[]>([])
  const [customClassifications, setCustomClassifications] = useState<string[]>([])
  const [newClassification, setNewClassification] = useState<string>('')
  const [availableClassifications, setAvailableClassifications] = useState<string[]>(DEFAULT_CLASSIFICATIONS)
  const [customFields, setCustomFields] = useState<any[]>([])
  const [allFormFields, setAllFormFields] = useState<any[]>(FORM_FIELDS)
  const [unmappedFields, setUnmappedFields] = useState<string[]>([])
  const [newCustomField, setNewCustomField] = useState({ name: '', label: '' })
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false)
  const [selectedUnmappedField, setSelectedUnmappedField] = useState('')

  // Chunked upload states
  const [isChunkedUpload, setIsChunkedUpload] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentChunk, setCurrentChunk] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [chunkResults, setChunkResults] = useState<any[]>([])
  const [overallResults, setOverallResults] = useState<{ imported: number; skipped: number; errors: number; errorDetails: string[] }>({ imported: 0, skipped: 0, errors: 0, errorDetails: [] })

  // Load available classifications and custom fields on component mount
  useEffect(() => {
    loadClassifications()
    loadCustomFields()
  }, [])

  // Update unmapped fields when field mappings change
  useEffect(() => {
    if (importPreview) {
      const unmapped = importPreview.headers.filter(header => {
        const mapping = fieldMappings.find(m => m.sourceField === header)
        return !mapping || !mapping.targetField
      })
      setUnmappedFields(unmapped)
    }
  }, [fieldMappings, importPreview])

  const loadClassifications = async () => {
    try {
      const response = await fetch('/api/admin/classifications')
      if (response.ok) {
        const data = await response.json()
        setAvailableClassifications(data.classifications)
        setCustomClassifications(data.custom || [])
      }
    } catch (error) {
      console.error('Error loading classifications:', error)
    }
  }

  const loadCustomFields = async () => {
    try {
      const response = await fetch('/api/admin/custom-fields')
      if (response.ok) {
        const data = await response.json()
        const formattedFields = data.map((field: any) => ({
          key: field.name,
          label: field.label,
          required: false,
          isCustom: true
        }))
        setCustomFields(formattedFields)
        setAllFormFields(prev => [...FORM_FIELDS, ...formattedFields])
      }
    } catch (error) {
      console.error('Error loading custom fields:', error)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size for chunked upload
      const maxSingleUploadSize = 3 * 1024 * 1024 // 3MB
      const maxChunkedUploadSize = 100 * 1024 * 1024 // 100MB limit for chunked uploads
      
      if (selectedFile.size > maxChunkedUploadSize) {
        alert(`File too large! Maximum size for chunked upload is ${maxChunkedUploadSize / (1024 * 1024)}MB. Your file is ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB. Please split your data into smaller files.`)
        e.target.value = '' // Clear the input
        return
      }
      
      // Enable chunked upload for large files
      if (selectedFile.size > maxSingleUploadSize) {
        setIsChunkedUpload(true)
        console.log(`Large file detected (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB). Enabling chunked upload mode.`)
      } else {
        setIsChunkedUpload(false)
      }
      
      setFile(selectedFile)
      processFilePreview(selectedFile)
    }
  }

  const processFilePreview = async (file: File) => {
    try {
      const text = await file.text()
      let headers: string[] = []
      let rows: any[][] = []

      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n')
        headers = parseCSVLine(lines[0])
        rows = lines.slice(1, 6).map(line => parseCSVLine(line))
      } else if (file.name.endsWith('.json')) {
        const data = JSON.parse(text)
        const array = Array.isArray(data) ? data : [data]
        if (array.length > 0) {
          headers = Object.keys(array[0])
          rows = array.slice(0, 5).map(obj => headers.map(h => obj[h]))
        }
      }

      setImportPreview({
        headers,
        sampleRows: rows.filter(row => row.some(cell => cell !== '')),
        totalRows: file.name.endsWith('.csv') ? text.split('\n').length - 1 : Array.isArray(JSON.parse(text)) ? JSON.parse(text).length : 1
      })

      // Auto-suggest field mappings
      const autoMappings = headers.map(sourceField => {
        const normalized = sourceField.toLowerCase().replace(/\s+/g, '').replace(/[_-]/g, '')
        
        // Smart field mapping based on exact matches first, then common variations
        let targetField = ''
        
        // EXACT MATCHES for your old database fields
        if (normalized === 'firstname') targetField = 'firstName'
        else if (normalized === 'surname') targetField = 'lastName'
        else if (normalized === 'email') targetField = 'email'
        else if (normalized === 'phone') targetField = 'phone'
        else if (normalized === 'state') targetField = 'state'
        else if (normalized === 'suburb') targetField = 'suburb'
        else if (normalized === 'source') targetField = 'source'
        else if (normalized === 'interest') targetField = 'productInterest'
        else if (normalized === 'others') targetField = 'others' // Need to add this as a custom field
        else if (normalized === 'comment') targetField = 'comments'
        else if (normalized === 'fup') targetField = 'followUpNotes'
        else if (normalized === 'calltakenby') targetField = 'submittedBy'
        else if (normalized === 'enquirysource') targetField = 'eventSource'
        else if (normalized === 'inputdate') targetField = 'createdAt'
        else if (normalized === 'status') targetField = 'status'
        else if (normalized === 'classification') targetField = 'customerRating'
        else if (normalized === 'newsletter') targetField = 'doNotEmail'
        else if (normalized === 'institutionname') targetField = 'institutionName'
        else if (normalized === 'nationality') targetField = 'nationality'
        
        // PARTIAL MATCHES for variations
        else if (normalized.includes('first') && normalized.includes('name')) targetField = 'firstName'
        else if (normalized.includes('last') && normalized.includes('name')) targetField = 'lastName'
        else if (normalized === 'lastname') targetField = 'lastName'
        else if (normalized.includes('email')) targetField = 'email'
        else if (normalized.includes('phone') || normalized.includes('mobile')) targetField = 'phone'
        else if (normalized.includes('state')) targetField = 'state'
        else if (normalized.includes('suburb') || normalized.includes('city')) targetField = 'suburb'
        else if (normalized.includes('nationality') || normalized.includes('country')) targetField = 'nationality'
        else if (normalized.includes('institution') || normalized.includes('company')) targetField = 'institutionName'
        else if (normalized.includes('product') || normalized.includes('piano') || normalized.includes('interest')) targetField = 'productInterest'
        else if (normalized.includes('source')) targetField = 'source'
        else if (normalized.includes('comment') || normalized.includes('note')) targetField = 'comments'
        else if (normalized.includes('status')) targetField = 'status'
        else if (normalized.includes('rating')) targetField = 'customerRating'
        else if (normalized.includes('classification') || normalized.includes('class')) targetField = 'customerRating'
        else if (normalized.includes('date') || normalized.includes('created')) targetField = 'createdAt'
        else if (normalized.includes('staff') || normalized.includes('submitt')) targetField = 'submittedBy'

        return {
          sourceField,
          targetField,
          isRequired: FORM_FIELDS.find(f => f.key === targetField)?.required || false
        }
      })

      setFieldMappings(autoMappings)
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Error processing file. Please check the file format.')
    }
  }

  const updateFieldMapping = (index: number, targetField: string) => {
    setFieldMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, targetField } : mapping
    ))
  }

  const addCustomClassification = async () => {
    if (newClassification.trim() && !availableClassifications.includes(newClassification.trim())) {
      try {
        const response = await fetch('/api/admin/classifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            classification: newClassification.trim()
          })
        })

        if (response.ok) {
          setCustomClassifications(prev => [...prev, newClassification.trim()])
          setAvailableClassifications(prev => [...prev, newClassification.trim()])
          setNewClassification('')
        } else {
          const errorData = await response.json()
          alert(`Error adding classification: ${errorData.error}`)
        }
      } catch (error) {
        console.error('Error adding classification:', error)
        alert('Error adding classification')
      }
    }
  }

  const removeCustomClassification = (classification: string) => {
    setCustomClassifications(prev => prev.filter(c => c !== classification))
    setAvailableClassifications(prev => prev.filter(c => c !== classification))
  }

  const getAllClassifications = () => {
    return availableClassifications
  }

  const addCustomField = async () => {
    if (!newCustomField.name.trim() || !newCustomField.label.trim()) {
      alert('Please enter both field name and label')
      return
    }

    try {
      // Make API call to create custom field
      const response = await fetch('/api/admin/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCustomField.name.trim(),
          label: newCustomField.label.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`Error adding custom field: ${errorData.error}`)
        return
      }

      const createdField = await response.json()
      
      // Add to local state using the response data
      const newField = {
        key: createdField.name,
        label: createdField.label,
        required: false,
        isCustom: true
      }

      // Add to custom fields
      setCustomFields(prev => [...prev, newField])
      
      // Add to all form fields
      setAllFormFields(prev => [...prev, newField])

      // If we were mapping a specific unmapped field, do the mapping
      if (selectedUnmappedField) {
        const fieldIndex = fieldMappings.findIndex(m => m.sourceField === selectedUnmappedField)
        if (fieldIndex !== -1) {
          updateFieldMapping(fieldIndex, createdField.name)
        }
      }

      // Reset form
      setNewCustomField({ name: '', label: '' })
      setShowCustomFieldModal(false)
      setSelectedUnmappedField('')
      
    } catch (error) {
      console.error('Error creating custom field:', error)
      alert('Error adding custom field: Failed to create custom field')
    }
  }

  const handleChunkedImport = async () => {
    if (!file || !importPreview) return

    setImportStatus('processing')
    setErrorLog([])
    setChunkResults([])
    setOverallResults({ imported: 0, skipped: 0, errors: 0, errorDetails: [] })

    try {
      // Read the file content
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0]
      const dataLines = lines.slice(1).filter(line => line.trim() !== '')
      
      // Calculate chunks (aim for ~500 rows per chunk to stay under size limits)
      const rowsPerChunk = 500
      const chunks = []
      
      for (let i = 0; i < dataLines.length; i += rowsPerChunk) {
        const chunkLines = dataLines.slice(i, i + rowsPerChunk)
        const chunkContent = headers + '\n' + chunkLines.join('\n')
        chunks.push({
          content: chunkContent,
          startRow: i + 1,
          endRow: Math.min(i + rowsPerChunk, dataLines.length),
          rowCount: chunkLines.length
        })
      }

      setTotalChunks(chunks.length)
      console.log(`Splitting file into ${chunks.length} chunks of ~${rowsPerChunk} rows each`)

      // Process each chunk
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        setCurrentChunk(chunkIndex + 1)
        setUploadProgress(((chunkIndex) / chunks.length) * 100)

        const chunk = chunks[chunkIndex]
        console.log(`Processing chunk ${chunkIndex + 1}/${chunks.length} (rows ${chunk.startRow}-${chunk.endRow})`)

        try {
          // Create a blob for this chunk
          const chunkBlob = new Blob([chunk.content], { type: 'text/csv' })
          const chunkFile = new File([chunkBlob], `${file.name}_chunk_${chunkIndex + 1}.csv`, { type: 'text/csv' })

          // Prepare mappings with custom field info
          const enhancedMappings = fieldMappings.map(mapping => ({
            ...mapping,
            isCustomField: customFields.some(cf => cf.key === mapping.targetField)
          }))

          const formData = new FormData()
          formData.append('file', chunkFile)
          formData.append('mappings', JSON.stringify(enhancedMappings))
          formData.append('customFields', JSON.stringify(customFields))
          formData.append('isChunk', 'true')
          formData.append('chunkInfo', JSON.stringify({
            chunkIndex: chunkIndex + 1,
            totalChunks: chunks.length,
            startRow: chunk.startRow,
            endRow: chunk.endRow
          }))

          const response = await fetch('/api/admin/import', {
            method: 'POST',
            body: formData
          })

          const responseText = await response.text()
          let result

          try {
            result = JSON.parse(responseText)
          } catch (parseError) {
            console.error(`Chunk ${chunkIndex + 1} JSON Parse Error:`, parseError)
            throw new Error(`Chunk ${chunkIndex + 1}: Server returned invalid JSON. Response: ${responseText.substring(0, 200)}...`)
          }

          if (response.ok) {
            // Update overall results
            setOverallResults(prev => ({
              imported: prev.imported + (result.imported || 0),
              skipped: prev.skipped + (result.skipped || 0),
              errors: prev.errors + (result.errors || 0),
              errorDetails: [...prev.errorDetails, ...(result.errorDetails || [])]
            }))

            // Store chunk result
            setChunkResults(prev => [...prev, {
              chunkIndex: chunkIndex + 1,
              ...result,
              startRow: chunk.startRow,
              endRow: chunk.endRow
            }])

            console.log(`Chunk ${chunkIndex + 1} completed: ${result.imported} imported, ${result.errors} errors`)
          } else {
            throw new Error(`Chunk ${chunkIndex + 1}: ${result.error || 'Unknown error'}`)
          }

        } catch (chunkError) {
          console.error(`Error processing chunk ${chunkIndex + 1}:`, chunkError)
          setErrorLog(prev => [...prev, `Chunk ${chunkIndex + 1}: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`])
          
          // Continue with next chunk even if this one fails
          setOverallResults(prev => ({
            ...prev,
            errors: prev.errors + chunk.rowCount,
            errorDetails: [...prev.errorDetails, `Chunk ${chunkIndex + 1} failed: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`]
          }))
        }

        // Small delay between chunks to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setUploadProgress(100)
      setImportStatus('complete')
      console.log('Chunked import completed!')

    } catch (error) {
      console.error('Chunked import error:', error)
      setImportStatus('error')
      setErrorLog([`Chunked import failed: ${error instanceof Error ? error.message : 'Unknown error'}`])
    }
  }

  const openCustomFieldModal = (sourceField?: string) => {
    setSelectedUnmappedField(sourceField || '')
    setNewCustomField({ 
      name: sourceField || '', 
      label: sourceField ? sourceField.charAt(0).toUpperCase() + sourceField.slice(1) : '' 
    })
    setShowCustomFieldModal(true)
  }

  const handleImport = async () => {
    if (isChunkedUpload) {
      return handleChunkedImport()
    }

    // Original single-file import logic
    if (!file || !importPreview) return

    setImportStatus('processing')
    setErrorLog([])

    try {
      // Prepare mappings with custom field info
      const enhancedMappings = fieldMappings.map(mapping => ({
        ...mapping,
        isCustomField: customFields.some(cf => cf.key === mapping.targetField)
      }))

      console.log('Sending mappings:', enhancedMappings)
      console.log('Sending custom fields:', customFields)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('mappings', JSON.stringify(enhancedMappings))
      formData.append('customFields', JSON.stringify(customFields))

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      // Get the raw response text first
      const responseText = await response.text()
      console.log('Raw response:', responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        console.error('Response text that failed to parse:', responseText)
        
        // Check for specific Vercel errors
        if (responseText.includes('Request Entity Too Large') || responseText.includes('FUNCTION_PAYLOAD_TOO_LARGE')) {
          throw new Error('File or data too large for processing. Please try with a smaller file (under 3MB) or fewer field mappings.')
        }
        
        if (responseText.includes('Function Execution Timeout')) {
          throw new Error('Import process timed out. Please try with a smaller file or contact support.')
        }
        
        throw new Error(`Server returned invalid JSON. Response: ${responseText.substring(0, 200)}...`)
      }
      
      if (response.ok) {
        setImportResults(result)
        setImportStatus('complete')
      } else {
        setImportStatus('error')
        setErrorLog(result.errors || [result.error])
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportStatus('error')
      setErrorLog([`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
            <h1 className="text-2xl font-bold">Customer Data Import</h1>
            <p className="text-blue-100 mt-1">Import your existing customer database</p>
          </div>

          <div className="p-6">
            {/* File Upload */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Upload Your Data File</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv,.json,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-gray-600">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-lg font-medium">Click to upload file</p>
                    <p className="text-sm text-gray-500">CSV, JSON, or Excel files supported</p>
                  </div>
                </label>
              </div>
              {file && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}
            </div>

            {/* Data Preview */}
            {importPreview && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Data Preview</h2>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Total Records:</strong> {importPreview.totalRows} |
                    <strong> Fields Found:</strong> {importPreview.headers.length}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {importPreview.headers.map((header, index) => (
                          <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.sampleRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 border-r">
                              {cell ? cell.replace(/<[^>]*>/g, '') : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Field Mapping */}
            {fieldMappings.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Map Your Fields</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Map your data fields to the CRM system fields. Required fields are marked with *.
                </p>
                
                {/* Unmapped Fields Alert */}
                {unmappedFields.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-yellow-800">Unmapped Fields Detected</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p className="mb-2">The following CSV columns don't have matching field options:</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {unmappedFields.map(field => (
                              <div key={field} className="flex items-center bg-yellow-100 px-2 py-1 rounded text-xs">
                                <span className="font-medium">{field}</span>
                                <button
                                  onClick={() => openCustomFieldModal(field)}
                                  className="ml-2 text-yellow-600 hover:text-yellow-800"
                                  title="Create custom field mapping"
                                >
                                  +
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => openCustomFieldModal()}
                            className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                          >
                            Create Custom Field Mapping
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Classifications Management */}
                {customClassifications.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Custom Classifications Added:</h3>
                    <div className="flex flex-wrap gap-2">
                      {customClassifications.map(classification => (
                        <span key={classification} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {classification}
                          <button
                            onClick={() => removeCustomClassification(classification)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Fields Management */}
                {customFields.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg">
                    <h3 className="text-sm font-medium text-green-900 mb-2">Custom Fields Available:</h3>
                    <div className="flex flex-wrap gap-2">
                      {customFields.map(field => (
                        <span key={field.key} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {field.label}
                          <span className="ml-1 text-green-600 text-xs">({field.key})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {fieldMappings.map((mapping, index) => (
                    <div key={index} className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center p-3 rounded-lg ${
                      !mapping.targetField ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                    }`}>
                      <div className="col-span-1 md:col-span-4 flex items-center">
                        <span className="text-sm font-medium text-gray-700">{mapping.sourceField}</span>
                        {!mapping.targetField && (
                          <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                            Unmapped
                          </span>
                        )}
                      </div>
                      <div className="hidden md:block md:col-span-1 text-center text-gray-400">→</div>
                      <div className="col-span-1 md:col-span-7">
                        {mapping.targetField === 'classification' ? (
                          <div className="space-y-2">
                            <select
                              value={mapping.targetField}
                              onChange={(e) => updateFieldMapping(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-w-0"
                            >
                              <option value="">- Skip this field -</option>
                              {allFormFields.map(field => (
                                <option key={field.key} value={field.key}>
                                  {field.label} {field.required ? '*' : ''} {field.isCustom ? '(Custom)' : ''} {field.note ? `(${field.note})` : ''}
                                </option>
                              ))}
                            </select>
                            
                            {/* Add New Classification */}
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={newClassification}
                                onChange={(e) => setNewClassification(e.target.value)}
                                placeholder="Add new classification..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                onKeyPress={(e) => e.key === 'Enter' && addCustomClassification()}
                              />
                              <button
                                onClick={addCustomClassification}
                                className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                              >
                                Add
                              </button>
                            </div>
                            
                            {/* Preview available classifications */}
                            <div className="text-xs text-gray-500">
                              Available: {getAllClassifications().join(', ')}
                            </div>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <select
                              value={mapping.targetField}
                              onChange={(e) => updateFieldMapping(index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm min-w-0"
                            >
                              <option value="">- Skip this field -</option>
                              {allFormFields.map(field => (
                                <option key={field.key} value={field.key}>
                                  {field.label} {field.required ? '*' : ''} {field.isCustom ? '(Custom)' : ''} {field.note ? `(${field.note})` : ''}
                                </option>
                              ))}
                            </select>
                            {!mapping.targetField && (
                              <button
                                onClick={() => openCustomFieldModal(mapping.sourceField)}
                                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                title="Create custom field for this column"
                              >
                                + Field
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Field Modal */}
            {showCustomFieldModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                  <h3 className="text-lg font-medium mb-4">Create Custom Field Mapping</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Name (from CSV)
                      </label>
                      <input
                        type="text"
                        value={newCustomField.name}
                        onChange={(e) => setNewCustomField({...newCustomField, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="e.g., leadScore"
                        readOnly={!!selectedUnmappedField}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={newCustomField.label}
                        onChange={(e) => setNewCustomField({...newCustomField, label: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="e.g., Lead Score"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowCustomFieldModal(false)
                        setNewCustomField({ name: '', label: '' })
                        setSelectedUnmappedField('')
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addCustomField}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Create Field
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Import Data Section */}
            {fieldMappings.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">4. Import Data</h2>
                
                {/* Chunked Upload Info */}
                {isChunkedUpload && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-blue-900">Large File Detected - Chunked Upload Mode</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Your file is {file ? (file.size / (1024 * 1024)).toFixed(2) : '0'}MB and will be processed in smaller chunks to ensure reliable upload.
                    </p>
                    {importStatus === 'processing' && totalChunks > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-blue-700 mb-1">
                          <span>Processing chunk {currentChunk} of {totalChunks}</span>
                          <span>{uploadProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-yellow-800">Before You Import</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Ensure your data is clean and in the correct format</li>
                          <li>Product interests should be comma-separated (e.g., "Steinway, Boston")</li>
                          <li>Dates should be in YYYY-MM-DD or DD/MM/YYYY format</li>
                          <li>Boolean fields (Do Not Email) should be true/false or 1/0</li>
                          <li>All imported records will be marked with import source for tracking</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleImport}
                  disabled={importStatus === 'processing'}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {importStatus === 'processing' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isChunkedUpload ? `Processing chunk ${currentChunk}/${totalChunks}...` : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Start Import
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Import Results */}
            {importStatus === 'complete' && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Complete!</h2>
                
                {isChunkedUpload ? (
                  // Chunked upload results
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-900">Chunked Import Completed Successfully</span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-700">Records Imported:</span>
                          <span className="ml-1 text-green-900">{overallResults.imported}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Records Skipped:</span>
                          <span className="ml-1 text-green-900">{overallResults.skipped}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Records with Errors:</span>
                          <span className="ml-1 text-green-900">{overallResults.errors}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Total Chunks:</span>
                          <span className="ml-1 text-green-900">{totalChunks}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chunk Details */}
                    {chunkResults.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Chunk Processing Details</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {chunkResults.map((chunk, index) => (
                            <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded text-sm">
                              <span className="font-medium">Chunk {chunk.chunkIndex} (rows {chunk.startRow}-{chunk.endRow})</span>
                              <div className="flex space-x-4 text-xs">
                                <span className="text-green-600">✓ {chunk.imported || 0} imported</span>
                                {chunk.skipped > 0 && <span className="text-yellow-600">⚠ {chunk.skipped} skipped</span>}
                                {chunk.errors > 0 && <span className="text-red-600">✗ {chunk.errors} errors</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Single upload results
                  importResults && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-900">Successfully Imported</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-700">Records Imported:</span>
                          <span className="ml-1 text-green-900">{importResults.imported}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Records Skipped:</span>
                          <span className="ml-1 text-green-900">{importResults.skipped}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Records with Errors:</span>
                          <span className="ml-1 text-green-900">{importResults.errors}</span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Import Errors */}
            {importStatus === 'error' && errorLog.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Errors</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="space-y-2">
                    {errorLog.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error Details for Chunked Upload */}
            {isChunkedUpload && overallResults.errorDetails.length > 0 && (
              <div className="mt-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-900 mb-2">Error Details</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {overallResults.errorDetails.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 