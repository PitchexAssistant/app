import { Session } from "@/lib/api/client";

export interface UserData {
    name: string;
    email: string;
    avatar: string;
}

export interface ContextFile {
    filename: string;
    file_id: string;
    file_index: number;
    text_length: number;
    local_url: string;
    file: File;
}

export interface AnalysisScores {
    overall?: number;
    clarity?: number;
    confidence?: number;
    engagement?: number;
    persuasiveness?: number;
    structure?: number;
    delivery?: number;
}

export interface EmotionTrendPoint {
    timestamp: number;
    joy: number;
    confidence: number;
    nervousness: number;
    anger: number;
    surprise: number;
}

export interface AnalysisData {
    summary: string;
    feedback_items: string[];
    scores?: AnalysisScores;
    emotionTrend?: EmotionTrendPoint[];
}

export interface ResultsData {
    audioBlob: Blob;
    transcript: string;
    analysis: AnalysisData;
}

export interface DashboardState {
    mounted: boolean;
    showPractice: boolean;
    showUploadModal: boolean;
    showModeSelection: boolean;
    uploadedFiles: File[];
    contextFiles: ContextFile[];
    selectedMode: 'live' | 'recorded' | null;
    showResults: boolean;
    resultsData: ResultsData | null;
    showSettings: boolean;
}

export interface DashboardActions {
    handleDeleteFile: (index: number) => void;
    handleNewSession: () => void;
    handleSelectSession: (session: Session) => void;
    handleBackToSessions: () => void;
    handleSignOut: () => Promise<void>;
    handleStartPitching: () => void;
    handleUploadComplete: (files: File[]) => Promise<void>;
    handleModeSelection: (mode: 'live' | 'recorded') => Promise<void>;
    handleEndRecordedSession: () => void;
    handleShowResults: (audioBlob: Blob, transcript: string, analysis: AnalysisData) => void;
    setShowUploadModal: (show: boolean) => void;
    setShowModeSelection: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
}
