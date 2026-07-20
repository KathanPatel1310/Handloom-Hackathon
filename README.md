# AI Weaver Companion — Handloom Hackathon (PS 4.2)

**Income Stability & Demand Forecasting Tools** for handloom weavers.

Turns seasonal demand, buyer trends, and cashflow risk into a weekly action:
**What should I weave this week?**

## What judges see

| Mode | Purpose |
|------|---------|
| **Weaver** | One action card, cash traffic light, forecast graph, orders, voice/text assistant (EN/HI/GU), printable weekly card |
| **Admin** | Demand forecast with 90% confidence bands, 4-week cashflow, walk-forward backtest metrics (WAPE vs seasonal baseline) |

## Stack

- **ML:** XGBoost + seasonal-naive ensemble, walk-forward split, conformal 90% intervals
- **Backend:** FastAPI (`backend/app/main.py`)
- **Frontend:** React + Vite (`frontend/`) — Phase 2 companion UI
- **Data:** Hybrid real clusters + Agmarknet cotton / MoSPI CPI + demand history (see `extracted/METHODOLOGY.md`)

## Quick start

```bash
# 1) Python deps (from repo root)
.\.venv\Scripts\pip install -r requirements.txt

# Optional: regenerate models/artifacts
# .\.venv\Scripts\python.exe run_phase1.py

# 2) Backend
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000

# 3) Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

Optional Gemini assistant:

```bash
# Windows PowerShell
$env:GEMINI_API_KEY="your_key"
# or paste the key in Profile → Gemini API key (browser-only)
```

Without a key, the assistant uses a solid rule-based fallback grounded in the recommendation package.

## Demo script

See `DEMO_SCRIPT.md` (2–3 minutes). Highlight:

1. Weaver home → “Weave N units” + traffic light  
2. Forecast graph with confidence band  
3. Admin metrics: ensemble **WAPE ≈ 0.224** vs baseline **≈ 0.293**, coverage **≈ 0.91**  
4. Print card for low-smartphone field use  

## Problem statement mapping

| PS 4.2 need | Where it lives |
|-------------|----------------|
| Anticipate market demand | Ensemble forecast + festival/trend signals |
| Forecast orders | Weekly demand + orders log |
| Plan production | Capacity-aware weekly plan + print card |
| Manage income | Cashflow projection + credit traffic light + loan advice |
| Local market / buyer / history | Cluster signals, buyer_type orders, 5-year lags |

## Key paths

- `artifacts/` — trained models, forecasts, cashflow, backtest summary  
- `extracted/` — datasets + methodology  
- `Plan/` — product UX specs  
- `BACKTEST_RESULTS.md` — model credibility  
- `DEPLOYMENT.md` — Vercel + Render/Railway notes  
