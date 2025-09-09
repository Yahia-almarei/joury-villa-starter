import { NextRequest, NextResponse } from 'next/server';

// Mock booking data - In production, this would come from your database
const mockBookings = [
  {
    id: 'JOURY-2024-001',
    email: 'john.doe@email.com',
    checkIn: '2024-01-10',
    checkOut: '2024-01-15',
    status: 'completed',
    guestName: 'John Doe'
  },
  {
    id: 'JOURY-2024-002', 
    email: 'sarah.smith@email.com',
    checkIn: '2024-01-20',
    checkOut: '2024-01-25',
    status: 'completed',
    guestName: 'Sarah Smith'
  },
  {
    id: 'JOURY-2024-003',
    email: 'ahmed.hassan@email.com', 
    checkIn: '2024-02-01',
    checkOut: '2024-02-05',
    status: 'completed',
    guestName: 'Ahmed Hassan'
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingReference, email } = body;

    if (!bookingReference || !email) {
      return NextResponse.json(
        { success: false, error: 'Booking reference and email are required' },
        { status: 400 }
      );
    }

    // In production, query your database for the booking
    const booking = mockBookings.find(
      b => b.id.toLowerCase() === bookingReference.toLowerCase() && 
           b.email.toLowerCase() === email.toLowerCase()
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found. Please check your booking reference and email.' },
        { status: 404 }
      );
    }

    if (booking.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Reviews can only be submitted for completed stays.' },
        { status: 400 }
      );
    }

    // Check if the stay has already happened
    const checkOutDate = new Date(booking.checkOut);
    const today = new Date();
    
    if (checkOutDate > today) {
      return NextResponse.json(
        { success: false, error: 'Reviews can only be submitted after your stay is complete.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        guestName: booking.guestName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut
      },
      message: 'Booking verified successfully'
    });

  } catch (error) {
    console.error('Error verifying booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify booking' },
      { status: 500 }
    );
  }
}