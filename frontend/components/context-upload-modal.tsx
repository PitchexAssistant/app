"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, FileText, Loader2, Check, AlertCircle } from "lucide-react";

interface ContextUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: UploadedFile[]) => void;
  sessionId: string;
}

interface UploadedFile {
  file_id: string;
  filename: string;
  file_index: number;
  text_length: number;
  upload_timestamp: string;
  local_url?: string;
}

interface UploadResult {
  success: boolean;
  file_id?: string;
  filename?: string;
  file_index?: number;
  error?: string;
  local_url?: string;
}

export default function ContextUploadModal({
  isOpen,
  onClose,
  onSuccess,
  sessionId,
}: ContextUploadModalProps) {
  const [instructions, setInstructions] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      validateAndAddFiles(selectedFiles);
    }
  };

  // Validate and add files
  const validateAndAddFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach((file) => {
      // Check file type
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      if (fileExt !== "pdf") {
        errors.push(`${file.name}: Only PDF files are allowed`);
        return;
      }

      // Check file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds 10MB`);
        return;
      }

      validFiles.push(file);
    });

    // Check total file count (max 2)
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > 2) {
      errors.push("Maximum 2 files allowed per session");
      return;
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      validateAndAddFiles(droppedFiles);
    }
  }, [files]);

  // Remove file from list
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload files to backend
  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select at least one PDF file to upload");
      return;
    }

    setUploading(true);
    setUploadResults([]);

    try {
      // First, clear any existing session data to avoid conflicts
      try {
        const deleteResponse = await fetch(
          `http://localhost:8000/api/v1/documents/session/${sessionId}`,
          {
            method: "DELETE",
          }
        );
        if (deleteResponse.ok) {
          console.log("Previous session cleared successfully");
        }
      } catch (error) {
        // Session might not exist, that's okay
        console.log("No previous session to clear (this is normal for first upload)");
      }

      // Small delay to ensure delete completes
      await new Promise(resolve => setTimeout(resolve, 100));

      const results: UploadResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("session_id", sessionId);
        formData.append("file_index", i.toString());

        try {
          const response = await fetch(
            "http://localhost:8000/api/v1/documents/upload",
            {
              method: "POST",
              body: formData,
            }
          );

          const data = await response.json();

          if (response.ok && data.success) {
            results.push({
              success: true,
              file_id: data.data?.file_id,
              filename: data.data?.filename || file.name,
              file_index: data.data?.file_index ?? i,
              local_url: URL.createObjectURL(file),
            });
          } else {
            const errorMessage = data.detail || data.error || "Upload failed";
            results.push({
              success: false,
              error: errorMessage,
            });
            console.error(`Upload failed for ${file.name}:`, errorMessage);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Network error";
          results.push({
            success: false,
            error: `Failed to upload ${file.name}: ${errorMessage}`,
          });
          console.error(`Upload error for ${file.name}:`, error);
        }
      }

      setUploadResults(results);

      // If all uploads successful, call onSuccess
      const allSuccessful = results.every((r) => r.success);
      if (allSuccessful && onSuccess) {
        const uploadedFiles: UploadedFile[] = results
          .filter((r) => r.success)
          .map((r) => ({
            file_id: r.file_id || "",
            filename: r.filename || "",
            file_index: r.file_index ?? 0,
            text_length: 0,
            upload_timestamp: new Date().toISOString(),
            local_url: r.local_url,
          }));
        
        // Call onSuccess callback immediately
        onSuccess(uploadedFiles);
        
        // Close modal after a short delay to show success message
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during upload";
      setUploadResults([{
        success: false,
        error: errorMessage
      }]);
    } finally {
      setUploading(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    handleClose();
  };

  // Close modal
  const handleClose = () => {
    setFiles([]);
    setInstructions("");
    setUploadResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-[580px] p-8 bg-neutral-950 rounded-2xl shadow-2xl outline outline-1 outline-offset-[-1px] outline-zinc-800 flex flex-col gap-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-100 transition-all duration-200 hover:rotate-90 z-10"
          disabled={uploading}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-[148px] h-[168px] flex items-center justify-center">
            <img
              className="w-full h-full object-contain"
              src="https://via.placeholder.com/148x168/18181B/71717A?text=📄"
              alt="Upload illustration"
            />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-center text-white text-[22px] font-bold font-['Uber_Move'] leading-tight">
              Add Context To Our Model
            </h2>
            <p className="text-center text-neutral-400 text-[15px] font-normal font-['Uber_Move'] leading-relaxed max-w-md">
              Help us understand your pitch better. Upload supporting PDFs or documents, and add custom instructions so our AI can assist you more effectively.
            </p>
          </div>

          {/* Instructions Input */}
          <div className="w-full px-4 py-3 bg-black/20 rounded-xl border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600 transition-all duration-200">
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Type your instructions for your model"
              className="w-full bg-transparent text-white text-[15px] font-normal font-['Inter'] leading-6 outline-none placeholder:text-stone-500"
              disabled={uploading}
            />
          </div>

          {/* File Upload Area */}
          <div
            className={`w-full p-8 rounded-xl border-2 border-dashed ${
              dragActive
                ? "border-orange-500 bg-orange-500/5"
                : "border-zinc-800 hover:border-zinc-700"
            } flex flex-col items-center gap-4 cursor-pointer transition-all duration-200`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-14 h-14 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-center items-center">
              <Upload className="w-6 h-6 text-stone-500" />
            </div>
            <div className="text-center">
              <span className="text-orange-500 text-[15px] font-bold font-['Uber_Move']">
                Click to upload
              </span>
              <span className="text-stone-500 text-[15px] font-normal font-['Uber_Move']">
                {" "}or drag and drop PDF (max. 10 MB, max 2 files)
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="w-full flex flex-col gap-3">
              <p className="text-zinc-400 text-[13px] font-medium font-['Uber_Move']">
                Selected Files ({files.length}/2):
              </p>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3.5 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-white text-[14px] font-medium font-['Uber_Move'] truncate max-w-[300px]">
                        {file.name}
                      </span>
                      <span className="text-zinc-500 text-[12px] font-normal font-['Inter']">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="text-zinc-500 hover:text-red-500 transition-colors duration-200 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && (
            <div className="w-full flex flex-col gap-2">
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    result.success
                      ? "bg-green-500/5 border-green-500/30"
                      : "bg-red-500/5 border-red-500/30"
                  }`}
                >
                  {result.success ? (
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <span
                    className={`text-[13px] font-medium font-['Uber_Move'] ${
                      result.success ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {result.success
                      ? `${result.filename} uploaded successfully`
                      : result.error}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            disabled={uploading}
            className="flex-1 h-12 px-6 bg-transparent rounded-xl border-2 border-zinc-700 hover:border-zinc-600 text-white hover:bg-zinc-900/50 font-bold font-['Uber_Move'] text-[15px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="flex-1 h-12 px-6 bg-zinc-100 hover:bg-white rounded-xl text-neutral-950 font-bold font-['Uber_Move'] text-[15px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Next</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
