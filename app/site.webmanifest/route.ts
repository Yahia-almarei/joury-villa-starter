import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    name: "Joury Villa - Luxury Villa Rental",
    short_name: "Joury Villa",
    description: "Luxury villa rental in historic Jericho, Palestinian Territories",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png", 
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "apple-touch-icon"
      }
    ],
    categories: ["travel", "hospitality", "accommodation"],
    lang: "en",
    dir: "auto",
    scope: "/",
    prefer_related_applications: false
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}