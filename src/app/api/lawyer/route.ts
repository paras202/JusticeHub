// app/api/lawyer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lawyersre, appointments, directMessages } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { count } from "drizzle-orm";

// Add this export to mark the route as dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get authenticated user
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

    // Get appointment counts for stats
    const totalAppointments = await db
      .select({ count: count() })
      .from(appointments)
      .where(eq(appointments.lawyerId, lawyer.id));
    
    const pendingAppointments = await db
      .select({ count: count() })
      .from(appointments)
      .where(and(
        eq(appointments.lawyerId, lawyer.id),
        eq(appointments.status, "pending")
      ));
    
    const upcomingAppointments = await db
      .select({ count: count() })
      .from(appointments)
      .where(and(
        eq(appointments.lawyerId, lawyer.id),
        eq(appointments.status, "confirmed")
      ));
    
    const completedAppointments = await db
      .select({ count: count() })
      .from(appointments)
      .where(and(
        eq(appointments.lawyerId, lawyer.id),
        eq(appointments.status, "completed")
      ));
    
    // Get unread messages count
    const unreadMessages = await db
      .select({ count: count() })
      .from(directMessages)
      .where(and(
        eq(directMessages.receiverId, userId),
        eq(directMessages.read, false)
      ));
    
    // Get pending appointments
    const pendingAppointmentsData = await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.lawyerId, lawyer.id),
        eq(appointments.status, "pending")
      ))
      .orderBy(desc(appointments.date))
      .limit(10);
    
    // Get upcoming appointments
    const upcomingAppointmentsData = await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.lawyerId, lawyer.id),
        eq(appointments.status, "confirmed")
      ))
      .orderBy(appointments.date)
      .limit(10);
    
    // Get recent messages
    const sentMessages = await db
      .select()
      .from(directMessages)
      .where(eq(directMessages.senderId, userId))
      .orderBy(desc(directMessages.createdAt))
      .limit(50);
    
    const receivedMessages = await db
      .select()
      .from(directMessages)
      .where(eq(directMessages.receiverId, userId))
      .orderBy(desc(directMessages.createdAt))
      .limit(50);
    
    // Combine messages
    const allMessages = [...sentMessages, ...receivedMessages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Compile stats
    const stats = {
      totalAppointments: totalAppointments[0].count,
      pendingAppointments: pendingAppointments[0].count,
      upcomingAppointments: upcomingAppointments[0].count,
      completedAppointments: completedAppointments[0].count,
      unreadMessages: unreadMessages[0].count
    };
    
    return NextResponse.json({
      lawyer: {
        id: lawyer.id,
        clerkId: lawyer.clerkId,
        name: lawyer.name,
        avatar: lawyer.avatar,
        specialization: lawyer.specialization,
        experience: lawyer.experience,
        location: lawyer.location,
        rating: lawyer.rating,
        hourlyRate: lawyer.hourlyRate,
        expertise: lawyer.expertise,
        availableNow: lawyer.availableNow,
        email: lawyer.email,
        phone: lawyer.phone,
        bio: lawyer.bio
      },
      stats,
      appointments: {
        pending: pendingAppointmentsData,
        upcoming: upcomingAppointmentsData
      },
      messages: allMessages
    });
    
  } catch (error) {
    console.error("Error fetching lawyer data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST handler for updating lawyer profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Find the lawyer
    const existingLawyer = await db.query.lawyersre.findFirst({
      where: (lawyersre, { eq }) => eq(lawyersre.clerkId, userId)
    });
    
    if (!existingLawyer) {
      // Create new lawyer if doesn't exist
      const { ...data } = body;
      
      const newLawyer = await db.insert(lawyersre)
        .values({
          ...data,
          clerkId: userId
        })
        .returning();
      
      return NextResponse.json({
        message: "Lawyer profile created successfully",
        lawyer: newLawyer[0]
      });
    } else {
      // Update existing lawyer
      const updatedLawyer = await db.update(lawyersre)
        .set(body)
        .where(eq(lawyersre.clerkId, userId))
        .returning();
      
      return NextResponse.json({
        message: "Lawyer profile updated successfully",
        lawyer: updatedLawyer[0]
      });
    }
    
  } catch (error) {
    console.error("Error updating lawyer profile:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}