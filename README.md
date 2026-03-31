# Sol - AI Therapy App

Sol is an AI-powered therapy app for college students. It provides a warm, trustworthy, and calm AI companion that genuinely listens without judgment.

## Tech Stack
- **Frontend**: React 18, Vite, React Router v6, TailwindCSS, Framer Motion
- **Backend**: FastAPI (Python 3.11+), Uvicorn, Pydantic v2
- **Database & Auth**: Supabase (PostgreSQL)

## Getting Started

### Prerequisites
- Node.js (for frontend)
- Python 3.11+ (for backend)
- Supabase Project

### Backend Setup
1. Navigate to `backend/`
2. Create a virtual environment and install dependencies: `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill in your Supabase and OpenAI keys.
4. Run the Supabase SQL migration at `backend/supabase_migrations/001_initial.sql` in your Supabase SQL editor.
5. Start the API server: `uvicorn app.main:app --reload`

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Supabase project keys and API URL.
4. Start the development server: `npm run dev`
