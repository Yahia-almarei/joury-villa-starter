import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || 'a2f19c22-6b1e-4c87-a258-f35c123456b7';
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({
        success: false,
        error: 'Date parameter required'
      }, { status: 400 });
    }

    // Get custom pricing directly from memory cache
    const customPricing = global.customPricingCache?.get(propertyId) || {};
    const pricing = customPricing[date];

    return NextResponse.json({
      success: true,
      hasCustomPricing: !!pricing,
      pricing: pricing || null
    });

  } catch (error) {
    console.error('Custom pricing API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get custom pricing'
    }, { status: 500 });
  }
}