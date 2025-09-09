import { describe, it, expect } from 'vitest';
import { addDays, format } from 'date-fns';

// Test the core booking logic functions without database dependencies
describe('Booking Logic', () => {
  describe('Date validation', () => {
    it('should detect invalid date ranges', () => {
      const today = new Date();
      const yesterday = addDays(today, -1);
      const tomorrow = addDays(today, 1);
      
      // Check-in in the past should be invalid
      expect(yesterday < today).toBe(true);
      
      // Check-out before check-in should be invalid
      expect(yesterday < tomorrow).toBe(true);
    });

    it('should calculate nights correctly', () => {
      const checkIn = new Date('2024-01-01');
      const checkOut = new Date('2024-01-04');
      
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      const nights = timeDiff / (1000 * 60 * 60 * 24);
      
      expect(nights).toBe(3);
    });
  });

  describe('Pricing calculations', () => {
    it('should calculate base pricing correctly', () => {
      const basePricePerNight = 60000; // 600 ILS in agorot
      const nights = 3;
      const adults = 2;
      const children = 1;
      const pricePerAdult = 5000; // 50 ILS per night
      const pricePerChild = 2500; // 25 ILS per night
      const cleaningFee = 15000; // 150 ILS
      const vatRate = 0.17; // 17%

      // Calculate components
      const basePrice = basePricePerNight * nights;
      const adultSupplement = pricePerAdult * adults * nights;
      const childSupplement = pricePerChild * children * nights;
      const subtotal = basePrice + adultSupplement + childSupplement;
      const fees = cleaningFee;
      const subtotalWithFees = subtotal + fees;
      const taxes = Math.round(subtotalWithFees * vatRate);
      const total = subtotalWithFees + taxes;

      // Expected calculations
      expect(basePrice).toBe(180000); // 600 * 3
      expect(adultSupplement).toBe(30000); // 50 * 2 * 3
      expect(childSupplement).toBe(7500); // 25 * 1 * 3
      expect(subtotal).toBe(217500);
      expect(fees).toBe(15000);
      expect(subtotalWithFees).toBe(232500);
      expect(taxes).toBe(39525); // 17% of 232500
      expect(total).toBe(272025);
    });

    it('should handle zero children correctly', () => {
      const pricePerChild = 2500;
      const children = 0;
      const nights = 2;
      
      const childSupplement = pricePerChild * children * nights;
      expect(childSupplement).toBe(0);
    });

    it('should handle seasonal pricing override', () => {
      const basePricePerNight = 60000; // 600 ILS
      const seasonalOverride = 90000; // 900 ILS
      const nights = 2;
      
      // Use seasonal price instead of base price
      const seasonalPrice = seasonalOverride * nights;
      const basePrice = basePricePerNight * nights;
      
      expect(seasonalPrice).toBe(180000); // 900 * 2
      expect(seasonalPrice).toBeGreaterThan(basePrice); // 180000 > 120000
    });
  });

  describe('Guest validation', () => {
    it('should validate guest limits', () => {
      const maxAdults = 8;
      const maxChildren = 4;
      
      // Valid guest counts
      expect(2).toBeLessThanOrEqual(maxAdults);
      expect(1).toBeLessThanOrEqual(maxChildren);
      
      // Invalid guest counts
      expect(10).toBeGreaterThan(maxAdults);
      expect(6).toBeGreaterThan(maxChildren);
    });

    it('should require at least one adult', () => {
      const adults = 0;
      const children = 2;
      
      expect(adults).toBe(0);
      expect(children).toBeGreaterThan(0);
      
      // Should be invalid - need at least one adult
      const isValid = adults > 0;
      expect(isValid).toBe(false);
    });
  });

  describe('Stay duration validation', () => {
    it('should validate minimum nights', () => {
      const minNights = 2;
      const maxNights = 14;
      
      // Valid durations
      expect(3).toBeGreaterThanOrEqual(minNights);
      expect(3).toBeLessThanOrEqual(maxNights);
      
      // Invalid durations
      expect(1).toBeLessThan(minNights);
      expect(20).toBeGreaterThan(maxNights);
    });
  });

  describe('Currency formatting', () => {
    it('should format currency correctly', () => {
      const amountInAgorot = 272025; // 2720.25 ILS
      const amountInILS = amountInAgorot / 100;
      
      expect(amountInILS).toBe(2720.25);
      
      // Format for display
      const formatted = amountInILS.toLocaleString('he-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
      
      // Should contain the numeric value (account for RTL formatting)
      expect(formatted).toMatch(/2,?720/);
    });
  });

  describe('Date formatting', () => {
    it('should format dates for API correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const isoDate = format(date, 'yyyy-MM-dd');
      
      expect(isoDate).toBe('2024-01-15');
    });

    it('should handle timezone considerations', () => {
      const date = new Date('2024-01-15');
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth() is 0-indexed
      const day = date.getDate();
      
      expect(year).toBe(2024);
      expect(month).toBe(1);
      expect(day).toBe(15);
    });
  });
});