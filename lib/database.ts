import { createServerClient } from './supabase'
import { Database } from '@/types/supabase'

// Declare global type for custom pricing cache
declare global {
  var customPricingCache: Map<string, Record<string, any>> | undefined
}

// Database adapter for Supabase operations
// This provides a Prisma-like interface for easier migration

export class DatabaseAdapter {
  public supabase = createServerClient()

  // User operations
  async findUserByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        customer_profiles (*)
      `)
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async findUserById(id: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        customer_profiles (*)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createUser(userData: Database['public']['Tables']['users']['Insert']) {
    const { data, error } = await this.supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateUser(id: string, userData: Database['public']['Tables']['users']['Update']) {
    const { data, error } = await this.supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Customer profile operations
  async createCustomerProfile(profileData: Database['public']['Tables']['customer_profiles']['Insert']) {
    const { data, error } = await this.supabase
      .from('customer_profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateCustomerProfile(userId: string, profileData: Database['public']['Tables']['customer_profiles']['Update']) {
    const { data, error } = await this.supabase
      .from('customer_profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Property operations
  async findPropertyById(id: string) {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async getAllProperties() {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')

    if (error) throw error
    return data || []
  }

  async getProperty() {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }


  async createProperty(propertyData: Database['public']['Tables']['properties']['Insert']) {
    const { data, error } = await this.supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateProperty(id: string, propertyData: Database['public']['Tables']['properties']['Update']) {
    const { data, error } = await this.supabase
      .from('properties')
      .update(propertyData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Reservation operations
  async findReservationsByUser(userId: string, status?: string[]) {
    let query = this.supabase
      .from('reservations')
      .select(`
        *,
        properties (*),
        users!inner (
          *,
          customer_profiles (*)
        )
      `)
      .eq('user_id', userId)

    if (status && status.length > 0) {
      query = query.in('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async findReservationById(id: string) {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        properties (*),
        users!inner (
          *,
          customer_profiles (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async findReservationsByStatus(status: string, limit?: number) {
    let query = this.supabase
      .from('reservations')
      .select(`
        *,
        properties (*),
        users!inner (
          *,
          customer_profiles (*)
        )
      `)
      
    // Only filter by status if not 'ALL'
    if (status && status !== 'ALL') {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async getReservationsByDateRange(startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        users!inner (
          id,
          email,
          customer_profiles (
            full_name,
            phone
          )
        )
      `)
      .or(`check_in.lte.${endDate},check_out.gte.${startDate}`)
      .order('check_in', { ascending: true })

    if (error) throw error
    return data || []
  }

  async createReservation(reservationData: Database['public']['Tables']['reservations']['Insert']) {
    const { data, error } = await this.supabase
      .from('reservations')
      .insert(reservationData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateReservation(id: string, reservationData: Database['public']['Tables']['reservations']['Update']) {
    const { data, error } = await this.supabase
      .from('reservations')
      .update(reservationData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Availability operations
  async findConflictingReservations(propertyId: string, checkIn: string, checkOut: string, excludeId?: string) {
    let query = this.supabase
      .from('reservations')
      .select('*')
      .eq('property_id', propertyId)
      .in('status', ['PAID', 'APPROVED', 'AWAITING_APPROVAL'])
      .or(`check_in.lt.${checkOut},check_out.gt.${checkIn}`)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async findBlockedPeriods(propertyId: string, startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('blocked_periods')
      .select('*')
      .eq('property_id', propertyId)
      .or(`start_date.lt.${endDate},end_date.gt.${startDate}`)

    if (error) throw error
    return data || []
  }


  async checkAvailability(checkIn: string, checkOut: string, excludeReservationId?: string) {
    console.log('🔍 checkAvailability called with:', { checkIn, checkOut, excludeReservationId })

    // Check for overlapping reservations
    // Correct overlap logic: (start1 < end2 AND end1 > start2)
    let query = this.supabase
      .from('reservations')
      .select('*')
      .not('status', 'eq', 'CANCELLED')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn)

    // Exclude specific reservation if provided (for rescheduling)
    if (excludeReservationId) {
      query = query.not('id', 'eq', excludeReservationId)
    }

    const { data: overlappingReservations, error: reservationError } = await query

    if (reservationError) throw reservationError

    console.log('🔍 Found overlapping reservations:', overlappingReservations)

    // If there are overlapping reservations, dates are not available
    if (overlappingReservations && overlappingReservations.length > 0) {
      return false
    }

    // Check for blocked periods
    const { data: blockedPeriods, error: blockedError } = await this.supabase
      .from('blocked_periods')
      .select('*')
      .lt('start_date', checkOut)
      .gt('end_date', checkIn)

    if (blockedError) throw blockedError

    console.log('🔍 Found overlapping blocked periods:', blockedPeriods)

    // If there are overlapping blocked periods, dates are not available
    if (blockedPeriods && blockedPeriods.length > 0) {
      return false
    }

    console.log('✅ Dates are available')
    return true
  }

  async getConflictingReservations(checkIn: string, checkOut: string, excludeReservationId?: string) {
    console.log('getConflictingReservations called with:', { checkIn, checkOut, excludeReservationId })
    
    let query = this.supabase
      .from('reservations')
      .select(`
        id,
        check_in,
        check_out,
        status,
        users!inner (
          email,
          customer_profiles (full_name)
        )
      `)
      .not('status', 'eq', 'CANCELLED')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn)

    console.log('Query filters: not CANCELLED, proper date overlap check')

    // Exclude specific reservation if provided (for rescheduling)
    if (excludeReservationId) {
      query = query.not('id', 'eq', excludeReservationId)
    }

    const { data, error } = await query
    console.log('Query result:', { data, error })

    if (error) throw error
    return data || []
  }

  async deleteReservation(reservationId: string) {
    const { data, error } = await this.supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId)
      .select()

    if (error) throw error
    return data && data.length > 0 ? data[0] : null
  }

  // Coupon operations
  async findCouponByCode(code: string) {
    const { data, error } = await this.supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Verification token operations
  async findVerificationToken(token: string) {
    const { data, error } = await this.supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createVerificationToken(tokenData: Database['public']['Tables']['verification_tokens']['Insert']) {
    const { data, error } = await this.supabase
      .from('verification_tokens')
      .insert(tokenData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async markVerificationTokenUsed(token: string) {
    const { data, error } = await this.supabase
      .from('verification_tokens')
      .update({ used: true })
      .eq('token', token)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Payment operations
  async createPayment(paymentData: Database['public']['Tables']['payments']['Insert']) {
    const { data, error } = await this.supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updatePayment(id: string, paymentData: Database['public']['Tables']['payments']['Update']) {
    const { data, error } = await this.supabase
      .from('payments')
      .update(paymentData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Audit log operations
  async createAuditLog(logData: Database['public']['Tables']['audit_logs']['Insert']) {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .insert(logData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getRecentAuditLogs(limit: number = 10) {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select(`
        *,
        users!audit_logs_actor_user_id_fkey (
          *,
          customer_profiles (*)
        )
      `)
            .limit(limit)

    if (error) throw error
    return data || []
  }

  // Admin dashboard aggregations
  async getMonthlyRevenue(monthStart: string, monthEnd: string) {
    // Get ALL reservations for this month (not just PAID/APPROVED) to show real data
    const { data, error } = await this.supabase
      .from('reservations')
      .select('total')
      .not('status', 'eq', 'CANCELLED')  // Exclude cancelled reservations
      .gte('check_in', monthStart)
      .lte('check_in', monthEnd)

    if (error) throw error
    
    const sum = data?.reduce((acc, curr) => acc + curr.total, 0) || 0
    return {
      _sum: { total: sum },
      _count: data?.length || 0
    }
  }

  async getUserCount(role?: string) {
    let query = this.supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (role) {
      query = query.eq('role', role)
    }

    const { count, error } = await query

    if (error) throw error
    return count || 0
  }

  async getUpcomingArrivals(startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        properties (*),
        users!inner (
          *,
          customer_profiles (*)
        )
      `)
      .in('status', ['PAID', 'APPROVED'])
      .gte('check_in', startDate)
      .lte('check_in', endDate)
      .order('check_in', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Blocked periods management
  async createBlockedPeriod(propertyId: string, startDate: string, endDate: string, reason?: string) {
    const { data, error } = await this.supabase
      .from('blocked_periods')
      .insert({
        property_id: propertyId,
        start_date: startDate,
        end_date: endDate
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getAllBlockedPeriods(propertyId?: string) {
    let query = this.supabase
      .from('blocked_periods')
      .select('*')
      .order('start_date', { ascending: true })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async getBlockedPeriodsByDateRange(startDate: string, endDate: string, propertyId?: string) {
    let query = this.supabase
      .from('blocked_periods')
      .select('*')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
      .order('start_date', { ascending: true })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async deleteBlockedPeriod(id: string) {
    const { error } = await this.supabase
      .from('blocked_periods')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  // Custom pricing operations
  async createCustomPricing(pricingData: {
    property_id: string
    date: string
    price_per_night: number
    notes?: string
  }) {
    try {
      // First try to use the custom_pricing table
      const { data, error } = await this.supabase
        .from('custom_pricing')
        .upsert({
          property_id: pricingData.property_id,
          date: pricingData.date,
          price_per_night: pricingData.price_per_night,
          notes: pricingData.notes || null
        }, { onConflict: 'property_id,date' })
        .select()
        .single()

      if (error && !error.message.includes('relation "custom_pricing" does not exist') && !error.message.includes('Could not find the table \'public.custom_pricing\'')) {
        console.error('Supabase custom_pricing error:', error);
        throw error
      }
      
      if (error) {
        console.log('Custom pricing table not accessible, falling back to JSON approach');
      }

      if (!error && data) {
        return data
      }

      // Fallback to the JSON-based approach if table doesn't exist
      const customPricing = await this.getCustomPricingForProperty(pricingData.property_id)
      
      customPricing[pricingData.date] = {
        price_per_night: pricingData.price_per_night,
        notes: pricingData.notes || null,
      }
      
      await this.saveCustomPricingForProperty(pricingData.property_id, customPricing)
      
      return {
        id: `${pricingData.property_id}-${pricingData.date}`,
        ...pricingData,
      }
    } catch (error) {
      throw error
    }
  }

  private async getCustomPricingForProperty(propertyId: string): Promise<Record<string, any>> {
    // Use memory cache directly for now to avoid Supabase timeout issues
    if (global.customPricingCache) {
      return global.customPricingCache.get(propertyId) || {}
    }
    return {}
  }

  private async saveCustomPricingForProperty(propertyId: string, customPricing: Record<string, any>) {
    // First, check if the custom_pricing_json column exists
    try {
      const { error } = await this.supabase
        .from('properties')
        .update({ custom_pricing_json: customPricing })
        .eq('id', propertyId)

      if (error && error.message.includes('column "custom_pricing_json" does not exist')) {
        // Column doesn't exist, we need to add it or use an alternative approach
        console.warn('custom_pricing_json column does not exist, using memory storage')
        // For now, we'll store it in memory (this is a temporary solution)
        if (!global.customPricingCache) {
          global.customPricingCache = new Map()
        }
        global.customPricingCache.set(propertyId, customPricing)
        return
      }
      
      if (error) throw error
    } catch (error) {
      // Fallback to memory storage
      if (!global.customPricingCache) {
        global.customPricingCache = new Map()
      }
      global.customPricingCache.set(propertyId, customPricing)
    }
  }

  async getCustomPricingForDateRange(propertyId: string, startDate: string, endDate: string) {
    try {
      // First try to use the custom_pricing table
      const { data, error } = await this.supabase
        .from('custom_pricing')
        .select('*')
        .eq('property_id', propertyId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (!error && data) {
        return data
      }

      // Fallback to JSON-based approach
      const customPricing = await this.getCustomPricingForProperty(propertyId)
      
      const result = []
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      for (const [dateStr, pricing] of Object.entries(customPricing)) {
        const date = new Date(dateStr)
        if (date >= start && date <= end) {
          result.push({
            id: `${propertyId}-${dateStr}`,
            property_id: propertyId,
            date: dateStr,
            price_per_night: pricing.price_per_night,
            notes: pricing.notes,
          })
        }
      }
      
      result.sort((a, b) => a.date.localeCompare(b.date))
      return result
    } catch (error) {
      console.error('Error getting custom pricing for date range:', error)
      return []
    }
  }

  async updateCustomPricing(id: string, pricingData: {
    price_per_night?: number
    notes?: string
  }) {
    try {
      // Parse property_id and date from id
      const [propertyId, date] = id.split('-', 2)
      
      const customPricing = await this.getCustomPricingForProperty(propertyId)
      
      if (customPricing[date]) {
        // Update existing pricing
        Object.assign(customPricing[date], pricingData)
        await this.saveCustomPricingForProperty(propertyId, customPricing)
        
        return {
          id,
          property_id: propertyId,
          date,
          ...customPricing[date]
        }
      }
      
      throw new Error('Custom pricing not found')
    } catch (error) {
      throw error
    }
  }

  async deleteCustomPricing(id: string) {
    try {
      // First try to delete by UUID (new approach)
      const { error } = await this.supabase
        .from('custom_pricing')
        .delete()
        .eq('id', id)

      if (!error) {
        return true
      }

      // If that fails, try the legacy approach (propertyId-date format)
      const dateMatch = id.match(/-(\d{4}-\d{2}-\d{2})$/)
      if (!dateMatch) {
        throw new Error(`Invalid custom pricing ID format: ${id}`)
      }

      const date = dateMatch[1]
      const propertyId = id.replace(`-${date}`, '')
      const customPricing = await this.getCustomPricingForProperty(propertyId)

      if (customPricing[date]) {
        delete customPricing[date]
        await this.saveCustomPricingForProperty(propertyId, customPricing)
      }

      return true
    } catch (error) {
      throw error
    }
  }

  async bulkCreateCustomPricing(pricingEntries: Array<{
    property_id: string
    date: string
    price_per_night: number
    price_per_adult?: number
    price_per_child?: number
    notes?: string
  }>) {
    try {
      const results = []

      // Group by property_id to optimize updates
      const entriesByProperty = new Map<string, typeof pricingEntries>()

      for (const entry of pricingEntries) {
        if (!entriesByProperty.has(entry.property_id)) {
          entriesByProperty.set(entry.property_id, [])
        }
        entriesByProperty.get(entry.property_id)!.push(entry)
      }

      // Process each property
      for (const [propertyId, entries] of entriesByProperty) {
        const customPricing = await this.getCustomPricingForProperty(propertyId)

        for (const entry of entries) {
          customPricing[entry.date] = {
            price_per_night: entry.price_per_night,
            price_per_adult: entry.price_per_adult || null,
            price_per_child: entry.price_per_child || null,
            notes: entry.notes || null,
              }

          results.push({
            id: `${propertyId}-${entry.date}`,
            ...entry,
              })
        }

        await this.saveCustomPricingForProperty(propertyId, customPricing)
      }

      return results
    } catch (error) {
      throw error
    }
  }

  // Review operations
  async getAllReviews() {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')

    if (error) throw error
    return data || []
  }

  async getApprovedReviews() {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('id, name, rating, comment, stay_date')
      .eq('approved', true)

    if (error) throw error
    return data || []
  }

  async getPendingReviews() {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('approved', false)

    if (error) throw error
    return data || []
  }

  async createReview(reviewData: {
    name: string
    email: string
    rating: number
    comment: string
    stay_date?: string
  }) {
    const { data, error } = await this.supabase
      .from('reviews')
      .insert({
        name: reviewData.name,
        email: reviewData.email,
        rating: reviewData.rating,
        comment: reviewData.comment,
        stay_date: reviewData.stay_date || null,
        approved: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateReview(id: string, updateData: {
    name?: string
    rating?: number
    comment?: string
    stay_date?: string
  }) {
    const { data, error } = await this.supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async approveReview(id: string) {
    const { data, error } = await this.supabase
      .from('reviews')
      .update({ approved: true })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteReview(id: string) {
    const { error } = await this.supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getReviewById(id: string) {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async getReviewStats() {
    const { data: allReviews, error: allError } = await this.supabase
      .from('reviews')
      .select('rating')

    if (allError) throw allError

    const { data: approvedReviews, error: approvedError } = await this.supabase
      .from('reviews')
      .select('rating')
      .eq('approved', true)

    if (approvedError) throw approvedError

    const { data: pendingReviews, error: pendingError } = await this.supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('approved', false)

    if (pendingError) throw pendingError

    const total = allReviews?.length || 0
    const approved = approvedReviews?.length || 0
    const pending = pendingReviews?.length || 0
    const averageRating = approved > 0
      ? approvedReviews!.reduce((sum, review) => sum + review.rating, 0) / approved
      : 0

    return {
      total,
      approved,
      pending,
      averageRating
    }
  }

}

// Export singleton instance
export const db = new DatabaseAdapter()