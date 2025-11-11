# Frontend-Backend Integration

## Overview
The frontend is now fully integrated with the Python FastAPI backend for real-time pitch analysis.

## Architecture

```
User Records Audio → Frontend Component → API Client → FastAPI Backend
                                                              ↓
                                                         STT Service
                                                              ↓
                                                      Emotion Detection
                                                              ↓
                                                      Gemini 2.5 Pro LLM
                                                              ↓
                                                    Response with Feedback
```

## Backend Services (Port 8000)

1. **STT Service** (`/api/v1/stt/transcribe`)
   - Converts audio to text using Google Speech-to-Text
   - Supports multiple audio formats

2. **Emotion Service** (`/api/v1/emotion/analyze`)
   - Analyzes emotional content from text
   - Returns: dominant emotion, confidence, metrics
   - Model: j-hartmann/emotion-english-distilroberta-base

3. **Chat Service** (`/api/v1/chat/send`)
   - Sends text + emotion context to Gemini 2.5 Pro
   - Returns AI coaching feedback
   - Maintains conversation history

4. **Health Check** (`/api/v1/health`)
   - Check backend status

## Frontend Components

### 1. API Client (`lib/api/client.ts`)
- Centralized API communication
- Error handling
- Type-safe requests

### 2. Audio Recorder Hook (`hooks/use-audio-recorder.ts`)
- Record, pause, resume, stop
- Real-time timer
- Audio blob management

### 3. Emotion Indicator (`components/emotion-indicator.tsx`)
- Visual emotion display
- Emotion breakdown chart
- Metrics display (nervousness, enthusiasm, confidence)

### 4. Pitch Practice (`components/pitch-practice.tsx`)
- Main practice interface
- Audio recording controls
- Real-time emotion analysis
- Conversation display
- AI coach responses

## Usage

### Start Backend:
```bash
cd backend
source venv/bin/activate
venv/bin/python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend:
```bash
cd frontend
npm run dev
```

### Navigate to:
- Frontend: http://localhost:3000/dashboard
- Backend API Docs: http://localhost:8000/docs

## Testing the Integration

1. Click "Test Backend" button to verify connection
2. Click microphone icon to start recording
3. Speak your pitch
4. Click stop (square icon)
5. Click "Analyze Pitch" to process through pipeline
6. View:
   - Your transcribed text
   - Emotion analysis with breakdown
   - AI coach feedback

## Environment Variables

### Backend (.env)
```
GEMINI_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Features Implemented

✅ Audio recording with real-time timer
✅ Speech-to-Text transcription
✅ Emotion detection from text
✅ 7 emotion types: joy, sadness, anger, fear, surprise, neutral, disgust
✅ Emotion metrics: nervousness, enthusiasm, confidence
✅ LLM integration with Gemini 2.5 Pro
✅ Emotion-aware coaching responses
✅ Conversation history management
✅ Visual emotion indicators
✅ Emotion breakdown charts
✅ Error handling and loading states

## Next Steps

🔮 TTS integration for voice responses
🔮 Session persistence (database)
🔮 Advanced analytics dashboard
🔮 Emotion timeline visualization
🔮 Video recording support
🔮 Multi-language support
