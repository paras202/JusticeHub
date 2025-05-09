// app/api/lawyers/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lawyerEducation, lawyersre } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ["name", "specialization", "experience", "location", "hourlyRate", "expertise"];
    for (const field of requiredFields) {
      if (!body[field] || (Array.isArray(body[field]) && body[field].length === 0)) {
        return NextResponse.json(
          { message: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Validate numeric fields
    if (isNaN(body.experience) || body.experience < 0) {
      return NextResponse.json(
        { message: "Experience must be a positive number" },
        { status: 400 }
      );
    }
    
    // Check if this clerk user already has a lawyer profile
    const existingLawyer = await db.query.lawyersre.findFirst({
      where: (lawyersre, { eq }) => eq(lawyersre.clerkId, userId)
    });
    
    if (existingLawyer) {
      return NextResponse.json(
        { message: "You already have a lawyer profile" },
        { status: 409 }
      );
    }
    
    // Insert the new lawyer into the database
    const newLawyer = await db.insert(lawyersre).values({
      clerkId: userId,
      name: body.name,
      avatar: body.avatar || "/api/placeholder/150/150", // optional, default exists
      specialization: body.specialization,
      experience: Number(body.experience), // integer
      location: body.location,
      rating: String(body.rating || "4.5"),  // Default rating for new lawyers
      hourlyRate: String(body.hourlyRate), // text
      expertise: body.expertise,           // must be string[]
      availableNow: Boolean(body.availableNow),
      email: body.email,
      phone: body.phone || "",
      bio: body.bio || "",
    }).returning();
    
    // Handle education if provided
    if (body.education && Array.isArray(body.education) && body.education.length > 0) {
      for (const edu of body.education) {
        if (edu.institution && edu.degree && edu.year) {
          await db.insert(lawyerEducation).values({
            lawyerId: newLawyer[0].id,
            institution: edu.institution,
            degree: edu.degree,
            year: edu.year
          });
        }
      }
    }
    
    return NextResponse.json(
      { message: "Lawyer registered successfully", lawyer: newLawyer[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering lawyer:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}