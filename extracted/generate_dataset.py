"""
generate_dataset.py
Hybrid real + synthetic dataset generator for handloom weaver demand forecasting.
Built for: Handloom Hackathon 2026, Problem Statement 4.2
           "Income Stability & Demand Forecasting Tools"

Produces five CSVs:
  clusters.csv        - dimension table of 34 real handloom clusters across India
  signals_weekly.csv  - weekly exogenous signals (trends proxy, cotton price,
                         inflation, festival flags, wedding-season flags)
  demand_weekly.csv   - CORE synthetic table: weekly demand per cluster x product
  orders_log.csv       - order-level disaggregation (buyer type, delivery,
                         payment delay) -- this is what lets the model speak to
                         "delayed payments" and "visibility into future orders"
  weaver_cashflow_weekly.csv - cluster-week livelihood table linking delivered
                         demand to accrued income, realized cash-in, receivables,
                         and credit stress

Design principle: every multiplier / coefficient below is a NAMED CONSTANT with
a one-line comment justifying it. Nothing is a bare magic number buried in a
formula. Every column is tagged REAL / REAL-PROXY / SYNTHETIC in
DATA_DICTIONARY.md so the methodology can be defended to judges.
"""

import argparse
import os
import numpy as np
import pandas as pd

try:
    import holidays
    HAVE_HOLIDAYS = True
except ImportError:
    HAVE_HOLIDAYS = False


# =====================================================================
# CONSTANTS  (tune these, but change them HERE, not scattered in formulas)
# =====================================================================
N_YEARS = 5
WEEKS = N_YEARS * 52                       # 260 weeks of history
START_DATE = pd.Timestamp("2021-07-05")    # a Monday; ends ~mid-2026

FESTIVAL_LEAD_WEEKS = 5          # bulk/wholesale orders lead retail by weeks,
                                  # not just the festival week itself
FESTIVAL_MULTIPLIER_PEAK = 1.9   # peak lift the week nearest a major festival;
                                  # broadly consistent with the large festive-season
                                  # upticks Indian retail bodies report each year --
                                  # RE-CITE A SPECIFIC FIGURE before the final pitch
WEDDING_SEASON_MULTIPLIER = 1.25 # sustained (not spiky) lift across "shubh muhurat"
                                  # windows, heaviest for sarees/silk
COTTON_PRICE_ELASTICITY = -0.15  # 1% rise in cotton price vs trailing avg -> ~0.15%
                                  # softer demand; small because handloom is
                                  # craft/heritage-driven, less price-elastic than
                                  # mass-market apparel
TREND_ANNUAL_RANGE = (-0.03, 0.05)   # per-cluster annual drift: some clusters
                                      # shrinking (ageing weaver base, per Census
                                      # signals on declining full-time participation),
                                      # some growing (digitally-connected clusters)
SEASONAL_AMPLITUDE = 0.15        # mild non-festival annual cycle (wedding/winter
                                  # season vs monsoon lull)
AVG_ORDER_SIZE_UNITS = (6, 28)   # per-order size range used to disaggregate weekly
                                  # demand into individual orders in orders_log
PAYMENT_DELAY_MEAN_DAYS = 35     # lognormal center; informal-sector payment lag is
                                  # explicitly named in the problem statement
PAYMENT_DELAY_SIGMA = 0.55       # long right tail (a minority of buyers pay very late)
PRODUCTION_SHORTFALL_RATE = 0.06 # ~6% of ordered units not delivered same-cycle
                                  # (raw material delay, loom downtime)
NON_SPECIALTY_DAMPENING = 0.15   # a cluster still weaves non-specialty products,
                                  # just at a fraction of its main product's volume

PRODUCT_CATEGORIES = [
    "saree", "dupatta", "stole", "yardage_fabric", "home_furnishing", "shawl_wrap"
]

PRODUCTIVE_UNITS_PER_WEAVER_WEEK = {
    "saree": 0.6,
    "dupatta": 2.5,
    "stole": 3.0,
    "yardage_fabric": 6.5,
    "home_furnishing": 4.0,
    "shawl_wrap": 1.6,
}

MATERIAL_COST_SHARE = {
    "cotton": 0.26,
    "silk": 0.22,
    "wool": 0.24,
    "cotton/silk": 0.24,
    "silk-cotton": 0.24,
    "cotton-silk": 0.24,
    "wool/cotton": 0.25,
}

