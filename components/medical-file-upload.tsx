"use client";

import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MedicalFileUpload() {
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
	);
}
