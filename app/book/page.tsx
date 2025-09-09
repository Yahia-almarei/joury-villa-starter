'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Calendar, Clock, CheckCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuoteResult {
  success: boolean;
  checkIn: string;
  checkOut: string;
  nights: number;
  lineItems: Array<{
    label: string;
    amount: number;
    quantity?: number;
  }>;
  subtotal: number;
  fees: number;
  taxes: number;
  total: number;
  currency: string;
  holdToken?: string;
  holdExpiresAt?: string;
  error?: string;
  details?: string;
}

export default function BookPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signup');
    }
  }, [status, router]);

  // Fetch quote on load
  useEffect(() => {
    if (!checkIn || !checkOut || status === 'loading') return;

    const fetchQuote = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/quote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkIn,
            checkOut,
          }),
        });

        const data = await response.json();
        setQuote(data);

        if (!data.success) {
          setError(data.error || 'Failed to calculate pricing');
        }
      } catch (err) {
        setError('Failed to load booking details');
        console.error('Quote fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuote();
  }, [checkIn, checkOut, status]);

  const handleBooking = async () => {
    if (!quote || !quote.success || !session) return;

    try {
      setIsBooking(true);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkIn: quote.checkIn,
          checkOut: quote.checkOut,
          total: quote.total,
          holdToken: quote.holdToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setReservationId(result.reservationId);
        setBookingComplete(true);
      } else {
        setError(result.error || 'Failed to create reservation');
      }
    } catch (err) {
      setError('Failed to create booking');
      console.error('Booking error:', err);
    } finally {
      setIsBooking(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!checkIn || !checkOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Booking Request</h1>
          <p className="text-gray-600 mb-4">Missing check-in or check-out dates.</p>
          <Button onClick={() => router.push('/availability')}>
            Back to Availability
          </Button>
        </div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Submitted!</h1>
            <p className="text-lg text-gray-600 mb-6">
              Your reservation request has been submitted and is pending admin approval.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-blue-500 mr-2" />
                <span className="font-medium text-blue-800">Reservation ID: {reservationId}</span>
              </div>
              <p className="text-sm text-blue-700">
                You will receive an email notification once your booking is approved by our team.
              </p>
            </div>
            <div className="space-y-2 mb-6">
              <Button onClick={() => router.push('/account')} className="w-full">
                View My Bookings
              </Button>
              <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                Back to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currencySymbol = quote?.currency === 'ILS' ? '₪' : quote?.currency || '₪';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
          <p className="text-gray-600">Review your reservation details below</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Details */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reservation Details</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Check-in</div>
                  <div className="font-medium">{checkIn ? format(new Date(checkIn), 'MMMM d, yyyy') : '-'}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Check-out</div>
                  <div className="font-medium">{checkOut ? format(new Date(checkOut), 'MMMM d, yyyy') : '-'}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Nights</div>
                  <div className="font-medium">{quote?.nights} nights</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Process</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Immediate reservation hold</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span>Pending admin approval</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Email confirmation sent</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Summary</h2>
            
            {quote && quote.success ? (
              <>
                <div className="space-y-3 mb-6">
                  {quote.lineItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium">
                        {item.amount < 0 ? '-' : ''}{currencySymbol}{Math.abs(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-coral">{currencySymbol}{quote.total}</span>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <Button 
                  onClick={handleBooking}
                  disabled={isBooking}
                  className="w-full bg-coral hover:bg-coral/90 text-white py-3 text-lg font-semibold"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Reservation...
                    </>
                  ) : (
                    'Submit Booking Request'
                  )}
                </Button>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Your reservation will be held temporarily pending admin approval.
                  No payment is required at this time.
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">
                  {quote?.error || 'Unable to load pricing'}
                </div>
                <Button onClick={() => router.push('/availability')} variant="outline">
                  Back to Availability
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}