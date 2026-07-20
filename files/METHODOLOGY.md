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

**Validation, not just assertion**
The generation script prints and checks: the demand lift around major
festivals (~51%, consistent with widely reported festive-season retail
upticks in India), the correlation between simulated demand and the trends
signal (0.82), and the realism of the payment-delay distribution (60% of
orders somewhat late, not literally everyone — matching real informal-sector
payment friction rather than an exaggerated worst case).

**What's next**
Every synthetic-placeholder column (cotton price, CPI) is documented with the
exact real source that should replace it — Agmarknet / Cotton Corporation of
India for cotton prices, MOSPI for CPI — and the mandatory weaver-immersion
phase (if selected as a finalist) is the natural point to calibrate the
synthetic demand curves against real weaver-reported order patterns.