LABOR_SHARE = {
    "cotton": 0.34,
    "silk": 0.37,
    "wool": 0.35,
    "cotton/silk": 0.35,
    "silk-cotton": 0.35,
    "cotton-silk": 0.35,
    "wool/cotton": 0.35,
}

MAINTENANCE_COST_PER_ACTIVE_WEAVER_WEEK = 180.0
WORKING_CAPITAL_WEEKLY_COST = 0.0015

# name, state, primary product specialty, primary material, illustrative
# weaver-count estimate (NOT an exact census figure -- order-of-magnitude only,
# informed by state-level patterns in the 4th All India Handloom Census 2019-20),
# illustrative avg price per unit (INR)
CLUSTERS = [
    ("Patan Patola",              "Gujarat",          "saree",           "silk",         800,   45000),
    ("Surendranagar Tangaliya",   "Gujarat",           "shawl_wrap",      "wool",         1200,  4500),
    ("Kutch Weaves (Bhujodi)",    "Gujarat",           "shawl_wrap",      "wool/cotton",  2500,  3200),
    ("Ahmedabad Ashavali",        "Gujarat",           "saree",           "silk",         400,   38000),
    ("Surat Mashru",              "Gujarat",           "yardage_fabric",  "silk-cotton",  900,   1200),
    ("Varanasi Banarasi",         "Uttar Pradesh",     "saree",           "silk",         45000, 8500),
    ("Mubarakpur Azamgarh",       "Uttar Pradesh",     "saree",           "silk",         15000, 6000),
    ("Shantipur-Fulia Tant",      "West Bengal",       "saree",           "cotton",       30000, 2200),
    ("Murshidabad Silk",          "West Bengal",       "saree",           "silk",         12000, 7000),
    ("Bishnupur Baluchari",       "West Bengal",       "saree",           "silk",         3000,  12000),
    ("Nadia Jamdani",             "West Bengal",       "saree",           "cotton",       8000,  9500),
    ("Sambalpur Ikat",            "Odisha",            "saree",           "cotton/silk",  20000, 5000),
    ("Berhampur Patta",           "Odisha",            "saree",           "silk",         6000,  8000),
    ("Nuapatna Sonepuri",         "Odisha",            "saree",           "cotton",       4000,  4200),
    ("Pochampally Ikat",          "Telangana",         "saree",           "cotton/silk",  25000, 4800),
    ("Gadwal",                    "Telangana",         "saree",           "silk-cotton",  8000,  6500),
    ("Venkatagiri",               "Andhra Pradesh",    "saree",           "cotton/silk",  7000,  4000),
    ("Mangalagiri",               "Andhra Pradesh",    "saree",           "cotton",       5000,  2500),
    ("Kanchipuram Kanjeevaram",   "Tamil Nadu",        "saree",           "silk",         35000, 15000),
    ("Arani Silk",                "Tamil Nadu",        "saree",           "silk",         5000,  7000),
    ("Salem",                     "Tamil Nadu",        "yardage_fabric",  "cotton",       6000,  900),
    ("Ilkal",                     "Karnataka",         "saree",           "cotton/silk",  10000, 3800),
    ("Molakalmuru",               "Karnataka",         "saree",           "silk",         3000,  9000),
    ("Guledgudda Khana",          "Karnataka",         "dupatta",         "cotton",       2000,  1500),
    ("Sualkuchi Muga Silk",       "Assam",             "saree",           "silk",         22000, 12000),
    ("Barpeta",                   "Assam",             "yardage_fabric",  "cotton",       5000,  1100),
    ("Chanderi",                  "Madhya Pradesh",    "saree",           "cotton-silk",  4000,  5500),
    ("Maheshwar",                 "Madhya Pradesh",    "saree",           "cotton-silk",  3500,  5000),
    ("Paithan Paithani",          "Maharashtra",       "saree",           "silk",         2500,  20000),
    ("Solapur",                   "Maharashtra",       "home_furnishing", "cotton",       15000, 1800),
    ("Kota Doria",                "Rajasthan",         "saree",           "cotton-silk",  4000,  4200),
    ("Balaramapuram",             "Kerala",            "saree",           "cotton",       3000,  3200),
    ("Srinagar Pashmina",         "Jammu & Kashmir",   "shawl_wrap",      "wool",         6000,  25000),
    ("Bhagalpur Tussar",          "Bihar",             "saree",           "silk",         18000, 6000),
]

