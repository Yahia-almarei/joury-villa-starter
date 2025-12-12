'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, differenceInDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Phone, Loader2, Tag, Check, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTranslation } from '@/lib/use-translation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AvailabilityData {
  [key: string]: {
    available: boolean;
    reason?: string;
    price?: number;
    minStay?: number;
    hasCustomPricing?: boolean;
  };
}

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
  error?: string;
  details?: string;
}

export default function AvailabilityPage() {
  const { t, language } = useTranslation('availability');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityData>({});
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [publicCoupons, setPublicCoupons] = useState<any[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  
  // Get the current language to determine which day names to use
  const dayNames = language === 'ar' ? dayNamesAr : dayNamesEn;
  
  // Pad the beginning of the month to align with the correct day of week
  const paddedDays = React.useMemo(() => {
    const startPadding = monthStart.getDay();
    const padding = Array(startPadding).fill(null);
    return padding.concat(days);
  }, [monthStart, days]);

  // Fetch availability data when month changes (with caching)
  const fetchAvailability = useCallback(async (year: number, month: number) => {
    const cacheKey = `${year}-${month}`;

    try {
      setIsLoadingAvailability(true);
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year, month }),
      });
      
      const data = await response.json();
      if (data.success) {
        setAvailability(data.availability);
      } else {
        setError('Failed to load availability data');
      }
    } catch (err) {
      setError('Failed to load availability data');
      console.error('Availability fetch error:', err);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, []);

  // Fetch public coupons
  const fetchPublicCoupons = useCallback(async (checkInDate?: Date, checkOutDate?: Date) => {
    try {
      setIsLoadingCoupons(true);

      // Build URL with query parameters if dates are provided
      let url = '/api/public-coupons';
      if (checkInDate && checkOutDate) {
        const params = new URLSearchParams({
          checkIn: format(checkInDate, 'yyyy-MM-dd'),
          checkOut: format(checkOutDate, 'yyyy-MM-dd')
        });
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setPublicCoupons(data.coupons || []);
      } else {
        console.error('Failed to fetch public coupons:', data.error);
      }
    } catch (err) {
      console.error('Public coupons fetch error:', err);
    } finally {
      setIsLoadingCoupons(false);
    }
  }, []);

  // Fetch quote when dates change
  const fetchQuote = useCallback(async (checkInDate: string, checkOutDate: string) => {
    if (!checkInDate || !checkOutDate) return;
    
    try {
      setIsLoadingQuote(true);
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkIn: checkInDate,
          checkOut: checkOutDate,
          coupon: appliedCoupon,
        }),
      });
      
      const data = await response.json();
      setQuote(data);
    } catch (err) {
      console.error('Quote fetch error:', err);
      setError('Failed to calculate pricing');
    } finally {
      setIsLoadingQuote(false);
    }
  }, [appliedCoupon]);

  // Load availability when component mounts or month changes
  useEffect(() => {
    fetchAvailability(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
  }, [currentMonth, fetchAvailability]);

  useEffect(() => {
    fetchPublicCoupons();
  }, [fetchPublicCoupons]);

  // Update coupons when booking dates change
  useEffect(() => {
    if (checkIn && checkOut) {
      fetchPublicCoupons(checkIn, checkOut);
    }
  }, [checkIn, checkOut, fetchPublicCoupons]);

  // Update quote when dates or coupon change
  useEffect(() => {
    if (checkIn && checkOut) {
      const checkInStr = format(checkIn, 'yyyy-MM-dd');
      const checkOutStr = format(checkOut, 'yyyy-MM-dd');
      fetchQuote(checkInStr, checkOutStr);
    } else {
      setQuote(null);
    }
  }, [checkIn, checkOut, appliedCoupon, fetchQuote]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateAvailability = availability[dateKey];
    
    // Don't allow selection of unavailable dates
    if (!dateAvailability || !dateAvailability.available) return;
    
    if (!checkIn || (checkIn && checkOut)) {
      // Start new selection
      setCheckIn(date);
      setCheckOut(null);
      setIsSelectingRange(true);
      setError(null);
    } else if (checkIn && !checkOut) {
      // Complete the range
      if (date < checkIn) {
        setCheckIn(date);
        setCheckOut(checkIn);
      } else {
        setCheckOut(date);
      }
      setIsSelectingRange(false);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!checkIn) return false;
    if (!checkOut) return isSameDay(date, checkIn);
    return date >= checkIn && date <= checkOut;
  };

  const getDateStatus = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateAvailability = availability[dateKey];
    
    if (!dateAvailability || !dateAvailability.available) return 'unavailable';
    if (isDateInRange(date)) return 'selected';
    return 'available';
  };

  const getDatePrice = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateAvailability = availability[dateKey];
    return dateAvailability?.price;
  };

  const hasCustomPricing = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateAvailability = availability[dateKey];
    return dateAvailability?.hasCustomPricing || false;
  };

  const getPricingType = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateAvailability = availability[dateKey];
    if (dateAvailability?.hasCustomPricing) return 'custom';
    // You could extend this to detect seasonal vs base pricing if needed
    return 'standard';
  };

  const applyCoupon = async (code?: string) => {
    const couponToApply = code || couponCode;
    if (!couponToApply.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponToApply.toUpperCase(),
          checkIn: checkIn ? format(checkIn, 'yyyy-MM-dd') : null,
          checkOut: checkOut ? format(checkOut, 'yyyy-MM-dd') : null,
          nights,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAppliedCoupon(couponToApply.toUpperCase());
        setCouponSuccess(`Coupon "${couponToApply.toUpperCase()}" applied! ${data.discount}`);
        setCouponError(null);
        setCouponCode(couponToApply.toUpperCase());
      } else {
        setCouponError(data.error || 'Invalid coupon code');
        setCouponSuccess(null);
      }
    } catch (err) {
      setCouponError('Failed to validate coupon');
      setCouponSuccess(null);
    }
  };

  const applyPublicCoupon = (coupon: any) => {
    applyCoupon(coupon.code);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    setCouponSuccess(null);
  };

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  
  // Use quote data when available, fallback to estimated values
  const currency = quote?.currency || '₪';
  const currencySymbol = currency === 'ILS' ? '₪' : currency;
  
  // Handle booking button click
  const handleBookNow = () => {
    if (status === 'loading') return;
    
    if (!session) {
      // Redirect to signup if not authenticated
      router.push('/auth/signup');
      return;
    }
    
    if (!checkIn || !checkOut || !quote || !quote.success) {
      return;
    }
    
    // Navigate to booking page with selected dates
    const searchParams = new URLSearchParams({
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd')
    });
    
    router.push(`/book?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Select Your Dates</h1>
              
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="h-10 flex items-center justify-center text-sm text-gray-600 font-medium">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {paddedDays.map((day, index) => {
                  if (!day) {
                    return <div key={index} className="h-12" />;
                  }

                  const status = getDateStatus(day);
                  const price = getDatePrice(day);
                  const isCustomPricing = hasCustomPricing(day);
                  const pricingType = getPricingType(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isTodayDate = isToday(day);
                  const isStart = checkIn && isSameDay(day, checkIn);
                  const isEnd = checkOut && isSameDay(day, checkOut);
                  const isLoading = isLoadingAvailability;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      disabled={status === 'unavailable' || !isCurrentMonth || isLoading}
                      className={cn(
                        "h-12 w-full text-xs font-normal transition-all duration-200 rounded-lg relative flex flex-col items-center justify-center",
                        !isCurrentMonth && "text-gray-300 cursor-not-allowed",
                        isCurrentMonth && status === 'available' && !isCustomPricing && "text-gray-700 hover:bg-gray-100 border border-transparent hover:border-pink-200",
                        isCurrentMonth && status === 'available' && isCustomPricing && "text-gray-700 hover:bg-orange-50 border border-orange-200 hover:border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50",
                        status === 'unavailable' && "text-gray-300 cursor-not-allowed bg-gray-50 line-through",
                        status === 'selected' && "bg-pink-500 text-white",
                        isStart && "bg-pink-500 text-white rounded-l-lg",
                        isEnd && "bg-pink-500 text-white rounded-r-lg",
                        isTodayDate && status === 'available' && "ring-2 ring-pink-200",
                        isLoading && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{format(day, 'd')}</span>
                        {isCustomPricing && status === 'available' && isCurrentMonth && (
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" title={t('calendar.customPricingTooltip')} />
                        )}
                      </div>
                      {price && status === 'available' && isCurrentMonth && (
                        <span className={cn(
                          "text-[10px] leading-none mt-0.5 font-medium",
                          isCustomPricing ? "text-orange-600" : "text-gray-500"
                        )}>
                          {currencySymbol}{price}
                        </span>
                      )}
                      {isLoading && isCurrentMonth && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pink-500 rounded" />
                  <span>{t('calendar.legend.selectedDates')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 rounded" />
                  <span>{t('calendar.legend.unavailable')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border rounded" />
                  <span>{t('calendar.legend.standardPricing')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded relative">
                    <div className="w-1 h-1 bg-orange-500 rounded-full absolute top-0.5 right-0.5" />
                  </div>
                  <span>{t('calendar.legend.customPricing')}</span>
                </div>
              </div>

              {/* Selected dates display */}
              {checkIn && checkOut && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600">{t('dateSelection.checkIn')}</div>
                      <div className="font-semibold">{format(checkIn, 'M/d/yyyy')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-pink-500 font-semibold">{nights} {t('calendar.nights')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">{t('dateSelection.checkOut')}</div>
                      <div className="font-semibold">{format(checkOut, 'M/d/yyyy')}</div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('bookingSummary.title')}</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('dateSelection.checkIn')}:</span>
                  <span className="font-medium">{checkIn ? format(checkIn, 'M/d/yyyy') : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('dateSelection.checkOut')}:</span>
                  <span className="font-medium">{checkOut ? format(checkOut, 'M/d/yyyy') : '-'}</span>
                </div>
              </div>

              {/* Coupon Section */}
              <div className="border-t pt-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-pink-500" />
                    <span className="text-sm font-medium">{t('coupon.title')}</span>
                  </div>
                  
                  {!appliedCoupon ? (
                    <div className="space-y-3">
                      {/* Available Public Coupons */}
                      {publicCoupons.length > 0 && checkIn && checkOut && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-xs font-medium text-blue-800 mb-2">{t('coupon.availableCoupons')}</div>
                          <div className="space-y-2">
                            {publicCoupons.filter(coupon => {
                              // Filter out coupons that don't meet min nights requirement
                              if (coupon.min_nights && nights < coupon.min_nights) {
                                return false;
                              }
                              return true;
                            }).map((coupon) => (
                              <div key={coupon.id} className="flex items-center justify-between bg-white rounded p-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {coupon.code}
                                    </span>
                                    <span className="text-xs text-green-600 font-medium">
                                      {coupon.percent_off ? `${coupon.percent_off}${t('coupon.percentOff')}` : `₪${coupon.amount_off} ${t('coupon.amountOff')}`}
                                    </span>
                                  </div>
                                  {coupon.min_nights && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {t('coupon.minNights')} {coupon.min_nights} {t('coupon.nights')}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  onClick={() => applyPublicCoupon(coupon)}
                                  size="sm"
                                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 h-6"
                                >
                                  {t('coupon.apply')}
                                </Button>
                              </div>
                            ))}
                          </div>
                          {publicCoupons.filter(coupon => !coupon.min_nights || nights >= coupon.min_nights).length === 0 && (
                            <div className="text-xs text-gray-500 bg-white rounded p-2">
                              {t('coupon.noCouponsAvailable')}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Manual Coupon Entry */}
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600">{t('coupon.enterCouponCode')}</div>
                        <div className="flex gap-2">
                          <Input
                            placeholder={t('coupon.placeholder')}
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase());
                              setCouponError(null);
                              setCouponSuccess(null);
                            }}
                            className="flex-1 text-sm"
                          />
                          <Button
                            onClick={() => applyCoupon()}
                            size="sm"
                            disabled={!couponCode.trim() || !checkIn || !checkOut}
                            className="bg-pink-500 hover:bg-pink-600"
                          >
                            {t('coupon.apply')}
                          </Button>
                        </div>
                        
                        {couponError && (
                          <div className="flex items-center gap-1 text-red-600 text-xs">
                            <X className="h-3 w-3" />
                            <span>{couponError}</span>
                          </div>
                        )}
                        
                        {couponSuccess && (
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <Check className="h-3 w-3" />
                            <span>{couponSuccess}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">{t('coupon.couponApplied')}</span>
                        </div>
                        <Button
                          onClick={removeCoupon}
                          size="sm"
                          variant="ghost"
                          className="text-green-700 hover:text-green-800 hover:bg-green-100"
                        >
                          {t('coupon.remove')}
                        </Button>
                      </div>
                      <div className="mt-1">
                        <span className="text-xs text-green-700 font-mono bg-green-100 px-2 py-1 rounded">
                          {appliedCoupon}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Loading state */}
              {isLoadingQuote && nights > 0 && (
                <div className="border-t pt-4 mb-6 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">{t('pricing.calculatingPricing')}</span>
                </div>
              )}
              
              {/* Quote data */}
              {quote && quote.success && nights > 0 && (
                <>
                  <div className="border-t pt-4 space-y-3 mb-6">
                    {quote.lineItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{currencySymbol}{Math.abs(item.amount)}{item.amount < 0 ? ` ${t('coupon.discount')}` : ''}</span>
                      </div>
                    ))}
                  </div>

                  {/* Custom pricing indicator in quote */}
                  {quote.breakdown?.customPriceAdjustments && quote.breakdown.customPriceAdjustments.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm font-medium text-orange-800">{t('pricing.customPricingApplied')}</span>
                      </div>
                      <div className="space-y-1">
                        {quote.breakdown.customPriceAdjustments.map((adj: any, index: number) => (
                          <div key={index} className="text-xs text-orange-700">
                            {format(new Date(adj.date), 'MMM d')}: {currencySymbol}{adj.customPricePerNight} 
                            {adj.originalPricePerNight !== adj.customPricePerNight && (
                              <span className="text-gray-500 line-through ml-1">{currencySymbol}{adj.originalPricePerNight}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">{t('pricing.total')}</span>
                      <span className="text-2xl font-bold text-pink-500">{currencySymbol}{quote.total}</span>
                    </div>
                  </div>
                </>
              )}
              
              {/* Error state */}
              {quote && !quote.success && (
                <div className="border-t pt-4 mb-6">
                  <div className="text-red-600 text-sm">
                    <p className="font-medium">{quote.error}</p>
                    {quote.details && <p className="text-xs mt-1">{quote.details}</p>}
                  </div>
                </div>
              )}
              
              {/* General error */}
              {error && (
                <div className="border-t pt-4 mb-6">
                  <div className="text-red-600 text-sm">{error}</div>
                </div>
              )}

              <Button 
                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 text-lg font-semibold mb-6"
                disabled={!checkIn || !checkOut || isLoadingQuote || (quote && !quote.success) || status === 'loading'}
                onClick={handleBookNow}
              >
                {isLoadingQuote ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('booking.calculating')}
                  </>
                ) : status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : !session ? (
                  'Sign Up to Book'
                ) : (
                  t('booking.bookNow')
                )}
              </Button>

              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>{t('benefits.paymentProtected')}</span>
                </div>
                {!session && status !== 'loading' && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span>Account required to book</span>
                  </div>
                )}
                {session && (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Signed in as {session.user?.email}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">{t('help.title')}</h3>
                <div className="space-y-3">
                  <div 
                    className="flex items-center gap-3 text-sm p-2 rounded-lg"
                  >
                    <MessageSquare className="h-4 w-4 text-pink-500" />
                    <span>{t('help.chatOnWhatsApp')}</span>
                  </div>
                  <Link href="/contact">
                    <Button variant="outline" className="w-full mt-3">
                      {t('help.contactHost')}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}