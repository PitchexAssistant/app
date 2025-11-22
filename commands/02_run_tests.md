# Run Tests

This guide explains how to run tests for both the backend and frontend.

## Backend Tests

Ensure your virtual environment is activated.

### Run All Tests
```bash
cd backend
pytest
```

### Run Specific Test File
```bash
pytest tests/test_emotion_service.py
```

### Run with Coverage
```bash
pytest --cov=. tests/
```

## Frontend Tests

### Run Unit Tests
```bash
cd frontend
npm run test
```

### Run in Watch Mode
```bash
npm run test:watch
```

## End-to-End Tests (Optional)
If Cypress or Playwright is configured:
```bash
npm run e2e
```
