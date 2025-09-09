'use client'

import Link from "next/link";
import Image from "next/image";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/use-translation";

export default function GalleryPage() {
  const { t } = useTranslation('gallery');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  const galleryImages = [
    'pic1.jpg', 'pic3.jpg', 'pic4.jpg', 'pic5.jpg', 'pic6.jpg', 'pic7.jpg',
    'pic8.jpg', 'pic9.jpg', 'pic10.jpg', 'pic11.jpg', 'pic12.jpg', 'pic13.jpg',
    'pic14.jpg', 'pic15.jpg', 'pic16.jpg', 'pic18.jpg', 'pic19.jpg', 'pic20.jpg',
    'pic21.jpg', 'pic22.jpg', 'pic23.jpg', 'pic24.jpg', 'pic25.jpg', 'pic 26.jpg',
    'pic27.jpg', 'pic29.jpg', 'pic30.jpg', 'pic31.jpg', 'pic32.jpg', 'pic33.jpg', 'pic34.jpg'
  ];

  const openImage = (index: number) => {
    setCurrentImageIndex(index);
    setSelectedImage(`/images/gallery/${galleryImages[index]}`);
  };

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % galleryImages.length;
    openImage(nextIndex);
  };

  const prevImage = () => {
    const prevIndex = currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1;
    openImage(prevIndex);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!selectedImage) return;
      
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          nextImage();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          prevImage();
          break;
        case 'Escape':
          event.preventDefault();
          closeModal();
          break;
      }
    };

    if (selectedImage) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [selectedImage, currentImageIndex]);

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

        {/* Photo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {galleryImages.map((image, index) => (
            <div 
              key={index}
              className="relative h-64 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-transform hover:scale-105"
              onClick={() => openImage(index)}
            >
              <Image
                src={`/images/gallery/${image}`}
                alt={`${t('images.altText')} ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="text-white opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gray-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('cta.title')}</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <Link href="/availability">
            <button className="bg-coral hover:bg-coral/90 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all transform hover:scale-105">
              {t('cta.checkAvailability')}
            </button>
          </Link>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-white text-2xl z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ×
            </button>
            
            {/* Previous Arrow */}
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ‹
            </button>
            
            {/* Next Arrow */}
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ›
            </button>
            
            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {galleryImages.length}
            </div>
            
            <Image
              src={selectedImage}
              alt={t('modal.altText')}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}