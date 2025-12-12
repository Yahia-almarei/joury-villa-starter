// Temporary in-memory storage for reviews
// In production, replace this with a proper database

interface Review {
  id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  date: string;
  stayDate?: string;
  approved: boolean;
}

class ReviewStorage {
  private reviews: Review[] = [];

  addReview(review: Review): void {
    this.reviews.push(review);
  }

  getAllReviews(): Review[] {
    return this.reviews;
  }

  getApprovedReviews(): Omit<Review, 'email'>[] {
    return this.reviews
      .filter(review => review.approved)
      .map(({ email, ...review }) => review) // Don't expose email addresses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getPendingReviews(): Review[] {
    return this.reviews.filter(review => !review.approved);
  }

  approveReview(reviewId: string): boolean {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      review.approved = true;
      return true;
    }
    return false;
  }

  rejectReview(reviewId: string): boolean {
    const index = this.reviews.findIndex(r => r.id === reviewId);
    if (index !== -1) {
      this.reviews.splice(index, 1);
      return true;
    }
    return false;
  }

  getReviewById(reviewId: string): Review | undefined {
    return this.reviews.find(r => r.id === reviewId);
  }

  updateReview(reviewId: string, updatedData: Partial<Omit<Review, 'id'>>): boolean {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      Object.assign(review, updatedData);
      return true;
    }
    return false;
  }

  deleteReview(reviewId: string): boolean {
    const index = this.reviews.findIndex(r => r.id === reviewId);
    if (index !== -1) {
      this.reviews.splice(index, 1);
      return true;
    }
    return false;
  }
}

// Export a singleton instance
export const reviewStorage = new ReviewStorage();