import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================
// Configuración
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================
// Cliente de Supabase Admin
// ============================================

/**
 * Cliente de Supabase para operaciones del servidor
 * Usa la service role key para bypasear RLS
 * SOLO usar en API routes del servidor
 * NUNCA importar en componentes del cliente
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