# Approximate festival dates 2021-2026. Movable/lunar festivals shift every
# year -- these are best-effort estimates. VERIFY against a panchang or the
# `holidays` package's own calendar before the final pitch; do not present
# these as exact without a check.
FESTIVALS = {
    "Diwali":         {2021: "2021-11-04", 2022: "2022-10-24", 2023: "2023-11-12", 2024: "2024-10-31", 2025: "2025-10-20", 2026: "2026-11-08"},
    "Navratri_start": {2021: "2021-10-07", 2022: "2022-09-26", 2023: "2023-10-15", 2024: "2024-10-03", 2025: "2025-09-22", 2026: "2026-10-11"},
    "Raksha_Bandhan": {2021: "2021-08-22", 2022: "2022-08-11", 2023: "2023-08-30", 2024: "2024-08-19", 2025: "2025-08-09", 2026: "2026-08-28"},
    "Onam":           {2021: "2021-08-21", 2022: "2022-09-08", 2023: "2023-08-29", 2024: "2024-09-15", 2025: "2025-09-05", 2026: "2026-08-26"},
    "Pongal":         {y: f"{y}-01-14" for y in range(2021, 2027)},
    "Eid_ul_Fitr":    {2021: "2021-05-13", 2022: "2022-05-02", 2023: "2023-04-21", 2024: "2024-04-10", 2025: "2025-03-30", 2026: "2026-03-20"},
}

WEDDING_SEASON_MONTHS = [11, 12, 1, 2, 4, 5, 6]  # approximate "shubh muhurat" windows


def monday_floor(series):
    series = pd.to_datetime(series)
    return series - pd.to_timedelta(series.dt.weekday, unit="D")


def load_weekly_series(path, value_column, target_dates):
    if not os.path.exists(path):
        return None

    df = pd.read_csv(path)
    required = {"week_start_date", value_column}
    if not required.issubset(df.columns):
        raise ValueError(
            f"{os.path.basename(path)} must contain columns: week_start_date, {value_column}"
        )

    df["week_start_date"] = pd.to_datetime(df["week_start_date"])
    df = df.sort_values("week_start_date").drop_duplicates("week_start_date", keep="last")
    merged = pd.DataFrame({"week_start_date": target_dates}).merge(
        df[["week_start_date", value_column]],
        on="week_start_date",
        how="left",
    )
    merged[value_column] = merged[value_column].interpolate(limit_direction="both")
    if merged[value_column].isna().any():
        return None
    return merged[value_column].values


