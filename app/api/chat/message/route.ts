import { NextRequest, NextResponse } from "next/server";
import { processChat, processChatStream } from "@/lib/chat-orchestrator";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { message, documentId, sessionId, stream = true } = await req.json();

    // Validaciones básicas
    if (!message || !documentId) {
      return NextResponse.json(
        { error: "Message and documentId are required" },
        { status: 400 }
      );
    }

    // Obtener el usuario autenticado
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignorar error si se llama desde un Server Component
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Modo Streaming (Default y Recomendado para UX)
    if (stream) {
      const encoder = new TextEncoder();
      
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            // Callback para enviar metadata inicial como JSON en el primer chunk
            // Usamos un formato especial para separar metadata del contenido: HEADER_JSON\n\nCONTENT
            let isFirstChunk = true;
            
            const generator = processChatStream(
              message, 
              documentId, 
              sessionId,
              {
                userId: user.id,
                title: "Nuevo Chat" // TODO: Generar título dinámico
              },
              {
                onSessionCreated: (newSessionId) => {
                  if (isFirstChunk) {
                    controller.enqueue(encoder.encode(JSON.stringify({ sessionId: newSessionId }) + "\n\n"));
                    isFirstChunk = false;
                  }
                },
                onSourcesRetrieved: (sources) => {
                  // Podríamos enviar fuentes aquí si el cliente lo soporta
                }
              }
            );

            for await (const chunk of generator) {
              if (isFirstChunk && sessionId) {
                 // Si ya había sesión, el primer chunk es solo texto, pero necesitamos asegurar que no sea metadata
                 // Si no se envió header, enviamos uno vacío o con la sesión existente
                 controller.enqueue(encoder.encode(JSON.stringify({ sessionId }) + "\n\n"));
                 isFirstChunk = false;
              }
              controller.enqueue(encoder.encode(chunk));
            }
            
            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            controller.error(error);
          }
        },
      });

      return new NextResponse(customReadable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } 
    
    // Modo Bloqueante (Standard JSON Response)
    else {
      const result = await processChat(message, documentId, sessionId, {
        userId: user.id,
        title: "Nuevo Chat"
      });
      
      return NextResponse.json({
        response: result.response,
        sessionId: result.sessionId,
        sources: result.sources
      });
    }

  } catch (error) {
    console.error("[API] Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
