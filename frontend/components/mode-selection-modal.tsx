"use client"

import { useState } from "react"
import { X, Radio, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ModeSelectionModalProps {
  onClose: () => void
  onContinue: (mode: 'live' | 'recorded') => void
}

// Feature tags for each mode
const liveFeatures = ["Real-time audio", "AI feedback", "Live emotions"]
const recordedFeatures = ["Record audio","Upload audio","Detailed analysis"]

export function ModeSelectionModal({ onClose, onContinue }: ModeSelectionModalProps) {
  const [selectedMode, setSelectedMode] = useState<'live' | 'recorded'>('recorded')

  const handleContinue = () => {
    onContinue(selectedMode)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-1 rounded-2xl border border-border-primary p-6 w-[850px] shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary mb-1">
              Choose How You Want to Pitch
            </h2>
            <p className="text-sm font-medium text-text-secondary">
              Pick the mode that best fits your preparation style.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selection Cards */}
        <div className="flex gap-4">
          {/* Live Session Card */}
          <button
            onClick={() => setSelectedMode('live')}
            className={`relative flex-1 bg-surface-2 rounded-2xl p-6 flex flex-col gap-3 transition-all duration-300
              ${selectedMode === 'live'
                ? 'border border-accent-lime/80'
                : 'border border-surface-3 hover:border-text-tertiary'
              }`}
          >
            {/* Top Row: Icon and Selection Indicator */}
            <div className="flex items-start justify-between">
              {/* Icon Container - No visible border */}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center">
                <Radio className={`w-7 h-7 transition-colors duration-300 ${selectedMode === 'live' ? 'text-accent-lime' : 'text-text-primary'}`} />
              </div>

              {/* Selection Indicator */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                ${selectedMode === 'live'
                  ? 'border-accent-lime'
                  : 'border-surface-3'
                }`}>
                {selectedMode === 'live' && (
                  <div className="w-3 h-3 rounded-full bg-accent-lime"></div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2 text-left flex-1">
              <h3 className="text-2xl font-bold text-text-primary leading-tight">
                Live Session
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Connect with a live AI investor call. Simulate the high-pressure environment of an actual interview.
              </p>
            </div>

            {/* Feature Tags - Simple, static labels */}
            <div className="flex flex-wrap gap-2 pt-2">
              {liveFeatures.map((feature, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-surface-3/50 text-text-secondary"
                >
                  {feature}
                </span>
              ))}
            </div>
          </button>

          {/* Recorded Session Card */}
          <button
            onClick={() => setSelectedMode('recorded')}
            className={`relative flex-1 bg-surface-2 rounded-2xl p-6 flex flex-col gap-3 transition-all duration-300
              ${selectedMode === 'recorded'
                ? 'border border-accent-lime/80'
                : 'border border-surface-3 hover:border-text-tertiary'
              }`}
          >
            {/* Top Row: Icon and Selection Indicator */}
            <div className="flex items-start justify-between">
              {/* Icon Container - No visible border */}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center">
                <Mic className={`w-7 h-7 transition-colors duration-300 ${selectedMode === 'recorded' ? 'text-accent-lime' : 'text-text-primary'}`} />
              </div>

              {/* Selection Indicator */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                ${selectedMode === 'recorded'
                  ? 'border-accent-lime'
                  : 'border-surface-3'
                }`}>
                {selectedMode === 'recorded' && (
                  <div className="w-3 h-3 rounded-full bg-accent-lime"></div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2 text-left flex-1">
              <h3 className="text-2xl font-bold text-text-primary leading-tight">
                Recorded Session
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Record your pitch, upload it, and receive detailed investor-style feedback at your own pace.
              </p>
            </div>

            {/* Feature Tags - Simple, static labels */}
            <div className="flex flex-wrap gap-2 pt-2">
              {recordedFeatures.map((feature, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-surface-3/50 text-text-secondary"
                >
                  {feature}
                </span>
              ))}
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end pt-2">
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
