'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function UsersPage() {
  const [users] = useState([
    { id: 1, username: 'MarkandLouie2025@', role: 'admin', name: 'Mark & Louie', active: true, lastLogin: '2024-01-15 10:30' },
    { id: 2, username: 'june.staff', role: 'staff', name: 'June', active: true, lastLogin: '2024-01-15 09:15' },
    { id: 3, username: 'chris.staff', role: 'staff', name: 'Chris', active: true, lastLogin: '2024-01-14 16:45' },
    { id: 4, username: 'mike.staff', role: 'staff', name: 'Mike', active: true, lastLogin: '2024-01-14 14:20' },
    { id: 5, username: 'alison.staff', role: 'staff', name: 'Alison', active: true, lastLogin: '2024-01-13 11:30' },
    { id: 6, username: 'angela.staff', role: 'staff', name: 'Angela', active: true, lastLogin: '2024-01-12 15:10' },
    { id: 7, username: 'olivia.staff', role: 'staff', name: 'Olivia', active: true, lastLogin: '2024-01-11 13:45' },
    { id: 8, username: 'mark.staff', role: 'staff', name: 'Mark', active: true, lastLogin: '2024-01-10 10:20' },
    { id: 9, username: 'louie.staff', role: 'staff', name: 'Louie', active: true, lastLogin: '2024-01-09 16:30' },
  ])

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const handleViewUser = (user: any) => {
    setSelectedUser(user)
    setShowModal(true)
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
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
            <p className="text-sm text-gray-600">Complete list of system users</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          user.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'
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
                      <div className="text-sm text-gray-900">{user.lastLogin}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-800">
                        Edit
                      </button>
                      {user.role !== 'admin' && (
                        <button className="text-red-600 hover:text-red-800">
                          {user.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
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
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
      </div>
    </div>
  )
} 