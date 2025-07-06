'use client'

import { useState, useEffect } from 'react'

interface Staff {
  id: number
  name: string
  email: string
  phone: string
  position: string
  department: string
  status: 'active' | 'inactive'
  hire_date: string
  location: string
}

export default function StaffUnifiedPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    const sampleData: Staff[] = [
      {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@epg.com',
        phone: '+61 2 9876 5432',
        position: 'Senior Developer',
        department: 'Engineering',
        status: 'active',
        hire_date: '2023-01-15',
        location: 'Sydney, NSW'
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@epg.com',
        phone: '+61 3 9876 5432',
        position: 'Project Manager',
        department: 'Operations',
        status: 'active',
        hire_date: '2022-08-20',
        location: 'Melbourne, VIC'
      },
      {
        id: 3,
        name: 'Mike Chen',
        email: 'mike.chen@epg.com',
        phone: '+61 7 9876 5432',
        position: 'Marketing Specialist',
        department: 'Marketing',
        status: 'inactive',
        hire_date: '2023-03-10',
        location: 'Brisbane, QLD'
      }
    ]
    
    setTimeout(() => {
      setStaff(sampleData)
      setLoading(false)
    }, 500)
  }, [])

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    inactive: staff.filter(s => s.status === 'inactive').length,
    departments: new Set(staff.map(s => s.department)).size
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage your team members, view statistics, and handle staff operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.departments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search staff by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading staff...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No staff found matching your criteria</div>
            ) : (
              filteredStaff.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-500">{member.position}</p>
                        <span className={member.status === 'active' 
                            ? 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800' 
                            : 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800'}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span>📧</span>
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>📞</span>
                        <span>{member.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>📍</span>
                        <span>{member.location}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 flex space-x-2">
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                        Edit
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
