'use client'

import { useState, useEffect } from 'react'

interface Staff {
  id: number
  name: string
  email: string
  role: string
  active: boolean
  username?: string
  password?: string
  phone?: string
  position?: string
  department?: string
}

type TabType = 'overview' | 'email' | 'credentials' | 'add'

export default function UnifiedStaffManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Load staff data
  useEffect(() => {
    loadStaff()
  }, [activeTab])

  const loadStaff = async () => {
    try {
      setLoading(true)
      setMessage('')
      const endpoint = activeTab === 'email' 
        ? '/api/admin/staff?email_format=true'
        : '/api/admin/staff'
      
      const response = await fetch(endpoint)
      const data = await response.json()
      
      if (data.success) {
        setStaff(data.staff)
      } else {
        setMessage('❌ Failed to load staff data')
      }
    } catch (error) {
      setMessage('❌ Error loading staff data')
    } finally {
      setLoading(false)
    }
  }

  const updateStaffEmails = async () => {
    try {
      setSaving(true)
      setMessage('')
      const response = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff })
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage('✅ Staff emails updated successfully')
      } else {
        setMessage('❌ Failed to update staff emails')
      }
    } catch (error) {
      setMessage('❌ Error updating staff emails')
    } finally {
      setSaving(false)
    }
  }

  const updateStaffEmail = (id: number, email: string) => {
    setStaff(staff.map(s => s.id === id ? { ...s, email } : s))
  }

  const toggleStaffActive = (id: number) => {
    setStaff(staff.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const tabs = [
    { id: 'overview', name: 'Staff Overview', icon: '👥' },
    { id: 'email', name: 'Email Management', icon: '📧' },
    { id: 'credentials', name: 'Credentials', icon: '🔐' },
    { id: 'add', name: 'Add Staff', icon: '➕' }
  ] as const

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive staff management system - manage all staff information in one place
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 
            message.includes('❌') ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading staff data...</p>
            </div>
          ) : (
            <>
              {/* Staff Overview Tab */}
              {activeTab === 'overview' && (
                <div className="p-6">
                  <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Staff Overview</h2>
                    <div className="text-sm text-gray-500">
                      {staff.length} total staff members • {staff.filter(s => s.active).length} active
                    </div>
                  </div>
                  
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {staff.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.email || 'No email set'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {member.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {member.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => setActiveTab('email')}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit Email
                              </button>
                              <button
                                onClick={() => setActiveTab('credentials')}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Credentials
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Email Management Tab */}
              {activeTab === 'email' && (
                <div className="p-6">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Email Management</h2>
                      <p className="text-gray-600">Add email addresses to existing staff members for the reminder system.</p>
                    </div>
                    <button
                      onClick={updateStaffEmails}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {staff.map((member) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-2">{member.name}</h3>
                            <input
                              type="email"
                              value={member.email || ''}
                              onChange={(e) => updateStaffEmail(member.id, e.target.value)}
                              placeholder="Enter email address"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="ml-4 flex items-center">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={member.active}
                                onChange={() => toggleStaffActive(member.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Active</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Credentials Tab */}
              {activeTab === 'credentials' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Staff Credentials</h2>
                    <p className="text-gray-600">Manage usernames and passwords for staff access.</p>
                  </div>

                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {staff.map((member) => (
                          <tr key={member.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {member.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                              {member.username || member.name.toLowerCase().replace(/\s+/g, '.') + '.staff'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                              {member.password || '••••••••••••'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {member.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Add Staff Tab */}
              {activeTab === 'add' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Add New Staff Member</h2>
                    <p className="text-gray-600">Create a new staff member with automatic credential generation.</p>
                  </div>

                  <div className="max-w-md">
                                         <form onSubmit={(e) => {
                       e.preventDefault()
                       // Add new staff functionality would go here
                       setMessage('ℹ️ New staff creation feature coming soon')
                     }}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Staff Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter staff member name"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter email address"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                      >
                        Create Staff Member
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Unified Staff Management System • Only active staff will receive reminder emails</p>
        </div>
      </div>
    </div>
  )
} 