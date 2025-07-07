import { NextRequest, NextResponse } from 'next/server'

interface ThirdPartyService {
  name: string
  apiKey: string
  baseUrl: string
  listId?: string
  audienceId?: string
}

interface SyncCustomersRequest {
  service: 'mailchimp' | 'convertkit' | 'mailerlite' | 'constant-contact'
  credentials: {
    apiKey: string
    listId?: string
    audienceId?: string
    serverId?: string
  }
  customers: {
    email: string
    firstName: string
    lastName: string
    tags?: string[]
    customFields?: Record<string, any>
  }[]
}

export async function POST(request: NextRequest) {
  try {
    const body: SyncCustomersRequest = await request.json()
    const { service, credentials, customers } = body

    // Validate request
    if (!service || !credentials?.apiKey || !customers?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: service, credentials, customers' },
        { status: 400 }
      )
    }

    let result
    switch (service) {
      case 'mailchimp':
        result = await syncToMailchimp(credentials, customers)
        break
      case 'convertkit':
        result = await syncToConvertKit(credentials, customers)
        break
      case 'mailerlite':
        result = await syncToMailerLite(credentials, customers)
        break
      case 'constant-contact':
        result = await syncToConstantContact(credentials, customers)
        break
      default:
        return NextResponse.json(
          { error: `Unsupported service: ${service}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      service: service,
      result: result
    })

  } catch (error) {
    console.error('Third-party sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync with third-party service' },
      { status: 500 }
    )
  }
}

// Mailchimp integration
async function syncToMailchimp(credentials: any, customers: any[]) {
  const { apiKey, audienceId, serverId } = credentials
  
  if (!audienceId || !serverId) {
    throw new Error('Mailchimp requires audienceId and serverId')
  }

  const baseUrl = `https://${serverId}.api.mailchimp.com/3.0`
  
  const results = {
    totalCustomers: customers.length,
    successCount: 0,
    failureCount: 0,
    failures: [] as any[]
  }

  for (const customer of customers) {
    try {
      const response = await fetch(`${baseUrl}/lists/${audienceId}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_address: customer.email,
          status: 'subscribed',
          merge_fields: {
            FNAME: customer.firstName,
            LNAME: customer.lastName,
            ...customer.customFields
          },
          tags: customer.tags || []
        })
      })

      if (response.ok) {
        results.successCount++
      } else {
        const error = await response.json()
        results.failureCount++
        results.failures.push({
          email: customer.email,
          error: error.detail || 'Unknown error'
        })
      }
    } catch (error) {
      results.failureCount++
      results.failures.push({
        email: customer.email,
        error: error
      })
    }
  }

  return results
}

// ConvertKit integration
async function syncToConvertKit(credentials: any, customers: any[]) {
  const { apiKey, listId } = credentials
  
  if (!listId) {
    throw new Error('ConvertKit requires listId')
  }

  const baseUrl = 'https://api.convertkit.com/v3'
  
  const results = {
    totalCustomers: customers.length,
    successCount: 0,
    failureCount: 0,
    failures: [] as any[]
  }

  for (const customer of customers) {
    try {
      const response = await fetch(`${baseUrl}/forms/${listId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          email: customer.email,
          first_name: customer.firstName,
          last_name: customer.lastName,
          tags: customer.tags,
          fields: customer.customFields
        })
      })

      if (response.ok) {
        results.successCount++
      } else {
        const error = await response.json()
        results.failureCount++
        results.failures.push({
          email: customer.email,
          error: error.message || 'Unknown error'
        })
      }
    } catch (error) {
      results.failureCount++
      results.failures.push({
        email: customer.email,
        error: error
      })
    }
  }

  return results
}

// MailerLite integration
async function syncToMailerLite(credentials: any, customers: any[]) {
  const { apiKey, listId } = credentials
  
  if (!listId) {
    throw new Error('MailerLite requires listId')
  }

  const baseUrl = 'https://api.mailerlite.com/api/v2'
  
  const results = {
    totalCustomers: customers.length,
    successCount: 0,
    failureCount: 0,
    failures: [] as any[]
  }

  for (const customer of customers) {
    try {
      const response = await fetch(`${baseUrl}/groups/${listId}/subscribers`, {
        method: 'POST',
        headers: {
          'X-MailerLite-ApiKey': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: customer.email,
          name: `${customer.firstName} ${customer.lastName}`,
          fields: {
            name: customer.firstName,
            last_name: customer.lastName,
            ...customer.customFields
          }
        })
      })

      if (response.ok) {
        results.successCount++
      } else {
        const error = await response.json()
        results.failureCount++
        results.failures.push({
          email: customer.email,
          error: error.error?.message || 'Unknown error'
        })
      }
    } catch (error) {
      results.failureCount++
      results.failures.push({
        email: customer.email,
        error: error
      })
    }
  }

  return results
}

