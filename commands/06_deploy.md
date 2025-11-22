# Deployment Guide

This guide covers the steps to build and deploy the Pitchex application.

## 1. Build Frontend
Create a production build of the React application.

```bash
cd frontend
npm run build
```
The static files will be generated in the `dist/` directory.

## 2. Backend Preparation
Ensure all dependencies are listed in `requirements.txt`.

```bash
cd backend
pip freeze > requirements.txt
```

## 3. Docker (Recommended)
Build the Docker image using the `Dockerfile` (if available).

```bash
docker build -t pitchex-app .
docker run -d -p 8000:8000 pitchex-app
```

## 4. Manual Deployment
1. **Database**: Run migrations on the production database.
   ```bash
   alembic upgrade head
   ```
2. **Static Files**: Serve the `frontend/dist` folder using Nginx or similar.
3. **Backend**: Run the FastAPI app using Gunicorn or Uvicorn with production settings.
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

## 5. Environment Variables
Ensure all production environment variables are set on the server (API keys, DB URL, Secret Key).
