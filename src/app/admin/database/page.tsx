'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DatabasePage() {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [message, setMessage] = useState('')
  
  const backupHistory = [
    { id: 1, date: '2024-01-15 09:30', size: '2.4 MB', type: 'Auto', status: 'Complete' },
    { id: 2, date: '2024-01-14 09:30', size: '2.3 MB', type: 'Auto', status: 'Complete' },
    { id: 3, date: '2024-01-13 15:22', size: '2.2 MB', type: 'Manual', status: 'Complete' },
    { id: 4, date: '2024-01-12 09:30', size: '2.1 MB', type: 'Auto', status: 'Complete' },
  ]

  const handleBackup = async () => {
    setIsBackingUp(true)
    setMessage('')
    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 3000))
    setMessage('Database backup completed successfully!')
    setIsBackingUp(false)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleRestore = async (backupId: number) => {
    if (!confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) {
      return
    }
    setIsRestoring(true)
    setMessage('')
    // Simulate restore process
    await new Promise(resolve => setTimeout(resolve, 2000))
    setMessage(`Database restored from backup #${backupId} successfully!`)
    setIsRestoring(false)
    setTimeout(() => setMessage(''), 5000)
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                <span className="text-sm font-medium text-gray-900">245</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database Size:</span>
                <span className="text-sm font-medium text-gray-900">2.4 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Backup:</span>
                <span className="text-sm font-medium text-gray-900">Today 09:30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-sm font-medium text-green-600">Healthy</span>
              </div>
            </div>
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
                      <button className="text-green-600 hover:text-green-800">
                        Download
                      </button>
                      <button className="text-red-600 hover:text-red-800">
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
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center">
              <div className="text-2xl mb-2">🧹</div>
              <div className="text-sm font-medium text-gray-900">Clean Database</div>
              <div className="text-xs text-gray-600">Remove unused data</div>
            </button>
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-medium text-gray-900">Optimize Tables</div>
              <div className="text-xs text-gray-600">Improve performance</div>
            </button>
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm font-medium text-gray-900">Check Integrity</div>
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