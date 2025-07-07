'use client'

import { useState, useEffect } from 'react'
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
}

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
  scheduledAt?: string
  sentAt?: string
  createdAt: string
}

export default function CustomerEmailsPage() {
  const [activeTab, setActiveTab] = useState('campaigns')
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
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    templateId: '',
    subject: '',
    recipientType: 'all', // 'all', 'filtered', 'selected'
    scheduledAt: ''
  })

  // Template management state
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    type: 'newsletter' as EmailTemplate['type'],
    htmlContent: '',
    textContent: ''
  })
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)

  // Visual editor state
  const [editorElements, setEditorElements] = useState<Array<{
    id: string
    type: 'text' | 'image' | 'video' | 'button' | 'divider'
    content: string
    style: {
      position: { x: number; y: number }
      width: number
      height: number
      fontSize?: number
      fontWeight?: string
      color?: string
      backgroundColor?: string
      padding?: number
      borderRadius?: number
      textAlign?: 'left' | 'center' | 'right'
    }
  }>>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 })

  // Sample data - replace with actual API calls
  useEffect(() => {
    // Load customers, templates, and campaigns
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load customer data from your existing enquiries API
      const customersResponse = await fetch('/api/enquiries')
      const customersData = await customersResponse.json()
      
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
      
      setCustomers(transformedCustomers)
      
      // Load templates and campaigns (placeholder for now)
      setTemplates([
        {
          id: '1',
          name: 'Welcome Newsletter',
          subject: 'Welcome to Exclusive Piano Group',
          htmlContent: '<h1>Welcome!</h1><p>Thank you for your interest in our pianos...</p>',
          textContent: 'Welcome! Thank you for your interest in our pianos...',
          type: 'newsletter',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'New Arrivals Promotion',
          subject: 'New Steinway & Sons Pianos Just Arrived',
          htmlContent: '<h1>New Arrivals</h1><p>Discover our latest piano collection...</p>',
          textContent: 'New Arrivals: Discover our latest piano collection...',
          type: 'promotional',
          createdAt: '2024-01-10T14:30:00Z'
        }
      ])
      
      setCampaigns([
        {
          id: '1',
          name: 'January Newsletter',
          templateId: '1',
          templateName: 'Welcome Newsletter',
          subject: 'Your January Piano Update',
          recipientCount: 1250,
          sentCount: 1250,
          openRate: 45.2,
          clickRate: 12.8,
          status: 'sent',
          sentAt: '2024-01-15T09:00:00Z',
          createdAt: '2024-01-14T16:00:00Z'
        }
      ])
      
    } catch (error) {
      console.error('Error loading data:', error)
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
      const recipients = campaignForm.recipientType === 'all' 
        ? filteredCustomers.length
        : campaignForm.recipientType === 'filtered'
        ? filteredCustomers.length
        : selectedCustomers.length

      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: campaignForm.name,
        templateId: campaignForm.templateId,
        templateName: templates.find(t => t.id === campaignForm.templateId)?.name || '',
        subject: campaignForm.subject,
        recipientCount: recipients,
        sentCount: 0,
        status: campaignForm.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: campaignForm.scheduledAt || undefined,
        createdAt: new Date().toISOString()
      }

      setCampaigns([newCampaign, ...campaigns])
      setShowNewCampaign(false)
      setCampaignForm({
        name: '',
        templateId: '',
        subject: '',
        recipientType: 'all',
        scheduledAt: ''
      })
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    try {
      // This would integrate with your bulk email API
      const campaign = campaigns.find(c => c.id === campaignId)
      if (!campaign) return

      // Update campaign status
      setCampaigns(campaigns.map(c => 
        c.id === campaignId 
          ? { ...c, status: 'sending' as const }
          : c
      ))

      // Here you would call your bulk email API
      // await fetch('/api/email/send-campaign', { ... })
      
      // Simulate sending completion
      setTimeout(() => {
        setCampaigns(campaigns.map(c => 
          c.id === campaignId 
            ? { 
                ...c, 
                status: 'sent' as const, 
                sentCount: c.recipientCount,
                sentAt: new Date().toISOString()
              }
            : c
        ))
      }, 2000)
      
    } catch (error) {
      console.error('Error sending campaign:', error)
    }
  }

  // Template management functions
  const handleCreateTemplate = () => {
    setCurrentTemplate(null)
    setTemplateForm({
      name: '',
      subject: '',
      type: 'newsletter',
      htmlContent: '',
      textContent: ''
    })
    setEditorElements([])
    setSelectedElement(null)
    setShowTemplateEditor(true)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setCurrentTemplate(template)
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      type: template.type,
      htmlContent: template.htmlContent,
      textContent: template.textContent
    })
    loadElementsFromHtml(template.htmlContent)
    setSelectedElement(null)
    setShowTemplateEditor(true)
  }

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    setCurrentTemplate(null)
    setTemplateForm({
      name: `Copy of ${template.name}`,
      subject: template.subject,
      type: template.type,
      htmlContent: template.htmlContent,
      textContent: template.textContent
    })
    loadElementsFromHtml(template.htmlContent)
    setSelectedElement(null)
    setShowTemplateEditor(true)
  }

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setPreviewTemplate(template)
    setShowTemplatePreview(true)
  }

  const handleSaveTemplate = () => {
    try {
      // Generate HTML from visual elements
      const generatedHtml = generateHtmlFromElements()
      const generatedText = generatePlainTextFromElements()
      
      const templateData: EmailTemplate = {
        id: currentTemplate?.id || Date.now().toString(),
        name: templateForm.name,
        subject: templateForm.subject,
        type: templateForm.type,
        htmlContent: generatedHtml || templateForm.htmlContent,
        textContent: generatedText || templateForm.textContent,
        createdAt: currentTemplate?.createdAt || new Date().toISOString()
      }

      if (currentTemplate) {
        // Update existing template
        setTemplates(templates.map(t => 
          t.id === currentTemplate.id ? templateData : t
        ))
      } else {
        // Add new template
        setTemplates([templateData, ...templates])
      }

      setShowTemplateEditor(false)
      setCurrentTemplate(null)
      setEditorElements([])
      setSelectedElement(null)
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
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

  // Visual editor functions
  const addElement = (type: 'text' | 'image' | 'video' | 'button' | 'divider') => {
    const newElement = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      style: {
        position: { x: 50, y: 50 },
        width: type === 'divider' ? 500 : type === 'button' ? 200 : 300,
        height: type === 'text' ? 50 : type === 'divider' ? 2 : type === 'button' ? 40 : 200,
        fontSize: type === 'text' ? 16 : undefined,
        fontWeight: type === 'text' ? 'normal' : undefined,
        color: type === 'text' ? '#000000' : type === 'button' ? '#ffffff' : undefined,
        backgroundColor: type === 'button' ? '#3b82f6' : type === 'divider' ? '#e5e7eb' : undefined,
        padding: type === 'text' || type === 'button' ? 10 : undefined,
        borderRadius: type === 'button' ? 6 : undefined,
        textAlign: type === 'text' ? 'left' as const : undefined
      }
    }
    setEditorElements([...editorElements, newElement])
  }

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text': return 'Enter your text here...'
      case 'image': return 'https://via.placeholder.com/300x200'
      case 'video': return 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      case 'button': return 'Click Here'
      case 'divider': return ''
      default: return ''
    }
  }

  const updateElement = (id: string, updates: Partial<typeof editorElements[0]>) => {
    setEditorElements(editorElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
  }

  const deleteElement = (id: string) => {
    setEditorElements(editorElements.filter(el => el.id !== id))
    setSelectedElement(null)
  }

  const generateHtmlFromElements = () => {
    let html = `<div style="position: relative; width: ${canvasSize.width}px; min-height: ${canvasSize.height}px; background: #ffffff; font-family: Arial, sans-serif;">`
    
    editorElements.forEach(element => {
      const { style, content, type } = element
      const commonStyles = `
        position: absolute;
        left: ${style.position.x}px;
        top: ${style.position.y}px;
        width: ${style.width}px;
        height: ${style.height}px;
        ${style.fontSize ? `font-size: ${style.fontSize}px;` : ''}
        ${style.fontWeight ? `font-weight: ${style.fontWeight};` : ''}
        ${style.color ? `color: ${style.color};` : ''}
        ${style.backgroundColor ? `background-color: ${style.backgroundColor};` : ''}
        ${style.padding ? `padding: ${style.padding}px;` : ''}
        ${style.borderRadius ? `border-radius: ${style.borderRadius}px;` : ''}
        ${style.textAlign ? `text-align: ${style.textAlign};` : ''}
      `

      switch (type) {
        case 'text':
          html += `<div style="${commonStyles}">${content}</div>`
          break
        case 'image':
          html += `<img src="${content}" style="${commonStyles} object-fit: cover;" alt="Email Image" />`
          break
        case 'video':
          html += `<iframe src="${content}" style="${commonStyles}" frameborder="0" allowfullscreen></iframe>`
          break
        case 'button':
          html += `<a href="#" style="${commonStyles} display: flex; align-items: center; justify-content: center; text-decoration: none; border: none; cursor: pointer;">${content}</a>`
          break
        case 'divider':
          html += `<hr style="${commonStyles} border: none; background-color: ${style.backgroundColor};" />`
          break
      }
    })
    
    html += '</div>'
    return html
  }

  const generatePlainTextFromElements = () => {
    return editorElements
      .filter(el => el.type === 'text' || el.type === 'button')
      .map(el => el.content)
      .join('\n\n')
  }

  const loadElementsFromHtml = (html: string) => {
    // This would parse HTML back to elements - simplified for now
    // In a real implementation, you'd need a proper HTML parser
    if (!html || html.trim() === '') {
      setEditorElements([])
      return
    }
    
    // For now, keep existing elements if HTML is not from visual editor
    // In production, you'd want to parse the HTML properly
  }

  const renderCampaigns = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Campaigns</h2>
          <p className="text-gray-600">Create and manage customer email campaigns</p>
        </div>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Campaign
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
              <p className="text-3xl font-bold text-gray-900">{campaigns.reduce((sum, c) => sum + c.sentCount, 0)}</p>
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
                {campaigns.length > 0 
                  ? (campaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / campaigns.length).toFixed(1)
                  : '0'}%
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
                {campaigns.length > 0 
                  ? (campaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / campaigns.length).toFixed(1)
                  : '0'}%
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
                      <button className="text-gray-600 hover:text-gray-800 text-sm">
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
                  onChange={(e) => setCampaignForm({...campaignForm, templateId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({...campaignForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                <select
                  value={campaignForm.recipientType}
                  onChange={(e) => setCampaignForm({...campaignForm, recipientType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All customers ({filteredCustomers.length})</option>
                  <option value="filtered">Filtered customers ({filteredCustomers.length})</option>
                  <option value="selected">Selected customers ({selectedCustomers.length})</option>
                </select>
              </div>

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
                disabled={!campaignForm.name || !campaignForm.templateId || !campaignForm.subject}
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

                {/* Visual Template Editor Modal */}
        {showTemplateEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    {currentTemplate ? 'Edit Template' : 'Create New Template'}
                  </h3>
                  <p className="text-sm text-gray-600">Drag and drop elements to build your email template</p>
                </div>
                <button
                  onClick={() => setShowTemplateEditor(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Template Settings */}
              <div className="border-b px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                    <input
                      type="text"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                    <input
                      type="text"
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter email subject line"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Type</label>
                    <select
                      value={templateForm.type}
                      onChange={(e) => setTemplateForm({...templateForm, type: e.target.value as EmailTemplate['type']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="newsletter">Newsletter</option>
                      <option value="promotional">Promotional</option>
                      <option value="event">Event</option>
                      <option value="follow-up">Follow-up</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Main Editor Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Elements Sidebar */}
                <div className="w-64 border-r bg-gray-50 overflow-y-auto">
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Elements</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => addElement('text')}
                        className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          <span className="text-sm font-medium">Text Block</span>
                        </div>
                      </button>

                      <button
                        onClick={() => addElement('image')}
                        className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium">Image</span>
                        </div>
                      </button>

                      <button
                        onClick={() => addElement('button')}
                        className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                          </svg>
                          <span className="text-sm font-medium">Button</span>
                        </div>
                      </button>

                      <button
                        onClick={() => addElement('video')}
                        className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium">Video</span>
                        </div>
                      </button>

                      <button
                        onClick={() => addElement('divider')}
                        className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                          <span className="text-sm font-medium">Divider</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Canvas Size:</span>
                        <select 
                          value={canvasSize.width}
                          onChange={(e) => setCanvasSize({...canvasSize, width: parseInt(e.target.value)})}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="600">600px (Mobile)</option>
                          <option value="800">800px (Tablet)</option>
                          <option value="1000">1000px (Desktop)</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const html = generateHtmlFromElements()
                            if (html) {
                              handlePreviewTemplate({
                                id: 'preview',
                                name: templateForm.name || 'Untitled Template',
                                subject: templateForm.subject || 'No Subject',
                                type: templateForm.type,
                                htmlContent: html,
                                textContent: generatePlainTextFromElements(),
                                createdAt: new Date().toISOString()
                              })
                            }
                          }}
                          disabled={editorElements.length === 0}
                          className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50"
                        >
                          Preview
                        </button>
                        <button
                          onClick={handleSaveTemplate}
                          disabled={!templateForm.name || !templateForm.subject || editorElements.length === 0}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {currentTemplate ? 'Update Template' : 'Save Template'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Visual Canvas */}
                  <div className="flex-1 bg-gray-100 overflow-auto p-8">
                    <div 
                      className="bg-white shadow-lg mx-auto relative"
                      style={{ 
                        width: `${canvasSize.width}px`, 
                        minHeight: `${canvasSize.height}px`,
                        border: '1px solid #e5e7eb'
                      }}
                      onClick={() => setSelectedElement(null)}
                    >
                      {editorElements.map((element) => (
                        <div
                          key={element.id}
                          className={`absolute cursor-move ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
                          style={{
                            left: element.style.position.x,
                            top: element.style.position.y,
                            width: element.style.width,
                            height: element.style.height,
                            zIndex: selectedElement === element.id ? 10 : 1
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedElement(element.id)
                          }}
                          onMouseDown={(e) => {
                            const startX = e.clientX - element.style.position.x
                            const startY = e.clientY - element.style.position.y
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const newX = Math.max(0, Math.min(canvasSize.width - element.style.width, e.clientX - startX))
                              const newY = Math.max(0, Math.min(canvasSize.height - element.style.height, e.clientY - startY))
                              
                              updateElement(element.id, {
                                style: {
                                  ...element.style,
                                  position: { x: newX, y: newY }
                                }
                              })
                            }
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove)
                              document.removeEventListener('mouseup', handleMouseUp)
                            }
                            
                            document.addEventListener('mousemove', handleMouseMove)
                            document.addEventListener('mouseup', handleMouseUp)
                          }}
                        >
                          {element.type === 'text' && (
                            <div
                              style={{
                                fontSize: element.style.fontSize,
                                fontWeight: element.style.fontWeight,
                                color: element.style.color,
                                backgroundColor: element.style.backgroundColor,
                                padding: element.style.padding,
                                borderRadius: element.style.borderRadius,
                                textAlign: element.style.textAlign,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {element.content}
                            </div>
                          )}
                          
                          {element.type === 'image' && (
                            <img 
                              src={element.content} 
                              alt="Template Image"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: element.style.borderRadius
                              }}
                            />
                          )}
                          
                          {element.type === 'button' && (
                            <div
                              style={{
                                backgroundColor: element.style.backgroundColor,
                                color: element.style.color,
                                padding: element.style.padding,
                                borderRadius: element.style.borderRadius,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: element.style.fontSize || 14,
                                fontWeight: element.style.fontWeight || 'medium'
                              }}
                            >
                              {element.content}
                            </div>
                          )}
                          
                          {element.type === 'video' && (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px dashed #d1d5db',
                                borderRadius: element.style.borderRadius
                              }}
                            >
                              <div className="text-center">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm text-gray-500">Video Placeholder</p>
                              </div>
                            </div>
                          )}
                          
                          {element.type === 'divider' && (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: element.style.backgroundColor,
                                borderRadius: element.style.borderRadius
                              }}
                            />
                          )}
                          
                          {selectedElement === element.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteElement(element.id)
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {editorElements.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="text-gray-500 text-lg">Start by adding elements from the sidebar</p>
                            <p className="text-gray-400 text-sm mt-2">Drag and drop elements to build your email template</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Properties Panel */}
                {selectedElement && (
                  <div className="w-64 border-l bg-gray-50 overflow-y-auto">
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Element Properties</h4>
                      {(() => {
                        const element = editorElements.find(el => el.id === selectedElement)
                        if (!element) return null
                        
                        return (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                              {element.type === 'text' || element.type === 'button' ? (
                                <textarea
                                  value={element.content}
                                  onChange={(e) => updateElement(element.id, { content: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  rows={3}
                                />
                              ) : element.type === 'image' || element.type === 'video' ? (
                                <input
                                  type="url"
                                  value={element.content}
                                  onChange={(e) => updateElement(element.id, { content: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="Enter URL"
                                />
                              ) : null}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                                <input
                                  type="number"
                                  value={element.style.width}
                                  onChange={(e) => updateElement(element.id, {
                                    style: { ...element.style, width: parseInt(e.target.value) }
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                                <input
                                  type="number"
                                  value={element.style.height}
                                  onChange={(e) => updateElement(element.id, {
                                    style: { ...element.style, height: parseInt(e.target.value) }
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                />
                              </div>
                            </div>
                            
                            {(element.type === 'text' || element.type === 'button') && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                                  <input
                                    type="number"
                                    value={element.style.fontSize || 16}
                                    onChange={(e) => updateElement(element.id, {
                                      style: { ...element.style, fontSize: parseInt(e.target.value) }
                                    })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                                  <input
                                    type="color"
                                    value={element.style.color || '#000000'}
                                    onChange={(e) => updateElement(element.id, {
                                      style: { ...element.style, color: e.target.value }
                                    })}
                                    className="w-full h-8 border border-gray-300 rounded-md"
                                  />
                                </div>
                                
                                {element.type === 'text' && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Align</label>
                                    <select
                                      value={element.style.textAlign || 'left'}
                                      onChange={(e) => updateElement(element.id, {
                                        style: { ...element.style, textAlign: e.target.value as any }
                                      })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                    >
                                      <option value="left">Left</option>
                                      <option value="center">Center</option>
                                      <option value="right">Right</option>
                                    </select>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {(element.type === 'button' || element.type === 'divider') && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                                <input
                                  type="color"
                                  value={element.style.backgroundColor || '#3b82f6'}
                                  onChange={(e) => updateElement(element.id, {
                                    style: { ...element.style, backgroundColor: e.target.value }
                                  })}
                                  className="w-full h-8 border border-gray-300 rounded-md"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
      </div>
    </div>
  )
} 