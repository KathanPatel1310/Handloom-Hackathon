
# PHASE_2_CONTEXT.md

> Complete UI/UX redesign. Do not change forecasting logic unless required.

## Core Philosophy
Replace the analytics dashboard with an AI-first product.

The first screen must answer:
"What should I do this week?"

## Home Screen

Large Action Card

Example:

Good Morning, Rameshbhai

This Week:
Weave 6 Patola Sarees

Demand:
HIGH

Reason:
Raksha Bandhan demand increasing.

Buy:
Silk this week

Expected Selling Window:
20–28 July

Confidence:
High

[View Details]

## AI Assistant

Use Gemini API.

Gemini responsibilities:
- Explain forecasts
- Answer questions
- Translate
- Financial education
- Production guidance

Gemini must NOT forecast demand.

## Input methods
Priority:
1. Voice
2. Typing
3. Dynamic quick-question chips

Examples:
- How many sarees should I weave?
- Should I buy silk?
- Will demand increase?
- Why did you recommend this?
- Can I take a loan?

## Languages
- Gujarati
- Hindi
- English

Language chosen during onboarding.

## Forecast Screen
Only one clean trend graph.

Show:
- Demand
- Confidence
- Festival markers
- Production recommendation

Hide technical metrics.

## Insights (Admin only)
- MAPE
- WAPE
- Pinball loss
- Feature importance
- Backtest
- Confidence coverage

## Financial Card
Never show inflated values.

Prefer:
Income increase %
Risk level
Traffic-light indicator

Green = Healthy
Yellow = Caution
Red = Cash shortage likely

## Visual Design
Warm natural colors:
- Indigo
- Turmeric
- Madder
- Cotton cream

Avoid:
- Generic SaaS dashboards
- Blue gradients
- Dense tables

## UX Rules
- No more than one primary action per screen.
- Charts hidden behind View Details.
- Every prediction includes explanation.
- Every explanation ends with an action.
- Every page usable by non-technical weavers.

## Acceptance Criteria
A 55-year-old Gujarati weaver should understand the first screen in under 10 seconds without training.
