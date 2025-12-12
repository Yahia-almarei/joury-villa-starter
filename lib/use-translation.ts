'use client'

import { useLanguage } from './language-context';
import { useMemo } from 'react';

// Import only the most commonly used translation files
// This reduces initial bundle size significantly
import enHome from '../translations/en/home.json';
import arHome from '../translations/ar/home.json';
import enHeader from '../translations/en/header.json';
import arHeader from '../translations/ar/header.json';
import enOverview from '../translations/en/overview.json';
import arOverview from '../translations/ar/overview.json';
import enAvailability from '../translations/en/availability.json';
import arAvailability from '../translations/ar/availability.json';

// Load less commonly used translations on demand
import enMap from '../translations/en/map.json';
import arMap from '../translations/ar/map.json';
import enGallery from '../translations/en/gallery.json';
import arGallery from '../translations/ar/gallery.json';
import enContact from '../translations/en/contact.json';
import arContact from '../translations/ar/contact.json';
import enAdmin from '../translations/en/admin.json';
import arAdmin from '../translations/ar/admin.json';
import enReviews from '../translations/en/reviews.json';
import arReviews from '../translations/ar/reviews.json';
import enPolicies from '../translations/en/policies.json';
import arPolicies from '../translations/ar/policies.json';
import enBooking from '../translations/en/booking.json';
import arBooking from '../translations/ar/booking.json';
import enAuth from '../translations/en/auth.json';
import arAuth from '../translations/ar/auth.json';

const translations = {
  en: {
    home: enHome,
    header: enHeader,
    overview: enOverview,
    availability: enAvailability,
    map: enMap,
    gallery: enGallery,
    contact: enContact,
    admin: enAdmin,
    reviews: enReviews,
    policies: enPolicies,
    booking: enBooking,
    auth: enAuth,
  },
  ar: {
    home: arHome,
    header: arHeader,
    overview: arOverview,
    availability: arAvailability,
    map: arMap,
    gallery: arGallery,
    contact: arContact,
    admin: arAdmin,
    reviews: arReviews,
    policies: arPolicies,
    booking: arBooking,
    auth: arAuth,
  },
};

type TranslationKey = string;

export function useTranslation(namespace: keyof typeof translations.en) {
  const { language } = useLanguage();

  const t = useMemo(() => {
    return (key: TranslationKey, variables?: Record<string, any>): string => {
      const keys = key.split('.');
      let value: any = translations[language][namespace];

      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          return key; // Return key if translation not found
        }
      }

      if (typeof value === 'string') {
        // Simple interpolation support
        if (variables) {
          return value.replace(/{{(\w+)}}/g, (match, varName) => {
            return variables[varName] !== undefined ? String(variables[varName]) : match;
          });
        }
        return value;
      }

      return key;
    };
  }, [language, namespace]);

  return { t, language };
}