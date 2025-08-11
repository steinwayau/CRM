'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'EPG CRM System',
    emailNotifications: true,
    autoBackup: true,
    maintenanceMode: false,
    maxFileSize: '10MB',
    sessionTimeout: '30 minutes',
    footerEnabled: false,
    footerLogoUrl: '',
    footerPhoneLabel: 'National Information Line 1300 199 589',
    footerFacebook: 'https://www.facebook.com/steinwayaustralia',
    footerInstagram: 'https://www.instagram.com/steinwaygalleriesaustralia/?hl=en',
    footerYouTube: 'https://www.youtube.com/@steinwaygalleriesaustralia8733/featured',
    facebookIconUrl: '',
    instagramIconUrl: '',
    youtubeIconUrl: ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Track upload states to prevent concurrent modifications
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingIcons, setUploadingIcons] = useState({
    facebook: false,
    instagram: false,
    youtube: false
  })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (json?.settings) setSettings((prev) => ({ ...prev, ...json.settings }))
        }
      } catch (e) {
        console.error('Failed to load settings', e)
      }
    })()
  }, [])

  // REMOVED AUTO-SAVE - This was causing race conditions
  // Settings now only save when explicitly triggered

  const handleSave = async () => {
    // Prevent concurrent saves
    if (isSaving) return
    
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      })

      if (response.ok) {
        // Reload settings from server to confirm persistence
        const confirmResponse = await fetch('/api/admin/settings', { cache: 'no-store' })
        if (confirmResponse.ok) {
          const data = await confirmResponse.json()
          if (data?.settings) {
            setSettings(data.settings)
          }
        }
        
        setSaveMessage('Settings saved successfully!')
        setHasUnsavedChanges(false)
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveMessage('Failed to save settings')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
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
                    <option value="never">Never (Stay logged in)</option>
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

            {/* Branded Footer Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Footer</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Enable Branded Footer</h4>
                    <p className="text-sm text-gray-600">Adds logo, phone label, and social links above unsubscribe</p>
                  </div>
                  <button
                    onClick={() => {
                      setSettings({...settings, footerEnabled: !settings.footerEnabled})
                      setHasUnsavedChanges(true)
                    }}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${settings.footerEnabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.footerEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Footer Logo (PNG/SVG recommended)</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={uploadingLogo || isSaving}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        setUploadingLogo(true)
                        try {
                          const form = new FormData()
                          form.append('image', file)
                          const res = await fetch('/api/upload/image', { method: 'POST', body: form })
                          if (res.ok) {
                            const json = await res.json()
                            setSettings({...settings, footerLogoUrl: json.url})
                            setHasUnsavedChanges(true)
                            // Auto-save after successful upload
                            setTimeout(() => handleSave(), 100)
                          }
                        } finally {
                          setUploadingLogo(false)
                        }
                      }} />
                    {settings.footerLogoUrl && (
                      <img src={settings.footerLogoUrl} alt="Footer Logo" className="h-10" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Label</label>
                  <input
                    type="text"
                    value={settings.footerPhoneLabel}
                    onChange={(e) => {
                      setSettings({...settings, footerPhoneLabel: e.target.value})
                      setHasUnsavedChanges(true)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                    <input type="url" value={settings.footerFacebook} onChange={(e)=>{setSettings({...settings, footerFacebook: e.target.value}); setHasUnsavedChanges(true)}} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                    <div className="mt-2 flex items-center gap-3">
                      <input 
                        type="file" 
                        accept="image/*" 
                        disabled={uploadingIcons.facebook || isSaving}
                        onChange={async (e)=>{
                          const f = e.target.files?.[0]; 
                          if(!f) return; 
                          
                          setUploadingIcons({...uploadingIcons, facebook: true})
                          try {
                            const form = new FormData(); 
                            form.append('image', f); 
                            const r = await fetch('/api/upload/image',{method:'POST',body:form}); 
                            if(r.ok){ 
                              const j=await r.json(); 
                              setSettings({...settings, facebookIconUrl:j.url})
                              setHasUnsavedChanges(true)
                              setTimeout(() => handleSave(), 100)
                            }
                          } finally {
                            setUploadingIcons({...uploadingIcons, facebook: false})
                          }
                        }} />
                      {settings.facebookIconUrl && <img src={settings.facebookIconUrl} alt="FB" className="h-6" />}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                    <input type="url" value={settings.footerInstagram} onChange={(e)=>{setSettings({...settings, footerInstagram: e.target.value}); setHasUnsavedChanges(true)}} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                    <div className="mt-2 flex items-center gap-3">
                      <input 
                        type="file" 
                        accept="image/*" 
                        disabled={uploadingIcons.instagram || isSaving}
                        onChange={async (e)=>{
                          const f = e.target.files?.[0]; 
                          if(!f) return; 
                          
                          setUploadingIcons({...uploadingIcons, instagram: true})
                          try {
                            const form = new FormData(); 
                            form.append('image', f); 
                            const r = await fetch('/api/upload/image',{method:'POST',body:form}); 
                            if(r.ok){ 
                              const j=await r.json(); 
                              setSettings({...settings, instagramIconUrl:j.url})
                              setHasUnsavedChanges(true)
                              setTimeout(() => handleSave(), 100)
                            }
                          } finally {
                            setUploadingIcons({...uploadingIcons, instagram: false})
                          }
                        }} />
                      {settings.instagramIconUrl && <img src={settings.instagramIconUrl} alt="IG" className="h-6" />}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL</label>
                    <input type="url" value={settings.footerYouTube} onChange={(e)=>{setSettings({...settings, footerYouTube: e.target.value}); setHasUnsavedChanges(true)}} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                    <div className="mt-2 flex items-center gap-3">
                      <input 
                        type="file" 
                        accept="image/*" 
                        disabled={uploadingIcons.youtube || isSaving}
                        onChange={async (e)=>{
                          const f = e.target.files?.[0]; 
                          if(!f) return; 
                          
                          setUploadingIcons({...uploadingIcons, youtube: true})
                          try {
                            const form = new FormData(); 
                            form.append('image', f); 
                            const r = await fetch('/api/upload/image',{method:'POST',body:form}); 
                            if(r.ok){ 
                              const j=await r.json(); 
                              setSettings({...settings, youtubeIconUrl:j.url})
                              setHasUnsavedChanges(true)
                              setTimeout(() => handleSave(), 100)
                            }
                          } finally {
                            setUploadingIcons({...uploadingIcons, youtube: false})
                          }
                        }} />
                      {settings.youtubeIconUrl && <img src={settings.youtubeIconUrl} alt="YT" className="h-6" />}
                    </div>
                  </div>
                </div>
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
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSave}
                  disabled={isSaving || (!hasUnsavedChanges && !uploadingLogo && !uploadingIcons.facebook && !uploadingIcons.instagram && !uploadingIcons.youtube)}
                  className={`px-6 py-3 ${hasUnsavedChanges ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400'} text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors`}
                >
                  {isSaving && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Settings' : 'No Changes'}</span>
                </button>
                {(uploadingLogo || uploadingIcons.facebook || uploadingIcons.instagram || uploadingIcons.youtube) && (
                  <span className="text-sm text-gray-600">Uploading image...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 