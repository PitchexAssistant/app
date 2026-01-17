"use client"

import { useState, useRef } from "react"
import { X, Upload, File as FileIcon, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-1 rounded-2xl border border-border-primary p-6 w-[480px] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-text-primary mb-2">
              Upload and attach files
            </h2>
            <p className="text-sm font-medium text-text-primary">
              Upload supporting PDFs or documents so our AI can assist you more effectively.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`bg-surface-2 rounded-2xl p-6 mb-4 border-2 border-dashed border-border-primary transition-colors ${isDragging ? "border-accent-lime" : "border-transparent"
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Upload Icon */}
            <div className="w-10 h-10 bg-surface-3 rounded-full flex items-center justify-center">
              <Upload className="w-5 h-5 text-text-secondary" />
            </div>

            {/* Upload Text */}
            <div className="flex flex-col items-center gap-1 w-full">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-bold text-accent-lime hover:underline"
                >
                  Click to upload
                </button>
                <span className="text-sm font-medium text-text-secondary">
                  or drag and drop
                </span>
              </div>
              <p className="text-xs font-normal text-text-secondary text-center">
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
                className="bg-surface-2 rounded-2xl p-4 flex items-start gap-4"
              >
                {/* File Icon */}
                <div className="w-8 h-8 bg-surface-3 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileIcon className="w-4 h-4 text-text-secondary" />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-secondary truncate">
                    {file.name}
                  </p>
                  <p className="text-sm font-medium text-text-tertiary">
                    {file.size}
                  </p>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-2 bg-text-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-lime rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-text-tertiary whitespace-nowrap">
                      {file.progress}%
                    </span>
                  </div>
                </div>

                {/* Status Icons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {file.completed && (
                    <div className="w-4 h-4 bg-accent-lime rounded flex items-center justify-center">
                      <Check className="w-3 h-3 text-surface-0" strokeWidth={3} />
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="w-5 h-5 flex items-center justify-center text-red hover:text-red/80 transition-colors"
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
          <Button
            variant="nav"
            onClick={() => onNext([])}
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            variant="default"
            onClick={() => onNext(uploadedFiles.map(f => f.file))}
            disabled={uploadedFiles.length === 0}
            className="flex-1"
          >
            Next
          </Button>
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
