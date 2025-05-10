// app/api/lawyers/search/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { lawyers } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server"

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_SECRET_KEY}`;

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();

    const allLawyers = await db.select().from(lawyers);

    if (!query || query.trim() === "") {
      return NextResponse.json(
        allLawyers.sort((a, b) => Number(b.rating) - Number(a.rating))
      );
    }

    // Call Gemini API
    const prompt = `
You are a legal search assistant. Your task is to analyze the user's query about legal help and determine:
1. What practice areas might be relevant (e.g., Family Law, Criminal Law, etc.)
2. What specific legal issues they might be facing (e.g., divorce, property dispute)
3. What expertise areas would be most helpful
4. Any location preferences mentioned
5. Any experience level preferences mentioned

Output only a JSON object with these fields:
{
  "practiceAreas": ["area1", "area2"],
  "legalIssues": ["issue1", "issue2"],
  "expertiseNeeded": ["expertise1", "expertise2"],
  "location": "location or null if not specified",
  "experienceLevel": "minimum years or null if not specified",
  "originalQuery": "the original query"
}

Query: """${query}"""
`;

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const geminiData = await geminiResponse.json();
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

     // Extract JSON from the response text which might contain markdown formatting
     let searchParams;
     try {
       // First try direct parse in case it's already valid JSON
       searchParams = JSON.parse(responseText);
     } catch {
       // If that fails, try to extract JSON from markdown code blocks
       const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
       
       if (jsonMatch && jsonMatch[1]) {
         // Found JSON inside markdown code blocks
         try {
           searchParams = JSON.parse(jsonMatch[1].trim());
         } catch (jsonError) {
           console.error("[LAWYER_GEMINI_SEARCH_ERROR] Failed to parse extracted JSON:", jsonError);
           return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
         }
       } else {
         // No valid JSON found
         console.error("[LAWYER_GEMINI_SEARCH_ERROR] No valid JSON found in response");
         return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
       }
     }

    let relevantLawyers = [...allLawyers];

    if (searchParams.practiceAreas?.length > 0) {
      relevantLawyers = relevantLawyers.filter((lawyer) =>
        searchParams.practiceAreas.some((area: string) =>
          lawyer.specialization.toLowerCase().includes(area.toLowerCase())
        )
      );
    }

    if (searchParams.expertiseNeeded?.length > 0) {
      relevantLawyers = relevantLawyers.filter((lawyer) =>
        searchParams.expertiseNeeded.some((expertise: string) =>
          lawyer.expertise.some((e: string) =>
            e.toLowerCase().includes(expertise.toLowerCase())
          )
        )
      );
    }

    if (searchParams.location && searchParams.location !== "null") {
      relevantLawyers = relevantLawyers.filter((lawyer) =>
        lawyer.location.toLowerCase().includes(searchParams.location.toLowerCase())
      );
    }

    if (searchParams.experienceLevel && searchParams.experienceLevel !== "null") {
      const minExperience = parseInt(searchParams.experienceLevel);
      if (!isNaN(minExperience)) {
        relevantLawyers = relevantLawyers.filter(
          (lawyer) => lawyer.experience >= minExperience
        );
      }
    }

    if (relevantLawyers.length === 0) {
      relevantLawyers = allLawyers.filter((lawyer) =>
        lawyer.name.toLowerCase().includes(query.toLowerCase()) ||
        lawyer.specialization.toLowerCase().includes(query.toLowerCase()) ||
        lawyer.location.toLowerCase().includes(query.toLowerCase()) ||
        lawyer.expertise.some((e: string) =>
          e.toLowerCase().includes(query.toLowerCase())
        )
      );
    }

    relevantLawyers.sort((a, b) => Number(b.rating) - Number(a.rating));

    return NextResponse.json(relevantLawyers);
  } catch (error) {
    console.error("[LAWYER_GEMINI_SEARCH_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
