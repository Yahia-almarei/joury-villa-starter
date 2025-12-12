import { NextRequest, NextResponse } from 'next/server';
import { reviewService } from '@/lib/review-service';

export async function GET(request: NextRequest) {
  try {
    // Get approved reviews from database
    const approvedReviews = await reviewService.getApprovedReviews();

    return NextResponse.json({
      success: true,
      reviews: approvedReviews,
      total: approvedReviews.length
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, rating, comment, stayDate } = body;

    // Validate required fields
    if (!name || !email || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create new review in database
    const newReview = await reviewService.createReview({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rating: parseInt(rating),
      comment: comment.trim(),
      stay_date: stayDate || undefined
    });

    console.log('New review submitted:', newReview);

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully! It will be published after moderation.',
      reviewId: newReview.id
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}