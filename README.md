# Cactus Makes Perfect 🌵✨  
Santa Fe 20th Anniversary Guest Portal

This repo contains a monorepo with:

- **Frontend:** React + Vite + Tailwind + TypeScript  
- **Backend:** FastAPI + PostgreSQL (Supabase)  
- **Infra:** Railway deployment configs, Dockerfiles  

## Quickstart (local)

### Frontend
```bash
cd apps/frontend
npm install
npm run dev

### Backend
cd apps/api
pip install .
uvicorn app.main:app --reload

Railway

- Deploy both apps/frontend and apps/api as services via infra/railway.json.
- Configure environment variables in the Railway dashboard.