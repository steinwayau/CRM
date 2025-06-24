import { NextRequest, NextResponse } from 'next/server'

// Temporary in-memory storage reference
let enquiries: any[] = []

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    // Check if we have a database connection
    if (process.env.POSTGRES_URL) {
      // Use database if available
      const { sql } = await import('@vercel/postgres')
      await sql`DELETE FROM enquiries WHERE id = ${id}`
      return NextResponse.json({ message: 'Enquiry deleted successfully' })
    } else {
      // Use temporary storage for demo
      const enquiryIndex = enquiries.findIndex(e => e.id === id)
      if (enquiryIndex > -1) {
        enquiries.splice(enquiryIndex, 1)
        return NextResponse.json({ message: 'Enquiry deleted successfully' })
      } else {
        return NextResponse.json(
          { error: 'Enquiry not found' },
          { status: 404 }
        )
      }
    }
  } catch (error) {
    console.error('Error deleting enquiry:', error)
    return NextResponse.json(
      { error: 'Failed to delete enquiry' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    // Check if we have a database connection
    if (process.env.POSTGRES_URL) {
      // Use database if available
      const { sql } = await import('@vercel/postgres')
      const { rows } = await sql`SELECT * FROM enquiries WHERE id = ${id}`
      if (rows.length > 0) {
        return NextResponse.json(rows[0])
      } else {
        return NextResponse.json(
          { error: 'Enquiry not found' },
          { status: 404 }
        )
      }
    } else {
      // Use temporary storage for demo
      const enquiry = enquiries.find(e => e.id === id)
      if (enquiry) {
        return NextResponse.json(enquiry)
      } else {
        return NextResponse.json(
          { error: 'Enquiry not found' },
          { status: 404 }
        )
      }
    }
  } catch (error) {
    console.error('Error fetching enquiry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enquiry' },
      { status: 500 }
    )
  }
} 