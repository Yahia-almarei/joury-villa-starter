import { NextRequest, NextResponse } from 'next/server';
import { reviewService } from '@/lib/review-service';

// This endpoint is for admin use to approve/manage reviews
// In production, add proper authentication middleware

export async function GET(request: NextRequest) {
  try {
    // Get all reviews including pending ones
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'all'

    let filteredReviews;

    if (status === 'pending') {
      filteredReviews = await reviewService.getPendingReviews();
    } else if (status === 'approved') {
      filteredReviews = await reviewService.getApprovedReviews();
    } else {
      filteredReviews = await reviewService.getAllReviews();
    }

    return NextResponse.json({
      success: true,
      reviews: filteredReviews,
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

    if (action === 'approve') {
      await reviewService.approveReview(reviewId);
    } else if (action === 'reject') {
      await reviewService.deleteReview(reviewId);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, name, rating, comment, stayDate } = body;

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'Missing reviewId' },
        { status: 400 }
      );
    }

    await reviewService.updateReview(reviewId, {
      name,
      rating,
      comment,
      stay_date: stayDate
    });

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully'
    });

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'Missing reviewId' },
        { status: 400 }
      );
    }

    await reviewService.deleteReview(reviewId);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}

