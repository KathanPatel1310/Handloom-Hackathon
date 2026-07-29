from __future__ import annotations

import json
import os
from collections import defaultdict
from functools import lru_cache
from pathlib import Path
from typing import Any
from urllib import error, request

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from xgboost import Booster

from pipeline_common import (
    ARTIFACTS_DIR,
    ROOT_DIR,
    load_cashflow,
    load_clusters,
    load_orders,
    read_json,
)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


app = FastAPI(
    title="AI Weaver Companion API",
    version="3.0.0",
    description="Personalised recommendation backend for the Handloom AI Weaver Companion.",
)

TODAY = pd.Timestamp("2026-07-18")
GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)
MODEL_DIR = ARTIFACTS_DIR / "models"

PRODUCT_CATALOG: dict[str, dict[str, Any]] = {
    "sarees": {
        "label": "Sarees",
        "model_category": "saree",
        "capacity_per_loom": (4, 6),
        "material_kg_per_unit": 2.0,
        "track": "complex_saree",
        "icon": "🪡",
    },
    "dupattas": {
        "label": "Dupattas",
        "model_category": "dupatta",
        "capacity_per_loom": (15, 25),
        "material_kg_per_unit": 0.55,
        "track": "light_apparel",
        "icon": "🧣",
    },
    "shawls": {
        "label": "Shawls",
        "model_category": "shawl_wrap",
        "capacity_per_loom": (10, 18),
        "material_kg_per_unit": 0.85,
        "track": "shawl",
        "icon": "🧵",
    },
    "towels": {
        "label": "Towels",
        "model_category": "home_furnishing",
        "capacity_per_loom": (30, 50),
        "material_kg_per_unit": 0.22,
        "track": "utility_textile",
        "icon": "🧺",
    },
    "bedsheets": {
        "label": "Bedsheets",
        "model_category": "home_furnishing",
        "capacity_per_loom": (10, 15),
        "material_kg_per_unit": 1.35,
        "track": "home_textile",
        "icon": "🛏️",
    },
    "gamchas": {
        "label": "Gamchas",
        "model_category": "home_furnishing",
        "capacity_per_loom": (35, 55),
        "material_kg_per_unit": 0.18,
        "track": "utility_textile",
        "icon": "🧺",
    },
    "scarves": {
        "label": "Scarves",
        "model_category": "stole",
        "capacity_per_loom": (15, 25),
        "material_kg_per_unit": 0.38,
        "track": "light_apparel",
        "icon": "🧣",
    },
    "silk_fabric": {
        "label": "Silk Fabric",
        "model_category": "yardage_fabric",
        "capacity_per_loom": (18, 28),
        "material_kg_per_unit": 0.45,
        "track": "fabric",
        "icon": "🪢",
    },
    "cotton_fabric": {
        "label": "Cotton Fabric",
        "model_category": "yardage_fabric",
        "capacity_per_loom": (20, 30),
        "material_kg_per_unit": 0.5,
        "track": "fabric",
        "icon": "🪢",
    },
    "stoles": {
        "label": "Stoles",
        "model_category": "stole",
        "capacity_per_loom": (15, 25),
        "material_kg_per_unit": 0.4,
        "track": "light_apparel",
        "icon": "🧣",
    },
    "other": {
        "label": "Other",
        "model_category": "yardage_fabric",
        "capacity_per_loom": (12, 20),
        "material_kg_per_unit": 0.65,
        "track": "fabric",
        "icon": "🪡",
    },
}

TRACK_TASKS: dict[str, list[tuple[str, str]]] = {
    "complex_saree": [
        ("Monday", "Check loom setup, sort yarn, and prepare warp for the first half of the week."),
        ("Tuesday", "Warp and wind pirns for the first 2 pieces. Start border work."),
        ("Wednesday", "Focus on steady weaving for the main body of the order."),
        ("Thursday", "Continue weaving and complete motif or border alignment checks."),
        ("Friday", "Finish the remaining pieces and inspect for weaving defects."),
        ("Saturday", "Do finishing, trimming, folding, and packing."),
        ("Sunday", "Call buyers, confirm delivery timing, and prepare payment follow-up."),
    ],
    "light_apparel": [
        ("Monday", "Prepare yarn, warp, and dye or sort colors for the week."),
        ("Tuesday", "Weave the first batch and keep finishing thread ready."),
        ("Wednesday", "Continue weaving and separate completed pieces for trimming."),
        ("Thursday", "Finish the second batch and check edges."),
        ("Friday", "Steam, fold, and pack finished pieces."),
        ("Saturday", "Keep one batch ready for delivery or local market pickup."),
        ("Sunday", "Review stock and confirm next week’s raw material needs."),
    ],
    "shawl": [
        ("Monday", "Prepare warp and wool or blended yarn for the week."),
        ("Tuesday", "Weave the first set and keep pattern notes nearby."),
        ("Wednesday", "Continue weaving with focus on consistent width and finish."),
        ("Thursday", "Complete the second set and start finishing."),
        ("Friday", "Brush, trim, and fold finished shawls."),
        ("Saturday", "Pack completed shawls and line up dispatch."),
        ("Sunday", "Review remaining yarn and confirm the next payment milestone."),
    ],
    "utility_textile": [
        ("Monday", "Prepare warp for the week and split production into two batches."),
        ("Tuesday", "Weave the first batch at steady pace."),
        ("Wednesday", "Continue weaving and separate completed pieces for cutting."),
        ("Thursday", "Weave the second batch and keep finishing work ready."),
        ("Friday", "Trim, fold, and bundle finished textiles."),
        ("Saturday", "Pack and label by batch for buyers or retailers."),
        ("Sunday", "Review stock movement and plan raw material refill."),
    ],
    "home_textile": [
        ("Monday", "Prepare long warp and confirm measurements for each bedsheet."),
        ("Tuesday", "Weave the first half of the batch."),
        ("Wednesday", "Continue weaving and inspect width and selvedge consistency."),
        ("Thursday", "Finish remaining pieces and start trimming."),
        ("Friday", "Do washing, drying, folding, and packing."),
        ("Saturday", "Bundle orders for delivery and note expected payments."),
        ("Sunday", "Review raw material usage and plan next week’s purchase."),
    ],
    "fabric": [
        ("Monday", "Prepare warp, count yarn, and plan fabric length targets."),
        ("Tuesday", "Weave the first run and monitor uniformity."),
        ("Wednesday", "Continue weaving and separate completed rolls."),
        ("Thursday", "Finish target fabric length and inspect consistency."),
        ("Friday", "Roll, measure, and pack completed fabric."),
        ("Saturday", "Confirm dispatch and buyer requirements."),
        ("Sunday", "Prepare the next run based on demand signals."),
    ],
}

SPECIAL_LABEL_OVERRIDES = {
    ("C01", "saree"): "Patola Sarees",
    ("C09", "saree"): "Banarasi Silk Sarees",
    ("C03", "dupatta"): "Ajrakh Dupattas",
    ("C03", "stole"): "Ajrakh Stoles",
}

