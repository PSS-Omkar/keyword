# Keyword Generator (Frontend + Backend)

This repo runs the frontend and backend separately, locally or via Docker Compose.

## Structure
- client/ — React + Vite frontend
- server/ — Express + TypeScript backend
- shared/ — Shared types/schemas (imported via @shared)
- attached_assets/ — Assets used by the frontend

## Local development

Frontend
- cd client
- npm install
- npm run dev
- Open http://localhost:5173

Backend (in-memory, no DB required)
- cd server
- npm install
- On macOS/Linux: STORAGE_MODE=memory npm run dev
- On Windows (PowerShell): $env:STORAGE_MODE="memory"; npm run dev
- API: http://localhost:5000

Backend with Postgres (optional)
- Set DATABASE_URL (e.g., postgresql://user:pass@host:5432/db)
- Remove STORAGE_MODE when using a real DB

## Docker

- docker compose up --build
- Frontend: http://localhost:3001
- Backend:  http://localhost:5000

Notes
- client Docker image serves the built SPA with Nginx and proxies /api to the backend service
- server Docker image runs the Express API; STORAGE_MODE defaults to memory unless DATABASE_URL is provided

## Environment variables (server)
- STORAGE_MODE — "memory" to use in-memory storage
- DATABASE_URL — Postgres connection string (when not using memory)
- Optional Google Ads integration:
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI,
  - GOOGLE_REFRESH_TOKEN, GOOGLE_DEVELOPER_TOKEN, GOOGLE_CUSTOMER_ID, GOOGLE_LOGIN_CUSTOMER_ID
- USD_RATE — Optional micros→USD fallback rate

## Cleanup
The root previously contained legacy/duplicate files. Cleaned to avoid confusion:
- Removed root-level vite.config.ts and tailwind.config.ts (client has its own)
- Removed legacy Dockerfiles under frontend/ and backend/

If you need anything restored, use the History tab to revert.
