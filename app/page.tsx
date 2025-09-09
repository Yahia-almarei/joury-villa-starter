'use client'

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Wifi,
  Car,
  Utensils,
  Waves,
  Star,
  Users,
  Calendar,
  Search,
  Shield,
  Clock,
  Award,
  Heart,
  CheckCircle,
  Phone,
  Mail,
  Globe,
  Plus,
  Minus,
  Flame
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/lib/use-translation";

export default function HomePage() {
  const { t } = useTranslation('home');
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  
  // Get today's date in YYYY-MM-DD format (local timezone)
  const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  
  // Calculate minimum checkout date (day after checkin)
  const getMinCheckOutDate = () => {
    if (!checkInDate) return today
    const checkIn = new Date(checkInDate)
    checkIn.setDate(checkIn.getDate() + 1)
    return checkIn.toISOString().split('T')[0]
  }
  
  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckIn = e.target.value
    setCheckInDate(newCheckIn)
    
    // If checkout is before new checkin + 1 day, reset checkout
    if (checkOutDate && checkOutDate <= newCheckIn) {
      setCheckOutDate('')
    }
  }
  
  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckOutDate(e.target.value)
  }
  
  const property = {
    id: 'joury-villa-001',
    name: 'Joury Villa',
    address: 'Jericho, Palestinian Territories',
    pricePerNight: 500,
    currency: 'ILS',
    description: 'Luxury villa rental in historic Jericho, Palestinian Territories. Experience comfort and hospitality in one of the world\'s oldest cities.',
    amenities: ['Swimming Pool', 'Free WiFi', 'Parking', 'Kitchen', 'Air Conditioning', 'Heating'],
    images: ['/images/homepage-pic-1.jpg', '/images/homepage-pic-2.jpg', '/images/homepage-pic-3.jpg']
  }
  
  return (
    <>
      {/* Hero Section - Clear Image and Better Calendar */}
      <section className="relative h-[70vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/homepage-pic-1.jpg"
            alt="Joury Villa - Luxury vacation rental"
            fill
            className="object-cover object-center"
            priority
            quality={95}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/20"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-8">
            {t('hero.title')}
          </h1>
          
          {/* Booking Widget - Crystal Clear Calendar */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-5xl mx-auto border border-white/20">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600">
                ✨ <strong>{t('hero.noBookingFees')}</strong>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">{t('booking.checkIn')}</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={handleCheckInChange}
                  min={today}
                  onKeyDown={(e) => e.preventDefault()}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all text-center"
                  style={{
                    colorScheme: 'light',
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '1.2',
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">{t('booking.checkOut')}</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={handleCheckOutChange}
                  min={getMinCheckOutDate()}
                  onKeyDown={(e) => e.preventDefault()}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all text-center"
                  style={{
                    colorScheme: 'light',
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '1.2',
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">&nbsp;</label>
                <Link href="/availability">
                  <Button className="w-full bg-coral hover:bg-coral/90 text-white px-8 py-5 rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" />
                    {t('booking.checkAvailability')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Book - Simple Process */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('howToBook.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('howToBook.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('howToBook.checkDates.title')}</h3>
              <p className="text-gray-600">{t('howToBook.checkDates.description')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('howToBook.makeReservation.title')}</h3>
              <p className="text-gray-600">{t('howToBook.makeReservation.description')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('howToBook.confirmation.title')}</h3>
              <p className="text-gray-600">{t('howToBook.confirmation.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section 1 - Exact Lodgify Layout */}
      <section id="overview" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {t('sections.pool.title')}
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  {t('sections.pool.description')}
                </p>
              </div>
            </div>
            
            <div className="relative">
              <Image
                src="/images/homepage-pic-3.jpg"
                alt="Villa pool area"
                width={600}
                height={400}
                className="rounded-lg shadow-lg object-cover w-full h-[400px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content Section 2 - Exact Lodgify Layout */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <Image
                src="/images/homepage-pic-2.jpg"
                alt="Villa bedroom"
                width={600}
                height={400}
                className="rounded-lg shadow-lg object-cover w-full h-[400px]"
              />
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {t('sections.comfort.title')}
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  {t('sections.comfort.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Simple Lodgify Style */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('amenities.title')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('amenities.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Waves className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('amenities.privatePool.title')}</h3>
              <p className="text-gray-600 text-sm">{t('amenities.privatePool.description')}</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('amenities.freeWifi.title')}</h3>
              <p className="text-gray-600 text-sm">{t('amenities.freeWifi.description')}</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('amenities.freeParking.title')}</h3>
              <p className="text-gray-600 text-sm">{t('amenities.freeParking.description')}</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('amenities.fullKitchen.title')}</h3>
              <p className="text-gray-600 text-sm">{t('amenities.fullKitchen.description')}</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('amenities.bbqArea.title')}</h3>
              <p className="text-gray-600 text-sm">{t('amenities.bbqArea.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Lodgify Style */}
      <section className="py-20 bg-coral text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/availability">
              <Button size="lg" className="bg-white text-coral hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
                {t('cta.checkAvailability')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Simple Lodgify Style */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-6">{t('footer.title')}</h3>
              <p className="text-gray-300 mb-4">
                {t('footer.description')}
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">{t('footer.quickLinks')}</h4>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/" className="hover:text-coral">{t('footer.home')}</Link></li>
                <li><Link href="/availability" className="hover:text-coral">{t('footer.bookNow')}</Link></li>
                <li><Link href="/policies" className="hover:text-coral">{t('footer.policies')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">{t('footer.contact')}</h4>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5" />
                  <span>+970 123 456 789</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">{t('footer.location')}</h4>
              <div className="flex items-start space-x-3 text-gray-300">
                <MapPin className="w-5 h-5 mt-1" />
                <span>{t('footer.address')}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </>
  );
}