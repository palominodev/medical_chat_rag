import { NextRequest, NextResponse } from "next/server";
import { getSessionById } from "@/lib/chat-memory";
import { getDocumentById } from "@/lib/document-storage";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // 1. Obtener la sesión
    const session = await getSessionById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // 2. Obtener el documento asociado
    let document = null;
    let signedUrl = null;

    if (session.document_id) {
      document = await getDocumentById(session.document_id);
      
      if (document) {
        // 3. Generar URL firmada para el documento
        const storagePath = document.metadata?.storagePath;
        
        if (storagePath) {
             const { data: urlData, error: urlError } = await supabaseAdmin
            .storage
            .from('files')
            .createSignedUrl(storagePath, 3600); // 1 hora
            
            if (!urlError && urlData) {
                signedUrl = urlData.signedUrl;
            }
        }
      }
    }

    return NextResponse.json({
      session,
      document: document ? {
        ...document,
        url: signedUrl
      } : null
    });

  } catch (error) {
    console.error("[API] Get session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
