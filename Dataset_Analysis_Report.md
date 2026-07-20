# Handloom Hackathon 2026 — Dataset Analysis & Rating Report
**Problem Statement:** 4.2 — Income Stability & Demand Forecasting Tools  
**Theme:** 4 — Weaver Livelihoods & Financial Inclusion  
**Submission Deadline:** 20 July 2026, 23:59 IST  
**Analysis Date:** 16 July 2026

---

## 1. Hackathon Context

| Detail | Info |
|---|---|
| **Organizer** | Development Commissioner (Handlooms), Ministry of Textiles, Govt. of India |
| **Partners** | National Design Centre + Foundation for Innovation and Technology Transfer (IIT Delhi) |
| **Theme** | "DREAM IT; DO IT" |
| **Total Prize Pool** | ₹4 Lakhs across 4 themes |
| **Round 1** | Idea Submission (4–20 July 2026) |
| **Round 2** | Technical Screening (21–25 July) |
| **Round 3** | Finalist Prep + Virtual Weaver Immersion (26–31 July) |
| **Grand Finale** | 1 August 2026 |
| **Submission URL** | https://youthideathon.in/handloom/ |

---

## 2. What PS 4.2 Asks For

> **Challenge:** Handloom weavers frequently face irregular income due to seasonal demand fluctuations, uncertain market trends, delayed payments, and lack of visibility into future orders. This income instability affects their financial security and discourages younger generations from pursuing weaving as a livelihood.

> **Your HH Mission:** Create intelligent tools that help weavers anticipate market demand, forecast orders, plan production cycles, and manage income more effectively. The solution should provide actionable insights using local market data, buyer trends, and historical demand patterns to support stable earnings and better business decisions.

**Key deliverables judges expect:**
1. **Demand forecasting** — seasonal, festival, wedding, market-trend driven
2. **Income stability modeling** — not just demand, but *predictable income*
3. **Delayed payments** — cash flow visibility and risk scoring
4. **Visibility into future orders** — promised vs actual delivery, order pipeline
5. **Actionable insights** — not just predictions, but *what to do*

---

## 3. Your Dataset — At a Glance

| File | Rows | Purpose | Strength |
|---|---|---|---|
| `clusters.csv` | 34 | Dimension table: 34 real named handloom clusters across 15 states | ⭐ Real entities |
| `signals_weekly.csv` | 260 | Exogenous signals: festivals, wedding season, trends, cotton price, CPI | ⭐ Multi-signal grounding |
| `demand_weekly.csv` | 53,040 | Core modeling table: weekly demand per cluster × product | ⭐ 5-year time series |
| `orders_log.csv` | 62,180 | Order-level disaggregation: buyer type, delivery, payment timing | ⭐ Granular transaction data |
| **Total** | **115,514** | | |

**Coverage:**
- 34 real clusters (Patan Patola, Varanasi Banarasi, Pochampally Ikat, Kanchipuram, etc.)
- 15 states (Gujarat, UP, West Bengal, Odisha, Telangana, AP, TN, Karnataka, Assam, MP, Maharashtra, Rajasthan, Kerala, J&K, Bihar)
- 6 product categories (saree, dupatta, stole, yardage_fabric, home_furnishing, shawl_wrap)
- 260 weeks = 5 years (July 2021 → June 2026)

---

## 4. Dataset Rating — 8.5 / 10

| Category | Score | Rationale |
|---|---|---|
| **Relevance to PS 4.2** | 9/10 | Directly addresses demand forecasting, income irregularity, delayed payments, and order visibility. The order-level log is a killer feature most teams will skip. |
| **Data Volume & Granularity** | 9/10 | 115k+ rows, multi-level (weekly aggregate + order-level), multi-dimensional. More than sufficient for a hackathon prototype. |
| **Realism & Grounding** | 8/10 | Real cluster names, states, specialties. Demand generation uses documented mechanics (seasonality, festivals, wedding season, price elasticity, trends). 51% festival lift, 0.82 trends correlation, 60% late payments — all plausible. |
| **Methodology Transparency** | 9/10 | Every constant is named, justified, and documented. No magic numbers. The generation script is clean and defensible. Data dictionary tags every column (REAL / REAL-PROXY / SYNTHETIC-CALIBRATED / SYNTHETIC-PLACEHOLDER). |
| **Income Stability Angle** | 6/10 | The dataset shows *demand* and *payment delays*, but does not explicitly model **weaver income**, **savings cycles**, **credit access**, or **financial resilience**. This is the gap between "demand forecasting" and "income stability." |
| **Signal Quality** | 7/10 | Google Trends is a synthetic fallback (pytrends was unreachable). Cotton price and CPI are synthetic placeholders. The script explicitly tells you to replace them with real Agmarknet / MOSPI data. |
| **Competitive Differentiation** | 9/10 | Most teams will show a simple demand chart. Your dataset has **order-level payment delays**, **production shortfalls**, **buyer-type segmentation**, and **multi-cluster granularity**. This is a significant differentiator. |
| **Actionability** | 8/10 | The dataset supports: "Which clusters are most at risk?" (payment delay), "Which products spike when?" (festival/wedding), "What's my cash flow 4 weeks out?" (order pipeline). Could be stronger with explicit income modeling. |

