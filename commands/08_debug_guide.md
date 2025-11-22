# Debug Guide

Common issues and how to resolve them.

## Backend Issues

### 1. "Module not found"
- **Cause**: Virtual environment not activated or dependency missing.
- **Fix**:
  ```bash
  source venv/bin/activate
  pip install -r requirements.txt
  ```

### 2. Database Connection Failed
- **Cause**: Incorrect credentials in `.env` or DB server not running.
- **Fix**: Check `.env` file and ensure the database service is active.

### 3. CORS Errors
- **Cause**: Frontend origin not allowed in backend configuration.
- **Fix**: Update `backend/core/config.py` or `main.py` to include the frontend URL in `allow_origins`.

## Frontend Issues

### 1. API Request Failed (404/500)
- **Cause**: Backend not running or incorrect API URL.
- **Fix**: Check Network tab in DevTools. Verify `VITE_API_URL` in `.env`.

### 2. Component Not Rendering
- **Cause**: Import error or logic issue.
- **Fix**: Check console for React errors. Verify props being passed.

## Logs

### Backend Logs
Logs are typically output to stdout. You can also configure file logging in `backend/core/config.py`.

### Frontend Logs
Use `console.log` for development debugging. Ensure to remove them before production.
