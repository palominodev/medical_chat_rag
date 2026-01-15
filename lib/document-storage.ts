import { supabaseAdmin, MedicalDocument, DocumentChunk } from "./supabase";
import { EmbeddedChunk } from "./pdf-processing";

// ============================================
// Interfaces
// ============================================

export interface SaveDocumentParams {
  filename: string;
  userId?: string;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: string;
    totalPages?: number;
    totalChunks?: number;
    storagePath?: string;
  };
}

export interface SaveDocumentResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export interface SaveChunksResult {
  success: boolean;
  savedCount: number;
  error?: string;
}

// ============================================
// Funciones de Almacenamiento
// ============================================

/**
 * Guarda un documento en la tabla medical_documents
 * 
 * @param params - Parámetros del documento
 * @returns Resultado con el ID del documento creado
 */
export async function saveDocument(
  params: SaveDocumentParams
): Promise<SaveDocumentResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("medical_documents")
      .insert({
        filename: params.filename,
        user_id: params.userId || null,
        metadata: params.metadata || null
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("Error saving document:", error);
      return {
        success: false,
        error: `Error al guardar documento: ${error.message}`
      };
    }
    
    return {
      success: true,
      documentId: data.id
    };
  } catch (error) {
    console.error("Error in saveDocument:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    };
  }
}

/**
 * Guarda los chunks con embeddings en la tabla document_chunks
 * 
 * @param documentId - ID del documento padre
 * @param chunks - Chunks con embeddings generados
 * @returns Resultado con el número de chunks guardados
 */
export async function saveChunksWithEmbeddings(
  documentId: string,
  chunks: EmbeddedChunk[]
): Promise<SaveChunksResult> {
  try {
    // Preparar datos para inserción
    const chunksToInsert = chunks.map(chunk => ({
      document_id: documentId,
      content: chunk.content,
      embedding: chunk.embedding,
      page_number: chunk.pageNumber,
      chunk_index: chunk.chunkIndex,
      metadata: chunk.metadata
    }));
    
    // Insertar en batch
    const { error } = await supabaseAdmin
      .from("document_chunks")
      .insert(chunksToInsert);
    
    if (error) {
      console.error("Error saving chunks:", error);
      return {
        success: false,
        savedCount: 0,
        error: `Error al guardar chunks: ${error.message}`
      };
    }
    
    return {
      success: true,
      savedCount: chunks.length
    };
  } catch (error) {
    console.error("Error in saveChunksWithEmbeddings:", error);
    return {
      success: false,
      savedCount: 0,
      error: error instanceof Error ? error.message : "Error desconocido"
    };
  }
}

/**
 * Obtiene un documento por su ID
 * 
 * @param documentId - ID del documento
 * @returns Documento o null si no existe
 */
export async function getDocumentById(
  documentId: string
): Promise<MedicalDocument | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("medical_documents")
      .select("*")
      .eq("id", documentId)
      .single();
    
    if (error) {
      console.error("Error getting document:", error);
      return null;
    }
    
    return data as MedicalDocument;
  } catch (error) {
    console.error("Error in getDocumentById:", error);
    return null;
  }
}

/**
 * Obtiene todos los chunks de un documento
 * 
 * @param documentId - ID del documento
 * @returns Array de chunks ordenados por índice
 */
export async function getDocumentChunks(
  documentId: string
): Promise<DocumentChunk[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("document_chunks")
      .select("*")
      .eq("document_id", documentId)
      .order("chunk_index", { ascending: true });
    
    if (error) {
      console.error("Error getting chunks:", error);
      return [];
    }
    
    return (data as DocumentChunk[]) || [];
  } catch (error) {
    console.error("Error in getDocumentChunks:", error);
    return [];
  }
}

/**
 * Elimina un documento y todos sus chunks asociados
 * La eliminación de chunks es automática por CASCADE
 * 
 * @param documentId - ID del documento a eliminar
 * @returns true si se eliminó correctamente
 */
export async function deleteDocument(documentId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("medical_documents")
      .delete()
      .eq("id", documentId);
    
    if (error) {
      console.error("Error deleting document:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteDocument:", error);
    return false;
  }
}

/**
 * Obtiene todos los documentos de un usuario
 * 
 * @param userId - ID del usuario
 * @returns Array de documentos
 */
export async function getUserDocuments(
  userId: string
): Promise<MedicalDocument[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("medical_documents")
      .select("*")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false });
    
    if (error) {
      console.error("Error getting user documents:", error);
      return [];
    }
    
    return (data as MedicalDocument[]) || [];
  } catch (error) {
    console.error("Error in getUserDocuments:", error);
    return [];
  }
}

/**
 * Obtiene todos los documentos (sin filtro de usuario)
 * Útil para demo o admin
 * 
 * @returns Array de documentos
 */
/**
 * Sube un archivo al bucket 'files' de Supabase Storage
 * 
 * @param file - Archivo a subir (Buffer)
 * @param filename - Nombre original del archivo
 * @param contentType - Tipo de contenido (mimetype)
 * @returns Path del archivo subido o null si hubo error
 */
export async function uploadFileToStorage(
  file: Buffer,
  filename: string,
  contentType: string = 'application/pdf'
): Promise<string | null> {
  try {
    // Generar un nombre único para evitar colisiones
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `documents/${timestamp}_${sanitizedFilename}`;

    const { data, error } = await supabaseAdmin
      .storage
      .from('files')
      .upload(filePath, file, {
        contentType,
        upsert: false
      });

    if (error) {
      console.error("Error uploading file to storage:", error);
      return null;
    }

    return data.path;
  } catch (error) {
    console.error("Error in uploadFileToStorage:", error);
    return null;
  }
}

export async function getAllDocuments(): Promise<MedicalDocument[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("medical_documents")
      .select("*")
      .order("uploaded_at", { ascending: false });
    
    if (error) {
      console.error("Error getting all documents:", error);
      return [];
    }
    
    return (data as MedicalDocument[]) || [];
  } catch (error) {
    console.error("Error in getAllDocuments:", error);
    return [];
  }
}
