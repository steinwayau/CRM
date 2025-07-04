'use client'

import { useState } from 'react'

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
  { key: 'createdAt', label: 'Original Date Created', required: false, note: 'Date format: YYYY-MM-DD or DD/MM/YYYY' }
]

const PRODUCT_OPTIONS = ['steinway', 'boston', 'essex', 'kawai', 'yamaha', 'usedpiano', 'roland', 'ritmuller', 'ronisch', 'kurzweil', 'other']

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle')
  const [importResults, setImportResults] = useState<any>(null)
  const [errorLog, setErrorLog] = useState<string[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
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
        headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        rows = lines.slice(1, 6).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')))
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
        
        // Smart field mapping based on common variations
        let targetField = ''
        if (normalized.includes('first') && normalized.includes('name')) targetField = 'firstName'
        else if (normalized.includes('last') && normalized.includes('name')) targetField = 'lastName'
        else if (normalized.includes('surname') || normalized === 'lastname') targetField = 'lastName'
        else if (normalized === 'email' || normalized.includes('email')) targetField = 'email'
        else if (normalized === 'phone' || normalized.includes('phone') || normalized.includes('mobile')) targetField = 'phone'
        else if (normalized.includes('state')) targetField = 'state'
        else if (normalized.includes('suburb') || normalized.includes('city')) targetField = 'suburb'
        else if (normalized.includes('nationality') || normalized.includes('country')) targetField = 'nationality'
        else if (normalized.includes('institution') || normalized.includes('company')) targetField = 'institutionName'
        else if (normalized.includes('product') || normalized.includes('piano') || normalized.includes('interest')) targetField = 'productInterest'
        else if (normalized.includes('source')) targetField = 'source'
        else if (normalized.includes('comment') || normalized.includes('note')) targetField = 'comments'
        else if (normalized.includes('status')) targetField = 'status'
        else if (normalized.includes('rating')) targetField = 'customerRating'
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

  const handleImport = async () => {
    if (!file || !importPreview) return

    setImportStatus('processing')
    setErrorLog([])

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mappings', JSON.stringify(fieldMappings))

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (response.ok) {
        setImportResults(result)
        setImportStatus('complete')
      } else {
        setImportStatus('error')
        setErrorLog(result.errors || [result.error])
      }
         } catch (error) {
       setImportStatus('error')
       setErrorLog([`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`])
     }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
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
                              {cell || '-'}
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
                <div className="space-y-3">
                  {fieldMappings.map((mapping, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">{mapping.sourceField}</span>
                      </div>
                      <div className="text-center text-gray-400">→</div>
                      <div>
                        <select
                          value={mapping.targetField}
                          onChange={(e) => updateFieldMapping(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">- Skip this field -</option>
                          {FORM_FIELDS.map(field => (
                            <option key={field.key} value={field.key}>
                              {field.label} {field.required ? '*' : ''} {field.note ? `(${field.note})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Action */}
            {fieldMappings.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">4. Import Data</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
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
                  {importStatus === 'processing' && (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>
                    {importStatus === 'processing' ? 'Importing...' : 'Start Import'}
                  </span>
                </button>
              </div>
            )}

            {/* Import Results */}
            {importStatus === 'complete' && importResults && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Complete!</h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-8 w-8 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-green-800">Successfully Imported</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p><strong>Records Imported:</strong> {importResults.imported}</p>
                        <p><strong>Records Skipped:</strong> {importResults.skipped}</p>
                        <p><strong>Records with Errors:</strong> {importResults.errors}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Log */}
            {importStatus === 'error' && errorLog.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Errors</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-red-700">
                    {errorLog.map((error, index) => (
                      <p key={index} className="mb-2">{error}</p>
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