// app/api/lawyers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lawyers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lawyerId = params.id;
    
    if (!lawyerId) {
      return new NextResponse(
        JSON.stringify({ error: "Lawyer ID is required" }),
        { status: 400 }
      );
    }

    console.log("Fetching lawyer with ID:", lawyerId);

      const numericId = Number(lawyerId);
    let lawyerResult;

    if (!isNaN(numericId)) {
      lawyerResult = await db
        .select()
        .from(lawyers)
        .where(eq(lawyers.id, numericId))
        .limit(1);
    } else {
      // ID is not valid number, return 400
      return new NextResponse(
        JSON.stringify({ error: "Invalid lawyer ID format" }),
        { status: 400 }
      );
    }
    // If no lawyer found, return dummy data for development
    if (!lawyerResult || lawyerResult.length === 0) {
      console.log("No lawyer found in database, returning dummy data for development");
      
      // Create a dummy lawyer object for testing
      const dummyLawyer = {
        id: lawyerId,
        name: "Sarah Johnson",
        avatar: "/api/placeholder/150/150",
        specialization: "Family Law",
        experience: "12 years", // Changed to match the type in the page component
        location: "New York, NY",
        rating: "4.8",
        reviews: 124,
        hourlyRate: "$250",
        expertise: ["Divorce", "Child Custody", "Alimony"],
        availableNow: true
      };
      
      return NextResponse.json(dummyLawyer);
    }

    console.log("Lawyer found:", lawyerResult[0]);
    return NextResponse.json(lawyerResult[0]);
  } catch (error) {
    console.error("Error fetching lawyer:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}