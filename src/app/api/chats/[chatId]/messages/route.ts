import { NextResponse } from "next/server";
import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

// POST handler for creating a new message in a chat
export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  const { userId } = await auth();
  const { chatId } = params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if the chat exists and belongs to the user
    const chat = await db.query.chats.findFirst({
      where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const { content, role } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Create the new message - only include fields that exist in your schema
    const newMessage = await db
      .insert(messages)
      .values({
        content,
        role: role || "user", // Default to 'user' if role is not provided
        chatId,
        // Remove userId if it's not in your schema
      })
      .returning();

    return NextResponse.json(newMessage[0]);
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET handler for retrieving messages for a specific chat
export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  const { userId } = await auth();
  const { chatId } = params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First check if the chat exists and belongs to the user
    const chat = await db.query.chats.findFirst({
      where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Fetch all messages for this chat
    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, chatId),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });

    return NextResponse.json(chatMessages);
  } catch (error) {
    console.error("[MESSAGES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}