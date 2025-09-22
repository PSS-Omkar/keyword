# Keyword Generator - Separated Frontend and Backend

This repository is organized to run frontend and backend independently, both locally and with Docker.

## Repository structure

- client/ — React + Vite frontend (standalone)
  - Dockerfile
  - docker-compose.yml
  - vite.config.ts, tailwind.config.ts, postcss.config.js
- server/ — Express + TypeScript backend (standalone)
  - Dockerfile
  - docker-compose.yml
- shared/ — Shared types/schemas used by both (imported via @shared alias)
- attached_assets/ — Static assets consumed by the frontend

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Docker (optional, for containerized runs)

---

## Run locally (no Docker)

### Frontend only

- cd client
- npm install
- npm run dev
- Open http://localhost:5173

### Backend only (memory storage, no DB needed)

- cd server
- npm install
- On macOS/Linux: STORAGE_MODE=memory npm run dev
- On Windows (PowerShell): $env:STORAGE_MODE="memory"; npm run dev
- API available at http://localhost:5000

### Backend with Postgres (optional)

- Set DATABASE_URL (Postgres connection string), e.g.
  - macOS/Linux: DATABASE_URL="postgresql://user:pass@host:5432/db" npm run dev
  - Windows (PowerShell): $env:DATABASE_URL="postgresql://user:pass@host:5432/db"; npm run dev
- Remove STORAGE_MODE from the environment when using a real DB.

Notes:
- The server exposes a health endpoint at GET /api/health.
- The backend includes an in-memory storage fallback (STORAGE_MODE=memory) so you can develop without a database.

---

## Run with Docker

### Frontend container

- From repo root:
  - docker compose -f client/docker-compose.yml up --build
- App served at http://localhost:3001

### Backend container (memory storage by default)

- From repo root:
  - docker compose -f server/docker-compose.yml up --build
- API served at http://localhost:5000

To use Postgres in Docker:
- Edit server/docker-compose.yml to remove STORAGE_MODE and add DATABASE_URL in environment section.

---

## Environment variables (server)

- STORAGE_MODE — Set to "memory" to use in-memory storage (no DB). Default used in Docker backend.
- DATABASE_URL — Postgres connection string (when not in memory mode).
- Optional Google Ads integration vars (only if you use those endpoints):
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN, GOOGLE_DEVELOPER_TOKEN, GOOGLE_CUSTOMER_ID, GOOGLE_LOGIN_CUSTOMER_ID
- USD_RATE — Optional rate for micros→USD conversion fallback.

---

## Legacy/monolithic dev (optional)

The root-level development server can serve the frontend through Express + Vite in dev mode. If you only plan to run frontend and backend separately, you can ignore the root setup.

---

## Cleaning unused root files

If you confirm you no longer want the legacy/monolithic setup, the following can be removed safely:
- frontend/ (legacy folder)
- backend/ (legacy folder)
- Dockerfile.dev (root-level)
- Possibly root-level tools like tailwind.config.ts and vite.config.ts used by the monolithic dev server

Caution: Removing root vite/tailwind configs will break the monolithic dev server used by server/vite.ts in development. Confirm before deletion.

---

## Troubleshooting

- If the backend returns 500s due to DB, ensure STORAGE_MODE=memory is set (or provide a valid DATABASE_URL).
- Port conflicts: change the published ports in client/docker-compose.yml or server/docker-compose.yml.
- Frontend API base URL: the UI calls the same origin by default when served via the monolithic dev server. When running frontend separately, configure your API base URL if needed (e.g., through a .env and Axios config).
