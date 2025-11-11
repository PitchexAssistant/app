/**
 * API Client for Pitchex Backend
 * Handles all communication with the FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Network error occurred',
      undefined,
      error
    );
  }
}

/**
 * Health Check API
 */
export const healthAPI = {
  check: () => fetchAPI<{ status: string; version: string }>('/api/v1/health'),
};

/**
 * Speech-to-Text API
 */
export const sttAPI = {
  /**
   * Transcribe audio file
   */
  transcribe: async (audioFile: File, language: string = 'en-US') => {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('language', language);

    const response = await fetch(`${API_BASE_URL}/api/v1/stt/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || 'Transcription failed',
        response.status,
        errorData
      );
    }

    return await response.json();
  },

  /**
   * Transcribe audio blob (for real-time recording)
   */
  transcribeBlob: async (audioBlob: Blob, language: string = 'en-US') => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('language', language);

    const response = await fetch(`${API_BASE_URL}/api/v1/stt/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || 'Transcription failed',
        response.status,
        errorData
      );
    }

    return await response.json();
  },
};

/**
 * Emotion Detection API
 */
export const emotionAPI = {
  /**
   * Analyze emotion from text
   */
  analyze: (text: string, sessionId?: string) =>
    fetchAPI<{
      dominant_emotion: string;
      emotions: Record<string, number>;
      confidence: number;
      metrics: {
        nervousness_score: number;
        enthusiasm_level: string;
        confidence_indicator: string;
      };
      timestamp: string;
    }>('/api/v1/emotion/analyze', {
      method: 'POST',
      body: JSON.stringify({
        text,
        session_id: sessionId,
        include_confidence: true,
      }),
    }),
};

/**
 * LLM Chat API
 */
export const chatAPI = {
  /**
   * Send message to AI coach
   */
  sendMessage: (message: string, sessionId?: string, conversationHistory?: any[]) =>
    fetchAPI<{
      response: string;
      emotion_analysis?: any;
      session_id: string;
      timestamp: string;
    }>('/api/v1/chat/send', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: sessionId,
        conversation_history: conversationHistory,
      }),
    }),

  /**
   * Send message with emotion context
   */
  sendMessageWithEmotion: (
    message: string,
    emotionData: any,
    sessionId?: string,
    conversationHistory?: any[]
  ) =>
    fetchAPI<{
      response: string;
      emotion_analysis: any;
      session_id: string;
      timestamp: string;
    }>('/api/v1/chat/send', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: sessionId,
        conversation_history: conversationHistory,
        emotion_context: emotionData,
      }),
    }),
};

/**
 * Combined STT + Emotion + LLM Pipeline
 */
export const pipelineAPI = {
  /**
   * Process audio through complete pipeline:
   * Audio -> STT -> Text -> Emotion Analysis -> LLM -> Response
   */
  processAudio: async (
    audioBlob: Blob,
    sessionId?: string,
    conversationHistory?: any[]
  ) => {
    try {
      // Step 1: Transcribe audio
      const transcription = await sttAPI.transcribeBlob(audioBlob);
      const text = transcription.transcript;

      if (!text || text.trim().length === 0) {
        throw new APIError('No speech detected in audio');
      }

      // Step 2: Analyze emotion
      const emotionData = await emotionAPI.analyze(text, sessionId);

      // Step 3: Get LLM response with emotion context
      const chatResponse = await chatAPI.sendMessageWithEmotion(
        text,
        emotionData,
        sessionId,
        conversationHistory
      );

      return {
        transcript: text,
        emotion: emotionData,
        response: chatResponse.response,
        session_id: chatResponse.session_id,
        timestamp: chatResponse.timestamp,
      };
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Export default API client
 */
export const api = {
  health: healthAPI,
  stt: sttAPI,
  emotion: emotionAPI,
  chat: chatAPI,
  pipeline: pipelineAPI,
};

export default api;
