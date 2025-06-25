import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Exclusive Piano Group - CRM',
  description: 'Customer Relationship Management System for Exclusive Piano Group',
  icons: {
    icon: '/images.png',
    shortcut: '/images.png',
    apple: '/images.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images.png" type="image/png" />
        <link rel="shortcut icon" href="/images.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images.png" />
      </head>
      <body className={inter.className}>
        {/* Navigation */}
        <nav className="bg-black text-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-4">
                <a href="/" className="flex items-center space-x-2">
                  <span className="text-2xl">🎼</span>
                  <span className="font-semibold text-lg">EPG CRM</span>
                </a>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="/admin" className="hover:text-gray-300 transition-colors">
                  🏠 Dashboard
                </a>
                
                {/* Submitted Data Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-1 hover:text-gray-300 transition-colors">
                    <span>📊 Submitted Data</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <a href="/submitted-forms/enquiry-data" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        📧 Enquiry Data
                      </a>
                      <a href="/submitted-forms/event-summaries" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        📅 Event Summaries
                      </a>
                      <a href="/submitted-forms/hire-enquiry" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        📊 Hire Enquiry
                      </a>
                      <a href="/submitted-forms/marketing-data" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        📈 Marketing Data
                      </a>
                      <a href="/submitted-forms/promotions-data" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        🎯 Promotions Data
                      </a>
                    </div>
                  </div>
                </div>

                <a href="/admin" className="hover:text-gray-300 transition-colors">
                  👑 Admin Panel
                </a>
                
                <a href="/form" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors">
                  ➕ New Enquiry
                </a>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button className="text-white hover:text-gray-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="py-8 px-4">
          {children}
        </main>
      </body>
    </html>
  )
} 