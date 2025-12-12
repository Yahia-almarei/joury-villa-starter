import { 
  addDays, 
  eachDayOfInterval, 
  isBefore, 
  isAfter, 
  startOfDay, 
  endOfDay,
  addMinutes,
  format,
  isWithinInterval
} from "date-fns";
import { createServerClient } from '@/lib/supabase';
import { db } from '@/lib/database';
import { randomBytes } from "crypto";

const supabase = createServerClient();

export type QuoteInput = {
  checkIn: string;
  checkOut: string;
  coupon?: string | null;
  propertyId?: string;
};

export type QuoteResult = {
  success: true;
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
  holdToken: string;
  holdExpiresAt: string;
  breakdown: {
    basePrice: number;
    weekdayNights: number;
    weekendNights: number;
    customPriceAdjustments?: Array<{
      date: string;
      customPricePerNight: number;
      originalWeekdayPrice: number;
      originalWeekendPrice: number;
    }>;
  };
} | {
  success: false;
  error: string;
  details?: string;
};

export async function quote(input: QuoteInput): Promise<QuoteResult> {
  try {
    const { checkIn, checkOut, coupon } = input;
    
    // Validate dates
    const checkInDate = startOfDay(new Date(checkIn));
    const checkOutDate = startOfDay(new Date(checkOut));
    const today = startOfDay(new Date());
    
    if (!checkIn || !checkOut) {
      return { success: false, error: "Check-in and check-out dates are required" };
    }
    
    // Allow same-day bookings (today) but not past dates
    if (isBefore(checkInDate, today)) {
      return { success: false, error: "Check-in date cannot be in the past" };
    }
    
    if (!isBefore(checkInDate, checkOutDate)) {
      return { success: false, error: "Check-out date must be after check-in date" };
    }

    // Get property (use first available property if no ID provided)
    let property;
    
    if (input.propertyId && input.propertyId !== "joury-villa") {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('id', input.propertyId)
        .single();
      property = data;
    }
    
    if (!property) {
      // Get the first available property
      const { data } = await supabase
        .from('properties')
        .select('*')
        .limit(1)
        .single();
      property = data;
    }


    if (!property) {
      return { success: false, error: "Property not found" };
    }

    // Fixed guest counts - no validation needed for adults/children
    // Fixed pricing per night regardless of guest count

    // Calculate nights
    const nights = eachDayOfInterval({ start: checkInDate, end: addDays(checkOutDate, -1) }).length;
    
    if (nights < property.min_nights) {
      return { 
        success: false, 
        error: `Minimum ${property.min_nights} nights required`,
        details: `You selected ${nights} nights`
      };
    }
    
    if (nights > property.max_nights) {
      return { 
        success: false, 
        error: `Maximum ${property.max_nights} nights allowed`,
        details: `You selected ${nights} nights`
      };
    }

    // Check availability (blocked periods and existing reservations)
    const availability = await checkAvailability(property.id, checkInDate, checkOutDate);
    if (!availability.available) {
      return { 
        success: false, 
        error: "Selected dates are not available",
        details: availability.reason
      };
    }

    // Get custom pricing for the date range
    let customPricingData = [];
    let customPricingMap = new Map();
    
    try {
      customPricingData = await db.getCustomPricingForDateRange(
        property.id,
        format(checkInDate, 'yyyy-MM-dd'),
        format(addDays(checkOutDate, -1), 'yyyy-MM-dd')
      );

      customPricingData.forEach(pricing => {
        customPricingMap.set(pricing.date, {
          pricePerNight: pricing.price_per_night,
          pricePerAdult: pricing.price_per_adult,
          pricePerChild: pricing.price_per_child
        });
      });
    } catch (error) {
      console.error('Error fetching custom pricing:', error);
      // Continue without custom pricing
    }

    // Calculate pricing for each night
    const dailyRates = [];
    const customPriceAdjustments = [];
    let totalNightlyAmount = 0;

    for (const day of eachDayOfInterval({ start: checkInDate, end: addDays(checkOutDate, -1) })) {
      const dateStr = format(day, 'yyyy-MM-dd');
      
      // Check for custom pricing first (highest priority)
      const customPricing = customPricingMap.get(dateStr);
      
      let baseRate;
      
      if (customPricing) {
        baseRate = customPricing.pricePerNight;
        
        customPriceAdjustments.push({
          date: dateStr,
          customPricePerNight: customPricing.pricePerNight,
          originalWeekdayPrice: property.weekday_price_night ?? 500,
          originalWeekendPrice: property.weekend_price_night ?? Math.round((property.weekday_price_night ?? 500) * 1.2)
        });
      } else {
        // Determine if this is a weekday or weekend (Thu, Fri, Sat = weekend)
        const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const isWeekend = dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6; // Thu, Fri, Sat

        // Use correct pricing fields
        const weekdayPrice = property.weekday_price_night ?? 500;
        const weekendPrice = property.weekend_price_night ?? Math.round((property.weekday_price_night ?? 500) * 1.2);

        baseRate = isWeekend ? weekendPrice : weekdayPrice;
      }
      
      const dailyTotal = baseRate; // No adult/child supplements
      
      dailyRates.push({
        date: day,
        baseRate,
        total: dailyTotal
      });
      
      totalNightlyAmount += dailyTotal;
    }

    // Apply coupon if provided
    let couponDiscount = 0;
    let validCoupon = null;
    
    if (coupon) {
      const { data: coupons } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon.toUpperCase())
        .eq('is_active', true)
        .or(`valid_from.is.null,valid_from.lte.${new Date().toISOString()}`)
        .or(`valid_to.is.null,valid_to.gte.${new Date().toISOString()}`)
        .or(`min_nights.is.null,min_nights.lte.${nights}`);

      validCoupon = coupons?.[0] || null;

      if (!validCoupon) {
        return { 
          success: false, 
          error: "Invalid or expired coupon code",
          details: `Coupon "${coupon}" is not valid for these dates`
        };
      }

      if (validCoupon.percent_off) {
        couponDiscount = Math.round(totalNightlyAmount * (validCoupon.percent_off / 100));
      } else if (validCoupon.amount_off) {
        couponDiscount = Math.min(validCoupon.amount_off, totalNightlyAmount);
      }
    }

    // Calculate totals
    const subtotalBeforeFees = totalNightlyAmount - couponDiscount;
    const fees = property.cleaning_fee ?? 0; // Use actual cleaning fee from admin settings
    const subtotal = subtotalBeforeFees + fees;
    const vatPercent = property.vat_percent ?? 0; // Use actual VAT from admin settings
    const taxes = Math.round((subtotal * vatPercent) / 100);
    const total = subtotal + taxes;

    // Create hold token
    const holdToken = randomBytes(32).toString('hex');
    const holdExpiresAt = addMinutes(new Date(), 30); // 30 minutes hold

    // Build line items
    const lineItems = [];
    
    // Count weekday and weekend nights
    const weekdayNights = dailyRates.filter(day => {
      const dayOfWeek = day.date.getDay();
      return !(dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6);
    }).length;
    const weekendNights = nights - weekdayNights;
    
    // Weekday nights
    if (weekdayNights > 0) {
      const weekdayTotal = dailyRates
        .filter(day => {
          const dayOfWeek = day.date.getDay();
          return !(dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6);
        })
        .reduce((sum, day) => sum + day.baseRate, 0);
      
      lineItems.push({
        label: `Weekday rate (${weekdayNights} nights)`,
        amount: weekdayTotal,
        quantity: weekdayNights
      });
    }
    
    // Weekend nights
    if (weekendNights > 0) {
      const weekendTotal = dailyRates
        .filter(day => {
          const dayOfWeek = day.date.getDay();
          return dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6;
        })
        .reduce((sum, day) => sum + day.baseRate, 0);
      
      lineItems.push({
        label: `Weekend rate (${weekendNights} nights)`,
        amount: weekendTotal,
        quantity: weekendNights
      });
    }

    // Coupon discount
    if (couponDiscount > 0) {
      lineItems.push({
        label: `Coupon discount (${validCoupon!.code})`,
        amount: -couponDiscount
      });
    }

    // Fees
    if (fees > 0) {
      lineItems.push({
        label: "Cleaning fee",
        amount: fees
      });
    }

    // Taxes
    if (taxes > 0) {
      lineItems.push({
        label: `VAT (${vatPercent}%)`,
        amount: taxes
      });
    }

    return {
      success: true,
      checkIn: format(checkInDate, 'yyyy-MM-dd'),
      checkOut: format(checkOutDate, 'yyyy-MM-dd'),
      nights,
      lineItems,
      subtotal: subtotalBeforeFees,
      fees,
      taxes,
      total,
      currency: property.currency,
      holdToken,
      holdExpiresAt: holdExpiresAt.toISOString(),
      breakdown: {
        basePrice: dailyRates.reduce((sum, day) => sum + day.baseRate, 0),
        weekdayNights: dailyRates.filter(day => {
          const dayOfWeek = day.date.getDay();
          return !(dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6);
        }).length,
        weekendNights: dailyRates.filter(day => {
          const dayOfWeek = day.date.getDay();
          return dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6;
        }).length,
        customPriceAdjustments
      }
    };

  } catch (error) {
    console.error('Quote calculation error:', error);
    return { 
      success: false, 
      error: "Unable to calculate quote",
      details: "Please try again or contact support"
    };
  }
}

