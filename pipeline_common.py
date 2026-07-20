from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "extracted"
ARTIFACTS_DIR = ROOT_DIR / "artifacts"
MODEL_DIR = ARTIFACTS_DIR / "models"
FORECAST_HORIZON_WEEKS = 4
SPLIT_TRAIN_WEEKS = 208
SPLIT_VALID_WEEKS = 26
SPLIT_TEST_WEEKS = 26


@dataclass(frozen=True)
class SplitConfig:
    train_end: pd.Timestamp
    valid_end: pd.Timestamp
    test_end: pd.Timestamp


def ensure_directories() -> None:
    ARTIFACTS_DIR.mkdir(exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


def load_clusters() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "clusters.csv")


def load_signals() -> pd.DataFrame:
    signals = pd.read_csv(DATA_DIR / "signals_weekly.csv", parse_dates=["week_start_date"])
    signals = signals.sort_values("week_start_date").reset_index(drop=True)
    signals["is_wedding_season"] = signals["is_wedding_season"].astype(bool)
    signals["is_festival_week"] = signals["is_festival_week"].astype(bool)
    signals["cotton_price_trailing_12wk_avg"] = (
        signals["cotton_price_inr_per_kg"].rolling(12, min_periods=1).mean()
    )
    signals["cotton_price_rel_12wk_avg"] = (
        signals["cotton_price_inr_per_kg"] / signals["cotton_price_trailing_12wk_avg"] - 1.0
    )
    return signals


def load_demand() -> pd.DataFrame:
    demand = pd.read_csv(DATA_DIR / "demand_weekly.csv", parse_dates=["week_start_date"])
    return demand.sort_values(["cluster_id", "product_category", "week_start_date"]).reset_index(
        drop=True
    )


def load_orders() -> pd.DataFrame:
    date_cols = [
        "order_date",
        "promised_delivery_date",
        "actual_delivery_date",
        "payment_due_date",
        "payment_received_date",
    ]
    return pd.read_csv(DATA_DIR / "orders_log.csv", parse_dates=date_cols)


def load_cashflow() -> pd.DataFrame:
    cashflow = pd.read_csv(DATA_DIR / "weaver_cashflow_weekly.csv", parse_dates=["week_start_date"])
    return cashflow.sort_values(["cluster_id", "week_start_date"]).reset_index(drop=True)


def get_split_config() -> SplitConfig:
    signals = load_signals()
    unique_weeks = list(signals["week_start_date"].sort_values().unique())
    train_end = pd.Timestamp(unique_weeks[SPLIT_TRAIN_WEEKS - 1])
    valid_end = pd.Timestamp(unique_weeks[SPLIT_TRAIN_WEEKS + SPLIT_VALID_WEEKS - 1])
    test_end = pd.Timestamp(unique_weeks[-1])
    return SplitConfig(train_end=train_end, valid_end=valid_end, test_end=test_end)


def add_split_labels(df: pd.DataFrame, date_col: str = "week_start_date") -> pd.DataFrame:
    split = get_split_config()
    result = df.copy()
    result["split"] = np.where(
        result[date_col] <= split.train_end,
        "train",
        np.where(result[date_col] <= split.valid_end, "validate", "test"),
    )
    return result


def extend_signals(signals: pd.DataFrame, periods: int = FORECAST_HORIZON_WEEKS) -> pd.DataFrame:
    signals = signals.sort_values("week_start_date").reset_index(drop=True)
    future_rows: list[dict[str, Any]] = []
    last_date = pd.Timestamp(signals["week_start_date"].max())
    for step in range(1, periods + 1):
        future_date = last_date + pd.Timedelta(weeks=step)
        reference_date = future_date - pd.Timedelta(weeks=52)
        reference = signals.loc[signals["week_start_date"] == reference_date]
        if reference.empty:
            reference = signals.tail(1)
        template = reference.iloc[0].to_dict()
        template["week_start_date"] = future_date
        template["year"] = future_date.year
        template["month"] = future_date.month
        template["week_of_year"] = int(future_date.isocalendar().week)
        future_rows.append(template)
    extended = pd.concat([signals, pd.DataFrame(future_rows)], ignore_index=True)
    extended = extended.sort_values("week_start_date").reset_index(drop=True)
    extended["cotton_price_trailing_12wk_avg"] = (
        extended["cotton_price_inr_per_kg"].rolling(12, min_periods=1).mean()
    )
    extended["cotton_price_rel_12wk_avg"] = (
        extended["cotton_price_inr_per_kg"] / extended["cotton_price_trailing_12wk_avg"] - 1.0
    )
    return extended


def write_json(path: Path, payload: Any) -> None:
    ensure_directories()
    path.write_text(json.dumps(payload, indent=2, default=_json_default), encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _json_default(value: Any) -> Any:
    if isinstance(value, (pd.Timestamp, np.datetime64)):
        return pd.Timestamp(value).isoformat()
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    raise TypeError(f"Object of type {type(value)} is not JSON serializable")
