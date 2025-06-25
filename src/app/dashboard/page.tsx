'use client'

export default function Dashboard() {
  const modules = [
    {
      id: 'enquiry',
      title: 'Enquiry',
      icon: '📝',
      href: '/form',
      description: 'Customer enquiry form'
    },
    {
      id: 'promotional-planner',
      title: 'Promotional Planner',
      icon: '📦',
      href: '/promotional-planner',
      description: 'Plan promotional activities'
    },
    {
      id: 'promotions-events',
      title: 'Promotions and Event Proposal',
      icon: '📄',
      href: '/promotions-events',
      description: 'Event proposals and promotions'
    },
    {
      id: 'marketing-activity',
      title: 'Marketing Activity (New)',
      icon: '📂',
      href: '/marketing-activity',
      description: 'New marketing activities'
    },
    {
      id: 'institutional-calendar',
      title: 'Institutional Calendar',
      icon: '📅',
      href: '/institutional-calendar',
      description: 'Calendar management'
    },
    {
      id: 'hire-enquiry',
      title: 'Hire Enquiry',
      icon: '📊',
      href: '/hire-enquiry',
      description: 'Piano hire enquiries'
    },
    {
      id: 'vip-booking',
      title: 'VIP Booking',
      icon: '👥',
      href: '/vip-booking',
      description: 'VIP customer bookings'
    },
    {
      id: 'bookings',
      title: 'Bookings',
      icon: '📑',
      href: '/bookings',
      description: 'General bookings'
    },
    {
      id: 'staff-roster',
      title: 'Staff Roster',
      icon: '🕒',
      href: '/staff-roster',
      description: 'Staff scheduling'
    },
    {
      id: 'piano-teacher',
      title: 'Piano Teacher',
      icon: '🎹',
      href: '/piano-teacher',
      description: 'Piano teacher management'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">🎹 Exclusive Piano Group - CRM Dashboard</h1>
          <div className="flex items-center space-x-4">
            <a 
              href="/"
              className="inline-flex items-center px-3 py-2 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </a>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                  })
                  if (response.ok) {
                    window.location.href = '/staff'
                  }
                } catch (error) {
                  console.error('Logout failed:', error)
                }
              }}
              className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to your CRM</h2>
          <p className="text-gray-600">Select a module below to get started</p>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <a
              key={module.id}
              href={module.href}
              className="bg-white rounded-lg border border-gray-200 p-8 hover:shadow-lg transition-all duration-200 hover:border-gray-300 group"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="text-6xl group-hover:scale-110 transition-transform duration-200">
                  {module.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {module.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Enquiries</p>
                <p className="text-2xl font-bold text-gray-900">Live Data</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">Real-time</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Follow-ups Due</p>
                <p className="text-2xl font-bold text-gray-900">Connected</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-6">
          <p className="text-center text-gray-600">
            Made with ❤️ for Exclusive Piano Group
          </p>
        </div>
      </div>
    </div>
  )
} 