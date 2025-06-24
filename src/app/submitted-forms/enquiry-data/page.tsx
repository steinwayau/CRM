'use client'

import { useState, useEffect } from 'react'
import SuburbAutocomplete from '@/components/ui/suburb-autocomplete'

// Constants matching the current system
const PIANO_MODELS = ["All", "Steinway", "Boston", "Essex", "Yamaha", "Kawai", "Used Piano", "Other"]
const CUSTOMER_RATINGS = [
  "All", "Ready to buy", "High Priority", "After Sale Follow Up", 
  "Very interested but not ready to buy", "Looking for information", 
  "Just browsing for now", "Cold", "Events"
]
const STATUSES = ["All", "New", "In Progress", "Completed", "Follow Up", "Closed"]
const STATES = [
  "All", "Australian Capital Territory", "New South Wales", "Northern Territory",
  "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"
]
const MAIL_LISTS = ["All", "Yes", "No"]
const NATIONALITIES = ["All", "English", "Chinese", "Korean", "Japanese", "Indian", "Other"]
const STAFF_MEMBERS = [
  "All", "Abbey Landgren", "Alexa Curtis", "Angela Liu", "Chris", "Daryl", 
  "Jeremy", "Jessica Herz", "Lucy", "Mark", "Sargoon", "Teresa", "June", "Mike", "Olivia Huang"
]
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

type Enquiry = {
  id?: number
  status?: string
  firstName?: string
  first_name?: string
  surname?: string
  lastName?: string
  email?: string
  phone?: string
  state?: string
  suburb?: string
  nationality?: string
  productInterest?: string[]
  products?: string
  source?: string
  eventSource?: string
  enquiry_source?: string
  callTakenBy?: string
  call_taken_by?: string
  submittedBy?: string
  createdAt?: string
  created_at?: string
  [key: string]: any
}

