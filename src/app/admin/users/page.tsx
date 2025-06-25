'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface User {
  id: number
  username: string
  role: string
  name: string
  active: boolean
  lastLogin?: string
  password?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top?: number; bottom?: number }>({})
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({})

  useEffect(() => {
    fetchUsers()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/staff')
      const data = await response.json()
      
      if (data.success) {
        // Add admin user manually since it's not in staff data
        const adminUser: User = {
          id: 0,
          username: 'MarkandLouie2025@',
          role: 'admin',
          name: 'Mark & Louie',
          active: true,
          lastLogin: new Date().toISOString().slice(0, 16).replace('T', ' ')
        }
        
        // Convert staff data to user format with mock last login
        const staffUsers: User[] = data.staff.map((staff: any) => ({
          ...staff,
          lastLogin: generateMockLastLogin()
        }))
        
        setUsers([adminUser, ...staffUsers])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockLastLogin = () => {
    const now = new Date()
    const daysAgo = Math.floor(Math.random() * 7) + 1
    const hoursAgo = Math.floor(Math.random() * 24)
    const minutesAgo = Math.floor(Math.random() * 60)
    
    const loginTime = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000))
    return loginTime.toISOString().slice(0, 16).replace('T', ' ')
  }

  const handleViewUser = (user: any) => {
    setSelectedUser(user)
    setShowModal(true)
    setOpenDropdown(null)
  }

  const handleEditUser = (user: User) => {
    setEditingUser({...user})
    setEditMode(true)
    setOpenDropdown(null)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          name: editingUser.name,
          active: editingUser.active
        }),
      })

      if (response.ok) {
        await fetchUsers() // Refresh the list
        setEditMode(false)
        setEditingUser(null)
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const toggleUserStatus = async (user: User) => {
    if (user.role === 'admin') return // Don't allow deactivating admin
    
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          active: !user.active
        }),
      })

      if (response.ok) {
        setOpenDropdown(null) // Close dropdown after action
        await fetchUsers() // Refresh the list
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  const deleteUser = async (user: User) => {
    if (user.role === 'admin') {
      alert('Cannot delete admin user')
      return
    }

    if (!confirm('Are you sure you want to delete this user? This will deactivate their account but preserve all their data.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/staff?id=${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setOpenDropdown(null) // Close dropdown after action
        await fetchUsers() // Refresh the list
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const calculateDropdownPosition = (buttonElement: HTMLButtonElement) => {
    const rect = buttonElement.getBoundingClientRect()
    const dropdownHeight = 200 // Approximate dropdown height
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    
    // If there's not enough space below but enough space above, position above
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      return { bottom: 32 } // Position above the button
    }
    
    // Default: position below
    return { top: 32 }
  }

  const toggleDropdown = (id: number) => {
    if (openDropdown === id) {
      setOpenDropdown(null)
      return
    }
    
    const buttonElement = buttonRefs.current[id]
    if (buttonElement) {
      const position = calculateDropdownPosition(buttonElement)
      setDropdownPosition(position)
    }
    
    setOpenDropdown(id)
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage user accounts and access permissions</p>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/admin/staff"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Staff Accounts
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.active).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Staff Members</p>
                <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'staff').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
            <p className="text-sm text-gray-600 mt-1">Complete list of system users and their access levels</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          user.role === 'admin' ? 'bg-red-500' : user.active ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="relative" ref={openDropdown === user.id ? dropdownRef : undefined}>
                        <button
                          ref={(el) => { buttonRefs.current[user.id] = el }}
                          onClick={() => toggleDropdown(user.id)}
                          className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          title="More actions"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdown === user.id && (
                          <div 
                            className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                            style={dropdownPosition}
                          >
                            <button
                              onClick={() => handleViewUser(user)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                            
                            <button
                              onClick={() => handleEditUser(user)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit User
                            </button>

                            {user.role !== 'admin' && (
                              <button
                                onClick={() => toggleUserStatus(user)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                {user.active ? (
                                  <>
                                    <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L12 21l-1.5-1.5m1.5 1.5l1.5-1.5M21 12l-1.5-1.5m1.5 1.5l-1.5-1.5m-12.728 0L12 3l1.5 1.5M12 3L10.5 4.5M3 12l1.5 1.5M3 12l1.5-1.5" />
                                    </svg>
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Activate
                                  </>
                                )}
                              </button>
                            )}

                            {user.role !== 'admin' && (
                              <>
                                <div className="border-t border-gray-100 my-1"></div>
                                
                                <button
                                  onClick={() => deleteUser(user)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg ${
                      selectedUser.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">{selectedUser.name}</h4>
                      <p className="text-sm text-gray-600">{selectedUser.role} user</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Username</label>
                      <div className="text-sm font-mono text-gray-900">{selectedUser.username}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Role</label>
                      <div className="text-sm text-gray-900">{selectedUser.role}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Last Login</label>
                      <div className="text-sm text-gray-900">{selectedUser.lastLogin}</div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button 
                      onClick={() => handleEditUser(selectedUser)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit User
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editMode && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
                  <button
                    onClick={() => {
                      setEditMode(false)
                      setEditingUser(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={editingUser.role === 'admin'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      value={editingUser.username}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      disabled
                    />
                    <p className="text-sm text-gray-500 mt-1">Username cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <input
                      type="text"
                      value={editingUser.role}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      disabled
                    />
                    <p className="text-sm text-gray-500 mt-1">Role cannot be changed</p>
                  </div>

                  {editingUser.role !== 'admin' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Active Status</h4>
                        <p className="text-sm text-gray-600">Enable or disable user access</p>
                      </div>
                      <button
                        onClick={() => setEditingUser({...editingUser, active: !editingUser.active})}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          editingUser.active ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            editingUser.active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={handleSaveUser}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false)
                      setEditingUser(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
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