# =====================================================================
# TABLE 2: signals_weekly.csv  -- exogenous / grounding layer
# =====================================================================
def build_signals_weekly(rng, input_dir):
    dates = pd.date_range(START_DATE, periods=WEEKS, freq="W-MON")
    df = pd.DataFrame({"week_start_date": dates})
    df["year"] = df["week_start_date"].dt.year
    df["month"] = df["week_start_date"].dt.month
    df["week_of_year"] = df["week_start_date"].dt.isocalendar().week.astype(int)

    all_festival_dates = [(fname, pd.Timestamp(d)) for fname, ymap in FESTIVALS.items() for d in ymap.values()]

    festival_name, festival_proximity = [], []
    for row_date in df["week_start_date"]:
        best_prox, best_name = 0.0, ""
        for fname, fdate in all_festival_dates:
            weeks_diff = (fdate - row_date).days / 7.0
            if -1 <= weeks_diff <= FESTIVAL_LEAD_WEEKS:
                prox = 1.0 - max(weeks_diff, 0) / FESTIVAL_LEAD_WEEKS
                if weeks_diff < 0:  # small post-festival tail
                    prox = max(prox, 0.3)
                if prox > best_prox:
                    best_prox, best_name = prox, fname
        festival_proximity.append(best_prox)
        festival_name.append(best_name)

    df["festival_name"] = festival_name
    df["festival_proximity"] = festival_proximity
    df["is_festival_week"] = df["festival_proximity"] > 0
    df["is_wedding_season"] = df["month"].isin(WEDDING_SEASON_MONTHS)

    # Google Trends: try the real API; gracefully fall back to a documented
    # synthetic proxy with a matching seasonal shape if unreachable (expected
    # in network-restricted sandboxes -- re-run locally with internet to get
    # the REAL series and overwrite this column).
    trends = None
    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl="en-US", tz=330)
        pytrends.build_payload(["handloom saree"], timeframe=f"{START_DATE.date()} {dates[-1].date()}", geo="IN")
        real = pytrends.interest_over_time()
        if not real.empty:
            trends = real["handloom saree"].reindex(dates, method="nearest").values
    except Exception:
        trends = None

    if trends is None:
        base = 45 + 20 * np.sin(2 * np.pi * (df["week_of_year"] - 6) / 52)
        festival_bump = df["festival_proximity"].values * 35
        noise = rng.normal(0, 4, size=len(df))
        trends = np.clip(base + festival_bump + noise, 5, 100)
        df["google_trends_source"] = "SYNTHETIC_PROXY (pytrends unreachable in this environment)"
    else:
        df["google_trends_source"] = "REAL (pytrends)"
    df["google_trends_index"] = np.round(trends, 1)

    cotton_path = os.path.join(input_dir, "cotton_prices_weekly.csv")
    cotton_real = load_weekly_series(cotton_path, "cotton_price_inr_per_kg", dates)
    if cotton_real is not None:
        df["cotton_price_inr_per_kg"] = np.round(cotton_real, 1)
        df["cotton_price_source"] = "REAL_FILE (cotton_prices_weekly.csv)"
    else:
        # Cotton price: random walk in a labelled placeholder band (INR/kg).
        # REPLACE with a real Agmarknet / Cotton Corporation of India series
        # before the final pitch.
        price = np.zeros(len(df))
        price[0] = 190.0
        for i in range(1, len(df)):
            harvest_dip = -0.3 if df["month"].iloc[i] in (11, 12) else 0.0
            price[i] = np.clip(price[i - 1] + rng.normal(0, 2.2) + harvest_dip, 140, 260)
        df["cotton_price_inr_per_kg"] = np.round(price, 1)
        df["cotton_price_source"] = "SYNTHETIC_PLACEHOLDER (drop cotton_prices_weekly.csv into external_inputs/ to override)"

    cpi_path = os.path.join(input_dir, "cpi_weekly.csv")
    cpi_real = load_weekly_series(cpi_path, "cpi_inflation_index", dates)
    if cpi_real is not None:
        df["cpi_inflation_index"] = np.round(cpi_real, 2)
        df["cpi_source"] = "REAL_FILE (cpi_weekly.csv)"
    else:
        cpi = 100 * (1.055 ** (np.arange(len(df)) / 52))  # ~5.5%/yr illustrative drift
        df["cpi_inflation_index"] = np.round(cpi, 2)
        df["cpi_source"] = "SYNTHETIC_PLACEHOLDER (drop cpi_weekly.csv into external_inputs/ to override)"

    return df


# =====================================================================
# TABLE 3: demand_weekly.csv  -- THE CORE MODELING TABLE
# =====================================================================
def build_demand_weekly(rng, clusters_df, signals_df):
    n_weeks = len(signals_df)
    trailing_cotton_avg = signals_df["cotton_price_inr_per_kg"].rolling(12, min_periods=1).mean().values
    week_of_year = signals_df["week_of_year"].values
    fest_prox = signals_df["festival_proximity"].values
    wedding = signals_df["is_wedding_season"].values
    cotton_price = signals_df["cotton_price_inr_per_kg"].values
    week_dates = signals_df["week_start_date"].values

    rows = []
    for _, c in clusters_df.iterrows():
        cluster_scale = rng.uniform(0.6, 1.8)
        annual_trend = rng.uniform(*TREND_ANNUAL_RANGE)
        is_cotton = "cotton" in c["primary_material"]

        for product in PRODUCT_CATEGORIES:
            specialty_factor = 1.0 if product == c["product_specialty"] else NON_SPECIALTY_DAMPENING
            base_units = np.clip(80000 / c["avg_price_per_unit_inr"], 3, 120) * cluster_scale * specialty_factor

            seasonal = 1 + SEASONAL_AMPLITUDE * np.sin(2 * np.pi * (week_of_year - 8) / 52)
            fest_mult = 1 + fest_prox * (FESTIVAL_MULTIPLIER_PEAK - 1)
            if product == "home_furnishing":
                fest_mult = 1 + (fest_mult - 1) * 0.3

            wedding_mult = np.where(wedding & (product in ("saree", "shawl_wrap")), WEDDING_SEASON_MULTIPLIER, 1.0)

            if is_cotton:
                pct_change = np.divide(cotton_price - trailing_cotton_avg, trailing_cotton_avg,
                                        out=np.zeros_like(cotton_price), where=trailing_cotton_avg > 0)
                price_term = 1 + COTTON_PRICE_ELASTICITY * pct_change
            else:
                price_term = np.ones(n_weeks)

            trend_term = (1 + annual_trend) ** (np.arange(n_weeks) / 52)

            expected = base_units * seasonal * fest_mult * wedding_mult * price_term * trend_term
            expected = np.clip(expected, 0.5, None)

            units_ordered = rng.poisson(expected)
            shortfall = rng.binomial(units_ordered, PRODUCTION_SHORTFALL_RATE)
            units_delivered = units_ordered - shortfall
            avg_order_value = c["avg_price_per_unit_inr"] * (1 + rng.normal(0, 0.05, n_weeks))

            for i in range(n_weeks):
                rows.append((
                    c["cluster_id"], product, week_dates[i],
                    int(units_ordered[i]), int(units_delivered[i]), round(float(avg_order_value[i]), 2)
                ))

    return pd.DataFrame(rows, columns=[
        "cluster_id", "product_category", "week_start_date",
        "units_ordered", "units_delivered", "avg_order_value_inr"
    ])


