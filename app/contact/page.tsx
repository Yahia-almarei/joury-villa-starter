'use client'

import Link from "next/link";
import { Phone, MapPin, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../lib/use-translation";

export default function ContactPage() {
  const { t } = useTranslation('contact');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    checkIn: '',
    checkOut: '',
    guests: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    alert('Thank you for your message! We will get back to you soon.');
  };

  return (
    <div className="min-h-screen bg-white">


      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('header.title')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('header.subtitle')}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mx-auto">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">{t('getInTouch.title')}</h2>
              
              <div className="space-y-6 mb-8">
                <div 
                  className="flex items-start space-x-4 p-3 rounded-lg"
                >
                  <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('getInTouch.phone.title')}</h3>
                  </div>
                </div>

                <div 
                  className="flex items-start space-x-4 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=123+Ocean+Drive+Miami+Beach+FL', '_blank')}
                >
                  <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('getInTouch.location.title')}</h3>
                    <p className="text-gray-600">123 Ocean Drive, Miami Beach, FL 33139, USA</p>
                    <p className="text-sm text-gray-500">Miami Beach</p>
                    <p className="text-xs text-coral mt-1">{t('getInTouch.location.clickToView')}</p>
                  </div>
                </div>

              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('quickActions.title')}</h3>
                <div className="space-y-3">
                  <Link href="/availability" className="block w-full bg-coral hover:bg-coral/90 text-white text-center py-3 rounded-xl transition-colors">
                    {t('quickActions.checkAvailability')}
                  </Link>
                  <Link href="/overview" className="block w-full bg-white border-2 border-gray-200 hover:border-coral text-gray-900 text-center py-3 rounded-xl transition-colors">
                    {t('quickActions.viewDetails')}
                  </Link>
                  <Link href="/gallery" className="block w-full bg-white border-2 border-gray-200 hover:border-coral text-gray-900 text-center py-3 rounded-xl transition-colors">
                    {t('quickActions.browseGallery')}
                  </Link>
                  <Link href="/reviews" className="block w-full bg-white border-2 border-gray-200 hover:border-coral text-gray-900 text-center py-3 rounded-xl transition-colors">
                    {t('quickActions.viewReviews')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}