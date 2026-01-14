import { NextRequest, NextResponse } from "next/server";
import { createChatSession } from "@/lib/chat-memory";

export async function POST(req: NextRequest) {
  try {
    const { documentId, title } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    const result = await createChatSession(documentId, undefined, title);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: result.sessionId,
      documentId
    });

  } catch (error) {
    console.error("[API] Create session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
