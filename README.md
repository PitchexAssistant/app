# Pitchex AI Coach

## 🚀 Python Backend for AI Pitching & Negotiation Coach

This is the FastAPI backend that powers the Pitchex AI Coach platform. It integrates:
- **Google Speech-to-Text** for audio transcription
- **Gemini 2.5 Pro** for intelligent coaching responses
- **Emotion Detection** using HuggingFace transformers
- **Real-time Analysis Pipeline** for comprehensive pitch feedback

---

## 📋 Features

### ✅ Implemented (Phase 1-3)
- [x] FastAPI backend with async support
- [x] Google STT integration (with mock fallback for development)
- [x] Gemini 2.5 Pro LLM integration
- [x] Emotion detection (7 emotions + metrics)
- [x] Combined chat endpoint (text → emotion → LLM)
- [x] Complete pitch analysis (audio → STT → emotion → LLM)
- [x] RESTful API with proper error handling
- [x] Structured logging
- [x] CORS configuration for frontend

### 🎯 Architecture

```
┌─────────────────┐
│  Frontend       │
│  (Next.js)      │
└────────┬────────┘
         │
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│  FastAPI        │
│  API Gateway    │
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  STT   │ │Emotion │ │Gemini  │ │  DB    │
│Service │ │Service │ │Service │ │        │
└────────┘ └────────┘ └────────┘ └────────┘
```

---

## 🛠️ Installation & Setup

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
The `.env` file is already configured with your API keys. No changes needed for development.

### 4. Run the Server
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

---

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### 1. Health Check
```bash
GET /api/v1/health
```

#### 2. Emotion Analysis
```bash
POST /api/v1/emotion/analyze
Content-Type: application/json

{
  "text": "I'm so excited about this amazing opportunity!",
  "session_id": "optional-session-id",
  "include_confidence": true
}
```

#### 3. Chat (Text → Emotion → LLM)
```bash
POST /api/v1/chat/send
Content-Type: application/json

{
  "message": "I believe our product will revolutionize the market",
  "session_id": "session-123",
  "include_emotion_analysis": true
}
```

#### 4. Complete Pitch Analysis (Audio → STT → Emotion → LLM)
```bash
POST /api/v1/chat/analyze-pitch
Content-Type: multipart/form-data

file: <audio-file.wav>
session_id: session-123
language_code: en-US
```

#### 5. STT Transcription
```bash
POST /api/v1/stt/transcribe
Content-Type: multipart/form-data

file: <audio-file.wav>
language_code: en-US
sample_rate: 16000
encoding: LINEAR16
```

---

## 🧪 Testing

### Test Emotion Analysis
```bash
curl -X POST "http://localhost:8000/api/v1/emotion/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I am incredibly confident that we will succeed!",
    "include_confidence": true
  }'
```

### Test Chat
```bash
curl -X POST "http://localhost:8000/api/v1/chat/send" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How can I improve my pitch delivery?",
    "include_emotion_analysis": true
  }'
```

---

## 🏗️ Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration and settings
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
│
├── api/
│   └── routes/           # API route handlers
│       ├── health.py     # Health check
│       ├── emotion.py    # Emotion analysis endpoints
│       ├── stt.py        # Speech-to-text endpoints
│       ├── llm.py        # LLM endpoints
│       └── chat.py       # Combined chat & pitch analysis
│
├── services/             # Business logic services
│   ├── emotion_service.py    # Emotion detection using HuggingFace
│   ├── gemini_service.py     # Gemini 2.5 Pro integration
│   └── stt_service.py        # Google Cloud STT integration
│
└── schemas/              # Pydantic models
    └── api_schemas.py    # Request/response schemas
```

---

## 🎯 Service Details

### Emotion Detection Service
- **Model**: `j-hartmann/emotion-english-distilroberta-base`
- **Emotions**: anger, disgust, fear, joy, neutral, sadness, surprise
- **Metrics**: 
  - Nervousness score & level
  - Enthusiasm score & level
  - Confidence score & level
  - Emotional stability

### Gemini LLM Service
- **Model**: `gemini-2.0-flash-exp` (latest Gemini model)
- **Features**: 
  - Emotion-aware coaching responses
  - Conversation history management
  - Customizable coaching persona
  - Fallback responses for errors

### STT Service
- **Provider**: Google Cloud Speech-to-Text
- **Features**: 
  - Multiple audio format support (WAV, MP3, FLAC, OGG)
  - Automatic punctuation
  - Mock mode for development without credentials
  - Confidence scoring

---

## 🔧 Development Notes

### Mock Mode
If you don't have Google Cloud credentials configured, the STT service runs in **mock mode** and returns a sample transcription. This allows you to develop and test the emotion and LLM pipeline without Google Cloud setup.

### Emotion Model Download
On first run, the emotion detection model (~250MB) will be automatically downloaded from HuggingFace. This may take a few minutes.

### Performance
- Emotion analysis: ~50-100ms (CPU)
- LLM response: ~1-3s
- STT transcription: ~500ms-2s (depends on audio length)

---

## 🚀 Next Steps

1. **Test the API** using the Swagger UI or curl commands
2. **Integrate with frontend** (Next.js React components)
3. **Add TTS** (Phase 5) for voice responses
4. **Add session management** and user progress tracking
5. **Deploy** to cloud (AWS, GCP, Azure)

---

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `HUGGINGFACE_API_KEY` | HuggingFace API key | Optional |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID | Optional |
| `DATABASE_URL` | Database connection string | SQLite |
| `PORT` | Server port | 8000 |
| `DEBUG` | Enable debug mode | True |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |

---

## 🤝 Contributing

This is a comprehensive backend implementation following best practices:
- ✅ Async/await for better performance
- ✅ Proper error handling and logging
- ✅ Pydantic validation for all requests
- ✅ Modular service architecture
- ✅ Singleton pattern for service instances
- ✅ CORS configuration
- ✅ Structured logging

---

## 📄 License

Part of the Pitchex FYP Project - 2025
