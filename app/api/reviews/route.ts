import { NextRequest, NextResponse } from 'next/server';
import { reviewStorage } from '@/lib/review-storage';

export async function GET(request: NextRequest) {
  try {
    // Get approved reviews from storage
    const approvedReviews = reviewStorage.getApprovedReviews();

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

    // In production, you would:
    // 1. Connect to your database
    // 2. Insert the new review (with approved: false for moderation)
    // 3. Send notification email to admin
    // 4. Optionally send confirmation email to reviewer

    const newReview = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rating: parseInt(rating),
      comment: comment.trim(),
      stayDate: stayDate || null,
      date: new Date().toISOString().split('T')[0],
      approved: false // Reviews need admin approval
    };

    // Add to review storage (in production, save to database)
    reviewStorage.addReview(newReview);
    console.log('New review submitted:', newReview);
    console.log('Total reviews in storage:', reviewStorage.getAllReviews().length);

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