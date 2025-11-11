"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  Smile, 
  Frown, 
  Angry, 
  Meh, 
  Laugh, 
  Sparkles,
  AlertTriangle 
} from "lucide-react";

export interface EmotionData {
  dominant_emotion: string;
  emotions: Record<string, number>;
  confidence: number;
  metrics?: {
    nervousness_score: number;
    enthusiasm_level: string;
    confidence_indicator: string;
  };
}

interface EmotionIndicatorProps {
  emotion: EmotionData | null;
  className?: string;
}

const emotionConfig = {
  joy: { 
    icon: Laugh, 
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    label: "Joyful" 
  },
  sadness: { 
    icon: Frown, 
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    label: "Sad" 
  },
  anger: { 
    icon: Angry, 
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "Angry" 
  },
  fear: { 
    icon: AlertTriangle, 
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    label: "Nervous" 
  },
  surprise: { 
    icon: Sparkles, 
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    label: "Surprised" 
  },
  neutral: { 
    icon: Meh, 
    color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    label: "Neutral" 
  },
  disgust: { 
    icon: Frown, 
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    label: "Disgusted" 
  },
};

export function EmotionIndicator({ emotion, className }: EmotionIndicatorProps) {
  if (!emotion) {
    return null;
  }

  const config = emotionConfig[emotion.dominant_emotion as keyof typeof emotionConfig] || emotionConfig.neutral;
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-2 px-3 py-1.5",
          config.color
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="font-medium">{config.label}</span>
        <span className="text-xs opacity-70">
          {Math.round(emotion.confidence * 100)}%
        </span>
      </Badge>

      {emotion.metrics && (
        <>
          {emotion.metrics.nervousness_score > 0.5 && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              <AlertTriangle className="h-3 w-3 mr-1" />
              High Nervousness
            </Badge>
          )}
          
          {emotion.metrics.enthusiasm_level === 'high' && (
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
              <Sparkles className="h-3 w-3 mr-1" />
              High Energy
            </Badge>
          )}
        </>
      )}
    </div>
  );
}

export function EmotionBreakdown({ emotion }: { emotion: EmotionData }) {
  const sortedEmotions = Object.entries(emotion.emotions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Emotion Breakdown</h4>
      <div className="space-y-2">
        {sortedEmotions.map(([emotionName, score]) => {
          const config = emotionConfig[emotionName as keyof typeof emotionConfig] || emotionConfig.neutral;
          const Icon = config.icon;
          
          return (
            <div key={emotionName} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-24">
                <Icon className="h-3 w-3" />
                <span className="text-sm capitalize">{emotionName}</span>
              </div>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-300", config.color.split(' ')[0])}
                  style={{ width: `${score * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right">
                {Math.round(score * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
