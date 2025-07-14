'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Backup {
  id: number
  date: string
  size: string
  type: 'Auto' | 'Manual'
  status: 'Complete' | 'In Progress' | 'Failed'
}

export default function DatabasePage() {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isMaintaining, setIsMaintaining] = useState(false)
  const [message, setMessage] = useState('')
  const [backupHistory, setBackupHistory] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [dbStats, setDbStats] = useState({
    totalEnquiries: 0,
    databaseSize: 'Loading...',
    lastBackup: 'Loading...',
    status: 'Loading...'
  })

  useEffect(() => {
    fetchBackups()
    fetchDatabaseStats()
  }, [])

  const fetchDatabaseStats = async () => {
    try {
      // Fetch enquiry count
      const enquiriesResponse = await fetch('/api/enquiries')
      const enquiries = await enquiriesResponse.json()
      const totalEnquiries = enquiries.length

      // Calculate database size estimate (rough calculation)
      const estimatedSizeKB = totalEnquiries * 2 // ~2KB per enquiry
      const sizeDisplay = estimatedSizeKB > 1024 
        ? `${(estimatedSizeKB / 1024).toFixed(1)} MB`
        : `${estimatedSizeKB} KB`

      setDbStats({
        totalEnquiries,
        databaseSize: sizeDisplay,
        lastBackup: backupHistory.length > 0 ? backupHistory[0].date : 'Never',
        status: 'Healthy'
      })
    } catch (error) {
      console.error('Error fetching database stats:', error)
      setDbStats({
        totalEnquiries: 0,
        databaseSize: 'Error',
        lastBackup: 'Error',
        status: 'Error'
      })
    }
  }

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/admin/backup')
      const data = await response.json()
      
      if (data.success) {
        setBackupHistory(data.backups)
        // Update last backup date in stats
        setDbStats(prev => ({
          ...prev,
          lastBackup: data.backups.length > 0 ? data.backups[0].date : 'Never'
        }))
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackup = async () => {
    setIsBackingUp(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'Manual' }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Database backup completed successfully!')
        await fetchBackups() // Refresh backup list
        await fetchDatabaseStats() // Refresh database stats
      } else {
        setMessage(`Backup failed: ${data.error}`)
      }
    } catch (error) {
      setMessage('Network error during backup')
    } finally {
      setIsBackingUp(false)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const handleRestore = async (backupId: number) => {
    const confirmed = confirm(`⚠️ DANGER: Are you sure you want to restore from backup #${backupId}?

This will:
- DELETE ALL current data
- Replace it with backup data
- Create a pre-restore backup

Type "RESTORE" to confirm this action.`)
    
    if (!confirmed) return
    
    const doubleConfirm = prompt(`Please type "RESTORE" to confirm you want to restore from backup #${backupId}:`)
    if (doubleConfirm !== 'RESTORE') {
      alert('Restore cancelled. You must type "RESTORE" exactly.')
      return
    }
    
    setIsRestoring(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupId }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        await fetchBackups() // Refresh backup list
        await fetchDatabaseStats() // Refresh database stats
      } else {
        setMessage(`❌ Restore failed: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Network error during restore')
    } finally {
      setIsRestoring(false)
      setTimeout(() => setMessage(''), 8000)
    }
  }

  const handleDeleteBackup = async (backupId: number) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/backup?id=${backupId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Backup #${backupId} deleted successfully`)
        await fetchBackups() // Refresh backup list
      } else {
        setMessage(`Delete failed: ${data.error}`)
      }
    } catch (error) {
      setMessage('Network error during delete')
    } finally {
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleMaintenance = async (action: string) => {
    // Add confirmation for potentially destructive operations
    if (action === 'clean') {
      const confirmed = confirm(`⚠️ Are you sure you want to clean the database?

This will:
- Remove empty records
- Delete invalid email addresses  
- Remove duplicate entries
- Create a backup before cleaning

Click OK to proceed.`)
      
      if (!confirmed) return
    }
    
    setIsMaintaining(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        if (data.details) {
          console.log('Maintenance details:', data.details)
        }
        await fetchBackups() // Refresh backup list in case backups were created
        await fetchDatabaseStats() // Refresh database stats
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Network error during maintenance')
    } finally {
      setIsMaintaining(false)
      setTimeout(() => setMessage(''), 8000)
    }
  }

  const handleDownloadBackup = async (backupId: number) => {
    try {
      const response = await fetch(`/api/admin/backup?id=${backupId}&action=download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup_${backupId}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage('✅ Backup downloaded successfully')
      } else {
        setMessage('❌ Download failed')
      }
    } catch (error) {
      setMessage('❌ Network error during download')
    } finally {
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
            <p className="text-gray-600 mt-1">Backup, restore, and maintain your database</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        {/* Database Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-red-100 rounded-lg mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Backup</h3>
                <p className="text-sm text-gray-600">Create a manual backup of your database</p>
              </div>
            </div>
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isBackingUp && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isBackingUp ? 'Creating Backup...' : 'Create Backup Now'}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Database Statistics</h3>
                <p className="text-sm text-gray-600">Current database information</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Enquiries:</span>
                <span className="text-sm font-medium text-gray-900">{dbStats.totalEnquiries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database Size:</span>
                <span className="text-sm font-medium text-gray-900">{dbStats.databaseSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Backup:</span>
                <span className="text-sm font-medium text-gray-900">{dbStats.lastBackup}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${dbStats.status === 'Healthy' ? 'text-green-600' : 'text-red-600'}`}>
                  {dbStats.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-orange-100 rounded-lg mr-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Find Duplicates</h3>
                <p className="text-sm text-gray-600">Detect and remove duplicate customer entries</p>
              </div>
            </div>
            <Link
              href="/admin/duplicates"
              className="w-full px-4 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Scan for Duplicates</span>
            </Link>
          </div>
        </div>

        {/* Backup History */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Backup History</h3>
            <p className="text-sm text-gray-600">Recent database backups</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Backup ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backupHistory.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">#{backup.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{backup.date}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{backup.size}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        backup.type === 'Auto' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {backup.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {backup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                      <button
                        onClick={() => handleRestore(backup.id)}
                        disabled={isRestoring}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        Restore
                      </button>
                      <button 
                        onClick={() => handleDownloadBackup(backup.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Download
                      </button>
                      <button 
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Tools */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Maintenance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => handleMaintenance('clean')}
              disabled={isMaintaining}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center disabled:opacity-50 disabled:cursor-not-allowed relative group"
            >
              <div className="text-2xl mb-2">🧹</div>
              <div className="text-sm font-medium text-gray-900 flex items-center justify-center gap-1">
                Clean Database
                <div className="relative">
                  <svg className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Removes empty records, invalid emails, and duplicate entries. Creates backup before cleaning.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600">Remove unused data</div>
            </button>
            <button 
              onClick={() => handleMaintenance('optimize')}
              disabled={isMaintaining}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center disabled:opacity-50 disabled:cursor-not-allowed relative group"
            >
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-medium text-gray-900 flex items-center justify-center gap-1">
                Optimize Tables
                <div className="relative">
                  <svg className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Runs database optimization to improve query performance and update table statistics.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600">Improve performance</div>
            </button>
            <button 
              onClick={() => handleMaintenance('integrity')}
              disabled={isMaintaining}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center disabled:opacity-50 disabled:cursor-not-allowed relative group"
            >
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm font-medium text-gray-900 flex items-center justify-center gap-1">
                Check Integrity
                <div className="relative">
                  <svg className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Scans database for data integrity issues, missing fields, and invalid formats.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600">Verify data consistency</div>
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Automatic Daily Backups</h4>
                <p className="text-sm text-gray-600">Create automatic backups every day at 9:30 AM</p>
              </div>
              <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 bg-red-600">
                <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Retain Backups</h4>
                <p className="text-sm text-gray-600">Keep backups for 30 days before automatic deletion</p>
              </div>
              <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                <option>7 days</option>
                <option>30 days</option>
                <option>90 days</option>
                <option>Forever</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 