import { GoogleGenAI } from "@google/genai";

// ============================================
// Configuración del Modelo
// ============================================

const CHAT_MODEL_CONFIG = {
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.3,      // Bajo para respuestas consistentes
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048
  }
} as const;

// Inicializar cliente de Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ============================================
// Prompt Template
// ============================================

const MEDICAL_ASSISTANT_PROMPT = `
Eres un asistente médico especializado en analizar legajos médicos.
Tu rol es ayudar a interpretar y responder preguntas sobre el documento médico proporcionado.

## Directrices:
1. Basa TODAS tus respuestas en el contexto del documento proporcionado
2. Si la información no está en el documento, indica claramente que no está disponible
3. Usa terminología médica apropiada pero explica términos complejos
4. NO inventes información médica
5. Siempre recomienda consultar con un profesional de salud para decisiones médicas

## Contexto del Documento:
{context}

## Historial de Conversación:
{chat_history}

## Pregunta del Usuario:
{question}

## Tu Respuesta:
`;

// ============================================
// Interfaces
// ============================================

export interface GenerationConfig {
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ============================================
// Funciones de Generación
// ============================================

/**
 * Formatea el historial de chat para incluirlo en el prompt
 * 
 * @param messages - Array de mensajes del chat
 * @returns Historial formateado como string
 */
export function formatChatHistory(messages: ChatMessage[]): string {
  if (messages.length === 0) {
    return "Sin historial previo.";
  }
  
  return messages
    .map(msg => `${msg.role === "user" ? "Usuario" : "Asistente"}: ${msg.content}`)
    .join("\n\n");
}

/**
 * Genera una respuesta usando Gemini LLM
 * 
 * @param context - Contexto del documento (chunks recuperados)
 * @param chatHistory - Historial de conversación formateado
 * @param question - Pregunta actual del usuario
 * @param config - Configuración opcional de generación
 * @returns Respuesta generada
 */
export async function generateResponse(
  context: string,
  chatHistory: string,
  question: string,
  config?: GenerationConfig
): Promise<string> {
  const prompt = MEDICAL_ASSISTANT_PROMPT
    .replace("{context}", context)
    .replace("{chat_history}", chatHistory)
    .replace("{question}", question);
  
  const response = await ai.models.generateContent({
    model: CHAT_MODEL_CONFIG.model,
    contents: prompt,
    config: {
      temperature: config?.temperature ?? CHAT_MODEL_CONFIG.generationConfig.temperature,
      topP: CHAT_MODEL_CONFIG.generationConfig.topP,
      topK: CHAT_MODEL_CONFIG.generationConfig.topK,
      maxOutputTokens: config?.maxTokens ?? CHAT_MODEL_CONFIG.generationConfig.maxOutputTokens
    }
  });
  
  return response.text ?? "";
}

/**
 * Genera una respuesta en streaming usando Gemini LLM
 * Ideal para mostrar la respuesta en tiempo real en el UI
 * 
 * @param context - Contexto del documento (chunks recuperados)
 * @param chatHistory - Historial de conversación formateado
 * @param question - Pregunta actual del usuario
 * @param config - Configuración opcional de generación
 * @yields Chunks de texto de la respuesta
 */
export async function* generateResponseStream(
  context: string,
  chatHistory: string,
  question: string,
  config?: GenerationConfig
): AsyncGenerator<string> {
  const prompt = MEDICAL_ASSISTANT_PROMPT
    .replace("{context}", context)
    .replace("{chat_history}", chatHistory)
    .replace("{question}", question);
  
  const response = await ai.models.generateContentStream({
    model: CHAT_MODEL_CONFIG.model,
    contents: prompt,
    config: {
      temperature: config?.temperature ?? CHAT_MODEL_CONFIG.generationConfig.temperature,
      topP: CHAT_MODEL_CONFIG.generationConfig.topP,
      topK: CHAT_MODEL_CONFIG.generationConfig.topK,
      maxOutputTokens: config?.maxTokens ?? CHAT_MODEL_CONFIG.generationConfig.maxOutputTokens
    }
  });
  
  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}

// ============================================
// Funciones de Utilidad
// ============================================

/**
 * Genera respuesta completa integrando retrieval, historial y generación
 * Esta es la función principal para el pipeline RAG completo
 * 
 * @param context - Contexto del documento formateado
 * @param messages - Historial de mensajes del chat
 * @param question - Pregunta actual del usuario
 * @returns Respuesta generada
 */
export async function generateChatResponse(
  context: string,
  messages: ChatMessage[],
  question: string
): Promise<string> {
  const chatHistory = formatChatHistory(messages);
  return generateResponse(context, chatHistory, question);
}

/**
 * Genera respuesta en streaming integrando retrieval, historial y generación
 * 
 * @param context - Contexto del documento formateado
 * @param messages - Historial de mensajes del chat
 * @param question - Pregunta actual del usuario
 * @yields Chunks de texto de la respuesta
 */
export async function* generateChatResponseStream(
  context: string,
  messages: ChatMessage[],
  question: string
): AsyncGenerator<string> {
  const chatHistory = formatChatHistory(messages);
  yield* generateResponseStream(context, chatHistory, question);
}

// ============================================
// Configuración Exportada
// ============================================

export const CHAT_MODEL = CHAT_MODEL_CONFIG.model;
export const DEFAULT_TEMPERATURE = CHAT_MODEL_CONFIG.generationConfig.temperature;
