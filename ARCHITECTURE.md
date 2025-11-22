# Pitchex Architecture Guide

## 1. System Overview
Pitchex is an AI-powered coaching platform designed to help users improve their public speaking and pitching skills. The system leverages advanced emotion detection, speech analysis, and Large Language Models (LLMs) to provide real-time, personalized feedback.

## 2. Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI/ML**: 
    - Google Gemini (LLM for coaching and feedback)
    - Hume AI / Custom Models (Emotion detection)
    - Speech-to-Text (Transcription)
- **Database**: SQLite (Development), PostgreSQL (Production recommended)
- **ORM**: SQLAlchemy (Async)
- **Migrations**: Alembic

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS / Vanilla CSS
- **State Management**: React Context / Hooks
- **HTTP Client**: Axios / Fetch API

### DevOps & Tools
- **Containerization**: Docker (planned)
- **CI/CD**: GitHub Actions (planned)
- **Testing**: Pytest (Backend), Jest/Vitest (Frontend)

## 3. Directory Structure

```
Pitchex/
├── backend/                 # FastAPI Application
│   ├── api/                 # API Routes and Controllers
│   │   ├── routes/          # Endpoint definitions
│   │   └── deps.py          # Dependencies (Auth, DB session)
│   ├── core/                # Core configurations
│   │   ├── config.py        # Environment settings
│   │   └── security.py      # JWT, Hashing
│   ├── db/                  # Database layer
│   │   ├── models/          # SQLAlchemy models
│   │   └── session.py       # DB connection logic
│   ├── services/            # Business logic & External integrations
│   │   ├── emotion_service.py
│   │   ├── gemini_service.py
│   │   └── audio_service.py
│   ├── schemas/             # Pydantic models (Data Validation)
│   ├── tests/               # Backend tests
│   └── main.py              # Application entry point
│
├── frontend/                # React Application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API client functions
│   │   ├── context/         # Global state (Auth, Theme)
│   │   └── hooks/           # Custom React hooks
│   ├── public/              # Static assets
│   └── index.html           # Entry HTML
│
├── commands/                # Agent & Developer Command Guides
│   ├── 01_setup_environment.md
│   └── ...
│
├── .env                     # Environment variables (Gitignored)
├── .gitignore
└── README.md
```

## 4. Core Components

### 4.1 Emotion Engine
The Emotion Engine is responsible for analyzing audio and text input to determine the user's emotional state (e.g., confident, nervous, enthusiastic).
- **Input**: Audio stream or transcribed text.
- **Processing**: Uses pre-trained models or APIs to score emotions.
- **Output**: JSON object with emotion scores and dominant emotion.

### 4.2 Coaching Service (Gemini Integration)
Generates personalized feedback based on the user's pitch content and emotional analysis.
- **Prompt Engineering**: Context-aware prompts inject emotion data into the LLM context.
- **Response**: Actionable advice, improved phrasing, and encouragement.

### 4.3 Session Management
Tracks user sessions, storing pitch history, analysis results, and progress over time.

## 5. Data Flow

1. **User Input**: User records audio or uploads a file via the Frontend.
2. **Upload & Transcribe**: Audio is sent to the Backend, saved, and transcribed.
3. **Analysis**: 
    - Transcription is sent to the **Emotion Engine**.
    - Transcription + Emotion Data is sent to the **Coaching Service**.
4. **Storage**: Results are saved to the Database linked to the User Session.
5. **Feedback**: Results are returned to the Frontend for visualization (charts, text feedback).

## 6. Scalability & Performance

- **Async I/O**: FastAPI's async capabilities are used for non-blocking I/O operations (DB calls, external API requests).
- **Caching**: Implement Redis (future) for caching frequent queries and session data.
- **Worker Queues**: Use Celery or ARQ (future) for heavy background processing (video rendering, deep audio analysis) to keep the API responsive.
- **Database Indexing**: Ensure proper indexing on foreign keys and frequently queried fields (e.g., `user_id`, `created_at`).

## 7. Security Best Practices

- **Environment Variables**: Sensitive keys (API keys, DB passwords) must be loaded from `.env`.
- **Input Validation**: All incoming data is validated using Pydantic schemas.
- **CORS**: Configured to allow only trusted origins.
- **Rate Limiting**: Implement to prevent abuse of expensive AI endpoints.

## 8. Development Workflow

Refer to the `commands/` directory for specific guides on:
- Setting up the environment.
- Creating new endpoints and components.
- Running tests and deployments.
