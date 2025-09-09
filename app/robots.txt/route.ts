import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.SITE_URL || 'https://jouryvilla.com'
  
  const robots = `User-agent: *
Allow: /

# Disallow private pages
Disallow: /admin/
Disallow: /account/
Disallow: /auth/
Disallow: /api/

# Allow specific API endpoints that should be crawled
Allow: /api/ical
Allow: /api/availability

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1`

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}