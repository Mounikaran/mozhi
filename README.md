# Mozhi — Tamil English Coach

AI-powered English coaching for Tamil speakers. Practice speaking English, get real-time transcription via Google STT, and receive bilingual feedback (Tamil + English) powered by Gemini.

## Features

- Voice recording and transcription (Google Cloud STT v2)
- AI-powered coaching feedback in Tamil + English (Google Gemini)
- Text-to-speech feedback playback (Google Cloud TTS)
- Device fingerprinting + approval flow for streak protection
- Database-driven API pricing (no hardcoded costs)
- Configurable API models (switch Gemini version without redeploy)
- Admin panel: users, devices, pricing, cost reports

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| Backend | FastAPI, Python 3.14, SQLModel (Pydantic v2 + SQLAlchemy) |
| Database | PostgreSQL (Supabase or Docker) |
| AI | Google Gemini (configurable model) |
| Voice | Google Cloud STT v2 + TTS |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Google Cloud credentials (Gemini API key, STT/TTS service account)

### Setup

```bash
cp backend/.env.example backend/.env
# Fill in: GEMINI_API_KEY, GOOGLE_APPLICATION_CREDENTIALS, SUPABASE_URL, etc.

docker compose up --build
```

Seed the database (first time):
```bash
docker compose exec backend python seed.py
```

Open:
- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

### Local Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # edit with your values
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

See `backend/.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Strong random secret for JWT signing |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account JSON |
| `SUPABASE_URL` / `SUPABASE_KEY` | If using Supabase instead of local Postgres |

## API Documentation

FastAPI auto-generates interactive docs at `/docs` (Swagger UI) and `/redoc`.

Key routes:
- `POST /auth/register` — Register + get JWT
- `POST /auth/login` — Login with device fingerprint
- `POST /voice/transcribe` — Upload audio, get transcript
- `POST /voice/generate-feedback` — Get AI coaching feedback
- `POST /voice/speak` — TTS for Tamil feedback
- `GET /admin/cost-report` — 30-day cost summary
- `PATCH /admin/api-pricing/{id}` — Update pricing without redeploy

## Cost Tracking

All API costs are stored in the `api_pricing` table and queried at runtime — no hardcoded values. Update prices via the Admin panel or directly in the database. Historical pricing rows are preserved via `effective_date`.

## Device Approval Flow

1. User logs in → device fingerprint captured
2. If new device: created with `is_approved=false`
3. Admin or user approves via `/admin/devices` or `/devices/{id}/approve`
4. Streak protection: only approved devices maintain streak
