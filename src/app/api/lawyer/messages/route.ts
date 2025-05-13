// app/api/lawyer/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { directMessages } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

// GET endpoint to retrieve messages for a lawyer
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated lawyer from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    // Get the lawyer profile to verify they exist
    const lawyer = await db.query.lawyersre.findFirst({
      where: (lawyersre, { eq }) => eq(lawyersre.clerkId, userId)
    });
    
    if (!lawyer) {
      return NextResponse.json(
        { message: "Lawyer profile not found." },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');
    const clientId = url.searchParams.get('clientId');
    
    // If conversation ID is provided, get messages for that conversation
    if (conversationId) {
      const messages = await db.select()
        .from(directMessages)
        .where(eq(directMessages.conversationId, conversationId))
        .orderBy(desc(directMessages.createdAt));
      
      // Mark messages as read
      await db.update(directMessages)
        .set({ read: true })
        .where(and(
          eq(directMessages.conversationId, conversationId),
          eq(directMessages.receiverId, userId),
          eq(directMessages.read, false)
        ));
      
      return NextResponse.json({ messages });
    }
    
    // If client ID is provided, get or create conversation with that client
    if (clientId) {
      // First check if a conversation exists between the lawyer and client
      const existingMessages = await db.select()
        .from(directMessages)
        .where(
          and(
            eq(directMessages.senderId, userId),
            eq(directMessages.receiverId, clientId)
          )
        )
        .limit(1);
      
      let conversationId;
      
      if (existingMessages.length > 0) {
        // Use existing conversation
        conversationId = existingMessages[0].conversationId;
      } else {
        // No existing messages between these users yet
        conversationId = ''; // Will be created with first message
      }
      
      // Get all messages in this conversation
      const allMessages = conversationId ? await db.select()
        .from(directMessages)
        .where(eq(directMessages.conversationId, conversationId))
        .orderBy(desc(directMessages.createdAt)) : [];
      
      return NextResponse.json({ 
        conversationId, 
        messages: allMessages
      });
    }
    
    // Get all conversations this lawyer is part of
    const sentMessages = await db.select()
      .from(directMessages)
      .where(eq(directMessages.senderId, userId))
      .orderBy(desc(directMessages.createdAt));
    
    const receivedMessages = await db.select()
      .from(directMessages)
      .where(eq(directMessages.receiverId, userId))
      .orderBy(desc(directMessages.createdAt));
    
    // Combine messages and get unique conversation IDs
    const allMessages = [...sentMessages, ...receivedMessages];
    const conversationIds = [...new Set(allMessages.map(msg => msg.conversationId))];
    
    // For each conversation, get the latest message and the other participant
    const conversations = [];
    
    for (const convId of conversationIds) {
      const messagesInConversation = allMessages.filter(msg => msg.conversationId === convId);
      const latestMessage = messagesInConversation.reduce((latest, current) => {
        return new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current;
      });
      
      // Determine the other participant
      const otherParticipantId = latestMessage.senderId === userId ? 
        latestMessage.receiverId : latestMessage.senderId;
      
      // Count unread messages in this conversation
      const unreadCount = messagesInConversation.filter(
        msg => msg.receiverId === userId && !msg.read
      ).length;
      
      conversations.push({
        conversationId: convId,
        otherParticipantId,
        latestMessage,
        unreadCount
      });
    }
    
    return NextResponse.json({ conversations });
    
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint to send a message
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
    const { receiverId, content, conversationId: existingConversationId } = body;
    
    if (!receiverId || !content) {
      return NextResponse.json(
        { message: "Receiver ID and content are required" },
        { status: 400 }
      );
    }

    // Verify lawyer exists
    const lawyer = await db.query.lawyersre.findFirst({
      where: (lawyersre, { eq }) => eq(lawyersre.clerkId, userId)
    });
    
    if (!lawyer) {
      return NextResponse.json(
        { message: "Lawyer profile not found." },
        { status: 404 }
      );
    }

    // Use existing conversation ID or create a new one
    const conversationId = existingConversationId || uuidv4();

    // Create the message
    const newMessage = await db.insert(directMessages)
      .values({
        conversationId,
        senderId: userId,
        receiverId,
        content,
        read: false,
        createdAt: new Date()
      })
      .returning();

    return NextResponse.json({
      message: "Message sent successfully",
      directMessage: newMessage[0]
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT endpoint to mark messages as read
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
    const { conversationId } = body;
    
    if (!conversationId) {
      return NextResponse.json(
        { message: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // Mark all messages in the conversation as read
    await db.update(directMessages)
      .set({ read: true })
      .where(and(
        eq(directMessages.conversationId, conversationId),
        eq(directMessages.receiverId, userId),
        eq(directMessages.read, false)
      ));

    return NextResponse.json({
      message: "Messages marked as read"
    });

  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}