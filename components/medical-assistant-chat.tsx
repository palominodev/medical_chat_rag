"use client";

import { Send, Bot, User } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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

export function MedicalAssistantChat() {
	return (
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
	);
}
