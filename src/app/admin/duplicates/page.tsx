'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DuplicateEnquiry {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  state: string
  suburb: string
  createdAt: string
  importSource?: string
}

interface DuplicateGroup {
  id: string
  type: string
  criteria: string
  count: number
  enquiries: DuplicateEnquiry[]
  recommended: DuplicateEnquiry[]
}

interface DuplicateSummary {
  totalEnquiries: number
  duplicateGroups: number
  totalDuplicates: number
  uniqueRecords: number
  potentialSavings: number
}

export default function DuplicatesPage() {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [summary, setSummary] = useState<DuplicateSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(false)
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<number>>(new Set())
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchDuplicates()
  }, [])

  const fetchDuplicates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/duplicates')
      const data = await response.json()
      
      if (data.success) {
        setDuplicateGroups(data.duplicateGroups)
        setSummary(data.summary)
      } else {
        setMessage('Error loading duplicates')
      }
    } catch (error) {
      setMessage('Failed to load duplicates')
      console.error('Error fetching duplicates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectGroup = (group: DuplicateGroup, selectAll: boolean) => {
    const newSelected = new Set(selectedDuplicates)
    const idsToProcess = selectAll ? group.enquiries.map(e => e.id) : group.recommended.map(e => e.id)
    
    idsToProcess.forEach(id => {
      if (selectAll || newSelected.has(id)) {
        if (newSelected.has(id)) {
          newSelected.delete(id)
        } else {
          newSelected.add(id)
        }
      } else {
        newSelected.add(id)
      }
    })
    
    setSelectedDuplicates(newSelected)
  }

  const handleSelectIndividual = (id: number) => {
    const newSelected = new Set(selectedDuplicates)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDuplicates(newSelected)
  }

  const removeDuplicates = async () => {
    if (selectedDuplicates.size === 0) {
      setMessage('Please select duplicates to remove')
      return
    }

    if (!confirm(`Are you sure you want to remove ${selectedDuplicates.size} duplicate entries? This action cannot be undone (but a backup will be created).`)) {
      return
    }

    try {
      setRemoving(true)
      const response = await fetch('/api/admin/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          duplicateIds: Array.from(selectedDuplicates)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage(`✅ Successfully removed ${data.removedCount} duplicate entries. Backup created automatically.`)
        setSelectedDuplicates(new Set())
        // Refresh the duplicates list
        await fetchDuplicates()
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to remove duplicates')
      console.error('Error removing duplicates:', error)
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Scanning for duplicates...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Duplicate Management</h1>
              <p className="mt-2 text-gray-600">Find and remove duplicate customer entries</p>
            </div>
            <Link 
              href="/admin/database"
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              ← Back to Database
            </Link>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Total Enquiries</h3>
              <p className="text-3xl font-bold text-blue-600">{summary.totalEnquiries}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Duplicate Groups</h3>
              <p className="text-3xl font-bold text-orange-600">{summary.duplicateGroups}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Total Duplicates</h3>
              <p className="text-3xl font-bold text-red-600">{summary.totalDuplicates}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Unique Records</h3>
              <p className="text-3xl font-bold text-green-600">{summary.uniqueRecords}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Can Remove</h3>
              <p className="text-3xl font-bold text-purple-600">{summary.potentialSavings}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {duplicateGroups.length > 0 && (
          <div className="mb-6 flex gap-4">
            <button
              onClick={removeDuplicates}
              disabled={removing || selectedDuplicates.size === 0}
              className={`px-6 py-3 rounded-lg font-semibold ${
                removing || selectedDuplicates.size === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {removing ? 'Removing...' : `Remove Selected (${selectedDuplicates.size})`}
            </button>
            
            <button
              onClick={() => setSelectedDuplicates(new Set())}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Duplicate Groups */}
        {duplicateGroups.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">No Duplicates Found!</h2>
            <p className="text-gray-600">Your database is clean - no duplicate entries detected.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {duplicateGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{group.type}</h3>
                    <p className="text-gray-600">{group.criteria}</p>
                    <p className="text-sm text-gray-500">{group.count} total records</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectGroup(group, false)}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-semibold"
                    >
                      Select Recommended ({group.recommended.length})
                    </button>
                    <button
                      onClick={() => handleSelectGroup(group, true)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold"
                    >
                      Toggle All
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {group.enquiries.map((enquiry, index) => (
                    <div 
                      key={enquiry.id}
                      className={`p-4 border rounded-lg ${
                        selectedDuplicates.has(enquiry.id) 
                          ? 'border-red-500 bg-red-50' 
                          : index === 0 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={selectedDuplicates.has(enquiry.id)}
                              onChange={() => handleSelectIndividual(enquiry.id)}
                              className="h-5 w-5"
                              disabled={index === 0} // Don't allow selecting the first (original) record
                            />
                            <div>
                              <h4 className="font-semibold">
                                {enquiry.firstName} {enquiry.lastName}
                                {index === 0 && <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">KEEP</span>}
                                {group.recommended.some(r => r.id === enquiry.id) && <span className="ml-2 text-xs bg-orange-600 text-white px-2 py-1 rounded">RECOMMENDED FOR REMOVAL</span>}
                              </h4>
                              <p className="text-gray-600">{enquiry.email}</p>
                              <p className="text-gray-500 text-sm">{enquiry.phone} • {enquiry.state}</p>
                              <p className="text-gray-400 text-xs">
                                Created: {new Date(enquiry.createdAt).toLocaleDateString()}
                                {enquiry.importSource && ` • Source: ${enquiry.importSource}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 