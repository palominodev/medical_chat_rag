import { NextRequest, NextResponse } from "next/server";
import { getDocumentChatSessions } from "@/lib/chat-memory";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    
    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const sessions = await getDocumentChatSessions(documentId);

    return NextResponse.json({ sessions });

  } catch (error) {
    console.error("[API] Get sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
