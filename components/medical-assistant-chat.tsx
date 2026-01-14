"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useChatStream } from "@/hooks/use-chat-stream";
import Markdown from "react-markdown";

interface MedicalAssistantChatProps {
	documentId: string | null;
}

export function MedicalAssistantChat({ documentId }: MedicalAssistantChatProps) {
	const [input, setInput] = useState("");
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const {
		messages,
		sendMessage,
		isLoading,
		error
	} = useChatStream({
		documentId,
		onSessionCreated: (id) => console.log("Session created:", id)
	});

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}
	}, [messages, isLoading]);

	const handleSend = () => {
		if (!input.trim() || !documentId || isLoading) return;
		sendMessage(input);
		setInput("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<Card className="flex flex-col border-slate-800 bg-slate-900/50 backdrop-blur-sm h-full">
			<CardHeader className="pb-4 shrink-0">
				<CardTitle className="flex items-center gap-2 text-xl text-slate-100">
					<Bot className="h-5 w-5 text-blue-500" />
					Asistente Médico
				</CardTitle>
			</CardHeader>
			<Separator className="bg-slate-800 shrink-0" />

			{/* Messages Area */}
			<ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
				{!documentId ? (
					<div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 mt-10 opacity-60">
						<div className="p-4 bg-slate-800/50 rounded-full">
							<FileText className="h-12 w-12 text-slate-500" />
						</div>
						<div className="text-center max-w-xs">
							<h3 className="text-lg font-medium text-slate-300 mb-2">Esperando documento</h3>
							<p className="text-sm">Sube un legajo médico a la izquierda para comenzar a analizarlo.</p>
						</div>
					</div>
				) : messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 mt-10">
						<Bot className="h-12 w-12 text-blue-500/50" />
						<p className="text-center max-w-xs text-sm">
							¡Hola! Soy tu asistente médico. <br />
							Pregúntame sobre el diagnóstico, tratamiento o detalles del paciente.
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{messages.map((message) => (
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
									className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "assistant"
										? "bg-slate-800 text-slate-200"
										: "bg-emerald-600 text-white"
										}`}
								>
									{message.role === "assistant" ? (
										<div className="prose prose-invert prose-sm max-w-none">
											<Markdown>
												{message.content || "..."}
											</Markdown>
										</div>
									) : (
										<p>{message.content}</p>
									)}
								</div>
							</div>
						))}
						{isLoading && messages[messages.length - 1]?.role === "user" && (
							<div className="flex gap-3">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
									<Loader2 className="h-4 w-4 animate-spin" />
								</div>
								<div className="rounded-2xl px-4 py-3 bg-slate-800 text-slate-200">
									<span className="flex gap-1">
										<span className="animate-bounce delay-0">.</span>
										<span className="animate-bounce delay-150">.</span>
										<span className="animate-bounce delay-300">.</span>
									</span>
								</div>
							</div>
						)}
						{error && (
							<div className="mx-auto p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
								Error: {error}
							</div>
						)}
					</div>
				)}
			</ScrollArea>

			<Separator className="bg-slate-800 shrink-0" />

			{/* Input Area */}
			<div className="p-4 shrink-0">
				<div className="flex gap-3">
					<Textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={documentId ? "Escribe tu pregunta sobre el legajo médico..." : "Sube un documento primero..."}
						disabled={!documentId || isLoading}
						className="min-h-[60px] flex-1 resize-none border-slate-700 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 focus-visible:ring-blue-500 disabled:opacity-50"
					/>
					<Button
						onClick={handleSend}
						disabled={!input.trim() || !documentId || isLoading}
						className="h-auto bg-blue-600 px-4 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500"
					>
						{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
					</Button>
				</div>
			</div>
		</Card>
	);
}