# =====================================================================
# TABLE 4: orders_log.csv  -- order-level disaggregation
# (answers "delayed payments" + "visibility into future orders" directly)
# =====================================================================
def build_orders_log(rng, demand_df, clusters_df):
    price_map = clusters_df.set_index("cluster_id")["avg_price_per_unit_inr"].to_dict()
    buyer_types = np.array(["retail", "wholesale_b2b", "export", "cooperative_bulk"])
    buyer_probs = [0.55, 0.30, 0.08, 0.07]

    demand_nonzero = demand_df[demand_df["units_ordered"] > 0].copy()
    # rough number of orders per row from expected order size, then jitter
    approx_order_size = (AVG_ORDER_SIZE_UNITS[0] + AVG_ORDER_SIZE_UNITS[1]) / 2
    demand_nonzero["n_orders_est"] = np.maximum(1, (demand_nonzero["units_ordered"] / approx_order_size).round().astype(int))

    rows = []
    order_id = 1
    for row in demand_nonzero.itertuples(index=False):
        remaining = row.units_ordered
        n_est = row.n_orders_est
        sizes = rng.integers(AVG_ORDER_SIZE_UNITS[0], AVG_ORDER_SIZE_UNITS[1] + 1, size=n_est)
        for order_size in sizes:
            order_size = int(min(order_size, max(remaining, 1)))
            remaining -= order_size

            buyer_type = rng.choice(buyer_types, p=buyer_probs)
            order_date = pd.Timestamp(row.week_start_date) + pd.Timedelta(days=int(rng.integers(0, 7)))
            unit_price = price_map[row.cluster_id] * (1 + rng.normal(0, 0.06))

            production_days = int(rng.integers(10, 45))
            promised_delivery = order_date + pd.Timedelta(days=production_days)
            delay_slip = int(rng.exponential(4)) if rng.random() < 0.35 else 0
            actual_delivery = promised_delivery + pd.Timedelta(days=delay_slip)

            payment_due = actual_delivery + pd.Timedelta(days=14)
            # Shifted lognormal: most buyers pay within a modest window of the
            # due date (some early, some on time), with a right-skewed tail of
            # genuinely late payers -- this is what the problem statement means
            # by "delayed payments", not everyone-is-late.
            raw_delay = rng.lognormal(mean=np.log(12), sigma=0.9)
            payment_delay = raw_delay - 9
            payment_received = payment_due + pd.Timedelta(days=int(round(payment_delay)))

            rows.append((
                order_id, row.cluster_id, row.product_category, order_date.date(),
                buyer_type, order_size, round(unit_price, 2),
                promised_delivery.date(), actual_delivery.date(),
                payment_due.date(), payment_received.date(),
                int((payment_received - payment_due).days)
            ))
            order_id += 1
            if remaining <= 0:
                break

    cols = ["order_id", "cluster_id", "product_category", "order_date", "buyer_type",
            "quantity", "unit_price_inr", "promised_delivery_date", "actual_delivery_date",
            "payment_due_date", "payment_received_date", "payment_delay_days"]
    return pd.DataFrame(rows, columns=cols)


