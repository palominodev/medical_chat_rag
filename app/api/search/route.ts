import { NextRequest, NextResponse } from "next/server";
import { semanticSearch, searchDocumentChunks, formatChunksAsContext } from "@/lib/retrieval";

// ============================================
// POST /api/search
// Búsqueda semántica en documentos
// ============================================

interface SearchRequest {
  query: string;
  documentId?: string;
  topK?: number;
  threshold?: number;
  format?: "raw" | "context";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SearchRequest;
    
    // Validar query
    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        { error: "Se requiere una consulta (query)" },
        { status: 400 }
      );
    }
    
    const query = body.query.trim();
    if (query.length < 3) {
      return NextResponse.json(
        { error: "La consulta debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }
    
    // Configuración de búsqueda
    const config = {
      topK: Math.min(body.topK || 5, 20), // Máximo 20 resultados
      threshold: Math.max(0, Math.min(body.threshold || 0.7, 1)) // Entre 0 y 1
    };
    
    // Ejecutar búsqueda
    const results = body.documentId
      ? await searchDocumentChunks(query, body.documentId, config)
      : await semanticSearch(query, config);
    
    // Formatear respuesta
    if (body.format === "context") {
      // Retornar como contexto formateado para LLM
      return NextResponse.json({
        success: true,
        data: {
          query,
          context: formatChunksAsContext(results),
          chunksFound: results.length
        }
      });
    }
    
    // Retornar resultados raw
    return NextResponse.json({
      success: true,
      data: {
        query,
        results: results.map(chunk => ({
          id: chunk.id,
          content: chunk.content,
          similarity: chunk.similarity,
          similarityPercent: `${(chunk.similarity * 100).toFixed(1)}%`
        })),
        totalResults: results.length,
        config: {
          topK: config.topK,
          threshold: config.threshold,
          documentId: body.documentId || null
        }
      }
    });
    
  } catch (error) {
    console.error("[API] Error in search:", error);
    
    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message.includes("embedQuery")) {
        return NextResponse.json(
          { error: "Error al procesar la consulta. Verifica la configuración de Gemini." },
          { status: 500 }
        );
      }
      if (error.message.includes("match_documents")) {
        return NextResponse.json(
          { error: "Error en la búsqueda de base de datos. Verifica la configuración de Supabase." },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Error interno del servidor al realizar la búsqueda" },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/search - Información del endpoint
// ============================================

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/search",
    method: "POST",
    description: "Búsqueda semántica en documentos médicos",
    body: {
      query: "string (requerido) - Consulta de búsqueda",
      documentId: "string (opcional) - ID del documento donde buscar",
      topK: "number (opcional, default: 5) - Número de resultados",
      threshold: "number (opcional, default: 0.7) - Similitud mínima (0-1)",
      format: "'raw' | 'context' (opcional, default: 'raw') - Formato de respuesta"
    },
    examples: {
      searchInDocument: {
        query: "¿Cuál es el diagnóstico del paciente?",
        documentId: "uuid-del-documento"
      },
      searchAll: {
        query: "análisis de sangre",
        topK: 10,
        threshold: 0.6
      },
      forLLM: {
        query: "resultados de laboratorio",
        documentId: "uuid",
        format: "context"
      }
    }
  });
}
