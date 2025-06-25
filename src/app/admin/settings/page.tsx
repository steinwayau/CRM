'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'EPG CRM System',
    emailNotifications: true,
    autoBackup: true,
    maintenanceMode: false,
    maxFileSize: '10MB',
    sessionTimeout: '30 minutes'
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaveMessage('Settings saved successfully!')
    setIsSaving(false)
    setTimeout(() => setSaveMessage(''), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {saveMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {saveMessage}
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6">
            <h2 className="text-xl font-semibold">Configuration</h2>
            <p className="text-purple-100 mt-1">Manage your CRM system settings</p>
          </div>

          <div className="p-6 space-y-6">
            {/* General Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout
                  </label>
                  <select
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="15 minutes">15 minutes</option>
                    <option value="30 minutes">30 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="2 hours">2 hours</option>
                  </select>
                </div>
              </div>
            </div>

            {/* File Upload Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">File Upload Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum File Size
                </label>
                <select
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({...settings, maxFileSize: e.target.value})}
                  className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="5MB">5MB</option>
                  <option value="10MB">10MB</option>
                  <option value="20MB">20MB</option>
                  <option value="50MB">50MB</option>
                </select>
              </div>
            </div>

            {/* System Preferences */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Send email notifications for new enquiries</p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, emailNotifications: !settings.emailNotifications})}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      settings.emailNotifications ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Automatic Backup</h4>
                    <p className="text-sm text-gray-600">Automatically backup database daily</p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, autoBackup: !settings.autoBackup})}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      settings.autoBackup ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.autoBackup ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
                    <p className="text-sm text-gray-600">Put system in maintenance mode</p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t pt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSaving && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 