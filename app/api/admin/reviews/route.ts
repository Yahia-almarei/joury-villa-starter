import { NextRequest, NextResponse } from 'next/server';
import { reviewStorage } from '@/lib/review-storage';

// This endpoint is for admin use to approve/manage reviews
// In production, add proper authentication middleware

export async function GET(request: NextRequest) {
  try {
    // Get all reviews including pending ones
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'all'
    
    let filteredReviews;
    
    if (status === 'pending') {
      filteredReviews = reviewStorage.getPendingReviews();
    } else if (status === 'approved') {
      filteredReviews = reviewStorage.getApprovedReviews();
    } else {
      filteredReviews = reviewStorage.getAllReviews();
    }
    
    return NextResponse.json({
      success: true,
      reviews: filteredReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      total: filteredReviews.length
    });

  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, action } = body; // action: 'approve' or 'reject'

    if (!reviewId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing reviewId or action' },
        { status: 400 }
      );
    }

    let success = false;
    
    if (action === 'approve') {
      success = reviewStorage.approveReview(reviewId);
    } else if (action === 'reject') {
      success = reviewStorage.rejectReview(reviewId);
    }
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Review ${action}d successfully`
    });

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

