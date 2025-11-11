"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import ContextUploadModal from "./context-upload-modal";

interface AddContextButtonProps {
  sessionId?: string;
  onContextAdded?: (files: any[]) => void;
  className?: string;
}

export default function AddContextButton({
  sessionId = "default_session",
  onContextAdded,
  className = "",
}: AddContextButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (files: any[]) => {
    console.log("Files uploaded successfully:", files);
    if (onContextAdded) {
      onContextAdded(files);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`px-6 py-3 bg-transparent rounded-xl border-2 border-zinc-700 hover:border-zinc-600 text-white hover:bg-zinc-900/50 font-bold font-['Uber_Move'] text-[15px] transition-all duration-200 flex items-center gap-2.5 ${className}`}
      >
        <Sparkles className="w-5 h-5 text-orange-500" />
        <span>Add Context for our model</span>
      </button>

      <ContextUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        sessionId={sessionId}
      />
    </>
  );
}
