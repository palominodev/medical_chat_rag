import { 
  createChatSession, 
  getChatHistory, 
  saveChatMessage, 
  formatChatHistory 
} from "./chat-memory";
import { 
  hybridSearch, 
  formatChunksAsContext,
  RetrievedChunk
} from "./retrieval";
import { 
  generateResponse, 
  generateResponseStream 
} from "./response-generation";

// ============================================
// Interfaces
// ============================================

export interface ProcessChatResult {
  response: string;
  sessionId: string;
  sources: RetrievedChunk[];
}

export interface ChatConfig {
  stream?: boolean;
  modelTemperature?: number;
  userId?: string;
  title?: string;
}

// ============================================
// Funciones de Orquestación
// ============================================

/**
 * Procesa un mensaje de chat completo (Non-streaming)
 * 1. Recupera/Crea sesión
 * 2. Busca contexto relevante
 * 3. Recupera historial
 * 4. Genera respuesta
 * 5. Guarda interacción
 * 
 * @param message - Mensaje del usuario
 * @param documentId - ID del documento médico
 * @param sessionId - ID de sesión (opcional, se crea si no existe)
 * @param config - Configuración opcional
 */
export async function processChat(
  message: string,
  documentId: string,
  sessionId?: string,
  config?: ChatConfig
): Promise<ProcessChatResult> {
  // 1. Gestionar sesión
  let currentSessionId = sessionId;
  if (!currentSessionId) {
    const sessionResult = await createChatSession(
      documentId, 
      config?.userId, 
      config?.title
    );
    if (!sessionResult.success || !sessionResult.sessionId) {
      throw new Error("No se pudo crear la sesión de chat");
    }
    currentSessionId = sessionResult.sessionId;
  }

  // 2. Buscar contexto relevante (RAG)
  // Usamos búsqueda híbrida para mejor precisión
  const relevantChunks = await hybridSearch(message, documentId, {
    topK: 5,
    threshold: 0.6 // Ligeramente más permisivo para capturar contexto
  });
  
  const context = formatChunksAsContext(relevantChunks);

  // 3. Recuperar historial de conversación
  // Limitamos a los últimos 10 mensajes para no saturar el contexto
  const history = await getChatHistory(currentSessionId, 10);
  const formattedHistory = formatChatHistory(history);

  // 4. Generar respuesta con LLM
  const response = await generateResponse(
    context,
    formattedHistory,
    message,
    { temperature: config?.modelTemperature }
  );

  // 5. Guardar interacción en historial
  // Primero guardamos el mensaje del usuario si no es una sesión nueva sin mensajes
  await saveChatMessage(currentSessionId, "user", message);
  await saveChatMessage(currentSessionId, "assistant", response);

  return {
    response,
    sessionId: currentSessionId,
    sources: relevantChunks
  };
}

/**
 * Procesa un mensaje de chat con Streaming
 * Retorna un generador asíncrono que emite chunks de texto
 * 
 * @param message - Mensaje del usuario
 * @param documentId - ID del documento médico
 * @param sessionId - ID de sesión (opcional, se crea si no existe)
 * @param onSessionCreated - Callback opcional para recibir el ID de sesión creado
 * @param onSourcesRetrieved - Callback opcional para recibir los chunks recuperados
 */
export async function* processChatStream(
  message: string,
  documentId: string,
  sessionId?: string,
  config?: ChatConfig,
  callbacks?: {
    onSessionCreated?: (sessionId: string) => void;
    onSourcesRetrieved?: (sources: RetrievedChunk[]) => void;
    onCompletion?: (fullResponse: string) => void;
  }
): AsyncGenerator<string> {
  // 1. Gestionar sesión
  let currentSessionId = sessionId;
  if (!currentSessionId) {
    const sessionResult = await createChatSession(
      documentId,
      config?.userId,
      config?.title
    );
    if (!sessionResult.success || !sessionResult.sessionId) {
      throw new Error("No se pudo crear la sesión de chat");
    }
    currentSessionId = sessionResult.sessionId;
    callbacks?.onSessionCreated?.(currentSessionId);
  }

  // 2. Buscar contexto relevante (RAG)
  const relevantChunks = await hybridSearch(message, documentId, {
    topK: 5,
    threshold: 0.6
  });
  
  if (callbacks?.onSourcesRetrieved) {
    callbacks.onSourcesRetrieved(relevantChunks);
  }
  
  const context = formatChunksAsContext(relevantChunks);

  // 3. Recuperar historial
  const history = await getChatHistory(currentSessionId, 10);
  const formattedHistory = formatChatHistory(history);

  // 4. Guardar mensaje del usuario ANTES de generar (para mantener orden)
  await saveChatMessage(currentSessionId, "user", message);

  // 5. Generar respuesta en Stream
  let fullResponse = "";
  
  const stream = generateResponseStream(
    context,
    formattedHistory,
    message
  );

  for await (const chunk of stream) {
    fullResponse += chunk;
    yield chunk;
  }

  // 6. Guardar respuesta completa en historial
  await saveChatMessage(currentSessionId, "assistant", fullResponse);
  
  if (callbacks?.onCompletion) {
    callbacks.onCompletion(fullResponse);
  }
}
