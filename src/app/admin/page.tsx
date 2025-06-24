'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats] = useState({
    totalEnquiries: 245,
    newEnquiries: 23,
    activeStaff: 8,
    systemHealth: 'Good'
  })

  const adminSections = [
    {
      title: 'Staff Management',
      description: 'Manage staff members, roles, and permissions',
      href: '/admin/staff',
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      title: 'Data Import',
      description: 'Import customer data from CSV/Excel files',
      href: '/admin/import',
      icon: '📊',
      color: 'bg-green-500'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      href: '/admin/settings',
      icon: '⚙️',
      color: 'bg-purple-500'
    },
    {
      title: 'Analytics',
      description: 'View reports and analytics',
      href: '/admin/analytics',
      icon: '📈',
      color: 'bg-orange-500'
    },
    {
      title: 'Database Management',
      description: 'Database backup, restore, and maintenance',
      href: '/admin/database',
      icon: '🗄️',
      color: 'bg-red-500'
    },
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      href: '/admin/users',
      icon: '🔐',
      color: 'bg-indigo-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your CRM system settings and data</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 text-xl mr-4">📧</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enquiries</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEnquiries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 text-xl mr-4">🆕</div>
              <div>
                <p className="text-sm font-medium text-gray-600">New This Week</p>
                <p className="text-3xl font-bold text-gray-900">{stats.newEnquiries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 text-xl mr-4">👥</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeStaff}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 text-xl mr-4">✅</div>
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-lg font-semibold text-green-600">{stats.systemHealth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 p-6 group"
            >
              <div className="flex items-start">
                <div className={`${section.color} p-3 rounded-lg text-white text-2xl mr-4 group-hover:scale-110 transition-transform`}>
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {section.description}
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/import"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">📊</span>
              Import Customer Data
            </Link>
            <Link
              href="/admin/staff/new"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span className="mr-2">➕</span>
              Add New Staff Member
            </Link>
            <Link
              href="/submitted-forms/enquiry-data"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span className="mr-2">📋</span>
              View All Enquiries
            </Link>
            <Link
              href="/admin/database"
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <span className="mr-2">💾</span>
              Backup Database
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">New enquiry from John Smith</span>
              </div>
              <span className="text-xs text-gray-400">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Staff member June updated customer rating</span>
              </div>
              <span className="text-xs text-gray-400">15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">System backup completed successfully</span>
              </div>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 