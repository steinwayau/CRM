'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  state: string
  suburb?: string
  nationality?: string
  productInterest?: string[]
  source?: string
  eventSource?: string
  customerRating?: string
  status?: string
  doNotEmail: boolean
  createdAt: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  type: 'promotional' | 'newsletter' | 'event' | 'follow-up'
  createdAt: string
  elements?: any[]
  canvasSettings?: {
    width: number
    height: number
    backgroundColor: string
  }
}

// Filter constants matching enquiry data system
const PIANO_MODELS = ["All", "Steinway", "Boston", "Essex", "Yamaha", "Kawai", "Used Piano", "Roland", "Ritmuller", "Ronisch", "Kurzweil", "Other"]
const CUSTOMER_RATINGS = [
  "All", "N/A", "Ready to buy", "High Priority", "After Sale Follow Up", 
  "Very interested but not ready to buy", "Looking for information", 
  "Just browsing for now", "Cold", "Events"
]
const STATUSES = ["All", "New", "In Progress", "Completed", "Follow Up", "Closed"]
const STATES = [
  "All", "Australian Capital Territory", "New South Wales", "Northern Territory",
  "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"
]
const NATIONALITIES = ["All", "English", "Chinese", "Korean", "Japanese", "Indian", "Other"]
const HEAR_ABOUT_US = [
  "All", "Teacher", "Google", "Facebook", "Instagram", "LinkedIn", "WeChat", 
  "YouTube", "Steinway Website", "Radio", "Magazine/Newspaper", 
  "Recommended by a friend", "Event Follow Up", "Other"
]
const ENQUIRY_SOURCES = [
  "All", "Events - Steinway Gallery St Leonards", "Events - Steinway Gallery Melbourne", 
  "Phone Enquiry - Steinway National Information Line", "Phone Enquiry - Steinway Gallery St Leonards",
  "In-store enquiry - Steinway Gallery St Leonards", "Lunar New Year", "Piano Teacher Calls", "Other"
]

interface Campaign {
  id: string
  name: string
  templateId: string
  templateName: string
  subject: string
  recipientCount: number
  sentCount: number
  openRate?: number
  clickRate?: number
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  recipientType: 'all' | 'filtered' | 'selected' | 'custom'
  customEmails?: string
  textContent?: string // Temporary storage for custom emails
  scheduledAt?: string
  sentAt?: string
  createdAt: string
}

