# Setup Environment

This guide outlines the steps to set up the development environment for Pitchex.

## Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Git**

## 1. Clone the Repository
```bash
git clone <repository-url>
cd Pitchex
```

## 2. Backend Setup

### Create Virtual Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Environment Variables
Copy the example environment file and configure your keys.
```bash
cp .env.example .env
# Edit .env with your API keys (Gemini, Hume, etc.)
```

### Run Backend
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

## 3. Frontend Setup

### Install Dependencies
```bash
cd frontend
npm install
```

### Environment Variables
Create a `.env` file in the `frontend` directory if needed.
```bash
cp .env.example .env
```

### Run Frontend
```bash
npm run dev
```
The application will be available at `http://localhost:5173` (or similar).

## 4. Verify Setup
- Open `http://localhost:5173` in your browser.
- Ensure the backend is running and reachable.
