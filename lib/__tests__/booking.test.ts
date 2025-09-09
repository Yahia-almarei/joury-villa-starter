import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { addDays, format } from 'date-fns';
import { quote, checkAvailability, QuoteInput } from '../booking';

// Mock Supabase client for testing
const mockSupabase = {
  from: () => ({
    upsert: () => ({ data: null, error: null }),
    select: () => ({ single: () => ({ data: null, error: null }) }),
    delete: () => ({ data: null, error: null }),
    insert: () => ({ data: null, error: null }),
    eq: () => ({ data: [], error: null })
  })
};

// Mock the createServerClient function
const createServerClient = () => mockSupabase;

const supabase = createServerClient();

describe.skip('Booking System (requires database)', () => {
  beforeAll(async () => {
    // Ensure we have a test property
    await supabase
      .from('properties')
      .upsert({
        id: 'test-property',
        name: 'Test Villa',
        address: 'Test Location',
        timezone: 'Asia/Jerusalem',
        currency: 'ILS',
        base_price_night: 60000, // 600 ILS
        price_per_adult: 5000,   // 50 ILS per adult
        price_per_child: 2500,   // 25 ILS per child
        cleaning_fee: 15000,     // 150 ILS
        vat_percent: 17,
        min_nights: 2,
        max_nights: 14,
        max_adults: 8,
        max_children: 4,
      });
  });

  beforeEach(async () => {
    // Clean up test data
    await supabase
      .from('reservations')
      .delete()
      .eq('property_id', 'test-property');
    await supabase
      .from('blocked_periods')
      .delete()
      .eq('property_id', 'test-property');
  });

  afterAll(async () => {
    await supabase
      .from('properties')
      .delete()
      .eq('id', 'test-property');
  });

  describe('quote function', () => {
    it('should calculate basic quote correctly', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dayAfter = addDays(tomorrow, 3); // 3 nights
      
      const input: QuoteInput = {
        checkIn: format(tomorrow, 'yyyy-MM-dd'),
        checkOut: format(dayAfter, 'yyyy-MM-dd'),
        adults: 2,
        children: 1,
        propertyId: 'test-property'
      };

      const result = await quote(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.nights).toBe(3);
        expect(result.adults).toBe(2);
        expect(result.children).toBe(1);
        
        // Calculate expected amounts
        const basePrice = 60000 * 3; // 600 ILS * 3 nights
        const adultSupplement = 5000 * 2 * 3; // 50 ILS * 2 adults * 3 nights
        const childSupplement = 2500 * 1 * 3; // 25 ILS * 1 child * 3 nights
        const subtotal = basePrice + adultSupplement + childSupplement;
        const fees = 15000; // cleaning fee
        const subtotalWithFees = subtotal + fees;
        const taxes = Math.round(subtotalWithFees * 0.17); // 17% VAT
        const total = subtotalWithFees + taxes;
        
        expect(result.breakdown.basePrice).toBe(basePrice);
        expect(result.breakdown.adultSupplement).toBe(adultSupplement);
        expect(result.breakdown.childSupplement).toBe(childSupplement);
        expect(result.fees).toBe(fees);
        expect(result.taxes).toBe(taxes);
        expect(result.total).toBe(total);
        expect(result.currency).toBe('ILS');
        expect(result.holdToken).toBeDefined();
      }
    });

    it('should reject dates in the past', async () => {
      const yesterday = addDays(new Date(), -1);
      const today = new Date();
      
      const input: QuoteInput = {
        checkIn: format(yesterday, 'yyyy-MM-dd'),
        checkOut: format(today, 'yyyy-MM-dd'),
        adults: 2,
        propertyId: 'test-property'
      };

      const result = await quote(input);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('past');
      }
    });

    it('should reject if minimum nights not met', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dayAfter = addDays(tomorrow, 1); // Only 1 night
      
      const input: QuoteInput = {
        checkIn: format(tomorrow, 'yyyy-MM-dd'),
        checkOut: format(dayAfter, 'yyyy-MM-dd'),
        adults: 2,
        propertyId: 'test-property'
      };

      const result = await quote(input);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Minimum');
        expect(result.error).toContain('2 nights');
      }
    });

    it('should reject if too many adults', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dayAfter = addDays(tomorrow, 3);
      
      const input: QuoteInput = {
        checkIn: format(tomorrow, 'yyyy-MM-dd'),
        checkOut: format(dayAfter, 'yyyy-MM-dd'),
        adults: 10, // Exceeds max of 8
        propertyId: 'test-property'
      };

      const result = await quote(input);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Maximum');
        expect(result.error).toContain('adults');
      }
    });

    it('should handle seasonal pricing', async () => {
      // First create a season for test property
      const tomorrow = addDays(new Date(), 1);
      const seasonEnd = addDays(tomorrow, 10);
      
      await supabase
        .from('seasons')
        .insert({
          property_id: 'test-property',
          name: 'Test High Season',
          start_date: tomorrow.toISOString(),
          end_date: seasonEnd.toISOString(),
          price_per_night_override: 90000 // 900 ILS instead of 600
        });

      const checkOut = addDays(tomorrow, 2);
      
      const input: QuoteInput = {
        checkIn: format(tomorrow, 'yyyy-MM-dd'),
        checkOut: format(checkOut, 'yyyy-MM-dd'),
        adults: 1,
        children: 0,
        propertyId: 'test-property'
      };

      const result = await quote(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Should use seasonal rate of 900 ILS instead of base 600 ILS
        expect(result.breakdown.basePrice).toBe(90000 * 2); // 900 * 2 nights
        expect(result.breakdown.seasonalAdjustments).toHaveLength(1);
        expect(result.breakdown.seasonalAdjustments[0].seasonName).toBe('Test High Season');
      }
    });
  });

  describe('checkAvailability function', () => {
    it('should return available for open dates', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dayAfter = addDays(tomorrow, 3);
      
      const result = await checkAvailability('test-property', tomorrow, dayAfter);
      
      expect(result.available).toBe(true);
    });

    it('should return unavailable for blocked dates', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dayAfter = addDays(tomorrow, 3);
      
      // Create a blocked period
      await supabase
        .from('blocked_periods')
        .insert({
          property_id: 'test-property',
          start_date: tomorrow.toISOString(),
          end_date: addDays(tomorrow, 2).toISOString(),
          reason: 'Maintenance'
        });
      
      const result = await checkAvailability('test-property', tomorrow, dayAfter);
      
      expect(result.available).toBe(false);
      expect(result.reason).toContain('blocked');
      expect(result.reason).toContain('Maintenance');
    });

    it('should return unavailable for dates with existing reservations', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dayAfter = addDays(tomorrow, 3);
      
      // Create a conflicting reservation
      await supabase
        .from('reservations')
        .insert({
          property_id: 'test-property',
          user_id: 'test-user',
          check_in: tomorrow.toISOString(),
          check_out: addDays(tomorrow, 2).toISOString(),
          nights: 2,
          adults: 2,
          children: 0,
          subtotal: 100000,
          fees: 0,
          taxes: 0,
          total: 100000,
          status: 'PAID'
        });
      
      const result = await checkAvailability('test-property', tomorrow, dayAfter);
      
      expect(result.available).toBe(false);
      expect(result.reason).toContain('booked');
    });
  });
});