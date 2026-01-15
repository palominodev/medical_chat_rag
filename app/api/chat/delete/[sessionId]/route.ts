import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSessionById, deleteChatSession } from "@/lib/chat-memory";
import { getDocumentById, deleteDocument, deleteFileFromStorage } from "@/lib/document-storage";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // 1. Obtener el usuario autenticado
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignorar error si se llama desde un Server Component
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // 2. Obtener la sesión para verificar propiedad y obtener documentId
    const session = await getSessionById(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la sesión pertenezca al usuario (opcional, pero recomendado)
    if (session.user_id && session.user_id !== user.id) {
        return NextResponse.json(
            { error: "No tienes permiso para eliminar esta sesión" },
            { status: 403 }
        );
    }

    // 3. Obtener detalles del documento para el path de storage
    let storagePath = null;
    if (session.document_id) {
        const document = await getDocumentById(session.document_id);
        if (document?.metadata?.storagePath) {
            storagePath = document.metadata.storagePath;
        }
    }

    // 4. Eliminar la sesión (cascada a mensajes)
    const sessionDeleted = await deleteChatSession(sessionId);
    if (!sessionDeleted) {
        return NextResponse.json(
            { error: "Error al eliminar la sesión de chat" },
            { status: 500 }
        );
    }

    // 5. Eliminar el documento (cascada a chunks) y el archivo de storage
    if (session.document_id) {
        // Eliminar documento de la BD
        const docDeleted = await deleteDocument(session.document_id);
        if (!docDeleted) {
            console.error(`Error deleting document ${session.document_id} for session ${sessionId}`);
            // No detenemos el proceso, ya que la sesión ya fue eliminada
        }

        // Eliminar archivo de storage
        if (storagePath) {
            const fileDeleted = await deleteFileFromStorage(storagePath);
            if (!fileDeleted) {
                console.error(`Error deleting file from storage: ${storagePath}`);
            }
        }
    }

    return NextResponse.json({
      success: true,
      message: "Sesión y datos asociados eliminados correctamente"
    });

  } catch (error) {
    console.error("[API] Error deleting session:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al eliminar la sesión" },
      { status: 500 }
    );
  }
}
