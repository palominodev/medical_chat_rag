// Worker setup must be imported BEFORE pdf-parse
import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { embedBatch, EMBEDDING_DIMENSIONS } from "./embeddings";

// Configure worker for Next.js/serverless environment
PDFParse.setWorker(getPath());

// ============================================
// Interfaces
// ============================================

interface ChunkingConfig {
  chunkSize: number;      // Tamaño máximo del chunk en caracteres
  chunkOverlap: number;   // Superposición entre chunks
}

export interface ProcessedChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
  metadata: {
    documentType: string;
    processedAt: string;
  };
}

export interface EmbeddedChunk extends ProcessedChunk {
  embedding: number[];
}

export interface PDFProcessingResult {
  success: boolean;
  chunks: ProcessedChunk[];
  totalPages: number;
  totalChunks: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
  error?: string;
}

// ============================================
// Configuración por defecto para documentos médicos
// ============================================

const MEDICAL_CHUNK_CONFIG: ChunkingConfig = {
  chunkSize: 1200,        // 1000-1500 caracteres recomendado
  chunkOverlap: 250       // 20% del chunk aproximadamente
};

// ============================================
// Funciones principales
// ============================================

/**
 * Procesa un documento PDF y lo divide en chunks para vectorización
 * @param pdfBuffer - Buffer del archivo PDF
 * @param config - Configuración opcional de chunking
 * @returns Resultado del procesamiento con chunks
 */
export async function processDocument(
  pdfBuffer: Buffer,
  config: ChunkingConfig = MEDICAL_CHUNK_CONFIG
): Promise<PDFProcessingResult> {
  // Crear instancia del parser con el buffer
  const parser = new PDFParse({ data: pdfBuffer });
  
  try {
    // 1. Obtener información del documento
    const info = await parser.getInfo();
    const totalPages = info.total || 0;
    
    // 2. Extraer texto del PDF usando getText()
    const textResult = await parser.getText();
    const fullText = textResult.text;
    
    // 3. Verificar que hay contenido
    if (!fullText || fullText.trim().length === 0) {
      await parser.destroy();
      return {
        success: false,
        chunks: [],
        totalPages,
        totalChunks: 0,
        metadata: {},
        error: "El PDF no contiene texto extraíble. Puede ser un documento escaneado sin OCR."
      };
    }
    
    // 4. Dividir en chunks
    const textChunks = splitIntoChunks(fullText, config);
    
    // 5. Crear chunks procesados con metadata
    const processedChunks: ProcessedChunk[] = textChunks.map((content, index) => ({
      content,
      pageNumber: estimatePageNumber(index, textChunks.length, totalPages),
      chunkIndex: index,
      metadata: {
        documentType: "medical_record",
        processedAt: new Date().toISOString()
      }
    }));
    
    // 6. Limpiar recursos
    await parser.destroy();
    
    return {
      success: true,
      chunks: processedChunks,
      totalPages,
      totalChunks: processedChunks.length,
      metadata: {
        title: info.info?.Title || undefined,
        author: info.info?.Author || undefined,
        creationDate: info.info?.CreationDate || undefined
      }
    };
    
  } catch (error) {
    console.error("Error processing PDF:", error);
    // Asegurar limpieza en caso de error
    try {
      await parser.destroy();
    } catch {
      // Ignorar errores al destruir
    }
    return {
      success: false,
      chunks: [],
      totalPages: 0,
      totalChunks: 0,
      metadata: {},
      error: error instanceof Error ? error.message : "Error desconocido al procesar el PDF"
    };
  }
}

/**
 * Divide el texto en chunks con superposición
 * @param text - Texto completo a dividir
 * @param config - Configuración de chunking
 * @returns Array de strings (chunks)
 */
function splitIntoChunks(
  text: string,
  config: ChunkingConfig
): string[] {
  const { chunkSize, chunkOverlap } = config;
  const chunks: string[] = [];
  
  // Limpiar el texto
  const cleanedText = cleanText(text);
  
  // Dividir por párrafos primero (mejor para documentos médicos)
  const paragraphs = cleanedText.split(/\n\n+/);
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    if (!trimmedParagraph) continue;
    
    // Si añadir el párrafo excede el tamaño máximo
    if ((currentChunk + "\n\n" + trimmedParagraph).length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        
        // Mantener overlap para contexto
        const words = currentChunk.split(/\s+/);
        const overlapWords = Math.ceil(chunkOverlap / 5); // ~5 chars per word
        const overlap = words.slice(-overlapWords).join(" ");
        currentChunk = overlap + "\n\n" + trimmedParagraph;
      } else {
        // Párrafo muy largo, dividir por oraciones
        const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [trimmedParagraph];
        
        for (const sentence of sentences) {
          if ((currentChunk + " " + sentence).length > chunkSize) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? " " : "") + sentence;
          }
        }
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedParagraph;
    }
  }
  
  // Agregar el último chunk si existe
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // Filtrar chunks muy pequeños (menos de 50 caracteres)
  return chunks.filter(chunk => chunk.length >= 50);
}

