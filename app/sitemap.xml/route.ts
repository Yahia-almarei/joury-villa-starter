import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.SITE_URL || 'https://jouryvilla.com'
  
  const staticPages = [
    '',
    '/book',
    '/about',
    '/policies',
    '/auth/signin',
    '/auth/signup',
    '/contact'
  ]
  
  const languages = ['en', 'ar', 'he']
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticPages.map(page => {
  const url = `${baseUrl}${page}`
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : page === '/book' ? '0.9' : '0.8'}</priority>
${languages.map(lang => 
    `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}${page}?lang=${lang}" />`
).join('\n')}
  </url>`
}).join('\n')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  })
}