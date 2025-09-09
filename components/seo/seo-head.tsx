import Head from 'next/head'
// Translation functionality removed - using English only

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  noIndex?: boolean
  canonical?: string
  alternateLanguages?: { [key: string]: string }
}

export function SEOHead({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  noIndex = false,
  canonical,
  alternateLanguages
}: SEOHeadProps) {
  const { locale, direction } = useTranslation()
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jouryvilla.com'
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : baseUrl)
  
  const defaultTitle = locale === 'ar' 
    ? 'فيلا جوري - فيلا فاخرة في أريحا، فلسطين'
    : locale === 'he'
    ? 'וילה ג\'ורי - וילה יוקרתית ביריחו, ישראל'
    : 'Joury Villa - Luxury Villa in Jericho, Palestinian Territories'
    
  const defaultDescription = locale === 'ar'
    ? 'احجز إقامتك في فيلا جوري، فيلا فاخرة للإيجار في مدينة أريحا التاريخية. استمتع بالراحة والضيافة في الأراضي الفلسطينية.'
    : locale === 'he'
    ? 'הזמן את השהות שלך בוילה ג\'ורי, וילה יוקרתית להשכרה בעיר יריחו ההיסטורית. תיהנה מנוחות ואירוח בשטחים הפלסטיניים.'
    : 'Book your stay at Joury Villa, a luxury vacation rental in historic Jericho. Experience comfort and hospitality in the Palestinian territories.'

  const pageTitle = title ? `${title} | Joury Villa` : defaultTitle
  const pageDescription = description || defaultDescription
  const pageImage = image || `${baseUrl}/images/villa-exterior.jpg`
  
  const defaultKeywords = [
    'villa', 'jericho', 'palestine', 'vacation rental', 'booking',
    'luxury accommodation', 'palestinian territories', 'middle east',
    'historic jericho', 'dead sea', 'jordan valley'
  ]
  
  const allKeywords = [...defaultKeywords, ...keywords].join(', ')

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={allKeywords} />
      <meta name="author" content="Joury Villa" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content={locale} />
      <meta name="language" content={locale} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || currentUrl} />
      
      {/* Alternate Language Links */}
      {alternateLanguages && Object.entries(alternateLanguages).map(([lang, href]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={href} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/`} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content="Joury Villa" />
      <meta property="og:locale" content={locale === 'ar' ? 'ar_PS' : locale === 'he' ? 'he_IL' : 'en_US'} />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      
      {/* Favicon and Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      
      {/* Additional Meta Tags */}
      <meta name="format-detection" content="telephone=yes" />
      <meta name="geo.region" content="PS" />
      <meta name="geo.placename" content="Jericho" />
      <meta name="geo.position" content="31.8607;35.4444" />
      <meta name="ICBM" content="31.8607, 35.4444" />
      
      {/* Business Information */}
      <meta name="business:contact_data:street_address" content="Jericho" />
      <meta name="business:contact_data:locality" content="Jericho" />
      <meta name="business:contact_data:region" content="Palestinian Territories" />
      <meta name="business:contact_data:country_name" content="Palestine" />
      
      {/* RTL Support */}
      <meta name="direction" content={direction} />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
    </Head>
  )
}