/**
 * Limpia el texto extraído del PDF
 * @param text - Texto a limpiar
 * @returns Texto limpio
 */
function cleanText(text: string): string {
  return text
    // Normalizar saltos de línea
    .replace(/\r\n/g, "\n")
    // Eliminar múltiples espacios
    .replace(/[ \t]+/g, " ")
    // Eliminar líneas vacías múltiples
    .replace(/\n{3,}/g, "\n\n")
    // Eliminar caracteres de control
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Trim cada línea
    .split("\n")
    .map(line => line.trim())
    .join("\n")
    .trim();
}

/**
 * Estima el número de página para un chunk
 * @param chunkIndex - Índice del chunk
 * @param totalChunks - Total de chunks
 * @param totalPages - Total de páginas del PDF
 * @returns Número de página estimado
 */
function estimatePageNumber(
  chunkIndex: number,
  totalChunks: number,
  totalPages: number
): number {
  if (totalChunks === 0 || totalPages === 0) return 1;
  
  // Distribución proporcional
  const pageEstimate = Math.floor((chunkIndex / totalChunks) * totalPages) + 1;
  return Math.min(pageEstimate, totalPages);
}

/**
 * Obtiene estadísticas del documento procesado
 */
export function getDocumentStats(result: PDFProcessingResult): {
  averageChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  totalCharacters: number;
} {
  if (result.chunks.length === 0) {
    return {
      averageChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
      totalCharacters: 0
    };
  }
  
  const sizes = result.chunks.map(c => c.content.length);
  const total = sizes.reduce((a, b) => a + b, 0);
  
  return {
    averageChunkSize: Math.round(total / sizes.length),
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
    totalCharacters: total
  };
}

// ============================================
// Resultado con Embeddings
// ============================================

export interface PDFEmbeddingResult {
  success: boolean;
  chunks: EmbeddedChunk[];
  totalPages: number;
  totalChunks: number;
  embeddingDimensions: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
  error?: string;
}

/**
 * Procesa un documento PDF y genera embeddings para cada chunk
 * Combina extracción de texto + chunking + vectorización
 * 
 * @param pdfBuffer - Buffer del archivo PDF
 * @param config - Configuración opcional de chunking
 * @returns Resultado con chunks y sus embeddings
 */
export async function processAndEmbedDocument(
  pdfBuffer: Buffer,
  config: ChunkingConfig = MEDICAL_CHUNK_CONFIG
): Promise<PDFEmbeddingResult> {
  // 1. Procesar el PDF y obtener chunks
  const processingResult = await processDocument(pdfBuffer, config);
  
  if (!processingResult.success) {
    return {
      success: false,
      chunks: [],
      totalPages: processingResult.totalPages,
      totalChunks: 0,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
      metadata: processingResult.metadata,
      error: processingResult.error
    };
  }
  
  try {
    // 2. Extraer textos de los chunks
    const texts = processingResult.chunks.map(chunk => chunk.content);
    
    // 3. Generar embeddings en batch
    const batchResult = await embedBatch(texts);
    
    // 4. Combinar chunks con embeddings
    const embeddedChunks: EmbeddedChunk[] = processingResult.chunks.map((chunk, index) => ({
      ...chunk,
      embedding: batchResult.embeddings[index]?.embedding ?? []
    }));
    
    return {
      success: true,
      chunks: embeddedChunks,
      totalPages: processingResult.totalPages,
      totalChunks: embeddedChunks.length,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
      metadata: processingResult.metadata
    };
    
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return {
      success: false,
      chunks: [],
      totalPages: processingResult.totalPages,
      totalChunks: 0,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
      metadata: processingResult.metadata,
      error: error instanceof Error ? error.message : "Error desconocido al generar embeddings"
    };
  }
}
