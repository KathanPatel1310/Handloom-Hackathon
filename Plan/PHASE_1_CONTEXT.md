
# PHASE_1_CONTEXT.md

> Read MASTER_CONTEXT.md (when available) before coding.

## Objective
Transform the existing project into a real product for Handloom Hackathon 2026 PS 4.2 while preserving the working ML pipeline, datasets, and backend.

## Preserve
- Existing CSV datasets
- Trained models
- Feature engineering pipeline
- FastAPI backend
- React frontend structure where reasonable

## Product Vision
This is NOT a dashboard.
This is an AI Weaver Companion.

Primary user:
- Individual handloom weaver (40–65 years)
- Low digital literacy
- Android phone
- Prefers Gujarati/Hindi
- Needs actionable guidance, not analytics

Primary goals:
- Predict demand
- Recommend what to produce
- Improve income
- Reduce financial risk

## Non-negotiable rules
- Never fabricate numbers.
- Never display unrealistic income.
- ML predicts.
- Gemini explains.
- Every recommendation must include:
  - What
  - Why
  - Confidence
  - Action
- Preserve walk-forward validation.
- Never replace working ML without measurable improvement.

## Information Architecture
Bottom navigation:
- Home
- AI Assistant
- Forecast
- Orders
- Profile

Separate Admin mode:
- Forecast analytics
- MAPE/WAPE
- Confidence bands
- Cluster insights

## Accessibility
- Large touch targets
- Gujarati first-class
- English + Hindi
- Voice input
- Text input
- Quick-action buttons
- Printable recommendation card
- Mobile-first
- Low-bandwidth

## Existing assets
Reuse existing datasets and artifacts from the repository. Do not regenerate synthetic data unless explicitly required.

## Deliverable
Refactor architecture only. Do not redesign UI yet.