LANGUAGE_NAMES = {"gu": "Gujarati", "hi": "Hindi", "en": "English"}
PRICE_PROXY_LABELS = {
    "silk": "silk yarn price proxy",
    "cotton": "cotton yarn price proxy",
    "wool": "wool yarn price proxy",
    "wool/cotton": "blended yarn price proxy",
}


origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5175,http://127.0.0.1:5175,http://localhost:3456,http://127.0.0.1:3456,http://localhost:3457,http://127.0.0.1:3457,http://localhost:3458,http://127.0.0.1:3458,https://example.vercel.app",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




class WeaverProfile(BaseModel):
    name: str = Field(default="Rameshbhai")
    cluster_id: str
    primary_product_key: str
    selected_product_keys: list[str] = Field(default_factory=list)
    loom_count: int = Field(default=1, ge=1, le=50)
    weaver_count: int = Field(default=1, ge=1, le=200)
    average_weekly_output: float = Field(default=4.0, gt=0, le=500)
    language: str = Field(default="gu")


class RecommendationRequest(BaseModel):
    profile: WeaverProfile


class AssistantRequest(BaseModel):
    question: str
    profile: WeaverProfile | None = None
    cluster_id: str | None = None
    language: str = "gu"
    weaver_name: str = "Rameshbhai"
    product_category: str | None = None
    gemini_api_key: str | None = None


def _require_artifact(path: Path) -> Path:
    if not path.exists():
        raise HTTPException(
            status_code=503,
            detail=f"Missing artifact {path.name}. Run `python run_phase1.py` first.",
        )
    return path


@lru_cache(maxsize=1)
def artifact_bundle() -> dict[str, Any]:
    required = [
        "backtest_predictions.csv",
        "future_forecasts.csv",
        "cashflow_projection.csv",
        "cluster_insights.json",
        "backtest_summary.json",
        "cashflow_summary.csv",
        "model_manifest.json",
        "signals_extended.csv",
    ]
    for name in required:
        _require_artifact(ARTIFACTS_DIR / name)

    orders = load_orders()
    orders["delivery_to_payment_days"] = (
        orders["payment_received_date"] - orders["actual_delivery_date"]
    ).dt.days
    payment_summary = (
        orders.groupby("cluster_id")
        .agg(
            median_delivery_to_payment_days=("delivery_to_payment_days", "median"),
            avg_payment_delay_days=("payment_delay_days", "mean"),
        )
        .reset_index()
    )

    return {
        "clusters": load_clusters(),
        "orders": orders,
        "backtest_predictions": pd.read_csv(
            ARTIFACTS_DIR / "backtest_predictions.csv", parse_dates=["week_start_date"]
        ),
        "future_forecasts": pd.read_csv(
            ARTIFACTS_DIR / "future_forecasts.csv", parse_dates=["week_start_date"]
        ),
        "cashflow_projection": pd.read_csv(
            ARTIFACTS_DIR / "cashflow_projection.csv", parse_dates=["week_start_date"]
        ),
        "cashflow_summary": pd.read_csv(ARTIFACTS_DIR / "cashflow_summary.csv"),
        "signals_extended": pd.read_csv(
            ARTIFACTS_DIR / "signals_extended.csv", parse_dates=["week_start_date"]
        ),
        "cluster_insights": read_json(ARTIFACTS_DIR / "cluster_insights.json"),
        "backtest_summary": read_json(ARTIFACTS_DIR / "backtest_summary.json"),
        "model_manifest": read_json(ARTIFACTS_DIR / "model_manifest.json"),
        "payment_summary": payment_summary,
    }


def _cluster_lookup() -> dict[str, dict[str, Any]]:
    bundle = artifact_bundle()
    insights = {item["cluster_id"]: item for item in bundle["cluster_insights"]}
    summary = {
        row["cluster_id"]: row
        for row in bundle["cashflow_summary"].to_dict(orient="records")
    }
    available_products = (
        bundle["future_forecasts"]
        .groupby("cluster_id")["product_category"]
        .apply(lambda series: sorted(series.unique().tolist()))
        .to_dict()
    )
    output = []
    for row in bundle["clusters"].to_dict(orient="records"):
        cluster_id = row["cluster_id"]
        output.append(
            {
                **row,
                "insight": insights.get(cluster_id),
                "cashflow_summary": summary.get(cluster_id),
                "available_products": available_products.get(cluster_id, []),
            }
        )
    return {item["cluster_id"]: item for item in output}


def _future_rows_for_cluster(cluster_id: str) -> pd.DataFrame:
    rows = artifact_bundle()["future_forecasts"]
    cluster_rows = rows.loc[rows["cluster_id"] == cluster_id].copy()
    if cluster_rows.empty:
        raise HTTPException(status_code=404, detail="Unknown cluster_id")
    return cluster_rows.sort_values(["week_start_date", "product_category"]).reset_index(drop=True)


def _cashflow_rows_for_cluster(cluster_id: str) -> pd.DataFrame:
    rows = artifact_bundle()["cashflow_projection"]
    cluster_rows = rows.loc[rows["cluster_id"] == cluster_id].copy()
    if cluster_rows.empty:
        raise HTTPException(status_code=404, detail="Unknown cluster_id")
    return cluster_rows.sort_values("week_start_date").reset_index(drop=True)


def _history_rows_for_cluster(cluster_id: str, product_category: str) -> pd.DataFrame:
    rows = artifact_bundle()["backtest_predictions"]
    cluster_rows = rows.loc[
        (rows["cluster_id"] == cluster_id) & (rows["product_category"] == product_category)
    ].copy()
    return cluster_rows.sort_values("week_start_date").reset_index(drop=True)


def _current_week_row(rows: pd.DataFrame, date_col: str = "week_start_date") -> pd.Series:
    current_rows = rows.loc[rows[date_col] <= TODAY]
    if not current_rows.empty:
        return current_rows.sort_values(date_col).iloc[-1]
    return rows.sort_values(date_col).iloc[0]


def _cluster_product_label(cluster: dict[str, Any], product_key: str) -> str:
    product_cfg = PRODUCT_CATALOG[product_key]
    model_category = product_cfg["model_category"]
    override = SPECIAL_LABEL_OVERRIDES.get((cluster["cluster_id"], model_category))
    if override:
        return override
    if cluster["product_specialty"] == model_category:
        base_name = str(cluster["cluster_name"]).split("(")[0].strip()
        if model_category == "saree":
            return f"{base_name} Sarees"
        if model_category == "dupatta":
            return f"{base_name} Dupattas"
        if model_category == "shawl_wrap":
            return f"{base_name} Shawls"
    return product_cfg["label"]


