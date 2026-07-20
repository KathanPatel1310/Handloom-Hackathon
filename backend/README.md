# Backend

Run locally:

```bash
python run_phase1.py
uvicorn backend.app.main:app --reload
```

The API expects the Phase 1 artifacts under `artifacts/` and serves real backtest, forecast, cashflow, and insight outputs from those files.
