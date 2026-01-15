import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { processAndEmbedDocument, getDocumentStats } from "@/lib/pdf-processing";
import { saveDocument, saveChunksWithEmbeddings, uploadFileToStorage } from "@/lib/document-storage";

export async function POST(request: NextRequest) {
  try {
    // 1. Obtener el FormData con el archivo
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }
    
    // 2. Validar que sea un PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "El archivo debe ser un PDF" },
        { status: 400 }
      );
    }
    
    // 3. Validar tamaño (máximo 20MB)
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo de 20MB" },
        { status: 400 }
      );
    }
    
    // 4. Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4.5. Subir archivo a Supabase Storage
    const storagePath = await uploadFileToStorage(buffer, file.name);
    
    if (!storagePath) {
      return NextResponse.json(
        { error: "Error al subir el archivo al almacenamiento" },
        { status: 500 }
      );
    }
    
    // 5. Procesar el PDF y generar embeddings
    const result = await processAndEmbedDocument(buffer);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 422 }
      );
    }
    
    // 5.5. Obtener el usuario autenticado
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
    // 6. Guardar documento en Supabase
    const docResult = await saveDocument({
      userId: user.id,
      filename: file.name,
      metadata: {
        title: result.metadata.title,
        author: result.metadata.author,
        creationDate: result.metadata.creationDate,
        totalPages: result.totalPages,
        totalChunks: result.totalChunks,
        storagePath: storagePath
      }
    });
    
    if (!docResult.success || !docResult.documentId) {
      return NextResponse.json(
        { error: docResult.error || "Error al guardar documento" },
        { status: 500 }
      );
    }
    
    // 7. Guardar chunks con embeddings
    const chunksResult = await saveChunksWithEmbeddings(
      docResult.documentId,
      result.chunks
    );
    
    if (!chunksResult.success) {
      return NextResponse.json(
        { error: chunksResult.error || "Error al guardar chunks" },
        { status: 500 }
      );
    }
    
    // 8. Obtener estadísticas
    const stats = {
      averageChunkSize: result.chunks.length > 0
        ? Math.round(result.chunks.reduce((sum, c) => sum + c.content.length, 0) / result.chunks.length)
        : 0,
      totalCharacters: result.chunks.reduce((sum, c) => sum + c.content.length, 0),
      embeddingDimensions: result.embeddingDimensions
    };
    
    // 9. Retornar resultado exitoso
    return NextResponse.json({
      success: true,
      data: {
        documentId: docResult.documentId,
        filename: file.name,
        totalPages: result.totalPages,
        totalChunks: result.totalChunks,
        savedChunks: chunksResult.savedCount,
        metadata: result.metadata,
        stats: stats
      }
    });
    
  } catch (error) {
    console.error("[API] Error uploading document:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el documento" },
      { status: 500 }
    );
  }
}

// Configurar tiempo máximo para procesamiento de PDFs grandes
export const maxDuration = 60; // 60 segundos
