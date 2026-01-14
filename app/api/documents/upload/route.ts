import { NextRequest, NextResponse } from "next/server";
import { processDocument, getDocumentStats } from "@/lib/pdf-processing";

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
    
    // 5. Procesar el PDF
    const result = await processDocument(buffer);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 422 }
      );
    }
    
    // 6. Obtener estadísticas
    const stats = getDocumentStats(result);
    
    // 7. Retornar resultado exitoso
    return NextResponse.json({
      success: true,
      data: {
        filename: file.name,
        totalPages: result.totalPages,
        totalChunks: result.totalChunks,
        chunks: result.chunks,
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
 
// Configurar para archivos grandes
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
