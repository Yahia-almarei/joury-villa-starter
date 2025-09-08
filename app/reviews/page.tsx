'use client'

import React, { useState, useEffect } from 'react';
import { Star, User, Calendar, MessageSquare, Send, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/use-translation';
import { format } from 'date-fns';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  stayDate?: string;
  bookingReference?: string;
  verified?: boolean;
}

interface BookingInfo {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
}

export default function ReviewsPage() {
  const { t } = useTranslation('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedBooking, setVerifiedBooking] = useState<BookingInfo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    comment: '',
    stayDate: '',
    bookingReference: ''
  });
  const [verificationData, setVerificationData] = useState({
    bookingReference: '',
    email: ''
  });
  const [submitMessage, setSubmitMessage] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/reviews');
        const data = await response.json();
        
        if (data.success) {
          setReviews(data.reviews);
        } else {
          console.error('Failed to fetch reviews:', data.error);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleVerificationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationData({
      ...verificationData,
      [e.target.name]: e.target.value
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const verifyBooking = async () => {
    setIsVerifying(true);
    setVerificationMessage('');

    try {
      const response = await fetch('/api/verify-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      const data = await response.json();

      if (data.success) {
        setVerifiedBooking(data.booking);
        setFormData(prev => ({
          ...prev,
          name: data.booking.guestName,
          email: verificationData.email,
          bookingReference: data.booking.id,
          stayDate: data.booking.checkOut
        }));
        setShowVerificationForm(false);
        setShowReviewForm(true);
        setVerificationMessage('');
      } else {
        setVerificationMessage(data.error);
      }
    } catch (error) {
      setVerificationMessage('Failed to verify booking. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData({
      ...formData,
      rating
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          name: '',
          email: '',
          rating: 5,
          comment: '',
          stayDate: ''
        });
        setShowReviewForm(false);
        setSubmitMessage(t('form.successMessage'));
        // Note: New reviews won't appear immediately as they need approval
      } else {
        setSubmitMessage(data.error || t('form.errorMessage'));
      }
    } catch (error) {
      setSubmitMessage(t('form.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('header.title')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('header.subtitle')}
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-4">
            <Shield className="w-4 h-4 text-green-600" />
            <span>{t('header.verifiedOnly')}</span>
          </div>
        </div>

        {/* Overall Rating Summary */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="text-3xl font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </div>
                {renderStars(Math.round(averageRating))}
                <span className="text-gray-600">({reviews.length} {t('summary.reviewsCount')})</span>
              </div>
              <p className="text-gray-600">{t('summary.overallRating')}</p>
            </div>
            <Button 
              onClick={() => setShowVerificationForm(true)}
              className="bg-coral hover:bg-coral/90 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {t('buttons.writeReview')}
            </Button>
          </div>
        </Card>

        {/* Booking Verification Modal */}
        {showVerificationForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="p-6 max-w-lg w-full">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('verification.title')}</h3>
                <p className="text-gray-600">{t('verification.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('verification.bookingReference')} *
                  </label>
                  <Input
                    name="bookingReference"
                    type="text"
                    required
                    value={verificationData.bookingReference}
                    onChange={handleVerificationInputChange}
                    placeholder="JOURY-2024-XXX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('verification.email')} *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    required
                    value={verificationData.email}
                    onChange={handleVerificationInputChange}
                    placeholder="your@email.com"
                  />
                </div>

                {verificationMessage && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                    {verificationMessage}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={verifyBooking}
                    disabled={isVerifying || !verificationData.bookingReference || !verificationData.email}
                    className="flex-1 bg-coral hover:bg-coral/90"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t('verification.verifying')}
                      </>
                    ) : (
                      t('verification.verify')
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowVerificationForm(false)}
                    variant="outline"
                  >
                    {t('buttons.cancel')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && verifiedBooking && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('form.title')}</h2>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.name')} *
                  </label>
                  <Input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t('form.namePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.email')} *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('form.emailPlaceholder')}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.stayDate')}
                </label>
                <Input
                  name="stayDate"
                  type="date"
                  value={formData.stayDate}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.rating')} *
                </label>
                {renderStars(formData.rating, true, handleRatingChange)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.comment')} *
                </label>
                <Textarea
                  name="comment"
                  required
                  rows={4}
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder={t('form.commentPlaceholder')}
                  className="resize-none"
                />
              </div>

              {submitMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  submitMessage.includes('success') || submitMessage.includes('نجح') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {submitMessage}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.email || !formData.comment}
                  className="bg-coral hover:bg-coral/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t('form.submitting')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t('form.submitReview')}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  {t('buttons.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">{t('reviews.title')}</h2>
          
          {isLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('reviews.noReviews')}</h3>
              <p className="text-gray-600 mb-4">{t('reviews.beFirst')}</p>
              <Button 
                onClick={() => setShowReviewForm(true)}
                className="bg-coral hover:bg-coral/90 text-white"
              >
                {t('buttons.writeFirstReview')}
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6">
              {reviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-coral/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-coral" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{review.name}</h3>
                          {renderStars(review.rating)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(review.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      {review.stayDate && (
                        <div className="text-sm text-gray-500 mb-3">
                          {t('reviews.stayedOn')} {format(new Date(review.stayDate), 'MMM yyyy')}
                        </div>
                      )}
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}