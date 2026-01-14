"use client";

import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ViewMedicalFileProps {
	fileUrl: string;
	fileName?: string;
}

export default function ViewMedicalFile({ fileUrl, fileName }: ViewMedicalFileProps) {
	return (
		<Card className="flex flex-col border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
			<CardHeader className="pb-2 shrink-0">
				<CardTitle className="flex items-center gap-2 text-xl text-slate-100">
					<FileText className="h-5 w-5 text-emerald-500" />
					{fileName || "Documento Médico"}
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 p-2 min-h-0">
				<iframe
					src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
					className="h-full w-full rounded-lg border border-slate-700"
					title="PDF Viewer"
				/>
			</CardContent>
		</Card>
	);
}