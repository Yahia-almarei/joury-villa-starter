'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Calendar, Clock, CheckCircle, Users, FileText, ExternalLink, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/use-translation';

// Function to get current language
const getCurrentLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || 'en';
  }
  return 'en';
};

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
  const { t } = useTranslation('booking');
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [securityDepositOpen, setSecurityDepositOpen] = useState(false);
  const [securityDepositConfirmed, setSecurityDepositConfirmed] = useState(false);
  const [securityDepositSettings, setSecurityDepositSettings] = useState<any>(null);
  const [currentLanguage, setCurrentLanguage] = useState(() => getCurrentLanguage());
  const [error, setError] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);

  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signup');
    }
  }, [status, router]);

  // Fetch policies on load
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await fetch('/api/booking-policies');
        if (response.ok) {
          const data = await response.json();
          setPolicies(data.policies || []);
        }
      } catch (err) {
        console.error('Failed to fetch policies:', err);
      }
    };

    fetchPolicies();
  }, []);

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

  // Fetch security deposit settings and get current language
  useEffect(() => {
    const fetchSecurityDepositSettings = async () => {
      try {
        const response = await fetch('/api/security-deposit');
        const data = await response.json();
        if (data.success && data.settings) {
          setSecurityDepositSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching security deposit settings:', error);
      }
    };

    fetchSecurityDepositSettings();
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(getCurrentLanguage());
    };

    // Listen for storage changes (when language is changed in another tab/component)
    window.addEventListener('storage', handleLanguageChange);

    // Also check for language changes periodically since some components might not trigger storage events
    const interval = setInterval(handleLanguageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleLanguageChange);
      clearInterval(interval);
    };
  }, []);

  const handleBookingClick = async () => {
    if (!quote || !quote.success || !session) return;

    // Check if security deposit is enabled
    if (securityDepositSettings?.enabled) {
      setSecurityDepositOpen(true);
    } else {
      await processBooking();
    }
  };

  const handleSecurityDepositConfirm = async () => {
    if (!securityDepositConfirmed) {
      alert('Please confirm that you have transferred the security deposit.');
      return;
    }
    setSecurityDepositOpen(false);
    await processBooking();
  };

  const processBooking = async () => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Booking Details */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('reservationDetails.title')}</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">{t('reservationDetails.checkIn')}</div>
                  <div className="font-medium">{checkIn ? format(new Date(checkIn), 'MMMM d, yyyy') : '-'}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">{t('reservationDetails.checkOut')}</div>
                  <div className="font-medium">{checkOut ? format(new Date(checkOut), 'MMMM d, yyyy') : '-'}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">{t('reservationDetails.nights')}</div>
                  <div className="font-medium">{t('reservationDetails.nightCount', { count: quote?.nights || 0 })}</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">{t('bookingProcess.title')}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>{t('bookingProcess.immediateHold')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span>{t('bookingProcess.pendingApproval')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>{t('bookingProcess.emailConfirmation')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('pricingSummary.title')}</h2>
            
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
                    <span className="text-lg font-bold">{t('pricingSummary.total')}</span>
                    <span className="text-2xl font-bold text-coral">{currencySymbol}{quote.total}</span>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleBookingClick}
                  disabled={isBooking}
                  className="w-full bg-coral hover:bg-coral/90 text-white py-3 text-lg font-semibold"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Reservation...
                    </>
                  ) : (
                    t('submitButton')
                  )}
                </Button>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  {t('approvalNotice')}
                  <br />
                  {t('noPaymentRequired')}
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

        {/* Policies Section */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-coral" />
            {t('policies.title')}
          </h2>
          <p className="text-sm text-gray-600 mb-4">{t('policies.subtitle')}</p>

          <div className="space-y-4">
            {policies.length > 0 ? (
              policies.map((policy, index) => {
                const currentLanguage = getCurrentLanguage();
                const description = currentLanguage === 'ar' && policy.description_ar
                  ? policy.description_ar
                  : policy.description_en;

                // Assign colors based on index
                const borderColors = ['border-coral', 'border-blue-500', 'border-green-500', 'border-orange-500', 'border-purple-500', 'border-indigo-500'];
                const borderColor = borderColors[index % borderColors.length];

                return (
                  <div key={policy.id} className={`border-l-4 ${borderColor} pl-3`}>
                    <p className="text-xs text-gray-600" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
                      {description}
                    </p>
                  </div>
                );
              })
            ) : (
              // Fallback to hardcoded policies if none exist in database
              <>
                <div className="border-l-4 border-coral pl-3">
                  <h3 className="font-medium text-gray-900 text-sm">{t('policies.cancellation.title')}</h3>
                  <p className="text-xs text-gray-600 mt-1">{t('policies.cancellation.description')}</p>
                </div>

                <div className="border-l-4 border-blue-500 pl-3">
                  <h3 className="font-medium text-gray-900 text-sm">{t('policies.checkin.title')}</h3>
                  <p className="text-xs text-gray-600 mt-1">{t('policies.checkin.description')}</p>
                </div>

                <div className="border-l-4 border-green-500 pl-3">
                  <h3 className="font-medium text-gray-900 text-sm">{t('policies.payment.title')}</h3>
                  <p className="text-xs text-gray-600 mt-1">{t('policies.payment.description')}</p>
                </div>

                <div className="border-l-4 border-orange-500 pl-3">
                  <h3 className="font-medium text-gray-900 text-sm">{t('policies.houseRules.title')}</h3>
                  <p className="text-xs text-gray-600 mt-1">{t('policies.houseRules.description')}</p>
                </div>
              </>
            )}
          </div>

        </Card>
      </div>

      {/* Security Deposit Dialog */}
      <Dialog open={securityDepositOpen} onOpenChange={setSecurityDepositOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              {currentLanguage === 'ar'
                ? (securityDepositSettings?.title_ar || 'مطلوب دفع تأمين')
                : (securityDepositSettings?.title_en || 'Security Deposit Required')
              }
            </DialogTitle>
            <DialogDescription className="text-left whitespace-pre-line" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
              {currentLanguage === 'ar'
                ? (securityDepositSettings?.message_ar || 'مطلوب دفع تأمين لإتمام حجزك.')
                : (securityDepositSettings?.message_en || 'A security deposit is required to complete your booking.')
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Security Deposit Amount</h4>
              <p className="text-2xl font-bold text-blue-700">
                {securityDepositSettings?.currency || 'ILS'} {(securityDepositSettings?.amount || 500).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Bank Account Details</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
                {currentLanguage === 'ar'
                  ? (securityDepositSettings?.bankAccountInfo_ar || 'تفاصيل البنك غير متوفرة')
                  : (securityDepositSettings?.bankAccountInfo_en || 'Bank details not available')
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="security-deposit-confirm"
                checked={securityDepositConfirmed}
                onCheckedChange={setSecurityDepositConfirmed}
              />
              <label htmlFor="security-deposit-confirm" className="text-sm" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
                {currentLanguage === 'ar'
                  ? (securityDepositSettings?.confirmationText_ar || 'أؤكد أنني قمت بتحويل مبلغ التأمين')
                  : (securityDepositSettings?.confirmationText_en || 'I confirm that I have transferred the security deposit')
                }
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSecurityDepositOpen(false)}>
              {currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSecurityDepositConfirm} disabled={!securityDepositConfirmed}>
              {currentLanguage === 'ar' ? 'إرسال طلب الحجز' : 'Submit Booking Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}