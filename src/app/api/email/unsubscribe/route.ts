import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('e')
    if (!email) {
      return new NextResponse('<h1>Unsubscribe</h1><p>Missing email.</p>', { status: 400, headers: { 'Content-Type': 'text/html' } })
    }

    // Normalize email
    const normalized = decodeURIComponent(email).trim().toLowerCase()

    // Set doNotEmail=true for all matching enquiries
    await prisma.enquiry.updateMany({
      where: { email: normalized },
      data: { doNotEmail: true }
    })

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unsubscribed</title><style>body{font-family:Arial,sans-serif;background:#f6f7f9;margin:0;padding:0} .card{max-width:560px;margin:40px auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04)} .header{background:#111827;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0} .content{padding:24px 20px;color:#374151} .muted{color:#6b7280;font-size:14px} .btn{display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;margin-top:12px}</style></head><body><div class="card"><div class="header"><h2 style="margin:0;font-size:18px">You have been unsubscribed</h2></div><div class="content"><p>We have removed <strong>${normalized}</strong> from our mailing list. You will no longer receive marketing emails.</p><p class="muted">If this was a mistake, you can resubscribe by contacting us.</p><a class="btn" href="/">Return to site</a></div></div></body></html>`

    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return new NextResponse('<h1>Unsubscribe</h1><p>Something went wrong. Please try again later.</p>', { status: 500, headers: { 'Content-Type': 'text/html' } })
  } finally {
    await prisma.$disconnect()
  }
} 