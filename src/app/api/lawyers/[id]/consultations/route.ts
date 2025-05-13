//app/api/lawyers/[id]/consultations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { consultations } from "@/db/schema";
// import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authentication status
    const { userId } =await auth();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    const lawyerId = params.id;
    
    if (!lawyerId) {
      return new NextResponse(
        JSON.stringify({ error: "Lawyer ID is required" }),
        { status: 400 }
      );
    }

    const numericId = Number(lawyerId);
    if (isNaN(numericId)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid lawyer ID format" }),
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    // In development mode, return mock data
    if (process.env.NODE_ENV === "development") {
      // Generate some dummy consultations for this lawyer
      const mockConsultations = [
        {
          id: 1,
          userId,
          lawyerId: numericId,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          duration: 60,
          status: "pending",
          notes: "Discussing divorce proceedings",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          userId,
          lawyerId: numericId,
          scheduledAt: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          duration: 30,
          status: "confirmed",
          notes: "Child custody arrangements",
          createdAt: new Date().toISOString()
        }
      ];

      // If status filter is applied
      if (status) {
        return NextResponse.json(mockConsultations.filter(c => c.status === status));
      }

      return NextResponse.json(mockConsultations);
    }

    // Query consultations for this lawyer and user
    const result = await db
    .select()
    .from(consultations)
    .where(
        and(
        eq(consultations.userId, userId),
        eq(consultations.lawyerId, numericId),
        status ? eq(consultations.status, status) : undefined
        )
    )
    .orderBy(consultations.scheduledAt);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching consultations:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}