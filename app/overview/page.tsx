'use client'

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Users,
  Bed,
  Bath,
  Car,
  Wifi,
  Utensils,
  Coffee,
  Tv,
  Wind,
  Flame,
  Dog,
  CreditCard,
  Clock,
  Waves,
  Trees,
  Home
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/lib/use-translation";

export default function OverviewPage() {
  const { t } = useTranslation('overview');
  const [activeTab, setActiveTab] = useState('description');

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const galleryImages = [
    { src: '/images/homepage-pic-1.jpg', alt: t('pictures.gallery.exterior') },
    { src: '/images/homepage-pic-2.jpg', alt: t('pictures.gallery.livingRoom') },
    { src: '/images/homepage-pic-3.jpg', alt: t('pictures.gallery.poolArea') },
    { src: '/images/gallery/pic4.jpg', alt: t('pictures.gallery.bedroom') },
    { src: '/images/gallery/pic5.jpg', alt: t('pictures.gallery.kitchen') },
    { src: '/images/gallery/pic6.jpg', alt: t('pictures.gallery.gardenView') }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Main Image */}
      <div className="relative h-[500px] w-full">
        <Image
          src="/images/homepage-pic-1.jpg"
          alt={t('hero.alt')}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* View More Pictures Button */}
        <div className="absolute bottom-8 right-8">
          <Link href="/gallery">
            <Button className="bg-coral hover:bg-coral/90 text-white px-6 py-3 rounded-md flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('hero.viewPictures')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => scrollToSection('description')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'description'
                  ? 'border-coral text-coral'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('navigation.description')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pictures')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'pictures'
                  ? 'border-coral text-coral'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('navigation.pictures')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('amenities')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'amenities'
                  ? 'border-coral text-coral'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('navigation.amenities')}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Title and Key Info */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6">{t('title')}</h1>
        
        {/* Property Stats */}
        <div className="flex flex-wrap gap-8 mb-8 text-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>{t('stats.guests')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5" />
            <span>{t('stats.bedrooms')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Bath className="w-5 h-5" />
            <span>{t('stats.bathrooms')}</span>
          </div>
        </div>

        {/* Description Section */}
        <div id="description" className="mb-12">
          <div className="bg-white rounded-lg p-8 mb-8">
            <p className="text-gray-700 mb-4">
              {t('description.paragraph1')}
            </p>
            <p className="text-gray-700 mb-4">
              {t('description.paragraph2')}
            </p>
            <p className="text-gray-700 mb-6">
              {t('description.paragraph3')}
            </p>
          </div>
        </div>

        {/* Pictures Section */}
        <div id="pictures" className="mb-12">
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">{t('pictures.title')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {galleryImages.map((image, index) => (
                <div key={index} className="relative h-64 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <Link href="/gallery">
              <Button variant="link" className="text-coral hover:text-coral/80 p-0">
                {t('pictures.exploreAll')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Amenities Section */}
        <div id="amenities">
          {/* Sleeping Arrangements */}
          <div className="bg-white rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">{t('sleeping.title')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-6 text-center">
                <Bed className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="font-medium">{t('sleeping.kingBeds')}</p>
              </div>
              <div className="border rounded-lg p-6 text-center">
                <Bed className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="font-medium">{t('sleeping.twinBed')}</p>
              </div>
              <div className="border rounded-lg p-6 text-center">
                <Bed className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="font-medium">{t('sleeping.mattresses')}</p>
              </div>
            </div>
          </div>

          {/* Amenities - Icon Grid with Checklist Style */}
          <div className="bg-white rounded-lg p-8 mb-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800">{t('amenities.title')}</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Common Space & Essentials */}
                <div className="bg-pink-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Home className="w-5 h-5 text-pink-600" />
                    <h4 className="font-bold text-gray-900">{t('amenities.commonSpace.title')}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Wifi className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.commonSpace.wifi.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.commonSpace.wifi.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.commonSpace.parking.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.commonSpace.parking.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Wind className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.commonSpace.climate.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.commonSpace.climate.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Tv className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.commonSpace.tv.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.commonSpace.tv.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bedroom */}
                <div className="bg-pink-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bed className="w-5 h-5 text-pink-600" />
                    <h4 className="font-bold text-gray-900">{t('amenities.bedroom.title')}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bed className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.bedroom.kingBeds.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.bedroom.kingBeds.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bed className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.bedroom.twinBed.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.bedroom.twinBed.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.bedroom.linens.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.bedroom.linens.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.bedroom.pillows.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.bedroom.pillows.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bathroom */}
                <div className="bg-pink-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bath className="w-5 h-5 text-pink-600" />
                    <h4 className="font-bold text-gray-900">{t('amenities.bathroom.title')}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.bathroom.shower.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.bathroom.shower.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.bathroom.towels.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.bathroom.towels.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.bathroom.washer.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.bathroom.washer.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Kitchen */}
                <div className="bg-pink-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Utensils className="w-5 h-5 text-pink-600" />
                    <h4 className="font-bold text-gray-900">{t('amenities.kitchen.title')}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Utensils className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.kitchen.fullKitchen.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.kitchen.fullKitchen.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.kitchen.refrigerator.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.kitchen.refrigerator.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.kitchen.microwave.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.kitchen.microwave.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Coffee className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.kitchen.coffeeMaker.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.kitchen.coffeeMaker.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.kitchen.dishwasher.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.kitchen.dishwasher.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.kitchen.cookware.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.kitchen.cookware.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outdoors */}
                <div className="bg-pink-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Trees className="w-5 h-5 text-pink-600" />
                    <h4 className="font-bold text-gray-900">{t('amenities.outdoors.title')}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Waves className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.outdoors.pool.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.outdoors.pool.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Trees className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.outdoors.garden.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.outdoors.garden.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Flame className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.outdoors.bbq.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.outdoors.bbq.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-pink-100 transition-colors">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Coffee className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('amenities.outdoors.dining.title')}</p>
                        <p className="text-xs text-gray-600">{t('amenities.outdoors.dining.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* House Rules */}
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">{t('houseRules.title')}</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{t('houseRules.creditCards')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{t('houseRules.checkIn')}</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}