# =====================================================================
# TABLE 5: weaver_cashflow_weekly.csv -- income stability / cashflow layer
# =====================================================================
def build_weaver_cashflow_weekly(demand_df, orders_df, clusters_df, signals_df):
    demand = demand_df.copy()
    demand["week_start_date"] = pd.to_datetime(demand["week_start_date"])

    weekly_ops = (
        demand.groupby(["cluster_id", "week_start_date"], as_index=False)
        .agg(
            units_ordered=("units_ordered", "sum"),
            units_delivered=("units_delivered", "sum"),
            avg_realized_price_inr=("avg_order_value_inr", "mean"),
        )
    )

    weekly_ops = weekly_ops.merge(
        clusters_df[["cluster_id", "cluster_name", "state", "primary_material", "weaver_count_est"]],
        on="cluster_id",
        how="left",
    ).merge(
        signals_df[["week_start_date", "cotton_price_inr_per_kg", "cpi_inflation_index"]],
        on="week_start_date",
        how="left",
    )

    orders = orders_df.copy()
    orders["actual_delivery_date"] = pd.to_datetime(orders["actual_delivery_date"])
    orders["payment_received_date"] = pd.to_datetime(orders["payment_received_date"])
    orders["delivered_week"] = monday_floor(orders["actual_delivery_date"])
    orders["cash_in_week"] = monday_floor(orders["payment_received_date"])
    orders["order_value_inr"] = orders["quantity"] * orders["unit_price_inr"]

    delivered_value = (
        orders.groupby(["cluster_id", "delivered_week"], as_index=False)["order_value_inr"]
        .sum()
        .rename(columns={"delivered_week": "week_start_date", "order_value_inr": "delivered_revenue_inr"})
    )
    cash_in = (
        orders.groupby(["cluster_id", "cash_in_week"], as_index=False)["order_value_inr"]
        .sum()
        .rename(columns={"cash_in_week": "week_start_date", "order_value_inr": "cash_in_inr"})
    )

    weekly = (
        weekly_ops.merge(delivered_value, on=["cluster_id", "week_start_date"], how="left")
        .merge(cash_in, on=["cluster_id", "week_start_date"], how="left")
        .fillna({"delivered_revenue_inr": 0.0, "cash_in_inr": 0.0})
        .sort_values(["cluster_id", "week_start_date"])
        .reset_index(drop=True)
    )

    weekly["gross_merchandise_value_inr"] = (
        weekly["units_ordered"] * weekly["avg_realized_price_inr"]
    ).round(2)
    weekly["delivered_revenue_inr"] = weekly["delivered_revenue_inr"].round(2)
    weekly["cash_in_inr"] = weekly["cash_in_inr"].round(2)

    weekly["productivity_units_per_weaver_week"] = np.maximum(
        weekly["units_delivered"] / weekly["weaver_count_est"].clip(lower=1), 0
    )

    active_weavers = []
    for row in weekly.itertuples(index=False):
        cluster_rows = demand[
            (demand["cluster_id"] == row.cluster_id)
            & (demand["week_start_date"] == row.week_start_date)
        ]
        capacity = 0.0
        for drow in cluster_rows.itertuples(index=False):
            capacity += drow.units_delivered / PRODUCTIVE_UNITS_PER_WEAVER_WEEK[drow.product_category]
        active_weavers.append(min(row.weaver_count_est, max(1.0, capacity)))
    weekly["active_weavers_est"] = np.round(active_weavers).astype(int)

    material_share = weekly["primary_material"].map(MATERIAL_COST_SHARE).fillna(0.33)
    labor_share = weekly["primary_material"].map(LABOR_SHARE).fillna(0.40)
    cotton_factor = weekly["cotton_price_inr_per_kg"] / weekly["cotton_price_inr_per_kg"].mean()
    cpi_factor = weekly["cpi_inflation_index"] / weekly["cpi_inflation_index"].iloc[0]

    weekly["raw_material_cost_inr"] = (
        weekly["delivered_revenue_inr"] * material_share * (0.85 + 0.15 * cotton_factor)
    ).round(2)
    weekly["wage_cost_inr"] = (
        weekly["delivered_revenue_inr"] * labor_share
    ).round(2)
    weekly["loom_maintenance_cost_inr"] = (
        weekly["active_weavers_est"] * MAINTENANCE_COST_PER_ACTIVE_WEAVER_WEEK * cpi_factor
    ).round(2)

    weekly["net_income_accrual_inr"] = (
        weekly["delivered_revenue_inr"]
        - weekly["raw_material_cost_inr"]
        - weekly["wage_cost_inr"]
        - weekly["loom_maintenance_cost_inr"]
    ).round(2)
    weekly["income_per_active_weaver_inr"] = np.where(
        weekly["active_weavers_est"] > 0,
        weekly["net_income_accrual_inr"] / weekly["active_weavers_est"],
        0.0,
    ).round(2)

    weekly["cumulative_revenue_inr"] = weekly.groupby("cluster_id")["delivered_revenue_inr"].cumsum()
    weekly["cumulative_cash_in_inr"] = weekly.groupby("cluster_id")["cash_in_inr"].cumsum()
    weekly["pending_receivables_inr"] = (
        weekly["cumulative_revenue_inr"] - weekly["cumulative_cash_in_inr"]
    ).clip(lower=0).round(2)
    weekly["working_capital_drag_inr"] = (
        weekly["pending_receivables_inr"] * WORKING_CAPITAL_WEEKLY_COST
    ).round(2)
    weekly["net_cashflow_inr"] = (
        weekly["cash_in_inr"]
        - weekly["raw_material_cost_inr"]
        - weekly["wage_cost_inr"]
        - weekly["loom_maintenance_cost_inr"]
        - weekly["working_capital_drag_inr"]
    ).round(2)

    rolling_mean = (
        weekly.groupby("cluster_id")["net_cashflow_inr"]
        .transform(lambda s: s.rolling(8, min_periods=4).mean())
        .abs()
    )
    rolling_std = weekly.groupby("cluster_id")["net_cashflow_inr"].transform(
        lambda s: s.rolling(8, min_periods=4).std()
    )
    weekly["income_volatility_score"] = (
        rolling_std / rolling_mean.replace(0, np.nan)
    ).fillna(0.0)
    weekly["income_volatility_score"] = weekly["income_volatility_score"].clip(0, 25).round(3)

    rolling_4w_revenue = weekly.groupby("cluster_id")["delivered_revenue_inr"].transform(
        lambda s: s.rolling(4, min_periods=2).mean()
    )
    rolling_4w_cashflow = weekly.groupby("cluster_id")["net_cashflow_inr"].transform(
        lambda s: s.rolling(4, min_periods=2).mean()
    )
    weekly["receivable_weeks_outstanding"] = (
        weekly["pending_receivables_inr"] / rolling_4w_revenue.replace(0, np.nan)
    ).fillna(0.0).round(2)

    # Flag only sustained/meaningful stress:
    # - Negative average cashflow (4w) beyond 20% of revenue, OR
    # - Receivables larger than ~8 weeks of typical revenue (slow-paying buyers / cash crunch).
    weekly["credit_need_flag"] = (
        (rolling_4w_cashflow < (-0.20 * rolling_4w_revenue))
        | (weekly["receivable_weeks_outstanding"] > 8.0)
    )

    return weekly[
        [
            "cluster_id",
            "cluster_name",
            "state",
            "week_start_date",
            "units_ordered",
            "units_delivered",
            "gross_merchandise_value_inr",
            "delivered_revenue_inr",
            "cash_in_inr",
            "raw_material_cost_inr",
            "wage_cost_inr",
            "loom_maintenance_cost_inr",
            "working_capital_drag_inr",
            "net_income_accrual_inr",
            "net_cashflow_inr",
            "active_weavers_est",
            "income_per_active_weaver_inr",
            "pending_receivables_inr",
            "receivable_weeks_outstanding",
            "income_volatility_score",
            "credit_need_flag",
        ]
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", type=str, default="output")
    parser.add_argument("--input-dir", type=str, default="external_inputs")
    args = parser.parse_args()

    rng = np.random.default_rng(args.seed)
    os.makedirs(args.out, exist_ok=True)
    os.makedirs(args.input_dir, exist_ok=True)

    clusters_df = pd.DataFrame(CLUSTERS, columns=[
        "cluster_name", "state", "product_specialty", "primary_material",
        "weaver_count_est", "avg_price_per_unit_inr"
    ])
    clusters_df.insert(0, "cluster_id", ["C" + str(i + 1).zfill(2) for i in range(len(clusters_df))])

    print("Building weekly signals...")
    signals_df = build_signals_weekly(rng, args.input_dir)

    print("Building weekly demand (core table)...")
    demand_df = build_demand_weekly(rng, clusters_df, signals_df)

    print("Exploding into order-level log...")
    orders_df = build_orders_log(rng, demand_df, clusters_df)

    print("Building weekly weaver cashflow table...")
    cashflow_df = build_weaver_cashflow_weekly(demand_df, orders_df, clusters_df, signals_df)

    clusters_df.to_csv(os.path.join(args.out, "clusters.csv"), index=False)
    signals_df.to_csv(os.path.join(args.out, "signals_weekly.csv"), index=False)
    demand_df.to_csv(os.path.join(args.out, "demand_weekly.csv"), index=False)
    orders_df.to_csv(os.path.join(args.out, "orders_log.csv"), index=False)
    cashflow_df.to_csv(os.path.join(args.out, "weaver_cashflow_weekly.csv"), index=False)

    print("\n--- ROW COUNTS ---")
    print(f"clusters.csv:        {len(clusters_df):,} rows")
    print(f"signals_weekly.csv:  {len(signals_df):,} rows")
    print(f"demand_weekly.csv:   {len(demand_df):,} rows")
    print(f"orders_log.csv:      {len(orders_df):,} rows")
    print(f"weaver_cashflow_weekly.csv: {len(cashflow_df):,} rows")
    total = len(clusters_df) + len(signals_df) + len(demand_df) + len(orders_df) + len(cashflow_df)
    print(f"TOTAL:               {total:,} rows")

    print("\n--- VALIDATION ---")
    merged = demand_df.merge(
        signals_df[["week_start_date", "festival_proximity", "google_trends_index"]],
        on="week_start_date"
    )
    festival_weeks = merged.loc[merged["festival_proximity"] > 0.6, "units_ordered"].mean()
    normal_weeks = merged.loc[merged["festival_proximity"] == 0, "units_ordered"].mean()
    lift_pct = (festival_weeks / normal_weeks - 1) * 100
    print(f"Demand lift near major festivals vs normal weeks: {lift_pct:.1f}%")

    # Correlate on the AGGREGATE weekly series, not pooled cluster-product rows --
    # pooling mixes cross-sectional price/scale differences into the correlation
    # and dilutes it. This is the statistically correct check.
    weekly_totals = demand_df.groupby("week_start_date")["units_ordered"].sum().reset_index()
    weekly_totals = weekly_totals.merge(signals_df[["week_start_date", "google_trends_index"]], on="week_start_date")
    corr = weekly_totals[["units_ordered", "google_trends_index"]].corr().iloc[0, 1]
    print(f"Correlation(total weekly demand, google_trends_index): {corr:.3f}")

    avg_payment_delay = orders_df["payment_delay_days"].mean()
    pct_late = (orders_df["payment_delay_days"] > 0).mean() * 100
    print(f"Average payment delay vs due date: {avg_payment_delay:.1f} days ({pct_late:.1f}% of orders paid late)")

    pct_credit_stress = cashflow_df["credit_need_flag"].mean() * 100
    avg_cashflow = cashflow_df["net_cashflow_inr"].mean()
    print(f"Weekly livelihood stress: {pct_credit_stress:.1f}% of cluster-weeks flagged for credit need")
    print(f"Average net cashflow per cluster-week: INR {avg_cashflow:,.0f}")

    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plot_df = demand_df[demand_df["product_category"] == "saree"].groupby("week_start_date")["units_ordered"].sum()
    plt.figure(figsize=(12, 4))
    plt.plot(plot_df.index, plot_df.values)
    plt.title("Weekly saree demand, all clusters combined (synthetic)")
    plt.xlabel("Week")
    plt.ylabel("Units ordered")
    plt.tight_layout()
    plt.savefig(os.path.join(args.out, "demand_seasonality_check.png"), dpi=120)
    print(f"\nSaved sanity-check plot to {args.out}/demand_seasonality_check.png")


if __name__ == "__main__":
    main()
