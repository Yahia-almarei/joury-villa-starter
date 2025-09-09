'use client';
import { MapPin, Clock, Camera, Landmark, TreePine, Mountain, Waves } from 'lucide-react';
import { useTranslation } from '@/lib/use-translation';

export default function MapPage() {
  const { t } = useTranslation('map');
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        {/* About Jericho & Interactive Map */}
        <div className="mb-16">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Side - About Jericho */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('aboutJericho.title')}</h3>
                <div className="space-y-4 text-gray-700">
                  <p className="text-lg leading-relaxed">
                    {t('aboutJericho.paragraph1')}
                  </p>
                  <p>
                    {t('aboutJericho.paragraph2')}
                  </p>
                  <div className="mt-3">
                    <a
                      href="https://maps.app.goo.gl/DzfaFf7iVMuotAbT6?g_st=ipc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      {t('aboutJericho.googleMapsLink')}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <MapPin className="w-4 h-4" />
                    <span>{t('aboutJericho.locationNote')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{t('quickFacts.title')}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('quickFacts.elevation.label')}</span>
                    <span className="font-medium">{t('quickFacts.elevation.value')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('quickFacts.climate.label')}</span>
                    <span className="font-medium">{t('quickFacts.climate.value')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('quickFacts.population.label')}</span>
                    <span className="font-medium">{t('quickFacts.population.value')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('quickFacts.founded.label')}</span>
                    <span className="font-medium">{t('quickFacts.founded.value')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('quickFacts.unesco.label')}</span>
                    <span className="font-medium">{t('quickFacts.unesco.value')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Interactive Map */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{t('map.title')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{t('map.subtitle')}</span>
                  </div>
                </div>
              </div>
              <div className="relative h-96 lg:h-[400px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3396.65!2d35.465917!3d31.824056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1502e4f2f2f2f2f2f%3A0x1234567890abcdef!2s31.824056%2C35.468417!5e0!3m2!1sen!2s!4v1690000000000!5m2!1sen!2s&markers=31.824056,35.468417"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-b-lg"
                ></iframe>

              </div>
            </div>
          </div>
        </div>

        {/* Nearby Attractions */}
        <div className="mb-16">
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">{t('attractions.title')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">{t('attractions.mountOfTemptation.name')}</span>
                <span className="font-medium text-right">{t('attractions.mountOfTemptation.distance')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">{t('attractions.botanicalGardens.name')}</span>
                <span className="font-medium text-right">{t('attractions.botanicalGardens.distance')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">{t('attractions.hishamsPalace.name')}</span>
                <span className="font-medium text-right">{t('attractions.hishamsPalace.distance')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">{t('attractions.deadSea.name')}</span>
                <span className="font-medium text-right">{t('attractions.deadSea.distance')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">{t('attractions.cableCar.name')}</span>
                <span className="font-medium text-right">{t('attractions.cableCar.distance')}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">{t('attractions.ancientTell.name')}</span>
                <span className="font-medium text-right">{t('attractions.ancientTell.distance')}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}