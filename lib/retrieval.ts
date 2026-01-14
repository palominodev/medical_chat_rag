import { supabaseAdmin, MatchDocumentsParams, MatchDocumentsResult } from "./supabase";
import { embedQuery } from "./embeddings";

// ============================================
// Interfaces
// ============================================

export interface RetrievalConfig {
  topK: number;           // Número de chunks a retornar (5-10 recomendado)
  threshold: number;      // Similitud mínima (0.0 - 1.0, recomendado 0.7)
}

export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
  metadata: {
    documentType: string;
    processedAt: string;
  } | null;
}

// ============================================
// Configuración por defecto
// ============================================

const DEFAULT_RETRIEVAL_CONFIG: RetrievalConfig = {
  topK: 5,
  threshold: 0.7
};

// ============================================
// Funciones de Recuperación
// ============================================

/**
 * Realiza una búsqueda semántica en todos los documentos
 * Vectoriza la query y busca los chunks más similares
 * 
 * @param query - Consulta del usuario
 * @param config - Configuración de búsqueda opcional
 * @returns Array de chunks relevantes ordenados por similitud
 */
export async function semanticSearch(
  query: string,
  config: Partial<RetrievalConfig> = {}
): Promise<RetrievedChunk[]> {
  const { topK, threshold } = { ...DEFAULT_RETRIEVAL_CONFIG, ...config };
  
  // 1. Vectorizar la query
  const queryEmbedding = await embedQuery(query);
  
  // 2. Buscar chunks similares usando la función RPC
  const params: MatchDocumentsParams = {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
    filter_document_id: null
  };
  
  const { data, error } = await supabaseAdmin.rpc("match_documents", params);
  
  if (error) {
    console.error("Error in semantic search:", error);
    throw new Error(`Error en búsqueda semántica: ${error.message}`);
  }
  
  // 3. Mapear resultados
  return (data as MatchDocumentsResult[] || []).map(result => ({
    id: result.id,
    content: result.content,
    similarity: result.similarity,
    metadata: result.metadata
  }));
}

/**
 * Realiza una búsqueda semántica en un documento específico
 * Útil para RAG cuando el usuario ya seleccionó un documento
 * 
 * @param query - Consulta del usuario
 * @param documentId - ID del documento donde buscar
 * @param config - Configuración de búsqueda opcional
 * @returns Array de chunks relevantes del documento
 */
export async function searchDocumentChunks(
  query: string,
  documentId: string,
  config: Partial<RetrievalConfig> = {}
): Promise<RetrievedChunk[]> {
  const { topK, threshold } = { ...DEFAULT_RETRIEVAL_CONFIG, ...config };
  
  // 1. Vectorizar la query
  const queryEmbedding = await embedQuery(query);
  
  // 2. Buscar chunks similares en el documento específico
  const params: MatchDocumentsParams = {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
    filter_document_id: documentId
  };
  
  const { data, error } = await supabaseAdmin.rpc("match_documents", params);
  
  if (error) {
    console.error("Error in document search:", error);
    throw new Error(`Error buscando en documento: ${error.message}`);
  }
  
  return (data as MatchDocumentsResult[] || []).map(result => ({
    id: result.id,
    content: result.content,
    similarity: result.similarity,
    metadata: result.metadata
  }));
}

/**
 * Formatea los chunks recuperados como contexto para el LLM
 * 
 * @param chunks - Chunks recuperados
 * @param separator - Separador entre chunks
 * @returns Texto formateado para usar como contexto
 */
export function formatChunksAsContext(
  chunks: RetrievedChunk[],
  separator: string = "\n\n---\n\n"
): string {
  if (chunks.length === 0) {
    return "No se encontró información relevante en el documento.";
  }
  
  return chunks
    .map((chunk, index) => 
      `[Fragmento ${index + 1} - Similitud: ${(chunk.similarity * 100).toFixed(1)}%]\n${chunk.content}`
    )
    .join(separator);
}

/**
 * Búsqueda híbrida: combina semántica + keywords
 * Realiza búsqueda semántica y filtra por palabras clave si es necesario
 * 
 * @param query - Consulta del usuario
 * @param documentId - ID del documento donde buscar
 * @param config - Configuración de búsqueda
 * @returns Array de chunks relevantes
 */
export async function hybridSearch(
  query: string,
  documentId: string,
  config: Partial<RetrievalConfig> = {}
): Promise<RetrievedChunk[]> {
  // Por ahora, la búsqueda híbrida usa principalmente la semántica
  // ya que pgvector no tiene full-text search integrado
  // La "hibridez" viene del threshold que filtra resultados no relevantes
  
  const results = await searchDocumentChunks(query, documentId, {
    topK: (config.topK || DEFAULT_RETRIEVAL_CONFIG.topK) * 2, // Buscar más para filtrar
    threshold: config.threshold || 0.5 // Threshold más bajo para obtener más candidatos
  });
  
  // Filtrar y tomar los mejores resultados
  const finalThreshold = config.threshold || DEFAULT_RETRIEVAL_CONFIG.threshold;
  const finalTopK = config.topK || DEFAULT_RETRIEVAL_CONFIG.topK;
  
  return results
    .filter(chunk => chunk.similarity >= finalThreshold)
    .slice(0, finalTopK);
}
