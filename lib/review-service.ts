import { db } from './database'

export interface Review {
  id: string
  name: string
  email: string
  rating: number
  comment: string
  stay_date?: string
  approved: boolean
}

export interface CreateReviewInput {
  name: string
  email: string
  rating: number
  comment: string
  stay_date?: string
}

export interface UpdateReviewInput {
  name?: string
  rating?: number
  comment?: string
  stay_date?: string
}

export class ReviewService {
  // Get all reviews (admin use)
  async getAllReviews(): Promise<Review[]> {
    return await db.getAllReviews()
  }

  // Get approved reviews only (public use)
  async getApprovedReviews(): Promise<Omit<Review, 'email'>[]> {
    return await db.getApprovedReviews()
  }

  // Get pending reviews (admin use)
  async getPendingReviews(): Promise<Review[]> {
    return await db.getPendingReviews()
  }

  // Create a new review
  async createReview(reviewData: CreateReviewInput): Promise<Review> {
    return await db.createReview(reviewData)
  }

  // Update a review (admin use)
  async updateReview(reviewId: string, updateData: UpdateReviewInput): Promise<Review> {
    return await db.updateReview(reviewId, updateData)
  }

  // Approve a review
  async approveReview(reviewId: string): Promise<Review> {
    return await db.approveReview(reviewId)
  }

  // Reject/Delete a review
  async deleteReview(reviewId: string): Promise<void> {
    return await db.deleteReview(reviewId)
  }

  // Get a specific review by ID
  async getReviewById(reviewId: string): Promise<Review | null> {
    return await db.getReviewById(reviewId)
  }

  // Get review statistics
  async getReviewStats(): Promise<{
    total: number
    approved: number
    pending: number
    averageRating: number
  }> {
    return await db.getReviewStats()
  }
}

// Export a singleton instance
export const reviewService = new ReviewService()