**Overall: 8.5 / 10** — This is a **strong, above-average dataset** for Round 1. It will definitely boost your chances.

---

## 5. What This Gets You (Why It Boosts Your Chances)

### ✅ Strengths that impress judges:
1. **You did the research** — 34 real clusters, documented specialties, state-level Census grounding. This isn't a generic "textile dataset."
2. **You understand the problem** — The order-level log explicitly models the two hardest parts of PS 4.2: *"delayed payments"* and *"lack of visibility into future orders."* Most teams will only talk about demand forecasting.
3. **You can defend your data** — The methodology note and data dictionary show you know the difference between real data, proxies, and synthetic generation. This is professional-grade documentation.
4. **You have a working prototype** — The Python script generates the dataset, validates it, and produces a sanity-check plot. This shows technical capability.
5. **You have scale** — 115k+ rows is substantial. Judges can see you're not playing with toy data.

### ⚠️ Weaknesses to address:
1. **"Income Stability" is underrepresented** — The problem is called *Income Stability & Demand Forecasting*, not just demand forecasting. Your dataset shows demand and payment delays, but it doesn't show **what a weaver actually earns**, **whether that's enough to cover expenses**, or **how income volatility affects their household**.
2. **Synthetic placeholders are flagged** — Cotton price and CPI are synthetic. The script explicitly tells you to replace them. If a judge asks, you should be able to say "We replaced these with real data from X."
3. **No weather / monsoon data** — Monsoon directly affects cotton supply and rural purchasing power. This is a missed signal.
4. **No powerloom / mill-made competition data** — Handloom competes with powerloom and mill-made textiles. Understanding competitive pressure is part of market forecasting.
5. **No digital footprint / social media signals** — For a 2026 hackathon, Instagram/Pinterest trends, e-commerce search data, or D2C platform signals could be powerful.

---

## 6. How to Strengthen It (Before Submission)

You have ~4 days left. Here's what to prioritize:

| Priority | Action | Impact | Time |
|---|---|---|---|
| 🔴 **High** | Add a **weaver income model** — weekly income per cluster = (units_delivered × avg_order_value) − raw_material_cost − loom_maintenance − payment_delay_penalty. This directly bridges "demand" to "income stability." | **Massive** — directly answers the problem statement | 2–3 hrs |
| 🔴 **High** | Replace **cotton_price_inr_per_kg** with real Agmarknet data (or even a scraped sample). Same for **CPI** from MOSPI. Even partial real data strengthens defensibility. | High | 1–2 hrs |
| 🟡 **Medium** | Add a **monsoon / rainfall** signal (IMD data or synthetic based on actual monsoon timing). Monsoon affects both supply (cotton) and demand (rural purchasing). | Medium | 1–2 hrs |
| 🟡 **Medium** | Add **powerloom / mill-made price proxies** as a competitive pressure signal. | Medium | 1–2 hrs |
| 🟢 **Low** | Add a **cluster risk score** derived from payment-delay patterns, production shortfall, and demand volatility. This is a ready-made "actionable insight." | Medium-High | 1 hr |
| 🟢 **Low** | Generate a **weaver_livelihoods.csv** table with: estimated weekly income, income volatility (std dev), months with negative cash flow, credit need flag. This is the "income stability" table. | High for Round 3 | 2 hrs |

---

## 7. What Happens in Round 2 & Round 3

If you're selected as a finalist (Round 3, 26–31 July):
- You'll do a **1-week virtual weaver immersion** — this is your chance to validate the synthetic demand curves against real weaver-reported order patterns.
- Judges will ask: *"How did you validate this?"* — Your answer: *"We calibrated against the 4th All India Handloom Census 2019-20 for state-level weaver counts and income patterns, and we're now validating against real weaver-reported data during the immersion phase."*
- The **incubation pathway** (1-year structured support) is for investor-ready solutions. If your dataset is strong enough to build a working prototype, you have a shot at this.

---

## 8. Verdict

**Your dataset is GOOD. It will boost your chances.**

- **Round 1:** 8.5/10 — Strong enough to get you through.
- **Round 2:** Likely to pass technical screening if your pitch clearly explains the methodology.
- **Round 3:** You'll need to add real weaver data during immersion, but your synthetic baseline is solid.

**The biggest gap is the "income stability" half of the problem.** Right now your dataset is 90% "demand forecasting" and 10% "income stability." If you can add a weaver income model and cash flow table, this becomes a 9.5/10 dataset that directly answers both halves of the problem statement.

---

*Report generated on 16 July 2026 for Handloom Hackathon 2026, PS 4.2.*