def _material_label(cluster: dict[str, Any]) -> str:
    primary = str(cluster["primary_material"]).strip().lower()
    if primary == "silk":
        return "mulberry silk yarn"
    if primary == "cotton":
        return "cotton yarn"
    if primary == "wool":
        return "wool yarn"
    if primary == "wool/cotton":
        return "blended yarn"
    return f"{cluster['primary_material']} material"


def _price_status(signal_now: pd.Series, signal_history: pd.DataFrame) -> tuple[str, float]:
    current_price = float(signal_now["cotton_price_inr_per_kg"])
    trailing = signal_history.loc[signal_history["week_start_date"] < signal_now["week_start_date"]].tail(4)
    trailing_avg = (
        float(trailing["cotton_price_inr_per_kg"].mean())
        if not trailing.empty
        else current_price
    )
    pct_change = 0.0 if trailing_avg == 0 else (current_price / trailing_avg - 1.0) * 100
    if pct_change >= 2.0:
        return "rising", pct_change
    if pct_change <= -2.0:
        return "falling", pct_change
    return "stable", pct_change


def _confidence_score(predicted_range: tuple[float, float], festival_bonus: bool, trend_bonus: float) -> tuple[int, str]:
    low, high = predicted_range
    midpoint = max((low + high) / 2.0, 1.0)
    spread_ratio = (high - low) / midpoint
    score = 86 - spread_ratio * 16 + (8 if festival_bonus else 0) + min(6, abs(trend_bonus) * 40)
    score = int(max(55, min(89, round(score))))
    if score >= 78:
        return score, "High"
    if score >= 64:
        return score, "Medium"
    return score, "Low"


def _effective_capacity(capacity_per_loom: tuple[int, int], loom_count: int, weaver_count: int) -> tuple[int, int]:
    labor_factor = min(1.35, max(1.0, weaver_count / max(loom_count, 1)))
    low = round(capacity_per_loom[0] * loom_count * labor_factor)
    high = round(capacity_per_loom[1] * loom_count * labor_factor)
    return max(low, 1), max(high, low + 1)


def _state_market_trend(cluster: dict[str, Any], model_category: str) -> float:
    bundle = artifact_bundle()
    state_clusters = bundle["clusters"].loc[bundle["clusters"]["state"] == cluster["state"], "cluster_id"].tolist()
    hist = bundle["backtest_predictions"]
    fut = bundle["future_forecasts"]
    hist_rows = hist.loc[
        (hist["cluster_id"].isin(state_clusters)) & (hist["product_category"] == model_category)
    ].sort_values("week_start_date")
    fut_rows = fut.loc[
        (fut["cluster_id"].isin(state_clusters)) & (fut["product_category"] == model_category)
    ].sort_values("week_start_date")
    hist_mean = float(hist_rows.tail(4)["units_ordered"].mean())
    fut_mean = float(fut_rows.head(4)["ensemble_pred"].mean())
    if hist_mean <= 0:
        return 0.0
    return (fut_mean / hist_mean - 1.0) * 100


def _cluster_recent_trend(cluster_id: str, model_category: str) -> float:
    hist = _history_rows_for_cluster(cluster_id, model_category)
    fut = _future_rows_for_cluster(cluster_id)
    fut = fut.loc[fut["product_category"] == model_category].sort_values("week_start_date")
    hist_mean = float(hist.tail(4)["units_ordered"].mean()) if not hist.empty else 0.0
    fut_mean = float(fut.head(4)["ensemble_pred"].mean()) if not fut.empty else 0.0
    if hist_mean <= 0:
        return 0.0
    return (fut_mean / hist_mean - 1.0) * 100


def _payment_window(cluster_id: str, sell_start: pd.Timestamp) -> tuple[str, str]:
    payment_summary = artifact_bundle()["payment_summary"]
    row = payment_summary.loc[payment_summary["cluster_id"] == cluster_id]
    median_days = 17.0
    if not row.empty:
        median_days = float(row.iloc[0]["median_delivery_to_payment_days"])
    start = sell_start + pd.Timedelta(days=max(10, round(median_days - 3)))
    end = sell_start + pd.Timedelta(days=max(16, round(median_days + 4)))
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


def _impact_statement(avg_output: float, recommended_mid: float) -> str:
    change_pct = 0.0 if avg_output <= 0 else (recommended_mid / avg_output - 1.0) * 100
    if change_pct >= 4:
        return (
            f"Following this plan could improve your selling opportunity by about "
            f"{round(min(change_pct, 18))}% over your usual week if demand holds."
        )
    if change_pct <= -4:
        return (
            "This plan is slightly conservative so you do not overproduce before money comes in."
        )
    return "This plan is close to your usual pace and is designed to keep income steady."


def _loan_advice(
    direct_cost_inr: float,
    projected_cash_in_inr: float,
    projected_net_cashflow_inr: float,
    credit_status: str,
) -> tuple[bool, int | None, str]:
    if projected_net_cashflow_inr >= 0 and projected_cash_in_inr >= direct_cost_inr * 0.8 and credit_status == "green":
        return (
            False,
            None,
            "Avoid taking a new loan this week. Your current cashflow should cover the planned production.",
        )
    shortfall = max(direct_cost_inr - projected_cash_in_inr * 0.55, 0.0)
    loan_amount = int(round(max(shortfall, 5000), -2))
    return (
        True,
        loan_amount,
        f"A short-term loan of about ₹{loan_amount:,} could help you buy material now and repay after the next payment cycle.",
    )


def _weekly_plan(
    product_key: str,
    display_product: str,
    recommended_range: tuple[int, int],
    material_label: str,
    material_qty_kg: float,
) -> list[dict[str, str]]:
    tasks = TRACK_TASKS[PRODUCT_CATALOG[product_key]["track"]]
    plan = []
    for day, task in tasks:
        note = ""
        if day == "Monday":
            note = f"Prepare enough {material_label} for {recommended_range[0]}–{recommended_range[1]} {display_product.lower()}."
        elif day == "Saturday":
            note = f"Keep about {material_qty_kg:.1f} kg of material accounted for before packing."
        elif day == "Sunday":
            note = "Follow up on delivery and payment timing."
        plan.append({"day": day, "task": task, "note": note})
    return plan


def _data_sources(cluster: dict[str, Any], festival_name: str, state_trend_pct: float, current_signal: pd.Series) -> list[str]:
    festival_clean = festival_name.replace("_", " ") if festival_name else "festival calendar"
    return [
        f"{festival_clean} timing from the weekly festival calendar.",
        "Five years of anonymised cluster demand history from July 2021 to June 2026.",
        f"{cluster['state']} trend signal from the live forecast pipeline ({state_trend_pct:+.0f}% vs the last 4 observed weeks).",
        f"Weekly search-interest proxy and raw-material price proxy around ₹{float(current_signal['cotton_price_inr_per_kg']):.0f}/kg.",
    ]


