"use client";

import { useState } from "react";
import { MedicalFileUpload } from "@/components/view-medical-file/medical-file-upload";
import { MedicalAssistantChat } from "@/components/medical-assistant-chat";
import ViewMedicalFile from "@/components/view-medical-file/ViewMedicalFile";

interface UploadedFileState {
  url: string;
  name: string;
  documentId?: string;
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileState | null>(null);

  const handleFileUploaded = (file: File, url: string) => {
    // Initial state without documentId (will be updated after processing)
    setUploadedFile({ url, name: file.name });
  };

  const handleProcessingComplete = (result: { documentId: string }) => {
    setUploadedFile(prev => prev ? { ...prev, documentId: result.documentId } : null);
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Panel - DropZone or PDF Viewer */}
        {uploadedFile ? (
          <ViewMedicalFile fileUrl={uploadedFile.url} fileName={uploadedFile.name} />
        ) : (
          <MedicalFileUpload
            onFileUploaded={handleFileUploaded}
            onProcessingComplete={handleProcessingComplete}
          />
        )}

        {/* Right Panel - Chat */}
        <MedicalAssistantChat documentId={uploadedFile?.documentId ?? null} />
      </div>
    </div>
  );
}
