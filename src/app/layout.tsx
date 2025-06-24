import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Exclusive Piano Group - CRM System',
  description: 'Modern CRM system for Exclusive Piano Group enquiry management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold text-primary">
                    Exclusive Piano Group
                  </h1>
                  <span className="text-sm text-muted-foreground">
                    CRM System
                  </span>
                </div>
                                  <nav className="flex items-center space-x-6">
                  <a 
                    href="/dashboard" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Dashboard
                  </a>
                  <a 
                    href="/form" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    New Enquiry
                  </a>
                  <a 
                    href="/staff-roster" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Staff Roster
                  </a>
                  <a 
                    href="/admin" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Admin
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
} 