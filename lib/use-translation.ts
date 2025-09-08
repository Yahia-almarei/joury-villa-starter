'use client'

import { useLanguage } from './language-context';
import { useMemo } from 'react';

// Import translation files
import enHome from '../translations/en/home.json';
import arHome from '../translations/ar/home.json';
import enHeader from '../translations/en/header.json';
import arHeader from '../translations/ar/header.json';
import enOverview from '../translations/en/overview.json';
import arOverview from '../translations/ar/overview.json';
import enMap from '../translations/en/map.json';
import arMap from '../translations/ar/map.json';
import enGallery from '../translations/en/gallery.json';
import arGallery from '../translations/ar/gallery.json';
import enAvailability from '../translations/en/availability.json';
import arAvailability from '../translations/ar/availability.json';
import enContact from '../translations/en/contact.json';
import arContact from '../translations/ar/contact.json';
import enAdmin from '../translations/en/admin.json';
import arAdmin from '../translations/ar/admin.json';
import enReviews from '../translations/en/reviews.json';
import arReviews from '../translations/ar/reviews.json';

const translations = {
  en: {
    home: enHome,
    header: enHeader,
    overview: enOverview,
    map: enMap,
    gallery: enGallery,
    availability: enAvailability,
    contact: enContact,
    admin: enAdmin,
    reviews: enReviews,
  },
  ar: {
    home: arHome,
    header: arHeader,
    overview: arOverview,
    map: arMap,
    gallery: arGallery,
    availability: arAvailability,
    contact: arContact,
    admin: arAdmin,
    reviews: arReviews,
  },
};

type TranslationKey = string;

export function useTranslation(namespace: keyof typeof translations.en) {
  const { language } = useLanguage();

  const t = useMemo(() => {
    return (key: TranslationKey): string => {
      const keys = key.split('.');
      let value: any = translations[language][namespace];
      
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          return key; // Return key if translation not found
        }
      }
      
      return typeof value === 'string' ? value : key;
    };
  }, [language, namespace]);

  return { t, language };
}