// Constant Contact integration
async function syncToConstantContact(credentials: any, customers: any[]) {
  const { apiKey, listId } = credentials
  
  if (!listId) {
    throw new Error('Constant Contact requires listId')
  }

  const baseUrl = 'https://api.constantcontact.com/v2'
  
  const results = {
    totalCustomers: customers.length,
    successCount: 0,
    failureCount: 0,
    failures: [] as any[]
  }

  for (const customer of customers) {
    try {
      const response = await fetch(`${baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_addresses: [{
            email_address: customer.email
          }],
          first_name: customer.firstName,
          last_name: customer.lastName,
          lists: [{ id: listId }]
        })
      })

      if (response.ok) {
        results.successCount++
      } else {
        const error = await response.json()
        results.failureCount++
        results.failures.push({
          email: customer.email,
          error: error.error_message || 'Unknown error'
        })
      }
    } catch (error) {
      results.failureCount++
      results.failures.push({
        email: customer.email,
        error: error
      })
    }
  }

  return results
}

// GET endpoint to test third-party service connections
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const service = searchParams.get('service')
  const apiKey = searchParams.get('apiKey')
  const listId = searchParams.get('listId')
  const serverId = searchParams.get('serverId')

  if (!service || !apiKey) {
    return NextResponse.json(
      { error: 'Missing service or apiKey parameter' },
      { status: 400 }
    )
  }

  try {
    let testResult
    switch (service) {
      case 'mailchimp':
        testResult = await testMailchimpConnection(apiKey, serverId || undefined)
        break
      case 'convertkit':
        testResult = await testConvertKitConnection(apiKey)
        break
      case 'mailerlite':
        testResult = await testMailerLiteConnection(apiKey)
        break
      case 'constant-contact':
        testResult = await testConstantContactConnection(apiKey)
        break
      default:
        return NextResponse.json(
          { error: `Unsupported service: ${service}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      service: service,
      testResult: testResult
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      service: service,
      error: error
    })
  }
}

// Test connection functions
async function testMailchimpConnection(apiKey: string, serverId?: string) {
  const baseUrl = serverId ? `https://${serverId}.api.mailchimp.com/3.0` : 'https://us1.api.mailchimp.com/3.0'
  
  const response = await fetch(`${baseUrl}/ping`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  })

  if (response.ok) {
    return { connected: true, message: 'Mailchimp connection successful' }
  } else {
    const error = await response.json()
    throw new Error(error.detail || 'Mailchimp connection failed')
  }
}

async function testConvertKitConnection(apiKey: string) {
  const response = await fetch(`https://api.convertkit.com/v3/account?api_key=${apiKey}`)
  
  if (response.ok) {
    const data = await response.json()
    return { connected: true, message: 'ConvertKit connection successful', account: data }
  } else {
    const error = await response.json()
    throw new Error(error.message || 'ConvertKit connection failed')
  }
}

async function testMailerLiteConnection(apiKey: string) {
  const response = await fetch('https://api.mailerlite.com/api/v2/groups', {
    headers: {
      'X-MailerLite-ApiKey': apiKey
    }
  })
  
  if (response.ok) {
    return { connected: true, message: 'MailerLite connection successful' }
  } else {
    const error = await response.json()
    throw new Error(error.error?.message || 'MailerLite connection failed')
  }
}

async function testConstantContactConnection(apiKey: string) {
  const response = await fetch('https://api.constantcontact.com/v2/account/info', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  })
  
  if (response.ok) {
    return { connected: true, message: 'Constant Contact connection successful' }
  } else {
    const error = await response.json()
    throw new Error(error.error_message || 'Constant Contact connection failed')
  }
} 