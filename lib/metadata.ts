import { Metadata } from 'next'

const siteUrl = process.env.SITE_URL || 'https://jouryvilla.com'

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Joury Villa - Luxury Villa in Jericho, Palestinian Territories',
    template: '%s | Joury Villa'
  },
  description: 'Book your stay at Joury Villa, a luxury vacation rental in historic Jericho. Experience comfort and hospitality in the Palestinian territories.',
  keywords: [
    'villa', 'jericho', 'palestine', 'vacation rental', 'booking',
    'luxury accommodation', 'palestinian territories', 'middle east',
    'historic jericho', 'dead sea', 'jordan valley', 'luxury villa',
    'vacation home', 'holiday rental', 'palestinian hospitality'
  ],
  authors: [{ name: 'Joury Villa', url: siteUrl }],
  creator: 'Joury Villa',
  publisher: 'Joury Villa',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_PS', 'he_IL'],
    url: siteUrl,
    title: 'Joury Villa - Luxury Villa in Jericho, Palestinian Territories',
    description: 'Book your stay at Joury Villa, a luxury vacation rental in historic Jericho. Experience comfort and hospitality in the Palestinian territories.',
    siteName: 'Joury Villa',
    images: [
      {
        url: `${siteUrl}/images/villa-exterior.jpg`,
        width: 1200,
        height: 630,
        alt: 'Joury Villa - Luxury Villa in Jericho',
        type: 'image/jpeg'
      },
      {
        url: `${siteUrl}/images/villa-pool.jpg`,
        width: 1200,
        height: 630,
        alt: 'Joury Villa Swimming Pool',
        type: 'image/jpeg'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Joury Villa - Luxury Villa in Jericho, Palestinian Territories',
    description: 'Book your stay at Joury Villa, a luxury vacation rental in historic Jericho.',
    images: [`${siteUrl}/images/villa-exterior.jpg`],
    creator: '@jouryvilla',
    site: '@jouryvilla'
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
    other: {
      'facebook-domain-verification': process.env.FACEBOOK_DOMAIN_VERIFICATION || '',
    }
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'en': `${siteUrl}/en`,
      'ar': `${siteUrl}/ar`, 
      'he': `${siteUrl}/he`,
      'x-default': siteUrl
    }
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#3b82f6' }
    ]
  },
  manifest: '/site.webmanifest',
  other: {
    'geo.region': 'PS',
    'geo.placename': 'Jericho',
    'geo.position': '31.8607;35.4444',
    'ICBM': '31.8607, 35.4444',
    'business:contact_data:street_address': 'Jericho',
    'business:contact_data:locality': 'Jericho', 
    'business:contact_data:region': 'Palestinian Territories',
    'business:contact_data:country_name': 'Palestine'
  }
}

export function generatePageMetadata({
  title,
  description,
  keywords = [],
  image,
  url,
  noIndex = false
}: {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  noIndex?: boolean
} = {}): Metadata {
  const pageUrl = url ? `${siteUrl}${url}` : siteUrl
  const pageImage = image ? `${siteUrl}${image}` : `${siteUrl}/images/villa-exterior.jpg`
  
  const baseMetadata: any = defaultMetadata
  
  return {
    ...baseMetadata,
    title: title || baseMetadata.title,
    description: description || baseMetadata.description,
    keywords: [...(baseMetadata.keywords || []), ...keywords],
    alternates: {
      ...baseMetadata.alternates,
      canonical: pageUrl
    },
    robots: {
      ...baseMetadata.robots,
      index: !noIndex,
      follow: !noIndex
    },
    openGraph: {
      ...baseMetadata.openGraph,
      title: title || baseMetadata.openGraph?.title,
      description: description || baseMetadata.openGraph?.description,
      url: pageUrl,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: title || 'Joury Villa',
          type: 'image/jpeg'
        }
      ]
    },
    twitter: {
      ...baseMetadata.twitter,
      title: title || baseMetadata.twitter?.title,
      description: description || baseMetadata.twitter?.description,
      images: [pageImage]
    }
  }
}

// Specific page metadata generators
export const bookingPageMetadata = generatePageMetadata({
  title: 'Book Your Stay - Luxury Villa Rental',
  description: 'Book your stay at Joury Villa in Jericho. Check availability, view pricing, and reserve your luxury vacation rental in the Palestinian territories.',
  keywords: ['book', 'reserve', 'availability', 'pricing', 'luxury booking'],
  url: '/book'
})

export const accountPageMetadata = generatePageMetadata({
  title: 'Your Account',
  description: 'Manage your Joury Villa bookings and account settings.',
  url: '/account',
  noIndex: true
})

export const adminPageMetadata = generatePageMetadata({
  title: 'Admin Dashboard',
  description: 'Joury Villa administration panel.',
  url: '/admin',
  noIndex: true
})

export const signInPageMetadata = generatePageMetadata({
  title: 'Sign In',
  description: 'Sign in to your Joury Villa account to manage bookings.',
  url: '/auth/signin',
  noIndex: true
})