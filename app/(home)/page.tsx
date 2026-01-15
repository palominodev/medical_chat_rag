"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MedicalFileUpload } from "@/components/view-medical-file/medical-file-upload";
import { MedicalAssistantChat } from "@/components/medical-assistant-chat";
import ViewMedicalFile from "@/components/view-medical-file/ViewMedicalFile";

interface UploadedFileState {
  url: string;
  name: string;
  documentId?: string;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");
  const [uploadedFile, setUploadedFile] = useState<UploadedFileState | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (chatId) {
      setUploadedFile(null);
      setActiveSessionId(chatId);
      // Fetch session details
      fetch(`/api/chat/session/${chatId}`)
        .then(res => res.json())
        .then(data => {
          if (data.session && data.document) {
            setUploadedFile({
              url: data.document.url || "",
              name: data.document.filename,
              documentId: data.document.id
            });
          }
        })
        .catch(err => console.error("Error loading session:", err));
    }
  }, [chatId]);

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
        <MedicalAssistantChat
          documentId={uploadedFile?.documentId ?? null}
          sessionId={activeSessionId}
          fileName={uploadedFile?.name}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
