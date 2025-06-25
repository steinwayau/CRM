'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getAllStaffWithLabels } from '@/lib/staff-management'
import DateTimePicker from '@/components/ui/date-time-picker'

const CUSTOMER_RATINGS = [
  "N/A", "Ready to buy", "High Priority", "After Sale Follow Up", 
  "Very interested but not ready to buy", "Looking for information", 
  "Just browsing for now", "Cold", "Events"
]

const STEP_PROGRAM_OPTIONS = [
  "N/A", "Interested", "Not interested"
]

const STAFF_MEMBERS_WITH_LABELS = getAllStaffWithLabels()

type Enquiry = {
  id?: number
  status?: string
  firstName?: string
  lastName?: string
  surname?: string
  email?: string
  phone?: string
  state?: string
  suburb?: string
  nationality?: string
  institutionName?: string
  productInterest?: string[]
  source?: string
  eventSource?: string
  comments?: string
  createdAt?: string
  [key: string]: any
}

export default function FollowUpPage() {
  const router = useRouter()
  const params = useParams()
  const enquiryId = params.id as string

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [followUpData, setFollowUpData] = useState({
    bestTimeToFollowUp: '',
    customerRating: 'N/A',
    stepProgram: 'N/A',
    enquiryUpdatedBy: '',
    salesManagerInvolved: 'No',
    salesManagerExplanation: '',
    followUpNotes: '',
    doNotEmail: false
  })

  useEffect(() => {
    fetchEnquiry()
  }, [enquiryId])

  const fetchEnquiry = async () => {
    try {
      const response = await fetch('/api/enquiries')
      if (response.ok) {
        const data = await response.json()
        const foundEnquiry = data.find((e: Enquiry) => e.id?.toString() === enquiryId)
        if (foundEnquiry) {
          setEnquiry(foundEnquiry)
          // Pre-populate existing follow-up data if available
          setFollowUpData({
            bestTimeToFollowUp: foundEnquiry.bestTimeToFollowUp || '',
            customerRating: foundEnquiry.customerRating || 'N/A',
            stepProgram: foundEnquiry.stepProgram || 'N/A',
            enquiryUpdatedBy: foundEnquiry.enquiryUpdatedBy || '',
            salesManagerInvolved: foundEnquiry.salesManagerInvolved || 'No',
            salesManagerExplanation: foundEnquiry.salesManagerExplanation || '',
            followUpNotes: foundEnquiry.followUpNotes || '',
            doNotEmail: foundEnquiry.doNotEmail || false
          })
        } else {
          console.error('Enquiry not found')
        }
      }
    } catch (error) {
      console.error('Error fetching enquiry:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFollowUpData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      console.log('Saving follow-up data:', followUpData)
      
      // Call the API to update the enquiry with follow-up data
      const response = await fetch(`/api/enquiries/${enquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...followUpData,
          lastUpdated: new Date().toISOString(),
          hasFollowUp: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save follow-up data')
      }

      const updatedEnquiry = await response.json()
      console.log('Follow-up data saved successfully:', updatedEnquiry)
      
      alert('Follow-up information saved successfully!')
      router.push('/submitted-forms/enquiry-data')
    } catch (error) {
      console.error('Error saving follow-up:', error)
      alert(`Error saving follow-up information: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const formatProductInterest = (products: any) => {
    if (Array.isArray(products)) {
      return products.join(', ')
    }
    if (typeof products === 'string') {
      try {
        const parsed = JSON.parse(products)
        return Array.isArray(parsed) ? parsed.join(', ') : products
      } catch {
        return products
      }
    }
    return 'N/A'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">Loading enquiry details...</div>
        </div>
      </div>
    )
  }

  if (!enquiry) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center text-red-600">Enquiry not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Follow-up Information</h1>
            <button
              onClick={() => router.push('/submitted-forms/enquiry-data')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back to Enquiry Data
            </button>
          </div>
          
          {/* Customer Details Summary */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Customer:</span>
              <div className="font-medium">{enquiry.firstName} {enquiry.lastName || enquiry.surname}</div>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <div className="font-medium">{enquiry.email}</div>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <div className="font-medium">{enquiry.phone || 'N/A'}</div>
            </div>
            <div>
              <span className="text-gray-500">State:</span>
              <div className="font-medium">{enquiry.state}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mt-4">
            <div>
              <span className="text-gray-500">Product Interest:</span>
              <div className="font-medium">{formatProductInterest(enquiry.productInterest)}</div>
            </div>
            <div>
              <span className="text-gray-500">Source:</span>
              <div className="font-medium">{enquiry.source || 'N/A'}</div>
            </div>
            <div>
              <span className="text-gray-500">Institution:</span>
              <div className="font-medium">{enquiry.institutionName || 'N/A'}</div>
            </div>
          </div>

          {enquiry.comments && (
            <div className="mt-4">
              <span className="text-gray-500">Comments:</span>
              <div className="font-medium">{enquiry.comments}</div>
            </div>
          )}
        </div>

        {/* Follow-up Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Follow-up Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Best Time to Follow Up & Customer Rating */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <DateTimePicker
                  value={followUpData.bestTimeToFollowUp}
                  onChange={(value) => setFollowUpData(prev => ({ ...prev, bestTimeToFollowUp: value }))}
                  label="Best Time to Follow Up"
                  placeholder="Select date and time for follow-up"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Rating
                </label>
                <select
                  name="customerRating"
                  value={followUpData.customerRating}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CUSTOMER_RATINGS.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* STEP Program & Enquiry Updated By */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  STEP Program
                </label>
                <select
                  name="stepProgram"
                  value={followUpData.stepProgram}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {STEP_PROGRAM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enquiry Updated By *
                </label>
                <select
                  name="enquiryUpdatedBy"
                  value={followUpData.enquiryUpdatedBy}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">- select -</option>
                  {STAFF_MEMBERS_WITH_LABELS.map((staff) => (
                    <option key={staff.value} value={staff.value}>
                      {staff.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sales Manager Involvement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Did you involve a Sales Manager or the CEO for this enquiry?
              </label>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="salesManagerInvolved"
                      value="Yes"
                      checked={followUpData.salesManagerInvolved === 'Yes'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="salesManagerInvolved"
                      value="No"
                      checked={followUpData.salesManagerInvolved === 'No'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>

                {followUpData.salesManagerInvolved === 'Yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Please explain why
                    </label>
                    <textarea
                      name="salesManagerExplanation"
                      value={followUpData.salesManagerExplanation}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Explain why sales manager involvement was needed..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Follow-up Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Notes
              </label>
              <textarea
                name="followUpNotes"
                value={followUpData.followUpNotes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any additional notes about this customer interaction..."
              />
            </div>

            {/* Do Not Email */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="doNotEmail"
                  checked={followUpData.doNotEmail}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Do Not Email This Customer
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/submitted-forms/enquiry-data')}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !followUpData.enquiryUpdatedBy}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Follow-up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 