def _why_bullets(
    cluster: dict[str, Any],
    display_product: str,
    festival_name: str,
    days_to_peak: int,
    state_trend_pct: float,
    price_status: str,
    current_signal: pd.Series,
) -> list[str]:
    bullets = []
    if festival_name:
        bullets.append(f"{festival_name.replace('_', ' ')} is about {days_to_peak} days away.")
    if state_trend_pct >= 0:
        bullets.append(
            f"{cluster['state']} demand for {display_product.lower()} is projected {state_trend_pct:.0f}% higher than the last 4 observed weeks."
        )
    else:
        bullets.append(
            f"{cluster['state']} demand for {display_product.lower()} is softer than the last 4 observed weeks, so the plan stays careful."
        )
    bullets.append(
        f"The {PRICE_PROXY_LABELS.get(str(cluster['primary_material']).lower(), 'raw-material price proxy')} is {price_status} this week near ₹{float(current_signal['cotton_price_inr_per_kg']):.0f}/kg."
    )
    bullets.append("The recommendation blends your own weekly pace with the cluster forecast instead of showing a raw model number.")
    return bullets


def _fallback_assistant(question: str, package: dict[str, Any]) -> str:
    q = question.lower()
    primary_material = str(package["primary_material"]).lower()
    if "cotton" in q and "cotton" not in primary_material:
        return (
            f"You mainly work with {package['primary_material_label']}, not cotton. "
            f"{package['purchase_advice']['text']} Action: buy for your main material, not cotton."
        )
    if "silk" in q and "silk" not in primary_material:
        return (
            f"You mainly work with {package['primary_material_label']}, not silk. "
            f"{package['purchase_advice']['text']} Action: buy for your main material, not silk."
        )
    if "loan" in q or "borrow" in q:
        return package["loan_advice"]["text"]
    if "buy" in q or "material" in q or "silk" in q or "cotton" in q or "yarn" in q:
        return package["purchase_advice"]["text"]
    if "why" in q or "reason" in q:
        return f"{package['summary_reason']} Action: {package['action_line']}"
    if "demand" in q:
        return (
            f"Demand for {package['display_product'].lower()} is expected to stay "
            f"{package['demand_band'].lower()} over the next two weeks. Action: keep weaving within "
            f"{package['recommended_range_label']}."
        )
    if "what if" in q and "10" in q and ("price" in q or "cost" in q):
        current_cost = package["estimated_direct_cost_inr"]
        higher_cost = current_cost * 1.10
        return (
            f"If raw-material price rises by 10%, your direct production cost would move from "
            f"₹{current_cost:,.0f} to about ₹{higher_cost:,.0f}. Action: buy early if you can."
        )
    if "plan" in q or "week" in q:
        monday = package["weekly_plan"][0]
        sunday = package["weekly_plan"][-1]
        return (
            f"{monday['day']}: {monday['task']} "
            f"{sunday['day']}: {sunday['task']} Action: open Weekly Plan for the full schedule."
        )
    return (
        f"You should continue with {package['display_product']} and keep production within "
        f"{package['recommended_range_label']}. Action: {package['action_line']}"
    )


def _product_key_for_category(product_category: str) -> str:
    preferred = {
        "saree": "sarees",
        "dupatta": "dupattas",
        "shawl_wrap": "shawls",
        "stole": "stoles",
        "home_furnishing": "bedsheets",
        "yardage_fabric": "cotton_fabric",
    }
    if product_category in preferred:
        return preferred[product_category]
    for key, cfg in PRODUCT_CATALOG.items():
        if cfg["model_category"] == product_category:
            return key
    return "sarees"


