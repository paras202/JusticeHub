// app/api/lawyer/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

// Add this export to mark the route as dynamic
export const dynamic = 'force-dynamic';

// GET endpoint to retrieve appointments for a lawyer
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    // Get the lawyer profile
    const lawyer = await db.query.lawyersre.findFirst({
      where: (lawyersre, { eq }) => eq(lawyersre.clerkId, userId)
    });
    
    if (!lawyer) {
      return NextResponse.json(
        { message: "Lawyer profile not found." },
        { status: 404 }
      );
    }

    // Get all appointments for the lawyer
    const lawyerAppointments = await db.query.appointments.findMany({
      where: (appointments, { eq }) => eq(appointments.lawyerId, lawyer.id),
      orderBy: (appointments, { desc }) => [desc(appointments.date)]
    });
    
    // Get status filter from URL if present
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    if (status) {
      const filteredAppointments = lawyerAppointments.filter(app => app.status === status);
      return NextResponse.json({ appointments: filteredAppointments });
    }

    return NextResponse.json({ appointments: lawyerAppointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update appointment status
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { appointmentId, status } = body;
    
    if (!appointmentId || !status) {
      return NextResponse.json(
        { message: "Appointment ID and status are required" },
        { status: 400 }
      );
    }

    // Verify valid status
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status. Must be 'pending', 'confirmed', 'completed', or 'cancelled'" },
        { status: 400 }
      );
    }

    // Find the lawyer
    const lawyer = await db.query.lawyersre.findFirst({
      where: (lawyersre, { eq }) => eq(lawyersre.clerkId, userId)
    });
    
    if (!lawyer) {
      return NextResponse.json(
        { message: "Lawyer profile not found." },
        { status: 404 }
      );
    }

    // Find the appointment and verify it belongs to this lawyer
    const appointment = await db.query.appointments.findFirst({
      where: (appointments, { eq, and }) => 
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.lawyerId, lawyer.id)
        )
    });
    
    if (!appointment) {
      return NextResponse.json(
        { message: "Appointment not found or you don't have permission to update it." },
        { status: 404 }
      );
    }

    // Update the appointment status
    const updatedAppointment = await db.update(appointments)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    return NextResponse.json({
      message: "Appointment updated successfully",
      appointment: updatedAppointment[0]
    });

  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}