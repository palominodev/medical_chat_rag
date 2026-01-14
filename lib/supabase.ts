import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================
// Configuración
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ============================================
// Clientes de Supabase
// ============================================

/**
 * Cliente de Supabase para operaciones del servidor
 * Usa la service role key para bypasear RLS
 * SOLO usar en API routes del servidor
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Cliente de Supabase para operaciones del cliente
 * Usa la anon key, respeta RLS
 */
export const supabaseClient: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * Crea un cliente de Supabase con un token de acceso específico
 * Útil para operaciones autenticadas del usuario
 */
export function createSupabaseClient(accessToken?: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined
    }
  });
}

// ============================================
// Tipos de la Base de Datos
// ============================================

export interface MedicalDocument {
  id: string;
  filename: string;
  uploaded_at: string;
  user_id: string | null;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
    totalPages?: number;
    totalChunks?: number;
  } | null;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  embedding: number[] | null;
  page_number: number | null;
  chunk_index: number | null;
  metadata: {
    documentType: string;
    processedAt: string;
  } | null;
  created_at: string;
}

// ============================================
// Tipos para RPC match_documents
// ============================================

export interface MatchDocumentsParams {
  query_embedding: number[];
  match_threshold?: number;
  match_count?: number;
  filter_document_id?: string | null;
}

export interface MatchDocumentsResult {
  id: string;
  content: string;
  similarity: number;
  metadata: DocumentChunk["metadata"];
}

// ============================================
// Tipos para Memoria de Conversación
// ============================================

export interface ChatSession {
  id: string;
  document_id: string | null;
  user_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
