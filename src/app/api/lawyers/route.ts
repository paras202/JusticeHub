// app/api/lawyers/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db"; // or wherever your `db` is initialized
import { lawyers } from "@/db/schema";

export async function GET() {
  try {
    const result = await db.select().from(lawyers);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
