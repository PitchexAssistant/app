"use client"

import { useState, useRef } from "react"
import { X, Upload, File as FileIcon, Check, Trash2 } from "lucide-react"
import Image from "next/image"

interface UploadedFile {
  id: string
  name: string
  size: string
  sizeBytes: number
  progress: number
  completed: boolean
  file: File
}

interface UploadModalProps {
  onClose: () => void
  onNext: (files: File[]) => void
}

export function UploadModal({ onClose, onNext }: UploadModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: formatFileSize(file.size),
      sizeBytes: file.size,
      progress: 0,
      completed: false,
      file: file, // Store the actual File object for RAG processing
    }))

    // Add all new files without duplicate filtering (allow re-upload)
    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Simulate upload progress for each file
    newFiles.forEach((file) => {
      simulateUpload(file.id)
    })

    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const simulateUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 20
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, progress, completed: progress >= 100 }
            : f
        )
      )
      if (progress >= 100) clearInterval(interval)
    }, 100)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,26,26,0.7)] backdrop-blur-sm">
      <div className="bg-[#262626] rounded-[24px] p-6 w-[480px] shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <h2 className="text-[18px] font-bold text-[#f0f0f0] leading-[28px] mb-2">
              Upload and attach files
            </h2>
            <p className="text-[14px] font-medium text-[#f0f0f0] leading-[20px]">
              Upload supporting PDFs or documents so our AI can assist you more effectively.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[#9e9e9e] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`bg-[#171717] rounded-[16px] p-6 mb-4 border-2 border-dashed transition-colors ${
            isDragging ? "border-[#ff6b00]" : "border-transparent"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Upload Icon */}
            <div className="w-10 h-10 bg-[#404040] rounded-full flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#9e9e9e]" />
            </div>

            {/* Upload Text */}
            <div className="flex flex-col items-center gap-1 w-full">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[14px] font-bold text-[#ff6b00] leading-[20px] hover:underline"
                >
                  Click to upload
                </button>
                <span className="text-[14px] font-medium text-[#9e9e9e] leading-[20px]">
                  or drag and drop
                </span>
              </div>
              <p className="text-[12px] font-normal text-[#9e9e9e] leading-[18px] text-center">
                .pdf, .docx (max. 10 MB)
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-3 mb-8">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-[#171717] rounded-[16px] p-4 flex items-start gap-4"
              >
                {/* File Icon */}
                <div className="w-8 h-8 bg-[#404040] rounded-full flex items-center justify-center flex-shrink-0">
                  <FileIcon className="w-4 h-4 text-[#9e9e9e]" />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#9e9e9e] leading-[20px] truncate">
                    {file.name}
                  </p>
                  <p className="text-[14px] font-medium text-[#666666] leading-[20px]">
                    {file.size}
                  </p>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-2 bg-[#9e9e9e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ff6b00] rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <span className="text-[14px] font-bold text-[#666666] leading-[20px] whitespace-nowrap">
                      {file.progress}%
                    </span>
                  </div>
                </div>

                {/* Status Icons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {file.completed && (
                    <div className="w-4 h-4 bg-[#ff6b00] rounded flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="w-5 h-5 flex items-center justify-center text-[#ef4444] hover:text-[#dc2626] transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-[#404040] text-[#f0f0f0] rounded-[12px] px-4 py-2.5 text-[14px] font-semibold leading-[20px] hover:bg-[#4a4a4a] transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => onNext(uploadedFiles.map(f => f.file))}
            className="flex-1 bg-[#f0f0f0] text-[#0a0a0a] rounded-[12px] px-4 py-2.5 text-[14px] font-semibold leading-[20px] hover:bg-white transition-colors border border-[#f0f0f0]"
          >
            Next
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </div>
  )
}
