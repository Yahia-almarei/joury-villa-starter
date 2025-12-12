'use client'

import React, { useState, useEffect } from 'react';
import { Star, User, Calendar, MessageSquare, Send, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from '@/lib/use-translation';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

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

export default function ReviewsPage() {
  const { t } = useTranslation('reviews');
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    comment: '',
    stayDate: ''
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch reviews
        const reviewsResponse = await fetch('/api/reviews');
        const reviewsData = await reviewsResponse.json();

        if (reviewsData.success) {
          setReviews(reviewsData.reviews);
        } else {
          console.error('Failed to fetch reviews:', reviewsData.error);
        }

        // Pre-populate form data for authenticated users
        if (session?.user) {
          setFormData(prev => ({
            ...prev,
            name: session.user.name || '',
            email: session.user.email || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      const reviewData = {
        ...formData,
        stayDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
      };

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          name: session?.user?.name || '',
          email: session?.user?.email || '',
          rating: 5,
          comment: '',
          stayDate: ''
        });
        setSelectedDate(undefined);
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
        </div>

        {/* Overall Rating Summary */}
        <Card className="p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-4 mb-2 flex-wrap">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </div>
                {renderStars(Math.round(averageRating))}
                <span className="text-sm sm:text-base text-gray-600">({reviews.length} {t('summary.reviewsCount')})</span>
              </div>
              <p className="text-sm sm:text-base text-gray-600">{t('summary.overallRating')}</p>
            </div>
            <Button
              onClick={() => setShowReviewForm(true)}
              className="bg-coral hover:bg-coral/90 text-white w-full sm:w-auto flex-shrink-0"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {t('buttons.writeReview')}
            </Button>
          </div>
        </Card>

        {/* Review Form */}
        {showReviewForm && (
          <Card className="p-4 sm:p-6 mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">{t('form.title')}</h2>
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick your stay date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.email || !formData.comment}
                  className="bg-coral hover:bg-coral/90 text-white w-full sm:w-auto"
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
                  className="w-full sm:w-auto"
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