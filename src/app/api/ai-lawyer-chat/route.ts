// app/api/ai-lawyer-chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lawyers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Lawyer, ChatMessage } from "@/types/lawyer";

// Gemini API configuration
const GEMINI_API_KEY = process.env.GOOGLE_SECRET_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Cache for lawyer data to reduce database queries
const lawyerCache = new Map<number, Lawyer>();

interface GeminiPrompt {
  contents: {
    role: string;
    parts: {
      text: string;
    }[];
  }[];
}

export async function POST(req: NextRequest) {
  try {
    const { lawyerId, message, chatHistory } = await req.json();

    if (!lawyerId || !message) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Check lawyer cache first to avoid redundant database queries
    const numericId = Number(lawyerId);
    let lawyerData: Lawyer | null = null;
    
    if (!isNaN(numericId)) {
      // Try to get from cache first
      if (lawyerCache.has(numericId)) {
        lawyerData = lawyerCache.get(numericId) || null;
      } else {
        // Fetch from database if not in cache
        try {
          const result = await db.select().from(lawyers).where(eq(lawyers.id, numericId)).limit(1);
          if (result.length > 0) {
            lawyerData = result[0] as Lawyer;
            // Add to cache for future requests
            lawyerCache.set(numericId, lawyerData);
          }
        } catch (error) {
          console.error("Error fetching lawyer data:", error);
        }
      }
    }
    
    // Fallback to dummy data if necessary
    if (!lawyerData) {
      lawyerData = {
        id: lawyerId,
        name: "Sarah Johnson",
        avatar: "/api/placeholder/150/150",
        specialization: "Family Law",
        experience: "12 years",
        location: "New York, NY",
        rating: "4.8",
        reviews: 124,
        hourlyRate: "$250",
        expertise: ["Divorce", "Child Custody", "Alimony"],
        availableNow: true
      };
    }

    // Create prompt for Gemini AI
    const prompt = createLawyerPrompt(lawyerData, message, chatHistory);
    
    // Call Gemini API only when necessary
    const aiResponse = await callGeminiAPI(prompt);
    
    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Error processing AI lawyer chat:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

function createLawyerPrompt(
  lawyer: Lawyer, 
  message: string, 
  chatHistory: ChatMessage[]
): GeminiPrompt {
  // Limit chat history to last 10 messages to reduce token usage
  const recentChatHistory = chatHistory.slice(-10);
  
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are a lawyer representing a lawyer named ${lawyer.name} 
            who specializes in ${lawyer.specialization} with ${lawyer.experience} of experience.
            You're based in ${lawyer.location}.
            
            Act as if you are this lawyer providing legal consultation through a chat interface.
            Be professional, knowledgeable, and helpful, while maintaining the appropriate tone 
            expected from a legal professional.
            
            Remember that:
            1. You cannot give binding legal advice - always clarify this
            2. You should suggest scheduling a real consultation for complex matters
            3. You should ask clarifying questions when needed
            4. You should be empathetic but professional
            5. Keep responses concise and focused on the legal matter at hand
            
            Previous conversation (if any):
            ${recentChatHistory
              .map((msg) => `${msg.role === "assistant" ? "Lawyer" : "Client"}: ${msg.content}`)
              .join("\n")}
            
            Latest client message: ${message}
            
            Respond as the lawyer:`
          }
        ]
      }
    ]
  };
}

// Implement a simple debounce to prevent excessive API calls
let lastCallTimestamp = 0;
const DEBOUNCE_INTERVAL = 500; // milliseconds

async function callGeminiAPI(prompt: GeminiPrompt): Promise<string> {
  try {
    // Check if API key is available
    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Using fallback response.");
      return getFallbackResponse();
    }

    // Implement basic debouncing
    const now = Date.now();
    if (now - lastCallTimestamp < DEBOUNCE_INTERVAL) {
      console.log("Debouncing API call");
      return getFallbackResponse();
    }
    lastCallTimestamp = now;

    // Make API call with proper URL construction
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prompt),
      cache: "no-store" // Ensure fresh responses
    });

    // Improved error handling
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from Gemini API (${response.status}): ${errorText}`);
      
      // Different handling based on status code
      if (response.status === 429) {
        console.warn("Rate limit exceeded for Gemini API");
      }
      
      return getFallbackResponse();
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackResponse();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return getFallbackResponse();
  }
}

// Enhanced fallback responses with more variety
function getFallbackResponse(): string {
  const fallbackResponses = [
    "Thank you for sharing that information. To provide the best advice for your situation, I would need to know a few more details. Could you elaborate further?",
    "I understand your concern. This is a common legal issue I help clients with. Based on what you've shared, my initial thoughts are that we should look into the relevant statutes and precedents. Would you like to schedule a consultation to discuss this in more detail?",
    "That's an important question. The legal principles that would apply here involve several factors we should consider. I'd be happy to discuss this further in a formal consultation where we can explore all the options available to you.",
    "Thank you for reaching out. I've handled similar cases before, and there are several approaches we could take. Let me ask you a few clarifying questions to better understand your situation.",
    "I appreciate you sharing this with me. From a legal perspective, there are several important considerations we should address. Would you be able to provide some additional context about when this situation began?"
  ];
  
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}