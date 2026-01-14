import { NextRequest, NextResponse } from "next/server";
import { processAndEmbedDocument, getDocumentStats } from "@/lib/pdf-processing";
import { saveDocument, saveChunksWithEmbeddings } from "@/lib/document-storage";

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
    
    // 5. Procesar el PDF y generar embeddings
    const result = await processAndEmbedDocument(buffer);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 422 }
      );
    }
    
    // 6. Guardar documento en Supabase
    const docResult = await saveDocument({
      filename: file.name,
      metadata: {
        title: result.metadata.title,
        author: result.metadata.author,
        creationDate: result.metadata.creationDate,
        totalPages: result.totalPages,
        totalChunks: result.totalChunks
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
