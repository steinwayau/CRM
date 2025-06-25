'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30days')
  
  // Mock data - in real app this would come from API
  const analytics = {
    enquiries: {
      total: 245,
      thisMonth: 89,
      growth: 12.5
    },
    sources: [
      { name: 'Website', count: 125, percentage: 51 },
      { name: 'Referral', count: 78, percentage: 32 },
      { name: 'Social Media', count: 42, percentage: 17 }
    ],
    products: [
      { name: 'Steinway Grand', count: 45, percentage: 18 },
      { name: 'Boston Upright', count: 38, percentage: 16 },
      { name: 'Kawai Digital', count: 32, percentage: 13 },
      { name: 'Roland Electric', count: 28, percentage: 11 },
      { name: 'Other', count: 102, percentage: 42 }
    ],
    staff: [
      { name: 'June', enquiries: 34, rating: 4.8 },
      { name: 'Chris', enquiries: 28, rating: 4.6 },
      { name: 'Mike', enquiries: 25, rating: 4.7 },
      { name: 'Alison', enquiries: 22, rating: 4.5 }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">View detailed insights and performance metrics</p>
          </div>
          <div className="flex space-x-4">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="1year">Last year</option>
            </select>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enquiries</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.enquiries.total}</p>
                <p className="text-sm text-green-600 mt-1">
                  +{analytics.enquiries.growth}% from last month
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.enquiries.thisMonth}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {Math.round((analytics.enquiries.thisMonth / analytics.enquiries.total) * 100)}% of total
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900">23.4%</p>
                <p className="text-sm text-green-600 mt-1">+2.1% improvement</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enquiry Sources */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Enquiry Sources</h3>
              <p className="text-sm text-gray-600">Where customers are coming from</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analytics.sources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        index === 0 ? 'bg-blue-500' : 
                        index === 1 ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">{source.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">{source.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-blue-500' : 
                            index === 1 ? 'bg-green-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${source.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-10">{source.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product Interest */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Product Interest</h3>
              <p className="text-sm text-gray-600">Most popular piano categories</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analytics.products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        index === 0 ? 'bg-orange-500' : 
                        index === 1 ? 'bg-red-500' : 
                        index === 2 ? 'bg-yellow-500' :
                        index === 3 ? 'bg-indigo-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">{product.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-orange-500' : 
                            index === 1 ? 'bg-red-500' : 
                            index === 2 ? 'bg-yellow-500' :
                            index === 3 ? 'bg-indigo-500' : 'bg-gray-500'
                          }`}
                          style={{ width: `${product.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-10">{product.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Staff Performance</h3>
            <p className="text-sm text-gray-600">Enquiry handling and customer ratings</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enquiries Handled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.staff.map((member, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {member.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.enquiries}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">{member.rating}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(member.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.rating >= 4.7 ? 'bg-green-100 text-green-800' :
                        member.rating >= 4.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.rating >= 4.7 ? 'Excellent' : member.rating >= 4.5 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 