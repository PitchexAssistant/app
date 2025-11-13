"use client"

import { useState } from "react"
import { X, Radio, Mic } from "lucide-react"
import Image from "next/image"

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,26,26,0.7)] backdrop-blur-sm">
      <div className="bg-[#262626] rounded-[24px] p-6 w-[850px] h-[496px] shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03)] flex flex-col justify-end gap-8">
        {/* Header */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-[18px] font-bold text-[#f0f0f0] leading-[28px] mb-2">
                Choose How You Want to Pitch
              </h2>
              <p className="text-[14px] font-medium text-[#f0f0f0] leading-[20px]">
                Pick the mode that best fits your preparation style.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-[#9e9e9e] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Selection Cards */}
          <div className="flex-1 flex gap-4">
            {/* Live Session Card */}
            <button
              onClick={() => setSelectedMode('live')}
              className={`flex-1 bg-[#171717] rounded-[16px] p-6 flex flex-col justify-between transition-all ${
                selectedMode === 'live' 
                  ? 'border border-[#ff6b00]' 
                  : 'border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-[#404040] rounded-full flex items-center justify-center">
                  <Radio className="w-6 h-6 text-[#9e9e9e]" />
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedMode === 'live'
                    ? 'border-[#ff6b00] bg-transparent'
                    : 'border-[#404040] bg-transparent'
                }`}>
                  {selectedMode === 'live' && (
                    <div className="w-3 h-3 rounded-full bg-[#ff6b00]"></div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 text-left">
                <p className="text-[16px] font-bold text-[#f0f0f0] leading-[24px]">
                  Live Session
                </p>
                <p className="text-[16px] font-medium text-[#9e9e9e] leading-[24px]">
                  Join a live AI investor call that reacts, questions, and scores your performanc
                </p>
              </div>
            </button>

            {/* Recorded Session Card */}
            <button
              onClick={() => setSelectedMode('recorded')}
              className={`flex-1 bg-[#171717] rounded-[16px] p-6 flex flex-col justify-between transition-all ${
                selectedMode === 'recorded' 
                  ? 'border border-[#ff6b00]' 
                  : 'border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-[#404040] rounded-full flex items-center justify-center">
                  <Mic className="w-6 h-6 text-[#9e9e9e]" />
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedMode === 'recorded'
                    ? 'border-[#ff6b00] bg-transparent'
                    : 'border-[#404040] bg-transparent'
                }`}>
                  {selectedMode === 'recorded' && (
                    <div className="w-3 h-3 rounded-full bg-[#ff6b00]"></div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 text-left">
                <p className="text-[16px] font-bold text-[#f0f0f0] leading-[24px]">
                  Recorded Session
                </p>
                <p className="text-[16px] font-medium text-[#9e9e9e] leading-[24px]">
                  Record your pitch, upload it, and receive detailed investor-style feedback.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            className="w-[432px] bg-[#f0f0f0] text-[#0a0a0a] rounded-[12px] px-4 py-2.5 text-[14px] font-semibold leading-[20px] hover:bg-white transition-colors border border-[#f0f0f0]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
