"use client";

import { Upload, Send, Bot, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Dummy messages for UI preview
const dummyMessages = [
  { id: 1, role: "assistant", content: "¡Hola! Soy tu asistente médico. Sube un legajo médico para comenzar a analizar." },
  { id: 2, role: "user", content: "¿Qué tipo de archivos puedo subir?" },
  { id: 3, role: "assistant", content: "Puedes subir archivos PDF, imágenes (JPG, PNG), o documentos de texto con información médica." },
];

export default function Home() {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Panel - DropZone */}
        <Card className="flex flex-col border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
              <Upload className="h-5 w-5 text-emerald-500" />
              Legajo Médico
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center p-6">
            <div
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/30 transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-800/50"
            >
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="rounded-full bg-emerald-500/10 p-4">
                  <Upload className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-200">
                    Arrastra y suelta tu archivo aquí
                  </h3>
                  <p className="text-sm text-slate-400">
                    o haz clic para seleccionar
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Formatos soportados: PDF, JPG, PNG, TXT
                </p>
                <Button variant="outline" className="mt-4 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                  Seleccionar archivo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Chat */}
        <Card className="flex flex-col border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
              <Bot className="h-5 w-5 text-blue-500" />
              Asistente Médico
            </CardTitle>
          </CardHeader>
          <Separator className="bg-slate-800" />

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-4">
              {dummyMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${message.role === "assistant"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-emerald-500/20 text-emerald-400"
                      }`}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "assistant"
                        ? "bg-slate-800 text-slate-200"
                        : "bg-emerald-600 text-white"
                      }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator className="bg-slate-800" />

          {/* Input Area */}
          <div className="p-4">
            <div className="flex gap-3">
              <Textarea
                placeholder="Escribe tu pregunta sobre el legajo médico..."
                className="min-h-[60px] flex-1 resize-none border-slate-700 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
              <Button className="h-auto bg-blue-600 px-4 hover:bg-blue-700">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
