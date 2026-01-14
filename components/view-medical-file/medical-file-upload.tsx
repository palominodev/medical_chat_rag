"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProcessedChunk {
	content: string;
	pageNumber: number;
	chunkIndex: number;
	metadata: {
		documentType: string;
		processedAt: string;
	};
}

interface ProcessingResult {
	filename: string;
	totalPages: number;
	totalChunks: number;
	chunks: ProcessedChunk[];
	metadata: {
		title?: string;
		author?: string;
		creationDate?: string;
	};
	stats: {
		averageChunkSize: number;
		minChunkSize: number;
		maxChunkSize: number;
		totalCharacters: number;
	};
}

interface MedicalFileUploadProps {
	onFileUploaded?: (file: File, url: string) => void;
	onProcessingComplete?: (result: ProcessingResult) => void;
}

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export function MedicalFileUpload({ onFileUploaded, onProcessingComplete }: MedicalFileUploadProps) {
	const [status, setStatus] = useState<UploadStatus>("idle");
	const [progress, setProgress] = useState(0);
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const onDrop = useCallback(async (acceptedFiles: File[]) => {
		if (acceptedFiles.length > 0) {
			const file = acceptedFiles[0];
			setStatus("uploading");
			setProgress(0);
			setErrorMessage(null);

			try {
				// Simulate initial upload progress (0-30%)
				const uploadInterval = setInterval(() => {
					setProgress((prev) => {
						if (prev >= 30) {
							clearInterval(uploadInterval);
							return 30;
						}
						return prev + 5;
					});
				}, 100);

				// Create FormData and send to API
				const formData = new FormData();
				formData.append("file", file);

				setStatus("processing");
				clearInterval(uploadInterval);
				setProgress(35);

				const response = await fetch("/api/documents/upload", {
					method: "POST",
					body: formData,
				});

				// Simulate processing progress (35-90%)
				const processingInterval = setInterval(() => {
					setProgress((prev) => {
						if (prev >= 90) {
							clearInterval(processingInterval);
							return 90;
						}
						return prev + 10;
					});
				}, 200);

				const data = await response.json();
				clearInterval(processingInterval);

				if (!response.ok) {
					throw new Error(data.error || "Error al procesar el documento");
				}

				setProgress(100);
				setStatus("success");
				setUploadedFile(file);
				setProcessingResult(data.data);

				// Callbacks
				const url = URL.createObjectURL(file);
				onFileUploaded?.(file, url);
				onProcessingComplete?.(data.data);

			} catch (error) {
				console.error("Error processing file:", error);
				setStatus("error");
				setErrorMessage(error instanceof Error ? error.message : "Error desconocido");
			}
		}
	}, [onFileUploaded, onProcessingComplete]);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'application/pdf': ['.pdf'],
		},
		multiple: false
	});

	const resetUpload = (e: React.MouseEvent) => {
		e.stopPropagation();
		setUploadedFile(null);
		setProgress(0);
	};

	return (
		<Card className="flex flex-col border-slate-800 bg-slate-900/50 backdrop-blur-sm">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-xl text-slate-100">
					<Upload className="h-5 w-5 text-emerald-500" />
					Legajo Médico
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-1 items-center justify-center p-6">
				<div
					{...getRootProps()}
					className={`flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300
						${isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50 hover:bg-slate-800/50'}
					`}
				>
					<input {...getInputProps()} />

					{(status === "uploading" || status === "processing") ? (
						<div className="flex w-full max-w-xs flex-col items-center gap-4 p-8">
							<div className="relative h-16 w-16">
								<svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
									{/* Background Circle */}
									<path
										className="text-slate-700"
										d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
										fill="none"
										stroke="currentColor"
										strokeWidth="3"
									/>
									{/* Progress Circle */}
									<path
										className="text-emerald-500 transition-all duration-300 ease-out"
										strokeDasharray={`${progress}, 100`}
										d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
										fill="none"
										stroke="currentColor"
										strokeWidth="3"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<span className="text-xs font-bold text-emerald-500">{progress}%</span>
								</div>
							</div>
							<p className="animate-pulse text-sm text-emerald-400">
								{status === "uploading" ? "Subiendo archivo..." : "Procesando documento..."}
							</p>
						</div>
					) : status === "error" ? (
						<div className="flex flex-col items-center gap-4 p-8 text-center">
							<div className="rounded-full bg-red-500/20 p-4">
								<AlertCircle className="h-10 w-10 text-red-500" />
							</div>
							<div className="space-y-1">
								<h3 className="text-lg font-semibold text-red-400">
									Error al procesar
								</h3>
								<p className="max-w-[250px] text-sm text-slate-400">
									{errorMessage}
								</p>
							</div>
							<Button
								variant="outline"
								onClick={resetUpload}
								className="mt-2 border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400"
							>
								Intentar de nuevo
							</Button>
						</div>
					) : status === "success" && uploadedFile ? (
						<div className="flex flex-col items-center gap-4 p-8 text-center">
							<div className="rounded-full bg-emerald-500/20 p-4">
								<CheckCircle2 className="h-10 w-10 text-emerald-500" />
							</div>
							<div className="space-y-1">
								<h3 className="text-lg font-semibold text-emerald-400">
									¡Documento procesado!
								</h3>
								<p className="max-w-[200px] truncate text-sm text-slate-400">
									{uploadedFile.name}
								</p>
								{processingResult && (
									<div className="mt-2 flex flex-wrap justify-center gap-2 text-xs">
										<span className="rounded-full bg-slate-700 px-2 py-1 text-slate-300">
											{processingResult.totalPages} páginas
										</span>
										<span className="rounded-full bg-slate-700 px-2 py-1 text-slate-300">
											{processingResult.totalChunks} chunks
										</span>
									</div>
								)}
							</div>
							<Button
								variant="outline"
								onClick={resetUpload}
								className="mt-2 border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400"
							>
								Subir otro archivo
							</Button>
						</div>
					) : (
						<div className="flex flex-col items-center gap-4 p-8 text-center">
							<div className={`rounded-full p-4 transition-colors ${isDragActive ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`}>
								<Upload className={`h-10 w-10 ${isDragActive ? 'text-emerald-400' : 'text-emerald-500'}`} />
							</div>
							<div className="space-y-2">
								<h3 className="text-lg font-semibold text-slate-200">
									{isDragActive ? "Suelta el archivo aquí" : "Arrastra y suelta tu archivo aquí"}
								</h3>
								<p className="text-sm text-slate-400">
									o haz clic para seleccionar
								</p>
							</div>
							<p className="text-xs text-slate-500">
								Formatos soportados: PDF
							</p>
							<Button variant="outline" className="mt-4 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
								Seleccionar archivo
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
