'use client'

import { useState, useEffect } from 'react'

interface StaffMember {
  id: number
  username: string
  name: string
  role: string
  active: boolean
  password?: string
}

interface NewStaffResult {
  id: number
  username: string
  password: string
  name: string
  role: string
  active: boolean
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newStaffName, setNewStaffName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newStaffCredentials, setNewStaffCredentials] = useState<NewStaffResult | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/admin/staff')
      const data = await response.json()
      
      if (data.success) {
        setStaff(data.staff)
      } else {
        setError('Failed to load staff')
      }
    } catch (error) {
      setError('Network error loading staff')
    } finally {
      setLoading(false)
    }
  }

  const createStaff = async () => {
    if (!newStaffName.trim()) return

    setIsCreating(true)
    setError('')

    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newStaffName.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setNewStaffCredentials(data.staff)
        setShowPasswordModal(true)
        setNewStaffName('')
        fetchStaff() // Refresh the list
      } else {
        setError(data.error || 'Failed to create staff member')
      }
    } catch (error) {
      setError('Network error creating staff member')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleStaffStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, active: !currentStatus }),
      })

      if (response.ok) {
        fetchStaff() // Refresh the list
      } else {
        setError('Failed to update staff status')
      }
    } catch (error) {
      setError('Network error updating staff')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
            <h1 className="text-2xl font-bold">Staff Management</h1>
            <p className="text-blue-100 mt-1">Manage staff accounts and access permissions</p>
          </div>

          {/* Create New Staff */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Staff Member</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <input
                type="text"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="Enter staff member's full name"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && createStaff()}
              />
              <button
                onClick={createStaff}
                disabled={isCreating || !newStaffName.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCreating && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isCreating ? 'Creating...' : 'Create Staff Account'}</span>
              </button>
            </div>

            <p className="text-sm text-gray-600 mt-2">
              A unique username and secure password will be automatically generated.
            </p>
          </div>
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Current Staff Members</h2>
            <p className="text-sm text-gray-600 mt-1">Total: {staff.length} staff members</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
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
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          member.active ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">ID: {member.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">{member.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => toggleStaffStatus(member.id, member.active)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          member.active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {member.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Staff Credentials Modal */}
        {showPasswordModal && newStaffCredentials && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Staff Account Created!</h3>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>Important:</strong> Save these credentials securely. The password will not be shown again.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                      <div className="flex items-center justify-between bg-white border rounded px-3 py-2">
                        <span className="text-sm font-medium">{newStaffCredentials.name}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                      <div className="flex items-center justify-between bg-white border rounded px-3 py-2">
                        <span className="text-sm font-mono">{newStaffCredentials.username}</span>
                        <button
                          onClick={() => copyToClipboard(newStaffCredentials.username)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                      <div className="flex items-center justify-between bg-white border rounded px-3 py-2">
                        <span className="text-sm font-mono">{newStaffCredentials.password}</span>
                        <button
                          onClick={() => copyToClipboard(newStaffCredentials.password)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      copyToClipboard(`Username: ${newStaffCredentials.username}\nPassword: ${newStaffCredentials.password}`)
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Copy Both
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false)
                      setNewStaffCredentials(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 