def _default_profile(
    cluster_id: str,
    product_category: str | None = None,
    name: str = "Rameshbhai",
    language: str = "gu",
) -> WeaverProfile:
    cluster = _cluster_lookup().get(cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Unknown cluster_id")
    category = product_category or str(cluster["product_specialty"])
    defaults = {
        "saree": 4.0,
        "dupatta": 18.0,
        "shawl_wrap": 12.0,
        "stole": 16.0,
        "home_furnishing": 20.0,
        "yardage_fabric": 22.0,
    }
    return WeaverProfile(
        name=name or "Rameshbhai",
        cluster_id=cluster_id,
        primary_product_key=_product_key_for_category(category),
        loom_count=1,
        weaver_count=1,
        average_weekly_output=defaults.get(category, 8.0),
        language=language or "gu",
    )


def _package_to_weaver_brief(package: dict[str, Any], cluster: dict[str, Any]) -> dict[str, Any]:
    demand_band = str(package.get("demand_band", "Medium")).lower()
    if "high" in demand_band:
        demand_level = "high"
    elif "cautious" in demand_band or "low" in demand_band:
        demand_level = "low"
    else:
        demand_level = "steady"

    confidence_raw = str(package.get("confidence_label", "Medium")).lower()
    if "high" in confidence_raw:
        confidence_level = "high"
    elif "low" in confidence_raw:
        confidence_level = "low"
    else:
        confidence_level = "medium"

    cash_rows = _cashflow_rows_for_cluster(package["cluster_id"])
    current_cash = _current_week_row(cash_rows)
    credit_status = str(current_cash["credit_status"])

    festival_name = ""
    for alert in package.get("alerts", []):
        if alert.get("title") == "Festival countdown":
            text = str(alert.get("text") or "")
            if "days away" in text and "No major festival" not in text:
                festival_name = text.split(" is about ")[0].strip()
            break

    if festival_name:
        reason_code = "festival"
    elif credit_status in {"yellow", "red"}:
        reason_code = "cash_caution"
    else:
        reason_code = "momentum"

    sell_start = package.get("expected_payment_window", {}).get("start")
    sell_end = package.get("expected_payment_window", {}).get("end")
    peak = cluster.get("insight") or {}
    if peak.get("peak_week"):
        peak_week = pd.Timestamp(peak["peak_week"])
        sell_start = peak_week.strftime("%Y-%m-%d")
        sell_end = (peak_week + pd.Timedelta(days=7)).strftime("%Y-%m-%d")

    mid_units = int(
        round((package["recommended_min_units"] + package["recommended_max_units"]) / 2)
    )
    product_cfg = PRODUCT_CATALOG[package["primary_product_key"]]

    return {
        "week_start_date": package["last_updated"],
        "recommended_units": mid_units,
        "recommended_min_units": package["recommended_min_units"],
        "recommended_max_units": package["recommended_max_units"],
        "product_specialty": product_cfg["model_category"],
        "buy_material": package["primary_material"],
        "demand_level": demand_level,
        "confidence_level": confidence_level,
        "credit_status": credit_status,
        "reason_code": reason_code,
        "festival_name": festival_name.replace("_", " ") if festival_name else "",
        "expected_sell_start": sell_start,
        "expected_sell_end": sell_end,
        "message": package["summary_reason"],
        "why": " ".join(package.get("why_recommendation", [])),
        "action_line": package["action_line"],
        "purchase_advice": package.get("purchase_advice"),
        "loan_advice": package.get("loan_advice"),
        "finance_summary": package.get("finance_summary"),
        "projected_net_cashflow_inr": round(float(current_cash["projected_net_cashflow_inr"]), 2),
        "projected_cash_in_inr": round(float(current_cash["projected_cash_in_inr"]), 2),
        "weave_options": [
            {
                "product_key": option["product_key"],
                "display_name": option["display_name"],
                "recommended_units": int(
                    round(
                        (
                            int(str(option["recommended_range"]).split("–")[0])
                            + int(str(option["recommended_range"]).split("–")[-1])
                        )
                        / 2
                    )
                ),
                "recommended_range": option["recommended_range"],
                "estimated_revenue_inr": option["estimated_revenue_inr"],
                "estimated_profit_inr": option["estimated_profit_inr"],
                "cash_status": "healthy" if str(current_cash["credit_status"]) == "green" else "watch" if str(current_cash["credit_status"]) == "yellow" else "at risk",
            }
            for option in package.get("weave_options", [])
        ],
    }


def _cluster_orders(cluster_id: str, product_category: str, limit: int = 8) -> list[dict[str, Any]]:
    orders = artifact_bundle()["orders"]
    rows = orders.loc[orders["cluster_id"] == cluster_id].copy()
    if product_category:
        product_rows = rows.loc[rows["product_category"] == product_category]
        if not product_rows.empty:
            rows = product_rows
    rows = rows.sort_values("order_date", ascending=False).head(limit)
    output = []
    for row in rows.itertuples():
        output.append(
            {
                "order_id": str(row.order_id),
                "week_start_date": pd.Timestamp(row.order_date).strftime("%Y-%m-%d"),
                "product_category": row.product_category,
                "quantity": float(row.quantity),
                "buyer_type": str(row.buyer_type),
                "delivery_date": (
                    pd.Timestamp(row.actual_delivery_date).strftime("%Y-%m-%d")
                    if pd.notna(row.actual_delivery_date)
                    else None
                ),
                "payment_due_date": (
                    pd.Timestamp(row.payment_due_date).strftime("%Y-%m-%d")
                    if pd.notna(row.payment_due_date)
                    else None
                ),
                "payment_received_date": (
                    pd.Timestamp(row.payment_received_date).strftime("%Y-%m-%d")
                    if pd.notna(row.payment_received_date)
                    else None
                ),
                "status": (
                    "paid"
                    if pd.notna(row.payment_received_date)
                    else "awaiting_payment"
                    if pd.notna(row.actual_delivery_date)
                    else "in_production"
                ),
            }
        )
    return output


def _call_gemini(
    question: str,
    language: str,
    package: dict[str, Any],
    profile: WeaverProfile,
    gemini_api_key: str | None = None,
) -> dict[str, Any]:
    api_key = (gemini_api_key or os.getenv("GEMINI_API_KEY", "")).strip()
    if not api_key:
        fallback = _fallback_assistant(question, package)
        return {"available": False, "reply": fallback, "source": "fallback"}

    system_instruction = (
        "You are 'SAATHI', a warm, expert AI weaving companion for Indian handloom weavers. "
        "Your goal is to provide supportive, practical, and highly specific advice. "
        "Talk like a local expert who understands the weaver's life in India (specifically Gujarat/cluster location). "
        "Use gentle, respectful language (e.g., using 'Bhai' or 'Ji' where culturally appropriate).\n\n"
        "HYBRID INTELLIGENCE GUIDELINES:\n"
        "1. BUSINESS/ML QUESTIONS: If the user asks about their income, demand, production plan, cashflow, or recommendations, "
        "use the provided 'recommendation_package' JSON. This is LIVE DATA from our ML pipeline. Always refer to these specific numbers.\n"
        "2. GENERAL/LOCAL QUESTIONS: If the user asks general questions (where to buy yarn, how to fix a loom, local markets like Vastral, etc.), "
        "provide detailed, conversational, and comprehensive answers using your native knowledge. Don't be too brief; explain things clearly.\n"
        "3. MULTILINGUAL: Answer perfectly in the requested language (Hindi, Gujarati, or English).\n"
        "4. PRACTICALITY: Always end with a clear 'Action Step' for the weaver.\n"
        "5. NO HALLUCINATION: If asked about specific business data NOT in the JSON, explain you don't have that live data yet but provide general guidance based on their cluster's specialty."
    )
    language_name = LANGUAGE_NAMES.get(language, "English")
    context = {
        "today": TODAY.strftime("%Y-%m-%d"),
        "language": language_name,
        "profile": profile.model_dump(),
        "recommendation_package": package,
        "question": question,
    }
    payload = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            f"Context for the conversation:\n"
                            f"Language: {language_name}\n"
                            f"Today's Date: {TODAY.strftime('%Y-%m-%d')}\n"
                            f"User Profile: {json.dumps(profile.model_dump(), ensure_ascii=False)}\n"
                            f"Live ML Recommendation: {json.dumps(package, ensure_ascii=False)}\n\n"
                            f"User's Question: {question}\n\n"
                            f"Please provide a natural, helpful response in {language_name}."
                        )
                    }
                ],
            }
        ],
        "generationConfig": {"temperature": 0.45, "maxOutputTokens": 1024},
        "store": False,
    }
    req = request.Request(
        f"{GEMINI_ENDPOINT}?key={api_key}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=30) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
        candidates = response_payload.get("candidates") or []
        if not candidates:
            raise ValueError("Gemini returned no candidates")
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "\n".join(part.get("text", "") for part in parts if part.get("text")).strip()
        if not text:
            raise ValueError("Gemini returned no text")
        return {"available": True, "reply": text, "source": "gemini"}
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        return {
            "available": False,
            "reply": _fallback_assistant(question, package),
            "source": "gemini_error",
            "error_detail": detail,
        }
    except Exception:
        return {"available": False, "reply": _fallback_assistant(question, package), "source": "fallback"}


def build_recommendation_package(profile: WeaverProfile) -> dict[str, Any]:
    clusters = _cluster_lookup()
    cluster = clusters.get(profile.cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Unknown cluster_id")
    if profile.primary_product_key not in PRODUCT_CATALOG:
        raise HTTPException(status_code=400, detail="Unknown primary_product_key")

    product_cfg = PRODUCT_CATALOG[profile.primary_product_key]
    model_category = product_cfg["model_category"]
    future_rows = _future_rows_for_cluster(profile.cluster_id)
    product_rows = future_rows.loc[future_rows["product_category"] == model_category].copy()
    if product_rows.empty:
        product_rows = future_rows.loc[future_rows["product_category"] == cluster["product_specialty"]].copy()
    product_rows = product_rows.sort_values("week_start_date").reset_index(drop=True)
    current_row = _current_week_row(product_rows)
    current_week_start = pd.Timestamp(current_row["week_start_date"])
    upcoming_rows = product_rows.loc[product_rows["week_start_date"] >= current_week_start].reset_index(drop=True)
    peak_row = upcoming_rows.sort_values("ensemble_pred", ascending=False).iloc[0]

    signals = artifact_bundle()["signals_extended"].sort_values("week_start_date").reset_index(drop=True)
    current_signal = signals.loc[signals["week_start_date"] == current_week_start]
    current_signal_row = current_signal.iloc[0] if not current_signal.empty else signals.iloc[-1]
    peak_signal = signals.loc[signals["week_start_date"] == pd.Timestamp(peak_row["week_start_date"])]
    peak_signal_row = peak_signal.iloc[0] if not peak_signal.empty else current_signal_row

    cash_rows = _cashflow_rows_for_cluster(profile.cluster_id)
    current_cash = _current_week_row(cash_rows)

    cluster_trend_pct = _cluster_recent_trend(profile.cluster_id, model_category)
    state_trend_pct = _state_market_trend(cluster, model_category)
    price_status, price_pct = _price_status(current_signal_row, signals)

    capacity_low, capacity_high = _effective_capacity(
        product_cfg["capacity_per_loom"],
        profile.loom_count,
        profile.weaver_count,
    )
    baseline_output = max(profile.average_weekly_output, capacity_low)
    baseline_output = min(baseline_output, capacity_high)

    festival_bonus = min(
        0.18,
        float(current_signal_row.get("festival_proximity", 0.0)) * 0.35
        + (0.08 if str(current_signal_row.get("festival_name") or "").strip() else 0.0),
    )
    peak_growth = 0.0
    if float(current_row["ensemble_pred"]) > 0:
        peak_growth = float(peak_row["ensemble_pred"]) / float(current_row["ensemble_pred"]) - 1.0
    trend_bonus = max(-0.08, min(0.14, peak_growth * 0.22))
    search_bonus = max(-0.05, min(0.08, (float(current_signal_row["google_trends_index"]) - 55.0) / 110.0))
    total_multiplier = max(0.85, min(1.28, 1.0 + festival_bonus + trend_bonus + search_bonus))
    target_mid = min(capacity_high, max(capacity_low, baseline_output * total_multiplier))

    if capacity_high - capacity_low <= 4:
        range_min = max(capacity_low, int(target_mid // 1))
        range_max = min(capacity_high, max(range_min + 1, int(round(target_mid + 1))))
    else:
        span = max(2, round((capacity_high - capacity_low) * 0.18))
        range_min = max(capacity_low, int(round(target_mid - span / 2)))
        range_max = min(capacity_high, max(range_min + 2, int(round(target_mid + span / 2))))

    recommended_mid = (range_min + range_max) / 2.0
    material_qty_low = range_min * product_cfg["material_kg_per_unit"]
    material_qty_high = range_max * product_cfg["material_kg_per_unit"]
    display_product = _cluster_product_label(cluster, profile.primary_product_key)
    material_label = _material_label(cluster)

    avg_unit_value = float(current_row["avg_order_value_inr"])
    direct_cost_ratio = (
        float(current_cash["raw_material_cost_inr"])
        + float(current_cash["wage_cost_inr"])
        + float(current_cash["loom_maintenance_cost_inr"])
    ) / max(float(current_cash["forecast_revenue_inr"]), 1.0)
    estimated_revenue = recommended_mid * avg_unit_value
    estimated_direct_cost = estimated_revenue * direct_cost_ratio
    estimated_margin = estimated_revenue - estimated_direct_cost
    profit_margin_pct = round((estimated_margin / estimated_revenue * 100), 1) if estimated_revenue > 0 else 0
    raw_material_cost = estimated_revenue * (
        float(current_cash["raw_material_cost_inr"]) / max(float(current_cash["forecast_revenue_inr"]), 1.0)
    )
    wage_cost = estimated_revenue * (
        float(current_cash["wage_cost_inr"]) / max(float(current_cash["forecast_revenue_inr"]), 1.0)
    )

    loan_needed, loan_amount, loan_text = _loan_advice(
        direct_cost_inr=estimated_direct_cost,
        projected_cash_in_inr=float(current_cash["projected_cash_in_inr"]),
        projected_net_cashflow_inr=float(current_cash["projected_net_cashflow_inr"]),
        credit_status=str(current_cash["credit_status"]),
    )

    payment_start, payment_end = _payment_window(profile.cluster_id, pd.Timestamp(peak_row["week_start_date"]))
    festival_name = str(
        peak_signal_row.get("festival_name") or current_signal_row.get("festival_name") or ""
    ).strip()
    days_to_peak = max(0, (pd.Timestamp(peak_row["week_start_date"]) - TODAY).days)
    confidence_score, confidence_label = _confidence_score(
        (float(current_row["lower_90"]), float(current_row["upper_90"])),
        festival_bonus > 0,
        peak_growth,
    )

    demand_band = "Medium"
    if total_multiplier >= 1.25:
        demand_band = "High"
    elif total_multiplier >= 1.15:
        demand_band = "Medium-High"
    elif total_multiplier <= 0.92:
        demand_band = "Cautious"

    action_line = (
        "Produce carefully and keep delivery quality high."
        if str(current_cash["credit_status"]) == "yellow"
        else "Continue weaving at this pace and prepare material early."
    )
    if str(current_cash["credit_status"]) == "red":
        action_line = "Take only confirmed work this week and line up working capital before buying material."

    summary_reason = (
        f"Demand is expected to improve over the next 2 weeks because "
        f"{festival_name.replace('_', ' ')} is approaching."
        if festival_name
        else f"Demand signals for {display_product.lower()} are stable for the next 2 weeks."
    )

    why_bullets = _why_bullets(
        cluster=cluster,
        display_product=display_product,
        festival_name=festival_name,
        days_to_peak=days_to_peak,
        state_trend_pct=state_trend_pct,
        price_status=price_status,
        current_signal=current_signal_row,
    )
    data_sources = _data_sources(
        cluster=cluster,
        festival_name=festival_name,
        state_trend_pct=state_trend_pct,
        current_signal=current_signal_row,
    )
    weekly_plan = _weekly_plan(
        product_key=profile.primary_product_key,
        display_product=display_product,
        recommended_range=(range_min, range_max),
        material_label=material_label,
        material_qty_kg=material_qty_high,
    )

    weave_options = []
    current_week_all_products = future_rows.loc[future_rows["week_start_date"] == current_week_start]
    for option in current_week_all_products.sort_values("ensemble_pred", ascending=False).itertuples():
        matching_key = next(
            (key for key, cfg in PRODUCT_CATALOG.items() if cfg["model_category"] == option.product_category),
            None,
        )
        if not matching_key:
            continue
        option_label = _cluster_product_label(cluster, matching_key)
        option_cap_low, option_cap_high = _effective_capacity(
            PRODUCT_CATALOG[matching_key]["capacity_per_loom"],
            profile.loom_count,
            profile.weaver_count,
        )
        option_mid = min(option_cap_high, max(option_cap_low, baseline_output))
        option_low = max(option_cap_low, int(round(option_mid - 1)))
        option_high = min(option_cap_high, max(option_low + 1, int(round(option_mid + 1))))
        option_rev = ((option_low + option_high) / 2.0) * float(option.avg_order_value_inr)
        option_cost = option_rev * direct_cost_ratio
        weave_options.append(
            {
                "product_key": matching_key,
                "display_name": option_label,
                "recommended_range": f"{option_low}–{option_high}",
                "estimated_revenue_inr": round(option_rev, 2),
                "estimated_raw_material_cost_inr": round(
                    option_rev
                    * (
                        float(current_cash["raw_material_cost_inr"])
                        / max(float(current_cash["forecast_revenue_inr"]), 1.0)
                    ),
                    2,
                ),
                "estimated_profit_inr": round(option_rev - option_cost, 2),
            }
        )

    alerts = [
        {
            "title": "Festival countdown",
            "text": (
                f"{festival_name.replace('_', ' ')} is about {days_to_peak} days away."
                if festival_name
                else "No major festival spike is visible in the next two weeks."
            ),
        },
        {
            "title": "Price signal",
            "text": (
                f"The {PRICE_PROXY_LABELS.get(str(cluster['primary_material']).lower(), 'raw-material price proxy')} is "
                f"{price_status} this week ({price_pct:+.1f}% vs the recent average)."
            ),
        },
        {
            "title": "Market pulse",
            "text": (
                f"{cluster['state']} demand for {display_product.lower()} is projected {state_trend_pct:+.0f}% "
                f"versus the last 4 observed weeks."
            ),
        },
    ]

    package = {
        "last_updated": TODAY.strftime("%Y-%m-%d"),
        "profile_name": profile.name,
        "cluster_id": profile.cluster_id,
        "cluster_name": cluster["cluster_name"],
        "state": cluster["state"],
        "primary_material": cluster["primary_material"],
        "primary_material_label": material_label,
        "primary_product_key": profile.primary_product_key,
        "display_product": display_product,
        "summary_title": f"Continue weaving {display_product}.",
        "summary_reason": summary_reason,
        "recommended_min_units": range_min,
        "recommended_max_units": range_max,
        "recommended_range_label": f"{range_min}–{range_max} {display_product}",
        "demand_band": demand_band,
        "confidence_label": confidence_label,
        "confidence_score": confidence_score,
        "buy_within_days": 3 if price_status in {"stable", "rising"} else 5,
        "purchase_advice": {
            "material": material_label,
            "quantity_kg_min": round(material_qty_low, 1),
            "quantity_kg_max": round(material_qty_high, 1),
            "price_status": price_status,
            "price_proxy_inr_per_kg": round(float(current_signal_row["cotton_price_inr_per_kg"]), 1),
            "text": (
                f"Buy {material_qty_low:.0f}–{material_qty_high:.0f} kg of {material_label} within "
                f"{3 if price_status in {'stable', 'rising'} else 5} days. "
                f"The {PRICE_PROXY_LABELS.get(str(cluster['primary_material']).lower(), 'raw-material price proxy')} is {price_status} this week."
            ),
        },
        "loan_advice": {
            "should_borrow": loan_needed,
            "recommended_amount_inr": loan_amount,
            "text": loan_text,
        },
        "expected_payment_window": {
            "start": payment_start,
            "end": payment_end,
        },
        "estimated_revenue_inr": round(estimated_revenue, 2),
        "estimated_raw_material_cost_inr": round(raw_material_cost, 2),
        "estimated_wage_cost_inr": round(wage_cost, 2),
        "estimated_direct_cost_inr": round(estimated_direct_cost, 2),
        "estimated_profit_inr": round(estimated_margin, 2),
        "finance_summary": {
            "gross_revenue_inr": round(estimated_revenue, 0),
            "direct_costs_inr": round(estimated_direct_cost, 0),
            "net_profit_inr": round(estimated_margin, 0),
            "profit_margin_pct": profit_margin_pct,
            "cash_status": "healthy" if str(current_cash["credit_status"]) == "green" else "watch" if str(current_cash["credit_status"]) == "yellow" else "at risk",
            "raw_material_cost_inr": round(raw_material_cost, 0),
            "wage_cost_inr": round(wage_cost, 0),
        },
        "market_pulse": {
            "cluster_trend_pct": round(cluster_trend_pct, 1),
            "state_trend_pct": round(state_trend_pct, 1),
            "text": (
                f"{cluster['state']} demand for {display_product.lower()} is projected {state_trend_pct:+.0f}% "
                f"versus the last 4 observed weeks."
            ),
        },
        "alerts": alerts,
        "why_recommendation": why_bullets,
        "data_sources": data_sources,
        "action_line": action_line,
        "impact_statement": _impact_statement(profile.average_weekly_output, recommended_mid),
        "weekly_plan": weekly_plan,
        "print_plan": {
            "title": f"Weekly Plan for {display_product}",
            "quantity": f"{range_min}–{range_max}",
            "material": f"{material_qty_low:.0f}–{material_qty_high:.0f} kg {material_label}",
            "payment_window": f"{payment_start} to {payment_end}",
            "assistant_reopen_path": "/?screen=assistant",
        },
        "weave_options": weave_options[:4],
    }
    return package


def _feature_importance(product_category: str) -> list[dict[str, Any]]:
    model_path = MODEL_DIR / f"{product_category}_xgb_production.json"
    if not model_path.exists():
        return []
    booster = Booster()
    booster.load_model(model_path)
    scores = booster.get_score(importance_type="gain")
    grouped = defaultdict(float)
    for feature, score in scores.items():
        if feature.startswith("lag_") or feature.startswith("rolling_"):
            grouped["Historical demand pattern"] += score
        elif feature == "festival_proximity":
            grouped["Festival timing"] += score
        elif feature == "google_trends_index":
            grouped["Search interest"] += score
        elif feature.startswith("cotton_price"):
            grouped["Raw material price signal"] += score
        elif feature.startswith("delivery_"):
            grouped["Delivery reliability"] += score
        elif feature in {"cluster_code", "product_code"}:
            grouped["Cluster and product context"] += score
        else:
            grouped["Other features"] += score
    total = sum(grouped.values()) or 1.0
    return [
        {"label": label, "share_pct": round(value / total * 100, 1)}
        for label, value in sorted(grouped.items(), key=lambda item: item[1], reverse=True)
    ]


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "today": TODAY.strftime("%Y-%m-%d")}


@app.get("/api/clusters")
def clusters() -> list[dict[str, Any]]:
    return list(_cluster_lookup().values())


@app.get("/api/clusters/{cluster_id}")
def cluster_detail(
    cluster_id: str,
    product_category: str | None = Query(None),
) -> dict[str, Any]:
    cluster = _cluster_lookup().get(cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Unknown cluster_id")

    category = product_category or str(cluster["product_specialty"])
    profile = _default_profile(cluster_id, category)
    package = build_recommendation_package(profile)
    brief = _package_to_weaver_brief(package, cluster)
    future_rows = _future_rows_for_cluster(cluster_id)
    future_product = future_rows.loc[future_rows["product_category"] == category].sort_values(
        "week_start_date"
    )

    return {
        **cluster,
        "weaver_brief": brief,
        "recommendation_package": package,
        "orders": _cluster_orders(cluster_id, category),
        "future_forecasts": [
            {
                "week_start_date": row.week_start_date.strftime("%Y-%m-%d"),
                "product_category": row.product_category,
                "ensemble_pred": float(row.ensemble_pred),
                "lower_90": float(row.lower_90),
                "upper_90": float(row.upper_90),
            }
            for row in future_product.head(8).itertuples()
        ],
    }


@app.get("/api/weaver/catalog")
def weaver_catalog() -> dict[str, Any]:
    cluster_rows = load_clusters().to_dict(orient="records")
    products = [
        {
            "key": key,
            "label": value["label"],
            "model_category": value["model_category"],
            "capacity_per_loom": list(value["capacity_per_loom"]),
            "icon": value["icon"],
        }
        for key, value in PRODUCT_CATALOG.items()
        if key != "other" or True
    ]
    return {"today": TODAY.strftime("%Y-%m-%d"), "products": products, "clusters": cluster_rows}


@app.post("/api/weaver/recommendation")
def weaver_recommendation(payload: RecommendationRequest) -> dict[str, Any]:
    return build_recommendation_package(payload.profile)


@app.post("/api/weaver/weekly-plan")
def weaver_weekly_plan(payload: RecommendationRequest) -> dict[str, Any]:
    package = build_recommendation_package(payload.profile)
    return {
        "last_updated": package["last_updated"],
        "display_product": package["display_product"],
        "recommended_range_label": package["recommended_range_label"],
        "purchase_advice": package["purchase_advice"],
        "expected_payment_window": package["expected_payment_window"],
        "weekly_plan": package["weekly_plan"],
        "print_plan": package["print_plan"],
    }


@app.post("/api/assistant/respond")
def assistant_respond(payload: AssistantRequest) -> dict[str, Any]:
    if payload.profile is not None:
        profile = payload.profile
    else:
        if not payload.cluster_id:
            raise HTTPException(status_code=400, detail="cluster_id or profile is required")
        profile = _default_profile(
            cluster_id=payload.cluster_id,
            product_category=payload.product_category,
            name=payload.weaver_name,
            language=payload.language,
        )

    package = build_recommendation_package(profile)
    result = _call_gemini(
        question=payload.question,
        language=profile.language,
        package=package,
        profile=profile,
        gemini_api_key=payload.gemini_api_key,
    )
    return {
        "question": payload.question,
        "language": profile.language,
        "recommendation_package": package,
        **result,
    }


@app.get("/api/admin/metrics")
def admin_metrics() -> dict[str, Any]:
    return artifact_bundle()["backtest_summary"]


@app.get("/api/admin/forecast")
def admin_forecast(
    cluster_id: str = Query(...),
    product_category: str | None = Query(None),
) -> dict[str, Any]:
    bundle = artifact_bundle()
    predictions = bundle["backtest_predictions"]
    future = bundle["future_forecasts"]
    clusters = bundle["clusters"]

    cluster_predictions = predictions.loc[predictions["cluster_id"] == cluster_id].copy()
    cluster_future = future.loc[future["cluster_id"] == cluster_id].copy()
    if cluster_predictions.empty:
        raise HTTPException(status_code=404, detail="Unknown cluster_id")

    if not product_category:
        product_category = str(
            clusters.loc[clusters["cluster_id"] == cluster_id, "product_specialty"].iloc[0]
        )

    cluster_predictions = cluster_predictions.loc[
        cluster_predictions["product_category"] == product_category
    ].sort_values("week_start_date")
    cluster_future = cluster_future.loc[
        cluster_future["product_category"] == product_category
    ].sort_values("week_start_date")
    if cluster_predictions.empty or cluster_future.empty:
        raise HTTPException(status_code=404, detail="Unknown product_category for cluster")

    history_rows = [
        {
            "week_start_date": row.week_start_date.strftime("%Y-%m-%d"),
            "actual": float(row.units_ordered),
            "predicted": float(row.ensemble_pred),
            "lower_90": float(row.lower_90),
            "upper_90": float(row.upper_90),
            "festival_week": bool(row.is_festival_week),
        }
        for row in cluster_predictions.tail(26).itertuples()
    ]

    signals = bundle["signals_extended"]
    future_rows = []
    for row in cluster_future.itertuples():
        signal_row = signals.loc[signals["week_start_date"] == row.week_start_date]
        festival_name = ""
        if not signal_row.empty:
            festival_name = str(signal_row.iloc[0].get("festival_name") or "")
        future_rows.append(
            {
                "week_start_date": row.week_start_date.strftime("%Y-%m-%d"),
                "predicted": float(row.ensemble_pred),
                "lower_90": float(row.lower_90),
                "upper_90": float(row.upper_90),
                "festival_name": festival_name,
            }
        )
    return {
        "cluster_id": cluster_id,
        "product_category": product_category,
        "history": history_rows,
        "future": future_rows,
    }


@app.get("/api/admin/cashflow")
def admin_cashflow(cluster_id: str = Query(...)) -> dict[str, Any]:
    rows = _cashflow_rows_for_cluster(cluster_id)
    return {
        "cluster_id": cluster_id,
        "rows": [
            {
                "week_start_date": row.week_start_date.strftime("%Y-%m-%d"),
                "forecast_revenue_inr": float(row.forecast_revenue_inr),
                "projected_cash_in_inr": float(row.projected_cash_in_inr),
                "projected_net_cashflow_inr": float(row.projected_net_cashflow_inr),
                "credit_need_probability": float(row.credit_need_probability),
                "credit_status": row.credit_status,
            }
            for row in rows.itertuples()
        ],
    }


@app.get("/api/admin/explainability")
def admin_explainability(product_category: str = Query(...)) -> dict[str, Any]:
    return {"product_category": product_category, "feature_groups": _feature_importance(product_category)}

# Import Hisab routes
from . import hisab_api
from . import market_api

# --- Serve Frontend (for Docker single-container deployment) ---
FRONTEND_DIST = ROOT_DIR / "frontend_dist"
if FRONTEND_DIST.exists():
    # Mount Vite static assets
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")
    app.mount("/vite.svg", StaticFiles(directory=FRONTEND_DIST, html=False), name="vite_svg")

    @app.get("/")
    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str = ""):
        if catchall.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        return FileResponse(FRONTEND_DIST / "index.html")
