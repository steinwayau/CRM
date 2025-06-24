// @ts-nocheck
'use client'

import { useState } from 'react'
import SuburbAutocomplete from '@/components/ui/suburb-autocomplete'

// Simple constants defined inline
const STATES = [
  "Australian Capital Territory",
  "New South Wales", 
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania", 
  "Victoria",
  "Western Australia"
]

const NATIONALITIES = [
  "English", "Chinese", "Korean", "Japanese", "Indian", "Other"
]

const PRODUCTS = [
  { id: "steinway", name: "Steinway" },
  { id: "essex", name: "Essex" },
  { id: "yamaha", name: "Yamaha" },
  { id: "usedpiano", name: "Used Piano" },
  { id: "other", name: "Other" }
]

const SOURCES = [
  "Teacher", "Google", "Facebook", "Instagram", "LinkedIn", "WeChat", 
  "YouTube", "Steinway Website", "Radio", "Magazine/Newspaper", 
  "Recommended by a friend", "Event Follow Up", "Other"
]

const EVENT_SOURCES = [
  "Events - Steinway Gallery St Leonards",
  "Events - Steinway Gallery Melbourne", 
  "Phone Enquiry - Steinway National Information Line",
  "Phone Enquiry - Steinway Gallery St Leonards",
  "In-store enquiry - Steinway Gallery St Leonards",
  "Lunar New Year",
  "Piano Teacher Calls",
  "Other"
]

const STAFF_MEMBERS = [
  "Abbey Landgren", "Alexa Curtis", "Angela Liu", "Chris", "Daryl", 
  "Jeremy", "Jessica Herz", "Lucy", "Mark", "Sargoon", "Teresa"
]

const CUSTOMER_RATINGS = [
  "Ready to buy", "High Priority", "After Sale Follow Up", 
  "Very interested but not ready to buy", "Looking for information", 
  "Just browsing for now", "Cold", "Events"
]

export default function EnquiryForm() {
  const [formData, setFormData] = useState({
    status: 'New',
    institutionName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    state: '',
    suburb: '',
    productInterest: [],
    source: '',
    eventSource: '',
    comments: '',
    followUpInfo: '',
    bestTimeToFollowUp: '',
    customerRating: '',
    stepProgram: '',
    submittedBy: '',
    salesManagerInvolved: '',
    doNotEmail: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleProductChange = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productInterest: prev.productInterest.includes(productId)
        ? prev.productInterest.filter(id => id !== productId)
        : [...prev.productInterest, productId]
    }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitMessage('Enquiry submitted successfully! Thank you for your interest.')
        setFormData({
          status: 'New',
          institutionName: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          nationality: '',
          state: '',
          suburb: '',
          productInterest: [],
          source: '',
          eventSource: '',
          comments: '',
          followUpInfo: '',
          bestTimeToFollowUp: '',
          customerRating: '',
          stepProgram: '',
          submittedBy: '',
          salesManagerInvolved: '',
          doNotEmail: false
        })
      } else {
        setSubmitMessage('Error submitting enquiry. Please try again.')
      }
    } catch (error) {
      setSubmitMessage('Error submitting enquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 8V7l-3 2-3-2v1l3 2 3-2zm-8.5 0L9 6l-3.5 2L9 10l3.5-2zM12 14l9-5-9-5-9 5 9 5zm0 1L2.5 9.5 1 10l11 6 11-6-1.5-.5L12 15z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Customer Enquiry Form</h1>
                <p className="text-blue-100 mt-1">Exclusive Piano Group</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            {submitMessage && (
              <div className={`mb-6 p-4 rounded-lg ${
                submitMessage.includes('successfully') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {submitMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Follow Up">Follow Up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    name="institutionName"
                    value={formData.institutionName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter institution name"
                  />
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nationality
                  </label>
                  <select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select nationality</option>
                    {NATIONALITIES.map((nationality) => (
                      <option key={nationality} value={nationality}>
                        {nationality}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select state</option>
                    {STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Suburb
                  </label>
                  <SuburbAutocomplete
                    value={formData.suburb}
                    onChange={(value) => setFormData(prev => ({ ...prev, suburb: value }))}
                    state={formData.state}
                    placeholder="Type suburb name..."
                    className="px-4 py-3 rounded-xl"
                  />
                </div>
              </div>

              {/* Product Interest */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Product Interest
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {PRODUCTS.map((product) => (
                    <div key={product.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.productInterest.includes(product.id)}
                        onChange={() => handleProductChange(product.id)}
                        id={product.id}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={product.id} className="text-sm font-medium text-gray-700 cursor-pointer">
                        {product.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Where did you hear about us?
                  </label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">- select -</option>
                    {SOURCES.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Where did this enquiry come from?
                  </label>
                  <select
                    name="eventSource"
                    value={formData.eventSource}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select event source</option>
                    {EVENT_SOURCES.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Other Comments
                </label>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter any additional comments or information..."
                />
              </div>

              {/* Staff Assignment */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enquiry Submitted By
                  </label>
                  <select
                    name="submittedBy"
                    value={formData.submittedBy}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">- select -</option>
                    {STAFF_MEMBERS.map((staff) => (
                      <option key={staff} value={staff}>
                        {staff}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer Rating
                  </label>
                  <select
                    name="customerRating"
                    value={formData.customerRating}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">N/A</option>
                    {CUSTOMER_RATINGS.map((rating) => (
                      <option key={rating} value={rating}>
                        {rating}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email Preference */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  name="doNotEmail"
                  checked={formData.doNotEmail}
                  onChange={handleInputChange}
                  id="doNotEmail"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="doNotEmail" className="text-sm font-medium text-gray-700">
                  Do Not Email This Customer
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Enquiry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
