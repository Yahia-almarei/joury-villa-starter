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
                <h3 className="text-2xl font-bold text-gray-900 mb-4">About Miami Beach</h3>
                <div className="space-y-4 text-gray-700">
                  <p className="text-lg leading-relaxed">
                    Miami Beach is a south Florida island city, connected by bridges to mainland Miami. Wide beaches stretch from North Shore Open Space Park, past palm-lined Lummus Park to South Pointe Park.
                  </p>
                  <p>
                    The southern end, South Beach, is famous for its international cachet with models and celebrities, and its early-20th-century architecture in the Art Deco Historic district with pastel-colored buildings, especially on Ocean Drive.
                  </p>
                  <div className="mt-3">
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=123+Ocean+Drive+Miami+Beach+FL"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      View on Google Maps
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <MapPin className="w-4 h-4" />
                    <span>123 Ocean Drive, Miami Beach, FL 33139</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Quick Facts</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Elevation</span>
                    <span className="font-medium">1.2 m (4 ft)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Climate</span>
                    <span className="font-medium">Tropical Monsoon</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Population</span>
                    <span className="font-medium">~80,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Founded</span>
                    <span className="font-medium">1915</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Known For</span>
                    <span className="font-medium">Art Deco & Nightlife</span>
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
                    <span className="font-medium">Location Map</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>5 mins to Downtown</span>
                  </div>
                </div>
              </div>
              <div className="relative h-96 lg:h-[400px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3592.967963772266!2d-80.134567!3d25.769012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d9b48d6d6d6d6d%3A0x1234567890abcdef!2s123%20Ocean%20Dr%2C%20Miami%20Beach%2C%20FL%2033139!5e0!3m2!1sen!2sus!4v1690000000000!5m2!1sen!2sus"
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
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Nearby Attractions</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">South Beach</span>
                <span className="font-medium text-right">0.1 miles</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Art Deco Historic District</span>
                <span className="font-medium text-right">0.2 miles</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Lincoln Road Mall</span>
                <span className="font-medium text-right">1.5 miles</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Ocean Drive</span>
                <span className="font-medium text-right">0.0 miles</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Lummus Park</span>
                <span className="font-medium text-right">0.3 miles</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Miami Beach Botanical Garden</span>
                <span className="font-medium text-right">2.0 miles</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}