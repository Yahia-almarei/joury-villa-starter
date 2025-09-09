// Translation functionality removed - using English only

interface PropertyStructuredDataProps {
  property?: {
    id: string
    name: string
    address: string
    pricePerNight: number
    currency: string
    description?: string
    images?: string[]
    amenities?: string[]
  }
}

interface ReservationStructuredDataProps {
  reservation: {
    id: string
    checkIn: string
    checkOut: string
    total: number
    currency: string
    property: {
      name: string
      address: string
    }
    user: {
      name: string
      email: string
    }
  }
}

export function PropertyStructuredData({ property }: PropertyStructuredDataProps) {
  // Using English locale only
  const locale = 'en'
  
  if (!property) return null

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": property.name,
    "description": property.description || "Luxury villa rental in Jericho, Palestinian Territories",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Jericho",
      "addressRegion": "Palestinian Territories",
      "addressCountry": "PS",
      "streetAddress": property.address
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 31.8607,
      "longitude": 35.4444
    },
    "url": typeof window !== 'undefined' ? window.location.origin : "https://jouryvilla.com",
    "telephone": "+972-50-000-0000",
    "priceRange": `${property.currency} ${property.pricePerNight}+`,
    "amenityFeature": property.amenities?.map(amenity => ({
      "@type": "LocationFeatureSpecification",
      "name": amenity
    })) || [
      { "@type": "LocationFeatureSpecification", "name": "Swimming Pool" },
      { "@type": "LocationFeatureSpecification", "name": "Free WiFi" },
      { "@type": "LocationFeatureSpecification", "name": "Parking" },
      { "@type": "LocationFeatureSpecification", "name": "Kitchen" },
      { "@type": "LocationFeatureSpecification", "name": "Air Conditioning" }
    ],
    "starRating": {
      "@type": "Rating",
      "ratingValue": "5"
    },
    "checkinTime": "15:00",
    "checkoutTime": "11:00",
    "petsAllowed": false,
    "smokingAllowed": false,
    "inLanguage": ["en"],
    "currenciesAccepted": "ILS",
    "paymentAccepted": ["Credit Card", "Bank Transfer"],
    "image": property.images || ["https://jouryvilla.com/images/villa-exterior.jpg"],
    "availableLanguage": ["English"]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function ReservationStructuredData({ reservation }: ReservationStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LodgingReservation",
    "reservationId": reservation.id,
    "reservationStatus": "https://schema.org/ReservationConfirmed",
    "checkinTime": reservation.checkIn,
    "checkoutTime": reservation.checkOut,
    "totalPrice": {
      "@type": "PriceSpecification",
      "price": reservation.total,
      "priceCurrency": reservation.currency
    },
    "reservationFor": {
      "@type": "LodgingBusiness",
      "name": reservation.property.name,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": reservation.property.address,
        "addressLocality": "Jericho",
        "addressRegion": "Palestinian Territories",
        "addressCountry": "PS"
      }
    },
    "underName": {
      "@type": "Person",
      "name": reservation.user.name,
      "email": reservation.user.email
    },
    "provider": {
      "@type": "Organization",
      "name": "Joury Villa",
      "url": typeof window !== 'undefined' ? window.location.origin : "https://jouryvilla.com"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function OrganizationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Joury Villa",
    "description": "Luxury villa rental in historic Jericho, Palestinian Territories",
    "url": typeof window !== 'undefined' ? window.location.origin : "https://jouryvilla.com",
    "logo": "https://jouryvilla.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+972-50-000-0000",
      "contactType": "customer service",
      "availableLanguage": ["English"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Jericho",
      "addressRegion": "Palestinian Territories",
      "addressCountry": "PS"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 31.8607,
      "longitude": 35.4444
    },
    "sameAs": [
      "https://www.facebook.com/jouryvilla",
      "https://www.instagram.com/jouryvilla",
      "https://maps.app.goo.gl/DzfaFf7iVMuotAbT6"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function WebsiteStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Joury Villa",
    "description": "Luxury villa rental in historic Jericho, Palestinian Territories",
    "url": typeof window !== 'undefined' ? window.location.origin : "https://jouryvilla.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://jouryvilla.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Joury Villa",
      "logo": {
        "@type": "ImageObject",
        "url": "https://jouryvilla.com/logo.png"
      }
    },
    "inLanguage": ["en", "ar", "he"]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}