export default function CustomerEmailsPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab')
    return ['campaigns', 'customers', 'templates', 'analytics'].includes(tabParam || '') ? tabParam : 'campaigns'
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([])
  
  // Filters for customer segmentation
  const [filters, setFilters] = useState({
    state: 'All',
    rating: 'All',
    status: 'All',
    productInterest: 'All',
    nationality: 'All',
    hearAboutUs: 'All',
    enquirySource: 'All'
  })

  // New campaign form
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    templateId: '',
    subject: '',
    recipientType: 'all', // 'all', 'filtered', 'selected', 'custom'
    customEmails: '', // For custom email list
    scheduledAt: ''
  })
  
  // Campaign filters (same as enquiry data filters)
  const [campaignFilters, setCampaignFilters] = useState({
    startDate: '',
    endDate: '',
    pianoModel: 'All',
    customerRating: 'All',
    status: 'All',
    state: 'All',
    suburb: '',
    nationality: 'All',
    callTakenBy: 'All',
    hearAboutUs: 'All',
    enquirySource: 'All'
  })

  // Template management state
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null)
  
  // Campaign view state
  const [showCampaignView, setShowCampaignView] = useState(false)
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null)
  const [editingCampaign, setEditingCampaign] = useState(false)
  const [editCampaignForm, setEditCampaignForm] = useState({
    name: '',
    templateId: '',
    subject: '',
    recipientType: 'all',
    customEmails: '',
    scheduledAt: ''
  })
  const [campaignAnalytics, setCampaignAnalytics] = useState<{[key: string]: {opens: number, clicks: number}}>({})
  const [overallAnalytics, setOverallAnalytics] = useState<any>(null)
  const [detailedAnalytics, setDetailedAnalytics] = useState<any>(null)

  // Load overall analytics data from working API
  const loadOverallAnalytics = async () => {
    try {
      const response = await fetch('/api/email/analytics')
      if (response.ok) {
        const data = await response.json()
        setOverallAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to load overall analytics:', error)
    }
  }

  // Load detailed analytics data with click breakdowns
  const loadDetailedAnalytics = async () => {
    try {
      const response = await fetch('/api/email/analytics/detailed')
      if (response.ok) {
        const data = await response.json()
        setDetailedAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to load detailed analytics:', error)
    }
  }

  // Load real analytics data for campaigns
  const loadCampaignAnalytics = async () => {
    try {
      console.log('🔄 Loading campaign analytics for campaigns:', campaigns.map(c => ({ id: c.id, name: c.name, status: c.status, sentCount: c.sentCount })))
      const analyticsData: {[key: string]: {opens: number, clicks: number}} = {}
      
      for (const campaign of campaigns) {
        // ANALYTICS FIX: Fetch analytics for any campaign with 'sent' status
        // Previous logic required sentCount > 0, but database campaigns may have sentCount = 0
        if (campaign.status === 'sent') {
          console.log(`📊 Fetching analytics for sent campaign: ${campaign.id} (${campaign.name})`)
          const response = await fetch(`/api/email/analytics?campaignId=${campaign.id}`)
          if (response.ok) {
            const data = await response.json()
            console.log(`📈 Analytics data for ${campaign.id}:`, data)
            analyticsData[campaign.id] = {
              opens: data.opens || 0,
              clicks: data.clicks || 0
            }
          } else {
            console.error(`❌ Failed to fetch analytics for campaign ${campaign.id}:`, response.status, response.statusText)
          }
        } else {
          console.log(`⏭️ Skipping campaign ${campaign.id} - status: ${campaign.status} (not sent)`)
        }
      }
      
      console.log('📊 Final analytics data:', analyticsData)
      setCampaignAnalytics(analyticsData)
      
      // Also load overall analytics and detailed analytics
      loadOverallAnalytics()
      loadDetailedAnalytics()
    } catch (error) {
      console.error('❌ Failed to load campaign analytics:', error)
    }
  }

  // Auto-refresh analytics every 30 seconds for real-time updates
  useEffect(() => {
    if (campaigns.length > 0) {
      // Initial load
      loadCampaignAnalytics()
      
      // Set up interval for auto-refresh
      const interval = setInterval(() => {
        console.log('Auto-refreshing campaign analytics...')
        loadCampaignAnalytics()
      }, 30000) // 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [campaigns])
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    type: 'newsletter' as EmailTemplate['type'],
    htmlContent: '',
    textContent: ''
  })
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)

  // Removed visual editor state - now using full page editor

  // Sample data - replace with actual API calls
  useEffect(() => {
    // Load customers, templates, and campaigns
    loadData()
  }, [])

  // Update activeTab when URL changes (handles page refresh)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['campaigns', 'customers', 'templates', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])



  // Helper function to update campaigns (now using database)
  const updateCampaigns = async (newCampaigns: Campaign[]) => {
    setCampaigns(newCampaigns)
    
    // ANALYTICS FIX: Also persist campaign updates to database
    // This ensures sent campaigns with sentCount are saved permanently
    try {
      for (const campaign of newCampaigns) {
        // Only update campaigns that have been sent (have sentCount > 0 or status 'sent')
        if (campaign.status === 'sent' || campaign.sentCount > 0) {
          console.log(`📊 Persisting sent campaign to database: ${campaign.name} (sentCount: ${campaign.sentCount})`)
          
          const response = await fetch('/api/admin/campaigns', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: campaign.id,
              status: campaign.status,
              sentCount: campaign.sentCount,
              recipientCount: campaign.recipientCount,
              sentAt: campaign.sentAt
            })
          })
          
          if (!response.ok) {
            console.error(`Failed to persist campaign ${campaign.id} to database`)
          } else {
            console.log(`✅ Campaign ${campaign.name} persisted to database`)
          }
        }
      }
    } catch (error) {
      console.error('Error persisting campaign updates to database:', error)
    }
  }

  // Migration function to move localStorage campaigns to database
  const migrateCampaigns = async () => {
    try {
      const savedCampaigns = JSON.parse(localStorage.getItem('emailCampaigns') || '[]')
      if (savedCampaigns.length === 0) {
        alert('No campaigns found in localStorage to migrate')
        return
      }

      let migrated = 0
      for (const campaign of savedCampaigns) {
        try {
          const response = await fetch('/api/admin/campaigns', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: campaign.name || 'Migrated Campaign',
              subject: campaign.subject || 'Migrated Subject',
              templateId: campaign.templateId || 'default',
              templateName: campaign.templateName || 'Migrated Template',
              recipientType: campaign.recipientType || 'all',
              status: campaign.status || 'draft',
              scheduledAt: campaign.scheduledAt || null
            })
          })
          
          if (response.ok) {
            migrated++
          }
        } catch (error) {
          console.error('Error migrating campaign:', campaign.name, error)
        }
      }

      if (migrated > 0) {
        alert(`Successfully migrated ${migrated} campaigns to database!`)
        localStorage.removeItem('emailCampaigns') // Clear localStorage
        loadData() // Reload from database
      } else {
        alert('Failed to migrate campaigns')
      }
    } catch (error) {
      console.error('Migration error:', error)
      alert('Migration failed')
    }
  }

  // Template migration function
  const migrateTemplatesFromLocalStorage = async () => {
    try {
      const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]')
      
      let migrated = 0
      for (const template of savedTemplates) {
        try {
          const response = await fetch('/api/admin/templates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(template)
          })
          
          if (response.ok) {
            migrated++
          }
        } catch (error) {
          console.error('Error migrating template:', template.name, error)
        }
      }

      if (migrated > 0) {
        console.log(`Successfully migrated ${migrated} templates to database!`)
        localStorage.removeItem('emailTemplates') // Clear localStorage
        
        // Reload templates from database
        const templateResponse = await fetch('/api/admin/templates')
        if (templateResponse.ok) {
          const dbTemplates = await templateResponse.json()
          setTemplates(dbTemplates)
        }
      }
    } catch (error) {
      console.error('Template migration error:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Load customer data from your existing enquiries API
      console.log('Fetching customers from /api/enquiries...')
      const customersResponse = await fetch('/api/enquiries')
      
      if (!customersResponse.ok) {
        throw new Error(`HTTP ${customersResponse.status}: ${customersResponse.statusText}`)
      }
      
      const customersData = await customersResponse.json()
      console.log('Customers API response:', customersData)
      
      // Check if API returned an error
      if (customersData.error) {
        throw new Error(customersData.error)
      }
      
      // Ensure we have an array
      if (!Array.isArray(customersData)) {
        throw new Error('API did not return an array of customers')
      }
      
      // Transform enquiry data to customer format
      const transformedCustomers = customersData.map((enquiry: any) => ({
        id: enquiry.id,
        firstName: enquiry.firstName,
        lastName: enquiry.lastName || enquiry.surname,
        email: enquiry.email,
        phone: enquiry.phone,
        state: enquiry.state,
        suburb: enquiry.suburb,
        nationality: enquiry.nationality,
        productInterest: enquiry.productInterest,
        source: enquiry.source,
        eventSource: enquiry.eventSource,
        customerRating: enquiry.customerRating,
        status: enquiry.status,
        doNotEmail: enquiry.doNotEmail || false,
        createdAt: enquiry.createdAt
      }))
      
      console.log('Transformed customers:', transformedCustomers.length, 'customers')
      setCustomers(transformedCustomers)
      
            // Load templates from database first, fallback to localStorage
      try {
        const templateResponse = await fetch('/api/admin/templates')
        if (templateResponse.ok) {
          const dbTemplates = await templateResponse.json()
          setTemplates(dbTemplates)
          
          // Check if we need to migrate localStorage templates
          if (dbTemplates.length === 0) {
            const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]')
            if (savedTemplates.length > 0) {
              console.log('Migrating templates from localStorage to database...')
              await migrateTemplatesFromLocalStorage()
            }
          }
        } else {
          throw new Error('Failed to load templates from database')
        }
      } catch (error) {
        console.error('Error loading templates, falling back to localStorage:', error)
        const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]')
        setTemplates(savedTemplates)
      }
        
        // Load campaigns from database
      const campaignResponse = await fetch('/api/admin/campaigns')
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json()
        // Map textContent back to customEmails for campaigns with custom recipient type
        const campaignsWithCustomEmails = campaignData.map((campaign: any) => ({
          ...campaign,
          customEmails: campaign.textContent || ''
        }))
        setCampaigns(campaignsWithCustomEmails)
      } else {
        console.error('Failed to load campaigns')
        setCampaigns([])
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      // Show user-friendly error message
      alert(`Failed to load customer data: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the browser console for details.`)
      // Set empty arrays as fallback
      setCustomers([])
      setTemplates([])
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  // Filter customers based on selected criteria
  const filteredCustomers = customers.filter(customer => {
    if (customer.doNotEmail) return false // Respect email preferences
    
    if (filters.state !== 'All' && customer.state !== filters.state) return false
    if (filters.rating !== 'All' && customer.customerRating !== filters.rating) return false
    if (filters.status !== 'All' && customer.status !== filters.status) return false
    if (filters.nationality !== 'All' && customer.nationality !== filters.nationality) return false
    if (filters.hearAboutUs !== 'All' && customer.source !== filters.hearAboutUs) return false
    if (filters.enquirySource !== 'All' && customer.eventSource !== filters.enquirySource) return false
    
    if (filters.productInterest !== 'All') {
      if (!customer.productInterest || !customer.productInterest.includes(filters.productInterest)) {
        return false
      }
    }
    
    return true
  })

  const handleCreateCampaign = async () => {
    try {
      let recipients = 0
      
      if (campaignForm.recipientType === 'all') {
        recipients = filteredCustomers.length
      } else if (campaignForm.recipientType === 'filtered') {
        recipients = filteredCustomers.length
      } else if (campaignForm.recipientType === 'selected') {
        recipients = selectedCustomers.length
      } else if (campaignForm.recipientType === 'custom') {
        // Parse custom email list
        const emailList = campaignForm.customEmails
          .split(/[,\n\r]+/)
          .map(email => email.trim())
          .filter(email => email && /\S+@\S+\.\S+/.test(email))
        recipients = emailList.length
      }

      // Create campaign in database
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignForm.name,
          templateId: campaignForm.templateId,
          templateName: templates.find(t => t.id === campaignForm.templateId)?.name || '',
          subject: campaignForm.subject,
          recipientType: campaignForm.recipientType,
          customEmails: campaignForm.customEmails, // FIXED: Include custom emails
          status: campaignForm.scheduledAt ? 'scheduled' : 'draft',
          scheduledAt: campaignForm.scheduledAt || undefined,
        })
      })

      if (response.ok) {
        const newCampaign = await response.json()
        setCampaigns([newCampaign, ...campaigns])
        console.log('Campaign created successfully:', newCampaign)
      } else {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        
        // If it's a template validation error, reload templates to sync
        if (errorData.includes('templateId') && errorData.includes('does not exist')) {
          console.log('Template validation error detected, reloading templates...')
          loadData() // Reload templates to sync with database
        }
        
        throw new Error(`Failed to create campaign: ${response.status} - ${errorData}`)
      }
      setShowNewCampaign(false)
      setCampaignForm({
        name: '',
        templateId: '',
        subject: '',
        recipientType: 'all',
        customEmails: '',
        scheduledAt: ''
      })
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert(`Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId)
      if (!campaign) return

      // Get the selected template
      const template = templates.find(t => t.id === campaign.templateId)
      if (!template) {
        alert('Template not found for this campaign')
        return
      }

      // Update campaign status to sending
      updateCampaigns(campaigns.map(c => 
        c.id === campaignId 
          ? { ...c, status: 'sending' as const }
          : c
      ))

      // Prepare recipient data based on campaign type
      let customerIds: number[] = []
      let recipientFilters = {}

      if (campaign.recipientType === 'selected') {
        customerIds = selectedCustomers
      } else if (campaign.recipientType === 'filtered') {
        recipientFilters = filters
      } else if (campaign.recipientType === 'custom') {
        // Custom emails are handled in the API - no customerIds needed
        console.log('Using custom email list from campaign:', campaign.customEmails)
      }

      // CORE FIX: Pass template elements and canvas settings for Gmail-compatible HTML generation
      // This allows the backend to generate email-safe HTML instead of using preview HTML
      const templateElements = template.elements || []
      const canvasSettings = template.canvasSettings || { width: 1000, height: 800, backgroundColor: '#ffffff' }
      
      console.log(`Sending campaign with ${templateElements.length} elements for Gmail-compatible rendering`)

      // Call the actual email API with template elements for Gmail-compatible HTML generation
      const response = await fetch('/api/email/send-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaign.name,
          campaignId: campaign.id, // FIXED: Use campaign ID instead of template ID
          templateId: campaign.templateId,
          templateName: campaign.templateName,
          subject: campaign.subject,
          htmlContent: template.htmlContent, // Fallback for preview
          textContent: template.textContent,
          recipientType: campaign.recipientType,
          customerIds: customerIds.length > 0 ? customerIds : undefined,
          customEmails: campaign.recipientType === 'custom' ? (campaign.customEmails || campaign.textContent) : undefined,
          filters: Object.values(recipientFilters).some(v => v !== 'All') ? recipientFilters : undefined,
          // NEW: Template elements and canvas settings for Gmail-compatible HTML generation
          templateElements: templateElements,
          canvasSettings: canvasSettings
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Update campaign with actual results and reload from database
        await updateCampaigns(campaigns.map(c => 
          c.id === campaignId 
            ? { 
                ...c, 
                status: 'sent' as const, 
                sentCount: result.results.successCount,
                recipientCount: result.results.totalRecipients,
                sentAt: new Date().toISOString(),
                openRate: 0,  // Will be updated by tracking
                clickRate: 0  // Will be updated by tracking
              }
            : c
        ))

        // Reload campaigns from database to get the updated status
        loadData()
        
        // Load analytics data for the sent campaign
        setTimeout(() => {
          loadCampaignAnalytics()
        }, 1000)
        
        // Start polling for tracking updates every 30 seconds
        const trackingInterval = setInterval(async () => {
          try {
            const analyticsResponse = await fetch(`/api/email/analytics?campaignId=${campaignId}`)
            if (analyticsResponse.ok) {
              const analytics = await analyticsResponse.json()
              updateCampaigns(campaigns.map(c => 
                c.id === campaignId 
                  ? { 
                      ...c, 
                      openRate: analytics.metrics?.openRate || c.openRate,
                      clickRate: analytics.metrics?.clickRate || c.clickRate
                    }
                  : c
              ))
            }
          } catch (error) {
            console.error('Error fetching analytics:', error)
          }
        }, 30000) // Poll every 30 seconds
        
        // Clear polling after 1 hour
        setTimeout(() => clearInterval(trackingInterval), 3600000)

        alert(`Campaign sent successfully!\n\nSent to: ${result.results.successCount} recipients\nFailed: ${result.results.failureCount} recipients\n\n${result.message}`)
      } else {
        // Handle API error
        updateCampaigns(campaigns.map(c => 
          c.id === campaignId 
            ? { ...c, status: 'draft' as const }
            : c
        ))
        
        alert(`Failed to send campaign: ${result.error || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error('Error sending campaign:', error)
      
      // Reset campaign status on error
      updateCampaigns(campaigns.map(c => 
        c.id === campaignId 
          ? { ...c, status: 'draft' as const }
          : c
      ))
      
      alert(`Failed to send campaign: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Campaign management functions
  const handleViewCampaign = (campaign: Campaign) => {
    setViewingCampaign(campaign)
    setShowCampaignView(true)
    setEditingCampaign(false) // Ensure editing is off when viewing
  }

  const handleEditCampaign = () => {
    setEditingCampaign(true)
    setEditCampaignForm({
      name: viewingCampaign?.name || '',
      templateId: viewingCampaign?.templateId || '',
      subject: viewingCampaign?.subject || '',
      recipientType: viewingCampaign?.recipientType || 'all',
      customEmails: viewingCampaign?.customEmails || '',
      scheduledAt: viewingCampaign?.scheduledAt || ''
    })
  }

  const handleSaveCampaign = async () => {
    if (!viewingCampaign) return

    try {
      const campaign = campaigns.find(c => c.id === viewingCampaign.id)
      if (!campaign) return

      // Get the selected template
      const template = templates.find(t => t.id === editCampaignForm.templateId)
      if (!template) {
        alert('Template not found for this campaign')
        return
      }

      // Update campaign status to sending
      setCampaigns(campaigns.map(c => 
        c.id === viewingCampaign.id 
          ? { ...c, status: 'sending' as const }
          : c
      ))

      // Prepare recipient data based on campaign type
      let customerIds: number[] = []
      let recipientFilters = {}

      if (editCampaignForm.recipientType === 'selected') {
        customerIds = selectedCustomers
      } else if (editCampaignForm.recipientType === 'filtered') {
        recipientFilters = filters
      } else if (editCampaignForm.recipientType === 'custom') {
        // For custom email lists, we'll need to handle this differently
        // For now, we'll send to selected customers
        console.log('Custom email lists not yet implemented, using selected customers')
        customerIds = selectedCustomers
      }

      // Call the actual email API
      const response = await fetch('/api/email/send-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editCampaignForm.name,
          campaignId: viewingCampaign.id,
          templateId: editCampaignForm.templateId,
          templateName: template.name,
          subject: editCampaignForm.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
          recipientType: editCampaignForm.recipientType,
          customerIds: customerIds.length > 0 ? customerIds : undefined,
          customEmails: editCampaignForm.recipientType === 'custom' ? editCampaignForm.customEmails : undefined,
          filters: Object.values(recipientFilters).some(v => v !== 'All') ? recipientFilters : undefined
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Update campaign with actual results
        setCampaigns(campaigns.map(c => 
          c.id === viewingCampaign.id 
            ? { 
                ...c, 
                status: 'sent' as const, 
                sentCount: result.results.successCount,
                recipientCount: result.results.totalRecipients,
                sentAt: new Date().toISOString(),
                // Real performance data will be added when tracking is implemented
                openRate: undefined,
                clickRate: undefined
              }
            : c
        ))

        alert(`Campaign sent successfully!\n\nSent to: ${result.results.successCount} recipients\nFailed: ${result.results.failureCount} recipients\n\n${result.message}`)
      } else {
        // Handle API error
        setCampaigns(campaigns.map(c => 
          c.id === viewingCampaign.id 
            ? { ...c, status: 'draft' as const }
            : c
        ))
        
        alert(`Failed to send campaign: ${result.error || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error('Error sending campaign:', error)
      
      // Reset campaign status on error
      setCampaigns(campaigns.map(c => 
        c.id === viewingCampaign?.id 
          ? { ...c, status: 'draft' as const }
          : c
      ))
      
      alert(`Failed to send campaign: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Template management functions
  const handleCreateTemplate = () => {
    window.location.href = '/admin/customer-emails/template-editor'
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    window.location.href = `/admin/customer-emails/template-editor?id=${template.id}`
  }

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    // Create a copy of the template in localStorage
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `Copy of ${template.name}`,
      createdAt: new Date().toISOString()
    }
    
    const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]')
    localStorage.setItem('emailTemplates', JSON.stringify([newTemplate, ...savedTemplates]))
    
    // Refresh templates list
    setTemplates([newTemplate, ...templates])
  }

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setPreviewTemplate(template)
    setShowTemplatePreview(true)
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      // Update localStorage
      const savedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]')
      const updatedTemplates = savedTemplates.filter((t: EmailTemplate) => t.id !== templateId)
      localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates))
      
      // Update state
      setTemplates(templates.filter(t => t.id !== templateId))
    }
  }

  // Helper function to personalize template content
  const personalizeContent = (content: string) => {
    return content
      .replace(/\{\{firstName\}\}/g, 'John')
      .replace(/\{\{lastName\}\}/g, 'Smith')
      .replace(/\{\{fullName\}\}/g, 'John Smith')
      .replace(/\{\{email\}\}/g, 'john.smith@example.com')
  }

  const renderCampaigns = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Campaigns</h2>
          <p className="text-gray-600">Create and manage customer email campaigns</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewCampaign(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Campaign
          </button>

        </div>
      </div>

      {/* Campaign Stats Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
          <p className="text-sm text-gray-600">Auto-refreshes every 30 seconds</p>
        </div>
        <button
          onClick={() => {
            loadCampaignAnalytics()
            loadOverallAnalytics()
            loadDetailedAnalytics()
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Now
        </button>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-3xl font-bold text-gray-900">{campaigns.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Emails Sent</p>
              <p className="text-3xl font-bold text-gray-900">
                {overallAnalytics?.summary?.totalEmailsSent || campaigns.reduce((sum, c) => sum + c.sentCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Open Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {(() => {
                  const sentCampaigns = campaigns.filter(c => c.status === 'sent')
                  if (sentCampaigns.length === 0) return '0'
                  const latestCampaign = sentCampaigns[sentCampaigns.length - 1]
                  const analytics = campaignAnalytics[latestCampaign.id]
                  if (analytics && latestCampaign.sentCount > 0) {
                    return ((analytics.opens / latestCampaign.sentCount) * 100).toFixed(1)
                  }
                  // Fallback to overall analytics if campaign analytics not loaded
                  return overallAnalytics?.summary?.overallOpenRate || '0'
                })()}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Click Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {(() => {
                  const sentCampaigns = campaigns.filter(c => c.status === 'sent')
                  if (sentCampaigns.length === 0) return '0'
                  const latestCampaign = sentCampaigns[sentCampaigns.length - 1]
                  const analytics = campaignAnalytics[latestCampaign.id]
                  if (analytics && latestCampaign.sentCount > 0) {
                    return ((analytics.clicks / latestCampaign.sentCount) * 100).toFixed(1)
                  }
                  // Fallback to overall analytics if campaign analytics not loaded  
                  return overallAnalytics?.summary?.overallClickRate || '0'
                })()}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Recent Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-500">{campaign.subject}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{campaign.templateName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{campaign.recipientCount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                      campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {campaign.openRate && campaign.clickRate ? (
                      <div>
                        <p>Open: {campaign.openRate}%</p>
                        <p>Click: {campaign.clickRate}%</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleSendCampaign(campaign.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Send Now
                        </button>
                      )}
                      <button 
                        onClick={() => handleViewCampaign(campaign)}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Campaign</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter campaign name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Template</label>
                <select
                  value={campaignForm.templateId}
                  onChange={(e) => {
                    const selectedTemplate = templates.find(t => t.id === e.target.value)
                    console.log('Selected template:', selectedTemplate)
                    setCampaignForm({
                      ...campaignForm, 
                      templateId: e.target.value,
                      subject: selectedTemplate?.subject || campaignForm.subject || ''
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line
                  {campaignForm.templateId && (
                    <span className="text-xs text-gray-500 ml-2">(Auto-filled from template)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({...campaignForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder={campaignForm.templateId ? "Subject from template" : "Enter email subject"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                <select
                  value={campaignForm.recipientType}
                  onChange={(e) => {
                    setCampaignForm({...campaignForm, recipientType: e.target.value, customEmails: ''})
                    if (e.target.value === 'filtered') {
                      setShowFilterPanel(true)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All customers ({filteredCustomers.length})</option>
                  <option value="filtered">Filtered customers (Click to set filters)</option>
                  <option value="selected">Selected customers ({selectedCustomers.length})</option>
                  <option value="custom">Custom email list</option>
                </select>
                {campaignForm.recipientType === 'filtered' && (
                  <button
                    type="button"
                    onClick={() => setShowFilterPanel(true)}
                    className="mt-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Set Filters
                  </button>
                )}
              </div>

              {campaignForm.recipientType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Email List
                    <span className="text-xs text-gray-500 ml-2">(Paste emails separated by commas or new lines)</span>
                  </label>
                  <textarea
                    value={campaignForm.customEmails}
                    onChange={(e) => setCampaignForm({...campaignForm, customEmails: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={6}
                    placeholder="Enter email addresses separated by commas or new lines:&#10;john@example.com, jane@example.com&#10;bob@company.com&#10;alice@business.com"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    {(() => {
                      const emailList = campaignForm.customEmails
                        .split(/[,\n\r]+/)
                        .map(email => email.trim())
                        .filter(email => email && /\S+@\S+\.\S+/.test(email))
                      return `${emailList.length} valid email${emailList.length !== 1 ? 's' : ''} detected`
                    })()}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={campaignForm.scheduledAt}
                  onChange={(e) => setCampaignForm({...campaignForm, scheduledAt: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewCampaign(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={
                  !campaignForm.name || 
                  !campaignForm.templateId || 
                  !campaignForm.subject ||
                  (campaignForm.recipientType === 'custom' && !campaignForm.customEmails.trim())
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderCustomers = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Database</h2>
          <p className="text-gray-600">View and segment customers for email campaigns</p>
        </div>
        <div className="text-sm text-gray-600">
          {filteredCustomers.length} of {customers.length} customers
          {customers.filter(c => c.doNotEmail).length > 0 && (
            <span className="ml-2 text-red-600">
              ({customers.filter(c => c.doNotEmail).length} opted out)
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Customer Segmentation</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={filters.state}
              onChange={(e) => setFilters({...filters, state: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="All">All States</option>
              <option value="New South Wales">NSW</option>
              <option value="Victoria">VIC</option>
              <option value="Queensland">QLD</option>
              <option value="South Australia">SA</option>
              <option value="Western Australia">WA</option>
              <option value="Tasmania">TAS</option>
              <option value="Northern Territory">NT</option>
              <option value="Australian Capital Territory">ACT</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({...filters, rating: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="All">All Ratings</option>
              <option value="Ready to buy">Ready to buy</option>
              <option value="High Priority">High Priority</option>
              <option value="Very interested but not ready to buy">Very interested</option>
              <option value="Looking for information">Looking for info</option>
              <option value="Just browsing for now">Just browsing</option>
              <option value="Cold">Cold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Interest</label>
            <select
              value={filters.productInterest}
              onChange={(e) => setFilters({...filters, productInterest: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="All">All Products</option>
              <option value="Steinway">Steinway</option>
              <option value="Boston">Boston</option>
              <option value="Essex">Essex</option>
              <option value="Yamaha">Yamaha</option>
              <option value="Kawai">Kawai</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <select
              value={filters.nationality}
              onChange={(e) => setFilters({...filters, nationality: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="All">All</option>
              <option value="English">English</option>
              <option value="Chinese">Chinese</option>
              <option value="Korean">Korean</option>
              <option value="Japanese">Japanese</option>
              <option value="Indian">Indian</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hear About Us</label>
            <select
              value={filters.hearAboutUs}
              onChange={(e) => setFilters({...filters, hearAboutUs: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="All">All Sources</option>
              <option value="Teacher">Teacher</option>
              <option value="Google">Google</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="WeChat">WeChat</option>
              <option value="YouTube">YouTube</option>
              <option value="Steinway Website">Steinway Website</option>
              <option value="Radio">Radio</option>
              <option value="Magazine/Newspaper">Magazine/Newspaper</option>
              <option value="Recommended by a friend">Recommended by a friend</option>
              <option value="Event Follow Up">Event Follow Up</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enquiry Source</label>
            <select
              value={filters.enquirySource}
              onChange={(e) => setFilters({...filters, enquirySource: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="All">All Sources</option>
              <option value="Events - Steinway Gallery St Leonards">Events - St Leonards</option>
              <option value="Events - Steinway Gallery Melbourne">Events - Melbourne</option>
              <option value="Phone Enquiry - Steinway National Information Line">Phone - National Line</option>
              <option value="Phone Enquiry - Steinway Gallery St Leonards">Phone - St Leonards</option>
              <option value="In-store enquiry - Steinway Gallery St Leonards">In-store - St Leonards</option>
              <option value="Lunar New Year">Lunar New Year</option>
              <option value="Piano Teacher Calls">Piano Teacher Calls</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                state: 'All',
                rating: 'All',
                status: 'All',
                productInterest: 'All',
                nationality: 'All',
                hearAboutUs: 'All',
                enquirySource: 'All'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Customers ({filteredCustomers.length})</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{selectedCustomers.length} selected</span>
            <button 
              onClick={() => setSelectedCustomers([])}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Selection
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCustomers(filteredCustomers.map(c => c.id))
                      } else {
                        setSelectedCustomers([])
                      }
                    }}
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enquiry Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.slice(0, 100).map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCustomers([...selectedCustomers, customer.id])
                        } else {
                          setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id))
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                      {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {customer.suburb ? `${customer.suburb}, ` : ''}{customer.state}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {customer.productInterest?.slice(0, 2).join(', ')}
                    {customer.productInterest && customer.productInterest.length > 2 && '...'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.customerRating || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.eventSource || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length > 100 && (
            <div className="px-6 py-4 text-center text-sm text-gray-500">
              Showing first 100 of {filteredCustomers.length} customers
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderTemplates = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
          <p className="text-gray-600">Create and manage email templates for campaigns</p>
        </div>
        <button 
          onClick={handleCreateTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{template.type}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                template.type === 'promotional' ? 'bg-green-100 text-green-800' :
                template.type === 'newsletter' ? 'bg-blue-100 text-blue-800' :
                template.type === 'event' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {template.type}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-4">{template.subject}</p>
            
            <div className="space-y-2">
              <button 
                onClick={() => handlePreviewTemplate(template)}
                className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              >
                Preview
              </button>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEditTemplate(template)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDuplicateTemplate(template)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Duplicate
                </button>
              </div>
              <button 
                onClick={() => handleDeleteTemplate(template.id)}
                className="w-full px-3 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Template Builder Placeholder */}
      <div className="bg-white p-8 rounded-lg shadow border border-dashed border-gray-300 text-center">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Your First Template</h3>
        <p className="text-gray-600 mb-4">Build professional email templates with our drag-and-drop editor</p>
        <button 
          onClick={handleCreateTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Your First Template
        </button>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Email Analytics</h2>
        <p className="text-gray-600">Track performance and engagement metrics</p>
      </div>

      {/* Analytics placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Analytics charts coming soon</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Engagement Trends</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Engagement metrics coming soon</p>
          </div>
        </div>
      </div>

      {/* Detailed Click Analytics */}
      {detailedAnalytics?.summary?.clickBreakdown?.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Click Analytics Breakdown</h3>
            <p className="text-sm text-gray-600">Detailed analysis of link clicks by type</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {detailedAnalytics.summary.clickBreakdown.map((breakdown: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {breakdown.linkType.replace('-', ' ')} Links
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {breakdown.campaignsWithType} campaign{breakdown.campaignsWithType !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {breakdown.totalClicks}
                  </div>
                  <div className="text-sm text-gray-500">
                    {breakdown.uniqueUsers} unique user{breakdown.uniqueUsers !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Top Clicked URLs */}
            {detailedAnalytics.summary.topUrls?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold mb-3">Most Clicked Links</h4>
                <div className="space-y-2">
                  {detailedAnalytics.summary.topUrls.slice(0, 5).map((urlData: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {urlData.url}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {urlData.linkType} • {urlData.uniqueUsers} unique user{urlData.uniqueUsers !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-blue-600">
                        {urlData.clicks}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Recent Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-500">{campaign.subject}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{campaign.templateName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{campaign.recipientCount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                      campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {campaign.openRate && campaign.clickRate ? (
                      <div>
                        <p>Open: {campaign.openRate}%</p>
                        <p>Click: {campaign.clickRate}%</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleSendCampaign(campaign.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Send Now
                        </button>
                      )}
                      <button 
                        onClick={() => handleViewCampaign(campaign)}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer email system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Email Marketing</h1>
            <p className="text-gray-600 mt-1">Create campaigns, manage templates, and track performance</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'campaigns', label: 'Campaigns', icon: '📧' },
              { id: 'customers', label: 'Customers', icon: '👥' },
              { id: 'templates', label: 'Templates', icon: '📝' },
              { id: 'analytics', label: 'Analytics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'campaigns' && renderCampaigns()}
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'templates' && renderTemplates()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>

                {/* Template editor now uses full page at /admin/customer-emails/template-editor */}

        {/* Template Preview Modal */}
        {showTemplatePreview && previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{previewTemplate.name}</h3>
                  <p className="text-sm text-gray-600">Subject: {previewTemplate.subject}</p>
                </div>
                <button
                  onClick={() => setShowTemplatePreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="border rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium">
                  Email Preview (with sample personalization)
                </div>
                <div className="p-4">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: personalizeContent(previewTemplate.htmlContent)
                    }} 
                  />
                </div>
              </div>

              {previewTemplate.textContent && (
                <div className="mt-4 border rounded-lg">
                  <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium">
                    Plain Text Version
                  </div>
                  <div className="p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {personalizeContent(previewTemplate.textContent)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTemplatePreview(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                {previewTemplate.id !== 'preview' && (
                  <button
                    onClick={() => {
                      setShowTemplatePreview(false)
                      handleEditTemplate(previewTemplate)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Template
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter Panel Modal */}
        {showFilterPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Customer Filters</h3>
                  <p className="text-sm text-gray-600">Select criteria to target specific customer segments</p>
                </div>
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {/* Date Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={campaignFilters.startDate}
                    onChange={(e) => setCampaignFilters({...campaignFilters, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={campaignFilters.endDate}
                    onChange={(e) => setCampaignFilters({...campaignFilters, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Piano Model</label>
                  <select
                    value={campaignFilters.pianoModel}
                    onChange={(e) => setCampaignFilters({...campaignFilters, pianoModel: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {PIANO_MODELS.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Rating</label>
                  <select
                    value={campaignFilters.customerRating}
                    onChange={(e) => setCampaignFilters({...campaignFilters, customerRating: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {CUSTOMER_RATINGS.map(rating => (
                      <option key={rating} value={rating}>{rating}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={campaignFilters.status}
                    onChange={(e) => setCampaignFilters({...campaignFilters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    value={campaignFilters.state}
                    onChange={(e) => setCampaignFilters({...campaignFilters, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
                  <input
                    type="text"
                    value={campaignFilters.suburb}
                    onChange={(e) => setCampaignFilters({...campaignFilters, suburb: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter suburb..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <select
                    value={campaignFilters.nationality}
                    onChange={(e) => setCampaignFilters({...campaignFilters, nationality: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {NATIONALITIES.map(nationality => (
                      <option key={nationality} value={nationality}>{nationality}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Where did you hear about us?</label>
                  <select
                    value={campaignFilters.hearAboutUs}
                    onChange={(e) => setCampaignFilters({...campaignFilters, hearAboutUs: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {HEAR_ABOUT_US.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enquiry Source</label>
                  <select
                    value={campaignFilters.enquirySource}
                    onChange={(e) => setCampaignFilters({...campaignFilters, enquirySource: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {ENQUIRY_SOURCES.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <strong>Note:</strong> These filters will be applied when sending the campaign to target specific customer segments.
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setCampaignFilters({
                        startDate: '',
                        endDate: '',
                        pianoModel: 'All',
                        customerRating: 'All',
                        status: 'All',
                        state: 'All',
                        suburb: '',
                        nationality: 'All',
                        callTakenBy: 'All',
                        hearAboutUs: 'All',
                        enquirySource: 'All'
                      })
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaign View Modal */}
        {showCampaignView && viewingCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{viewingCampaign.name}</h3>
                  <p className="text-gray-600">{viewingCampaign.subject}</p>
                </div>
                <button
                  onClick={() => setShowCampaignView(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Recipients</p>
                      <p className="text-2xl font-bold text-gray-900">{viewingCampaign.recipientCount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sent</p>
                      <p className="text-2xl font-bold text-gray-900">{viewingCampaign.sentCount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {viewingCampaign.openRate ? `${viewingCampaign.openRate.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Click Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {viewingCampaign.clickRate ? `${viewingCampaign.clickRate.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Campaign Details</h4>
                    {!editingCampaign && viewingCampaign.status === 'draft' && (
                      <button
                        onClick={handleEditCampaign}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {editingCampaign ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                        <input
                          type="text"
                          value={editCampaignForm.name}
                          onChange={(e) => setEditCampaignForm({...editCampaignForm, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                        <input
                          type="text"
                          value={editCampaignForm.subject}
                          onChange={(e) => setEditCampaignForm({...editCampaignForm, subject: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Template</label>
                        <select
                          value={editCampaignForm.templateId}
                          onChange={(e) => setEditCampaignForm({...editCampaignForm, templateId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          {templates.map(template => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                        <select
                          value={editCampaignForm.recipientType}
                          onChange={(e) => setEditCampaignForm({...editCampaignForm, recipientType: e.target.value, customEmails: ''})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="all">All customers ({filteredCustomers.length})</option>
                          <option value="filtered">Filtered customers ({filteredCustomers.length})</option>
                          <option value="selected">Selected customers ({selectedCustomers.length})</option>
                          <option value="custom">Custom email list</option>
                        </select>
                      </div>

                      {editCampaignForm.recipientType === 'custom' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Custom Email List
                            <span className="text-xs text-gray-500 ml-2">(Paste emails separated by commas or new lines)</span>
                          </label>
                          <textarea
                            value={editCampaignForm.customEmails}
                            onChange={(e) => setEditCampaignForm({...editCampaignForm, customEmails: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            rows={4}
                            placeholder="Enter email addresses separated by commas or new lines"
                          />
                          <div className="mt-1 text-xs text-gray-500">
                            {(() => {
                              const emailList = editCampaignForm.customEmails
                                .split(/[,\n\r]+/)
                                .map(email => email.trim())
                                .filter(email => email && /\S+@\S+\.\S+/.test(email))
                              return `${emailList.length} valid email${emailList.length !== 1 ? 's' : ''} detected`
                            })()}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => setEditingCampaign(false)}
                          className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            // Update campaign with new details
                            if (viewingCampaign) {
                              let recipients = 0
                              
                              if (editCampaignForm.recipientType === 'all') {
                                recipients = filteredCustomers.length
                              } else if (editCampaignForm.recipientType === 'filtered') {
                                recipients = filteredCustomers.length
                              } else if (editCampaignForm.recipientType === 'selected') {
                                recipients = selectedCustomers.length
                              } else if (editCampaignForm.recipientType === 'custom') {
                                const emailList = editCampaignForm.customEmails
                                  .split(/[,\n\r]+/)
                                  .map(email => email.trim())
                                  .filter(email => email && /\S+@\S+\.\S+/.test(email))
                                recipients = emailList.length
                              }

                              // Save campaign changes to database
                              try {
                                const response = await fetch('/api/admin/campaigns', {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    id: viewingCampaign.id,
                                    name: editCampaignForm.name,
                                    templateId: editCampaignForm.templateId,
                                    templateName: templates.find(t => t.id === editCampaignForm.templateId)?.name || '',
                                    subject: editCampaignForm.subject,
                                    recipientType: editCampaignForm.recipientType,
                                    textContent: editCampaignForm.recipientType === 'custom' ? editCampaignForm.customEmails : '',
                                  })
                                })

                                if (response.ok) {
                                  const updatedCampaignFromDB = await response.json()
                                  const updatedCampaign = {
                                    ...updatedCampaignFromDB,
                                    customEmails: updatedCampaignFromDB.textContent || '',
                                    recipientCount: recipients
                                  }
                                  
                                  setCampaigns(campaigns.map(c => 
                                    c.id === viewingCampaign.id ? updatedCampaign : c
                                  ))
                                  setViewingCampaign(updatedCampaign)
                                  setEditingCampaign(false)
                                } else {
                                  throw new Error('Failed to save campaign changes')
                                }
                              } catch (error) {
                                console.error('Error saving campaign:', error)
                                alert('Failed to save campaign changes. Please try again.')
                              }
                            }
                          }}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          viewingCampaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                          viewingCampaign.status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                          viewingCampaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {viewingCampaign.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Template:</span>
                        <span className="text-gray-900">{viewingCampaign.templateName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Recipients:</span>
                        <span className="text-gray-900 capitalize">{viewingCampaign.recipientType}</span>
                      </div>
                      {viewingCampaign.recipientType === 'custom' && viewingCampaign.customEmails && (
                        <div className="mt-2">
                          <span className="text-gray-600 text-sm">Custom emails:</span>
                          <div className="mt-1 p-2 bg-gray-50 rounded text-sm text-gray-700 max-h-20 overflow-y-auto">
                            {viewingCampaign.customEmails}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900">{new Date(viewingCampaign.createdAt).toLocaleDateString()}</span>
                      </div>
                      {viewingCampaign.sentAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sent:</span>
                          <span className="text-gray-900">{new Date(viewingCampaign.sentAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                  {viewingCampaign.status === 'sent' && viewingCampaign.openRate && viewingCampaign.clickRate ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Open Rate</span>
                          <span>{viewingCampaign.openRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(viewingCampaign.openRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Click Rate</span>
                          <span>{viewingCampaign.clickRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(viewingCampaign.clickRate * 5, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Success Rate:</strong> {((viewingCampaign.sentCount / viewingCampaign.recipientCount) * 100).toFixed(1)}% delivered successfully
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">Performance metrics will be available after the campaign is sent</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <div className="flex space-x-3">
                  {!editingCampaign && (
                    <>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
                            try {
                              const response = await fetch(`/api/admin/campaigns?id=${viewingCampaign.id}`, {
                                method: 'DELETE'
                              })
                              
                              if (response.ok) {
                                setCampaigns(campaigns.filter(c => c.id !== viewingCampaign.id))
                                setShowCampaignView(false)
                              } else {
                                alert('Failed to delete campaign')
                              }
                            } catch (error) {
                              console.error('Error deleting campaign:', error)
                              alert('Failed to delete campaign')
                            }
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Delete Campaign
                      </button>
                      <button
                        onClick={handleEditCampaign}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Edit Campaign
                      </button>
                    </>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowCampaignView(false)
                      setEditingCampaign(false)
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {viewingCampaign.status === 'draft' && !editingCampaign && (
                    <button
                      onClick={() => {
                        setShowCampaignView(false)
                        handleSendCampaign(viewingCampaign.id)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Send Campaign
                    </button>
                  )}
                  {viewingCampaign.status === 'sent' && !editingCampaign && (
                    <button
                      onClick={() => {
                        // Create a duplicate campaign for re-sending
                        const duplicateCampaign: Campaign = {
                          ...viewingCampaign,
                          id: Date.now().toString(),
                          name: `Copy of ${viewingCampaign.name}`,
                          status: 'draft',
                          sentCount: 0,
                          sentAt: undefined,
                          openRate: undefined,
                          clickRate: undefined,
                          createdAt: new Date().toISOString()
                        }
                        updateCampaigns([duplicateCampaign, ...campaigns])
                        setShowCampaignView(false)
                        setViewingCampaign(duplicateCampaign)
                        setShowCampaignView(true)
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Duplicate & Resend
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 