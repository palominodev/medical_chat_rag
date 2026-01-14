import { NextRequest, NextResponse } from "next/server";
import { getChatHistory } from "@/lib/chat-memory";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const messages = await getChatHistory(sessionId, limit);

    return NextResponse.json({
      messages,
      sessionId
    });

  } catch (error) {
    console.error("[API] Get history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
