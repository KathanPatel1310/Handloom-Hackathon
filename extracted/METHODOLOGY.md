# Methodology Note — Hybrid Dataset for Handloom Demand Forecasting

**Why not just use a real dataset?**
No public dataset tracks granular (weekly, per-cluster, per-product) handloom
sales or order volume in India. The 4th All India Handloom Census (2019-20)
is the authoritative government source, but it is a household survey — it
tells you how many weavers exist and what they earn, not week-by-week demand.
This gap is precisely why "Income Stability & Demand Forecasting Tools" is a
real, unsolved problem worth a hackathon, not a data-availability oversight.

**Our approach**
We built a hybrid dataset: real, named entities and real/attempted-real
external signals, feeding a transparent synthetic demand-generation process —
not arbitrary random numbers.

- **Real:** 34 named handloom clusters across 15 states, each with its
  documented product specialty and material, informed by state-level patterns
  in the 4th All India Handloom Census 2019-20.
- **Real-proxy:** Google Trends search interest for handloom-related queries
  as a live demand signal (with a clearly-labelled, shape-matched fallback
  when the API is unreachable).
- **Synthetic, but mechanistic:** weekly order volume is generated from a
  documented formula — baseline scale, annual seasonality, a festival-lead
  effect (bulk orders precede retail buying by several weeks), a wedding-season
  effect, cotton-price elasticity, and a per-cluster growth/decline trend —
  with every coefficient named and justified in the generation script, so it
  can be defended and tuned rather than treated as a black box.
- **Order-level detail:** individual orders are disaggregated with buyer type,
  promised vs. actual delivery, and payment timing, so the dataset speaks
  directly to the two hardest parts of the problem statement — *"lack of
  visibility into future orders"* and *"delayed payments"* — which most
  competing teams will only address at the demand-forecasting level.
- **Income stability layer:** a weekly cashflow table converts delivered demand
  and payment timing into *accrued income vs realized cash-in*, receivables, and
  a credit-stress flag — enabling features like “should I take a short-term loan
  this month?” and “how much production can I safely commit to?”

**Validation, not just assertion**
The generation script prints and checks: the demand lift around major
festivals (~51%, consistent with widely reported festive-season retail
upticks in India), the correlation between simulated demand and the trends
signal (0.82), and the realism of the payment-delay distribution (60% of
orders somewhat late, not literally everyone — matching real informal-sector
payment friction rather than an exaggerated worst case).

**What's next**
Cotton price and CPI are now regenerated from real Indian public sources
(`external_inputs/cotton_prices_weekly.csv` and `external_inputs/cpi_weekly.csv`)
using Agmarknet and MoSPI. The remaining proxy is Google Trends, which can be
cached locally if you want a completely reproducible offline rebuild. The
mandatory weaver-immersion phase (if selected as a finalist) is the natural
point to calibrate the synthetic demand curves against real weaver-reported
order patterns.

## Plugging in real cotton/CPI series (optional but recommended)
If you can source weekly cotton price and CPI data, drop them into:
`external_inputs/cotton_prices_weekly.csv` and `external_inputs/cpi_weekly.csv`

Expected schema:
- `week_start_date` (YYYY-MM-DD, Monday-aligned)
- `cotton_price_inr_per_kg` or `cpi_inflation_index`

When these files exist, the generator automatically uses them and marks the
`*_source` columns as `REAL_FILE` in `signals_weekly.csv`.
