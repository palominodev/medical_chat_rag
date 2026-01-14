"use client";

import { useState } from "react";
import { MedicalFileUpload } from "@/components/view-medical-file/medical-file-upload";
import { MedicalAssistantChat } from "@/components/medical-assistant-chat";
import ViewMedicalFile from "@/components/view-medical-file/ViewMedicalFile";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);

  const handleFileUploaded = (file: File, url: string) => {
    setUploadedFile({ url, name: file.name });
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Panel - DropZone or PDF Viewer */}
        {uploadedFile ? (
          <ViewMedicalFile fileUrl={uploadedFile.url} fileName={uploadedFile.name} />
        ) : (
          <MedicalFileUpload onFileUploaded={handleFileUploaded} />
        )}

        {/* Right Panel - Chat */}
        <MedicalAssistantChat />
      </div>
    </div>
  );
}
