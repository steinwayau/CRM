'use client'

import { useState, useEffect } from 'react'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/admin/staff-emails')
      const data = await response.json()
      
      if (data.success) {
        setStaff(data.staff || [])
      } else {
        setMessage('Failed to load staff data')
      }
    } catch (error) {
      setMessage('Error loading staff data')
    } finally {
      setLoading(false)
    }
  }

  const updateStaffEmail = (id: string, email: string) => {
    setStaff(staff.map(member => 
      member.id === id ? { ...member, email } : member
    ))
  }

  const toggleStaffActive = (id: string) => {
    setStaff(staff.map(member => 
      member.id === id ? { ...member, active: !member.active } : member
    ))
  }

  const saveChanges = async () => {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/staff-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ staff })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage('✅ Staff email addresses updated successfully!')
        // Refresh the data
        fetchStaff()
      } else {
        setMessage('❌ Failed to update staff email addresses')
      }
    } catch (error) {
      setMessage('❌ Error saving changes')
    } finally {
      setSaving(false)
    }
  }

  const addNewStaff = () => {
    const newStaff: StaffMember = {
      id: `new-${Date.now()}`,
      name: '',
      email: '',
      role: 'staff',
      active: true
    }
    setStaff([...staff, newStaff])
  }

  const removeStaff = (id: string) => {
    setStaff(staff.filter(member => member.id !== id))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading staff data...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Staff Management</h1>
        <p className="text-gray-600">
          Manage staff email addresses for the reminder system. Only active staff will receive reminder emails.
        </p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white border rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Staff Email Addresses</h2>
            <button
              onClick={addNewStaff}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Add New Staff
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {staff.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Staff Name"
                    value={member.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStaff(staff.map(s => 
                      s.id === member.id ? { ...s, name: e.target.value } : s
                    ))}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={member.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStaffEmail(member.id, e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={member.active}
                      onChange={() => toggleStaffActive(member.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <button
                    onClick={() => removeStaff(member.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            {staff.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No staff members found. Click "Add New Staff" to get started.
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={saveChanges} 
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow mt-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">How Email Reminders Work</h2>
        </div>
        <div className="p-6">
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Email reminders are sent automatically every hour to active staff members</p>
            <p>• Only staff marked as "Active" will receive reminder emails</p>
            <p>• The system checks for enquiries that need follow-up based on their status and date</p>
            <p>• Staff assigned to specific enquiries will receive targeted reminders</p>
            <p>• If no specific staff is assigned, all active staff will receive the reminder</p>
          </div>
        </div>
      </div>
    </div>
  )
} 