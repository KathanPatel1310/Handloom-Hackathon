# Deployment

## Current status

The Phase 1 pipeline, FastAPI backend, and React frontend are implemented locally in this workspace and run against real artifacts generated from the provided CSVs.

Live cloud deployment is still pending because this environment does not have authenticated Vercel / Render / Railway credentials attached to it, so I could not publish a public URL directly from here without your account access.

## Local verification

1. Run the model pipeline:

```bash
python run_phase1.py
```

2. Start the backend:

```bash
uvicorn backend.app.main:app --reload
```

3. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

4. Open `http://localhost:5173` and verify:

- Weaver mode shows the weekly action card, cash traffic light, forecast, orders, and assistant.
- Admin mode shows forecast confidence bands, cashflow projection, and backtest metrics (WAPE vs baseline).
- Browser print creates a single-page weaver card.
- Language switch works for Gujarati / Hindi / English.

## Cloud deployment steps

### Frontend on Vercel

1. Import `frontend/` as a Vercel project.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variable:

```bash
VITE_API_BASE_URL=https://<your-backend-domain>
```

### Backend on Render or Railway

1. Create a Python web service from this repo root.
2. Install command:

```bash
pip install -r requirements.txt
```

3. Start command:

```bash
python run_phase1.py && uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

4. Set environment variable:

```bash
FRONTEND_ORIGINS=https://<your-vercel-domain>
```

## Live URL

Pending deployment credentials. Fill in after publishing:

- Frontend:
- Backend:
