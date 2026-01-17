"use client"

import { useState } from "react"
import { X, Radio, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ModeSelectionModalProps {
  onClose: () => void
  onContinue: (mode: 'live' | 'recorded') => void
}

export function ModeSelectionModal({ onClose, onContinue }: ModeSelectionModalProps) {
  const [selectedMode, setSelectedMode] = useState<'live' | 'recorded'>('recorded')

  const handleContinue = () => {
    onContinue(selectedMode)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-1 rounded-2xl border border-border-primary p-6 w-[850px] h-[496px] shadow-2xl flex flex-col justify-end gap-8">
        {/* Header */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-text-primary mb-2">
                Choose How You Want to Pitch
              </h2>
              <p className="text-sm font-medium text-text-primary">
                Pick the mode that best fits your preparation style.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Selection Cards */}
          <div className="flex-1 flex gap-4">
            {/* Live Session Card */}
            <button
              onClick={() => setSelectedMode('live')}
              className={`flex-1 bg-surface-2 rounded-2xl p-6 flex flex-col justify-between transition-all border ${selectedMode === 'live'
                ? 'border-accent-lime'
                : 'border-border-primary'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-surface-3 rounded-full flex items-center justify-center">
                  <Radio className="w-6 h-6 text-text-secondary" />
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMode === 'live'
                  ? 'border-accent-lime bg-transparent'
                  : 'border-surface-3 bg-transparent'
                  }`}>
                  {selectedMode === 'live' && (
                    <div className="w-3 h-3 rounded-full bg-accent-lime"></div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <p className="text-base font-bold text-text-primary leading-6">
                  Live Session
                </p>
                <p className="text-base font-medium text-text-secondary leading-6">
                  Join a live AI investor call that reacts, questions, and scores your performanc
                </p>
              </div>
            </button>

            {/* Recorded Session Card */}
            <button
              onClick={() => setSelectedMode('recorded')}
              className={`flex-1 bg-surface-2 rounded-2xl p-6 flex flex-col justify-between transition-all border ${selectedMode === 'recorded'
                ? 'border-accent-lime'
                : 'border-border-primary'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-surface-3 rounded-full flex items-center justify-center">
                  <Mic className="w-6 h-6 text-text-secondary" />
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMode === 'recorded'
                  ? 'border-accent-lime bg-transparent'
                  : 'border-surface-3 bg-transparent'
                  }`}>
                  {selectedMode === 'recorded' && (
                    <div className="w-3 h-3 rounded-full bg-accent-lime"></div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <p className="text-base font-bold text-text-primary leading-6">
                  Recorded Session
                </p>
                <p className="text-base font-medium text-text-secondary leading-6">
                  Record your pitch, upload it, and receive detailed investor-style feedback.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button
            variant="default"
            onClick={handleContinue}
            
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
