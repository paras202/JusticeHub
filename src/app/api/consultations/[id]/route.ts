//app/api/consultations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { consultations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

type ConsultationUpdate = {
  scheduledAt?: Date;
  duration?: number;
  status?: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  [key: string]: unknown; // 👈 Add this line
};


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authentication status
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    const consultationId = params.id;
    
    if (!consultationId) {
      return new NextResponse(
        JSON.stringify({ error: "Consultation ID is required" }),
        { status: 400 }
      );
    }

    const numericId = Number(consultationId);
    if (isNaN(numericId)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid consultation ID format" }),
        { status: 400 }
      );
    }

    // In development mode, return mock data
    if (process.env.NODE_ENV === "development") {
      // Generate a dummy consultation
      const mockConsultation = {
        id: numericId,
        userId,
        lawyerId: 1,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        duration: 60,
        status: "pending",
        notes: "Discussing divorce proceedings",
        createdAt: new Date().toISOString()
      };

      return NextResponse.json(mockConsultation);
    }

    // Query consultation by ID and user ID (for security)
    const result = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.id, numericId),
          eq(consultations.userId, userId)
        )
      )
      .limit(1);

    if (!result || result.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Consultation not found" }),
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching consultation:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authentication status
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    const consultationId = params.id;
    
    if (!consultationId) {
      return new NextResponse(
        JSON.stringify({ error: "Consultation ID is required" }),
        { status: 400 }
      );
    }

    const numericId = Number(consultationId);
    if (isNaN(numericId)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid consultation ID format" }),
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Ensure only allowed fields are updated
    const allowedUpdates = ['scheduledAt', 'duration', 'status', 'notes'];
   const updates: Partial<ConsultationUpdate> = {};
    
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "No valid fields to update" }),
        { status: 400 }
      );
    }

    // In development mode, return mock success
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        id: numericId,
        userId,
        ...updates,
        updatedAt: new Date().toISOString()
      });
    }

    // First check if consultation exists and belongs to user
    const existingConsultation = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.id, numericId),
          eq(consultations.userId, userId)
        )
      )
      .limit(1);

    if (!existingConsultation || existingConsultation.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Consultation not found" }),
        { status: 404 }
      );
    }

    // Update consultation
    const result = await db
      .update(consultations)
      .set(updates)
      .where(
        and(
          eq(consultations.id, numericId),
          eq(consultations.userId, userId)
        )
      )
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating consultation:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authentication status
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    const consultationId = params.id;
    
    if (!consultationId) {
      return new NextResponse(
        JSON.stringify({ error: "Consultation ID is required" }),
        { status: 400 }
      );
    }

    const numericId = Number(consultationId);
    if (isNaN(numericId)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid consultation ID format" }),
        { status: 400 }
      );
    }

    // In development mode, return mock success
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ success: true });
    }

    // Delete consultation (only if it belongs to the user)
    await db
      .delete(consultations)
      .where(
        and(
          eq(consultations.id, numericId),
          eq(consultations.userId, userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting consultation:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}