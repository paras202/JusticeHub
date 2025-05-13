//app/api/consultations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { consultations } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";


export async function POST(request: NextRequest) {
  try {
    // Get authentication status
    const { userId } =await auth();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { lawyerId, scheduledAt, duration, status, notes } = body;

    // Validate required fields
    if (!lawyerId || !scheduledAt || !duration) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Parse scheduled date and validate it's in the future
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return new NextResponse(
        JSON.stringify({ error: "Consultation date must be in the future" }),
        { status: 400 }
      );
    }

    console.log("Creating consultation:", {
      userId,
      lawyerId,
      scheduledAt: scheduledDate,
      duration,
      status: status || "pending",
      notes
    });

    // In development mode, return mock success response
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        id: Math.floor(Math.random() * 1000),
        userId,
        lawyerId,
        scheduledAt: scheduledDate.toISOString(),
        duration,
        status: status || "pending",
        notes,
        createdAt: new Date().toISOString()
      });
    }

    // Insert consultation into database
    const result = await db.insert(consultations).values({
      userId,
      lawyerId,
      scheduledAt: scheduledDate,
      duration,
      status: status || "pending",
      notes,
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error creating consultation:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    
    const url = new URL(request.url);
    const lawyerId = url.searchParams.get("lawyerId");
    const status = url.searchParams.get("status");
    
    const numericId = Number(lawyerId);
    if (isNaN(numericId)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid lawyer ID format" }),
        { status: 400 }
      );
    }
    if (process.env.NODE_ENV === "development") {
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

      if (status) {
        return NextResponse.json(mockConsultations.filter(c => c.status === status));
      }

      return NextResponse.json(mockConsultations);
    }

    const filters = [eq(consultations.userId, userId)];

    if (lawyerId) filters.push(eq(consultations.lawyerId, parseInt(lawyerId)));
    if (status) filters.push(eq(consultations.status, status));

    const result = await db
      .select()
      .from(consultations)
      .where(and(...filters))
      .orderBy(desc(consultations.scheduledAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching consultations:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

// Add this PUT method to your existing consultations route file (app/api/consultations/route.ts)

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { consultationId, status } = body;
    
    if (!consultationId || !status) {
      return new NextResponse(
        JSON.stringify({ error: "Consultation ID and status are required" }),
        { status: 400 }
      );
    }

    // Verify valid status
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid status. Must be 'pending', 'confirmed', 'completed', or 'cancelled'" }),
        { status: 400 }
      );
    }

    // For development mode, return mock success
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        id: consultationId,
        status,
        updatedAt: new Date().toISOString()
      });
    }

    // Get the lawyer profile to verify they have permission to update this consultation
    const lawyer = await db.query.lawyersre.findFirst({
      where: (lawyersre, { eq }) => eq(lawyersre.clerkId, userId)
    });
    
    if (!lawyer) {
      return new NextResponse(
        JSON.stringify({ error: "Lawyer profile not found" }),
        { status: 404 }
      );
    }

    // Find and update the consultation
    const result = await db
      .update(consultations)
      .set({ status })
      .where(
        and(
          eq(consultations.id, Number(consultationId)),
          eq(consultations.lawyerId, lawyer.id)
        )
      )
      .returning();

    if (result.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Consultation not found or you don't have permission to update it" }),
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
    
  } catch (error) {
    console.error("Error updating consultation:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}