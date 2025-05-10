// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lawyermessage } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lawyerId = searchParams.get("lawyerId");
    const userId = searchParams.get("userId");

    if (!lawyerId || !userId) {
      return new NextResponse(
        JSON.stringify({ error: "Both lawyerId and userId are required" }),
        { status: 400 }
      );
    }

    // Get messages where user is sender and lawyer is receiver OR lawyer is sender and user is receiver
    const messageList = await db
      .select()
      .from(lawyermessage)
      .where(
        or(
          and(
            eq(lawyermessage.senderId, userId),
            eq(lawyermessage.receiverId, lawyerId)
          ),
          and(
            eq(lawyermessage.senderId, lawyerId),
            eq(lawyermessage.receiverId, userId)
          )
        )
      )
      .orderBy(lawyermessage.timestamp);

    return NextResponse.json(messageList);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverId, content, attachments } = await request.json();

    if (!senderId || !receiverId || !content) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const newMessage = await db.insert(lawyermessage).values({
      senderId,
      receiverId,
      content,
      attachments: attachments || [],
      timestamp: new Date(),
      isRead: false
    }).returning();

    return NextResponse.json(newMessage[0]);
  } catch (error) {
    console.error("Error creating message:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}