export default function EnquiryData() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    pianoModel: 'All',
    customerRating: 'All',
    status: 'All',
    state: 'All',
    suburb: '',
    mailList: 'All',
    nationality: 'All',
    callTakenBy: 'All',
    hearAboutUs: 'All',
    enquirySource: 'All',
    leadsNotContacted: '- Select -',
    leadsInvolvingSales: '- Select -',
    leadsWithoutSales: '- Select -'
  })

  // Modal states
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [enquiryToDelete, setEnquiryToDelete] = useState<Enquiry | null>(null)

  useEffect(() => {
    fetchEnquiries()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [enquiries, filters, searchTerm])

  const fetchEnquiries = async () => {
    try {
      const response = await fetch('/api/enquiries')
      if (response.ok) {
        const data = await response.json()
        setEnquiries(data)
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...enquiries]

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(enquiry => 
        Object.values(enquiry).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply date filters
    if (filters.startDate) {
      filtered = filtered.filter(enquiry => {
        const enquiryDate = enquiry.createdAt || enquiry.created_at
        return enquiryDate && new Date(enquiryDate) >= new Date(filters.startDate)
      })
    }
    if (filters.endDate) {
      filtered = filtered.filter(enquiry => {
        const enquiryDate = enquiry.createdAt || enquiry.created_at
        return enquiryDate && new Date(enquiryDate) <= new Date(filters.endDate)
      })
    }

    // Apply dropdown filters
    if (filters.status !== 'All') {
      filtered = filtered.filter(enquiry => enquiry.status === filters.status)
    }
    if (filters.state !== 'All') {
      filtered = filtered.filter(enquiry => enquiry.state === filters.state)
    }
    if (filters.suburb) {
      filtered = filtered.filter(enquiry => 
        enquiry.suburb && enquiry.suburb.toLowerCase().includes(filters.suburb.toLowerCase())
      )
    }
    if (filters.nationality !== 'All') {
      filtered = filtered.filter(enquiry => enquiry.nationality === filters.nationality)
    }
    if (filters.callTakenBy !== 'All') {
      filtered = filtered.filter(enquiry => 
        (enquiry.callTakenBy || enquiry.call_taken_by) === filters.callTakenBy
      )
    }
    if (filters.hearAboutUs !== 'All') {
      filtered = filtered.filter(enquiry => enquiry.source === filters.hearAboutUs)
    }
    if (filters.enquirySource !== 'All') {
      filtered = filtered.filter(enquiry => 
        (enquiry.eventSource || enquiry.enquiry_source) === filters.enquirySource
      )
    }

    setFilteredEnquiries(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatProductInterest = (products: any) => {
    if (!products) return ''
    if (typeof products === 'string') {
      try {
        const parsed = JSON.parse(products)
        return Array.isArray(parsed) ? parsed.join(', ') : products
      } catch {
        return products
      }
    }
    return Array.isArray(products) ? products.join(', ') : products.toString()
  }

  // Pagination
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEnquiries = filteredEnquiries.slice(startIndex, endIndex)

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return '🟢'
      case 'in progress': return '🟡' 
      case 'completed': return '✅'
      case 'follow up': return '🔄'
      case 'sold': return '💰'
      case 'finalised': return '✅'
      default: return '⚪'
    }
  }

  // Modal handlers
  const handleViewEnquiry = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry)
    setIsViewModalOpen(true)
  }

  const handleEditEnquiry = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry)
    setIsEditModalOpen(true)
  }

  const handleDeleteEnquiry = (enquiry: Enquiry) => {
    setEnquiryToDelete(enquiry)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!enquiryToDelete) return
    
    try {
      const response = await fetch(`/api/enquiries/${enquiryToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setEnquiries(prev => prev.filter(e => e.id !== enquiryToDelete.id))
        setShowDeleteConfirm(false)
        setEnquiryToDelete(null)
      } else {
        alert('Error deleting enquiry. Please try again.')
      }
    } catch (error) {
      alert('Error deleting enquiry. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold">📧 Exclusive Piano Group - Enquiry Data</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {/* Date Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Piano Model</label>
              <select
                value={filters.pianoModel}
                onChange={(e) => handleFilterChange('pianoModel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {PIANO_MODELS.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Rating</label>
              <select
                value={filters.customerRating}
                onChange={(e) => handleFilterChange('customerRating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {CUSTOMER_RATINGS.map(rating => (
                  <option key={rating} value={rating}>{rating}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
              <SuburbAutocomplete
                value={filters.suburb}
                onChange={(value) => handleFilterChange('suburb', value)}
                state={filters.state === 'All' ? '' : filters.state}
                placeholder="Type suburb name..."
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mail List</label>
              <select
                value={filters.mailList}
                onChange={(e) => handleFilterChange('mailList', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {MAIL_LISTS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Nationality</label>
              <select
                value={filters.nationality}
                onChange={(e) => handleFilterChange('nationality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {NATIONALITIES.map(nationality => (
                  <option key={nationality} value={nationality}>{nationality}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Call Taken by</label>
              <select
                value={filters.callTakenBy}
                onChange={(e) => handleFilterChange('callTakenBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {STAFF_MEMBERS.map(staff => (
                  <option key={staff} value={staff}>{staff}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Where did you hear about us?</label>
              <select
                value={filters.hearAboutUs}
                onChange={(e) => handleFilterChange('hearAboutUs', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {HEAR_ABOUT_US.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Where did this enquiry come from?</label>
              <select
                value={filters.enquirySource}
                onChange={(e) => handleFilterChange('enquirySource', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {ENQUIRY_SOURCES.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leads not contacted over 3 months</label>
              <select
                value={filters.leadsNotContacted}
                onChange={(e) => handleFilterChange('leadsNotContacted', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="- Select -">- Select -</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leads involving Sales Manager or CEO</label>
              <select
                value={filters.leadsInvolvingSales}
                onChange={(e) => handleFilterChange('leadsInvolvingSales', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="- Select -">- Select -</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leads without involving Sales Manager or CEO</label>
              <select
                value={filters.leadsWithoutSales}
                onChange={(e) => handleFilterChange('leadsWithoutSales', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="- Select -">- Select -</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Status Icons: 🟢 = New | ✅ = Finalised | 💰 = Sold
        </div>

        {/* Results Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Show</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <label className="text-sm font-medium text-gray-700">entries</label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Search:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Search..."
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ACT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">STAT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">FIRST NAME</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">SURNAME</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">EMAIL</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">PHONE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">STATE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">SUBURB</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">PRODUCT INTEREST</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">DATE</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">CALL TAKEN BY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      Loading enquiries...
                    </td>
                  </tr>
                ) : currentEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      No enquiries found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  currentEnquiries.map((enquiry: any, index) => (
                    <tr key={enquiry.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex space-x-1">
                          <button className="text-orange-500 hover:text-orange-700" title="View" onClick={() => handleViewEnquiry(enquiry)}>👁️</button>
                          <button className="text-blue-500 hover:text-blue-700" title="Edit" onClick={() => handleEditEnquiry(enquiry)}>📝</button>
                          <button className="text-red-500 hover:text-red-700" title="Delete" onClick={() => handleDeleteEnquiry(enquiry)}>🗑️</button>
                          <button className="text-green-500 hover:text-green-700" title="Email" onClick={() => window.location.href = `mailto:${enquiry.email}`}>📧</button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-lg">
                        {getStatusIcon(enquiry.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {enquiry.firstName || enquiry.first_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {enquiry.surname || enquiry.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-600">
                        <a href={`mailto:${enquiry.email}`} className="hover:underline">
                          {enquiry.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {enquiry.phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {enquiry.state}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {enquiry.suburb}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatProductInterest(enquiry.productInterest || enquiry.products)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(enquiry.createdAt || enquiry.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {enquiry.callTakenBy || enquiry.call_taken_by || enquiry.submittedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredEnquiries.length)} of {filteredEnquiries.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                      currentPage === pageNum ? 'bg-orange-500 text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-gray-500">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                      currentPage === totalPages ? 'bg-orange-500 text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">View Enquiry Details</h3>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Name:</strong> {selectedEnquiry.firstName} {selectedEnquiry.surname || selectedEnquiry.lastName}</div>
              <div><strong>Email:</strong> {selectedEnquiry.email}</div>
              <div><strong>Phone:</strong> {selectedEnquiry.phone}</div>
              <div><strong>State:</strong> {selectedEnquiry.state}</div>
              <div><strong>Suburb:</strong> {selectedEnquiry.suburb}</div>
              <div><strong>Status:</strong> {selectedEnquiry.status}</div>
              <div><strong>Nationality:</strong> {selectedEnquiry.nationality}</div>
              <div><strong>Institution:</strong> {selectedEnquiry.institutionName || selectedEnquiry.institution_name}</div>
              <div className="col-span-2"><strong>Product Interest:</strong> {formatProductInterest(selectedEnquiry.productInterest || selectedEnquiry.products)}</div>
              <div className="col-span-2"><strong>Comments:</strong> {selectedEnquiry.comments}</div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && enquiryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="text-red-500 text-2xl mr-3">⚠️</div>
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the enquiry from <strong>{enquiryToDelete.firstName} {enquiryToDelete.surname || enquiryToDelete.lastName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 