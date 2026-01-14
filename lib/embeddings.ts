import { GoogleGenAI } from "@google/genai";

// ============================================
// Configuración
// ============================================

const EMBEDDING_CONFIG = {
  model: "gemini-embedding-001",
  outputDimensionality: 768,  // 768, 1536, o 3072 - 768 es balance óptimo
} as const;

// Inicializar cliente de Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ============================================
// Interfaces
// ============================================

export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
}

// ============================================
// Funciones de Embedding
// ============================================

/**
 * Vectoriza un texto para búsqueda (query del usuario)
 * Usa taskType RETRIEVAL_QUERY optimizado para consultas
 * 
 * @param query - Texto de la consulta del usuario
 * @returns Vector de embeddings
 */
export async function embedQuery(query: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_CONFIG.model,
    contents: query,
    config: {
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: EMBEDDING_CONFIG.outputDimensionality
    }
  });
  
  return response.embeddings?.[0]?.values ?? [];
}

/**
 * Vectoriza múltiples textos para indexación (documentos/chunks)
 * Usa taskType RETRIEVAL_DOCUMENT optimizado para documentos
 * 
 * @param texts - Array de textos a vectorizar
 * @returns Array de vectores de embeddings
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_CONFIG.model,
    contents: texts,
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: EMBEDDING_CONFIG.outputDimensionality
    }
  });
  
  return response.embeddings?.map(e => e.values ?? []) ?? [];
}

/**
 * Vectoriza un solo documento/chunk para indexación
 * 
 * @param text - Texto del documento a vectorizar
 * @returns Vector de embeddings
 */
export async function embedDocument(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_CONFIG.model,
    contents: text,
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: EMBEDDING_CONFIG.outputDimensionality
    }
  });
  
  return response.embeddings?.[0]?.values ?? [];
}

/**
 * Vectoriza textos en batch para mejor rendimiento
 * Recomendado para procesar múltiples chunks de un documento
 * 
 * @param texts - Array de textos a vectorizar
 * @returns Resultado con embeddings y metadata
 */
export async function embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_CONFIG.model,
    contents: texts,
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: EMBEDDING_CONFIG.outputDimensionality
    }
  });
  
  return {
    embeddings: (response.embeddings ?? []).map((e, index) => ({
      embedding: e.values ?? [],
      text: texts[index]
    }))
  };
}

/**
 * Calcula la similitud coseno entre dos vectores
 * Útil para comparaciones locales
 * 
 * @param a - Primer vector
 * @param b - Segundo vector
 * @returns Similitud coseno (0 a 1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Los vectores deben tener la misma dimensión");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============================================
// Configuración exportada
// ============================================

export const EMBEDDING_DIMENSIONS = EMBEDDING_CONFIG.outputDimensionality;
export const EMBEDDING_MODEL = EMBEDDING_CONFIG.model;
