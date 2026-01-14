import { MedicalFileUpload } from "@/components/medical-file-upload";
import { MedicalAssistantChat } from "@/components/medical-assistant-chat";

export default function Home() {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Panel - DropZone */}
        <MedicalFileUpload />

        {/* Right Panel - Chat */}
        <MedicalAssistantChat />
      </div>
    </div>
  );
}
