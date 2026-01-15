import { useState, useRef, useCallback, useEffect } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseChatStreamProps {
  documentId: string | null;
  initialSessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

export function useChatStream({ documentId, initialSessionId, onSessionCreated }: UseChatStreamProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  
  // Ref para mantener el sessionId actualizado en closures
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const resetChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    sessionIdRef.current = undefined;
    setError(null);
  }, []);

  const sendMessage = async (content: string) => {
    if (!documentId) {
      setError("No document selected");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. Agregar mensaje del usuario inmediatamente
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      };
      
      setMessages((prev) => [...prev, userMessage]);

      // 2. Preparar mensaje del asistente vacío
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      };
      
      setMessages((prev) => [...prev, assistantMessage]);

      // 3. Realizar petición de streaming
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          documentId,
          sessionId: sessionIdRef.current,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // 4. Procesar el stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          
          // Buscar metadata JSON en el primer chunk si no tenemos sesión
          if (!sessionIdRef.current && chunk.includes('{"sessionId":')) {
            const match = chunk.match(/{"sessionId":"([^"]+)"}/);
            if (match) {
              const newSessionId = match[1];
              setSessionId(newSessionId);
              sessionIdRef.current = newSessionId;
              onSessionCreated?.(newSessionId);
              
              // Eliminar el JSON del chunk para no mostrarlo
              const cleanChunk = chunk.replace(match[0], "").trimStart();
              accumulatedResponse += cleanChunk;
            } else {
              accumulatedResponse += chunk;
            }
          } else {
            accumulatedResponse += chunk;
          }

          // Actualizar mensaje del asistente con el texto acumulado
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === assistantMessageId 
                ? { ...msg, content: accumulatedResponse }
                : msg
            )
          );
        }
      } catch (streamError) {
        console.error("Error reading stream:", streamError);
        setError("Error reading response stream");
      } finally {
        reader.releaseLock();
      }

    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      
      // Remover mensaje del asistente si falló totalmente antes de empezar
      if (messages.length > 0 && messages[messages.length - 1].content === "") {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch existing chat history if initialSessionId is provided
  useEffect(() => {
    if (initialSessionId) {
      const fetchHistory = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/chat/history/${initialSessionId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.messages && Array.isArray(data.messages)) {
              setMessages(data.messages);
            }
          }
        } catch (err) {
          console.error("Failed to load chat history:", err);
          setError("Failed to load chat history");
        } finally {
          setIsLoading(false);
        }
      };

      fetchHistory();
    }
  }, [initialSessionId]);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    resetChat,
    sessionId
  };
}
