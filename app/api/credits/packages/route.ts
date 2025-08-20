import { NextRequest, NextResponse } from "next/server";
import { getCreditPackages } from "@/lib/paystack-enhanced";

export async function GET(request: NextRequest) {
  try {
    // Get credit packages from database
    const packages = await getCreditPackages();

    // Return packages with proper formatting
    return NextResponse.json({
      success: true,
      packages: packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        credits: pkg.credits,
        price: pkg.price,
        currency: 'NGN', // Fixed currency for Nigeria
        popular: pkg.popular || false,
        sort_order: 0
      }))
    });

  } catch (error) {
    console.error('Error fetching credit packages:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch credit packages',
        packages: []
      },
      { status: 500 }
    );
  }
}
