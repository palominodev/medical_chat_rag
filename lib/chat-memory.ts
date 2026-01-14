import { supabaseAdmin, ChatSession, ChatMessage } from "./supabase";

// ============================================
// Interfaces de Resultado
// ============================================

export interface CreateSessionResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface SaveMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// Gestión de Sesiones
// ============================================

/**
 * Crea una nueva sesión de chat
 * 
 * @param documentId - ID del documento médico asociado (opcional)
 * @param userId - ID del usuario (opcional)
 * @param title - Título de la sesión (opcional)
 * @returns Resultado con el ID de la sesión creada
 */
export async function createChatSession(
  documentId?: string,
  userId?: string,
  title?: string
): Promise<CreateSessionResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_sessions")
      .insert({
        document_id: documentId || null,
        user_id: userId || null,
        title: title || null
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating chat session:", error);
      return {
        success: false,
        error: `Error al crear sesión: ${error.message}`
      };
    }

    return {
      success: true,
      sessionId: data.id
    };
  } catch (error) {
    console.error("Error in createChatSession:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    };
  }
}

/**
 * Obtiene una sesión por su ID
 * 
 * @param sessionId - ID de la sesión
 * @returns Sesión o null si no existe
 */
export async function getSessionById(
  sessionId: string
): Promise<ChatSession | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error) {
      console.error("Error getting session:", error);
      return null;
    }

    return data as ChatSession;
  } catch (error) {
    console.error("Error in getSessionById:", error);
    return null;
  }
}

/**
 * Obtiene todas las sesiones de chat de un usuario
 * 
 * @param userId - ID del usuario
 * @returns Array de sesiones ordenadas por fecha de actualización
 */
export async function getUserChatSessions(
  userId: string
): Promise<ChatSession[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error getting user sessions:", error);
      return [];
    }

    return (data as ChatSession[]) || [];
  } catch (error) {
    console.error("Error in getUserChatSessions:", error);
    return [];
  }
}

/**
 * Obtiene todas las sesiones de chat de un documento
 * 
 * @param documentId - ID del documento médico
 * @returns Array de sesiones ordenadas por fecha de actualización
 */
export async function getDocumentChatSessions(
  documentId: string
): Promise<ChatSession[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_sessions")
      .select("*")
      .eq("document_id", documentId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error getting document sessions:", error);
      return [];
    }

    return (data as ChatSession[]) || [];
  } catch (error) {
    console.error("Error in getDocumentChatSessions:", error);
    return [];
  }
}

/**
 * Actualiza el título de una sesión
 * 
 * @param sessionId - ID de la sesión
 * @param title - Nuevo título
 * @returns true si se actualizó correctamente
 */
export async function updateSessionTitle(
  sessionId: string,
  title: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("chat_sessions")
      .update({ title })
      .eq("id", sessionId);

    if (error) {
      console.error("Error updating session title:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateSessionTitle:", error);
    return false;
  }
}

/**
 * Elimina una sesión y todos sus mensajes (CASCADE)
 * 
 * @param sessionId - ID de la sesión a eliminar
 * @returns true si se eliminó correctamente
 */
export async function deleteChatSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      console.error("Error deleting session:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteChatSession:", error);
    return false;
  }
}

// ============================================
// Gestión de Mensajes
// ============================================

/**
 * Guarda un mensaje en el historial de chat
 * 
 * @param sessionId - ID de la sesión
 * @param role - Rol del mensaje (user, assistant, system)
 * @param content - Contenido del mensaje
 * @param metadata - Metadata adicional (opcional)
 * @returns Resultado con el ID del mensaje creado
 */
export async function saveChatMessage(
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: Record<string, unknown>
): Promise<SaveMessageResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role,
        content,
        metadata: metadata || null
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error saving chat message:", error);
      return {
        success: false,
        error: `Error al guardar mensaje: ${error.message}`
      };
    }

    return {
      success: true,
      messageId: data.id
    };
  } catch (error) {
    console.error("Error in saveChatMessage:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    };
  }
}

/**
 * Obtiene el historial de chat de una sesión
 * 
 * @param sessionId - ID de la sesión
 * @param limit - Número máximo de mensajes a obtener (default: 50)
 * @returns Array de mensajes ordenados cronológicamente
 */
export async function getChatHistory(
  sessionId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .select("id, session_id, role, content, metadata, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error getting chat history:", error);
      return [];
    }

    return (data as ChatMessage[]) || [];
  } catch (error) {
    console.error("Error in getChatHistory:", error);
    return [];
  }
}

// ============================================
// Formateo y Optimización
// ============================================

/**
 * Formatea el historial de chat para incluir en el prompt del LLM
 * 
 * @param messages - Array de mensajes
 * @returns String formateado con el historial
 */
export function formatChatHistory(messages: ChatMessage[]): string {
  if (messages.length === 0) return "";

  return messages
    .map(msg => {
      const roleLabel = msg.role === "user" ? "Usuario" : 
                        msg.role === "assistant" ? "Asistente" : "Sistema";
      return `${roleLabel}: ${msg.content}`;
    })
    .join("\n\n");
}

/**
 * Obtiene el historial optimizado con ventana deslizante
 * Retorna los últimos N mensajes para mantener contexto sin exceder límites de tokens
 * 
 * @param sessionId - ID de la sesión
 * @param windowSize - Tamaño de la ventana (default: 10)
 * @returns String formateado con el historial reciente
 */
export async function getOptimizedHistory(
  sessionId: string,
  windowSize: number = 10
): Promise<string> {
  // Obtener los últimos mensajes según el tamaño de ventana
  const messages = await getChatHistory(sessionId, windowSize);
  
  return formatChatHistory(messages);
}

/**
 * Obtiene el historial como array de objetos {role, content}
 * Útil para APIs que esperan este formato (ej: OpenAI, Gemini)
 * 
 * @param sessionId - ID de la sesión
 * @param windowSize - Tamaño de la ventana (default: 10)
 * @returns Array de objetos con role y content
 */
export async function getHistoryForLLM(
  sessionId: string,
  windowSize: number = 10
): Promise<Array<{ role: string; content: string }>> {
  const messages = await getChatHistory(sessionId, windowSize);
  
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}