export async function checkAvailability(
  propertyId: string,
  checkIn: Date,
  checkOut: Date
): Promise<{ available: boolean; reason?: string }> {
  try {
    // Check blocked periods - fix date range overlap logic to prevent false positives
    const { data: blockedPeriods } = await supabase
      .from('blocked_periods')
      .select('*')
      .eq('property_id', propertyId)
      .or(
        `and(start_date.lt.${checkOut.toISOString()},end_date.gt.${checkIn.toISOString()})`
      );

    if (blockedPeriods && blockedPeriods.length > 0) {
      return {
        available: false,
        reason: `Property is blocked: ${blockedPeriods[0].reason || 'Administrative block'}`
      };
    }

    // Check existing reservations (active statuses only)
    // Fix: Use date-only strings instead of full ISO timestamps to avoid timezone conflicts
    // A checkout on date X should not conflict with check-in on the same date X
    const checkOutDate = format(checkOut, 'yyyy-MM-dd');
    const checkInDate = format(checkIn, 'yyyy-MM-dd');

    const { data: conflictingReservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('property_id', propertyId)
      .in('status', ['PENDING', 'AWAITING_APPROVAL', 'APPROVED', 'PAID'])
      .or(`and(check_in.lt.${checkOutDate},check_out.gt.${checkInDate})`);

    // Check if any PENDING reservations have expired holds
    const now = new Date();
    const activeReservations = (conflictingReservations || []).filter((reservation: any) => {
      if (reservation.status === 'PENDING') {
        return reservation.hold_expires_at ? isAfter(new Date(reservation.hold_expires_at), now) : false;
      }
      return true; // All other statuses are considered active
    });

    if (activeReservations.length > 0) {
      return {
        available: false,
        reason: 'Selected dates are already booked'
      };
    }

    return { available: true };

  } catch (error) {
    console.error('Availability check error:', error);
    return {
      available: false,
      reason: 'Unable to check availability'
    };
  }
}

export async function createHold(
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
  total: number,
  holdToken: string,
  userId?: string
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  try {
    // Get the actual property ID if using default
    let actualPropertyId = propertyId;
    if (propertyId === "joury-villa" || !propertyId) {
      const { data: property } = await supabase
        .from('properties')
        .select('id')
        .limit(1)
        .single();
      if (property) {
        actualPropertyId = property.id;
      }
    }
    
    // Get or use anonymous user for guest bookings
    let actualUserId = userId;
    if (!actualUserId) {
      const { data: anonymousUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'anonymous@jouryvilla.internal')
        .single();
      
      if (anonymousUser) {
        actualUserId = anonymousUser.id;
      } else {
        return { success: false, error: 'Anonymous user not found. Please contact support.' };
      }
    }
    
    // Double-check availability
    const availability = await checkAvailability(actualPropertyId, checkIn, checkOut);
    if (!availability.available) {
      return { success: false, error: availability.reason };
    }

    const holdExpiresAt = addMinutes(new Date(), 30);
    const nights = eachDayOfInterval({ start: checkIn, end: addDays(checkOut, -1) }).length;

    // Create temporary reservation with PENDING status
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        property_id: actualPropertyId,
        user_id: actualUserId,
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
        nights: nights,
        total: total,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      console.error('Create hold error:', error);
      return {
        success: false,
        error: 'Unable to create reservation hold'
      };
    }

    return {
      success: true,
      reservationId: reservation.id
    };

  } catch (error) {
    console.error('Create hold error:', error);
    return {
      success: false,
      error: 'Unable to create reservation hold'
    };
  }
}
