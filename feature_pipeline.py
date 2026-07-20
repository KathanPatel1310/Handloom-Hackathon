from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from pipeline_common import (
    ARTIFACTS_DIR,
    add_split_labels,
    ensure_directories,
    extend_signals,
    load_clusters,
    load_demand,
    load_signals,
)


LAG_STEPS = [1, 2, 4, 8, 52]


def build_feature_frame(output_path: Path | None = None) -> pd.DataFrame:
    ensure_directories()
    demand = load_demand()
    signals = load_signals()
    clusters = load_clusters()

    feature_df = demand.merge(signals, on="week_start_date", how="left")
    feature_df = feature_df.merge(
        clusters[["cluster_id", "cluster_name", "state", "primary_material", "product_specialty"]],
        on="cluster_id",
        how="left",
    )
    feature_df = feature_df.sort_values(["cluster_id", "product_category", "week_start_date"]).reset_index(
        drop=True
    )

    grouped = feature_df.groupby(["cluster_id", "product_category"], group_keys=False)
    for lag in LAG_STEPS:
        feature_df[f"lag_{lag}"] = grouped["units_ordered"].shift(lag)

    feature_df["rolling_mean_4"] = grouped["units_ordered"].shift(1).rolling(4, min_periods=1).mean()
    feature_df["rolling_std_4"] = (
        grouped["units_ordered"].shift(1).rolling(4, min_periods=1).std().fillna(0.0)
    )
    feature_df["rolling_mean_12"] = grouped["units_ordered"].shift(1).rolling(12, min_periods=1).mean()
    feature_df["rolling_std_12"] = (
        grouped["units_ordered"].shift(1).rolling(12, min_periods=1).std().fillna(0.0)
    )

    feature_df["cluster_code"] = feature_df["cluster_id"].astype("category").cat.codes
    feature_df["product_code"] = feature_df["product_category"].astype("category").cat.codes
    feature_df["avg_order_value_trailing_12"] = (
        grouped["avg_order_value_inr"].shift(1).rolling(12, min_periods=1).mean()
    )
    delivered_12 = grouped["units_delivered"].shift(1).rolling(12, min_periods=1).sum()
    ordered_12 = grouped["units_ordered"].shift(1).rolling(12, min_periods=1).sum().replace(0, np.nan)
    feature_df["delivery_rate_trailing_12"] = (delivered_12 / ordered_12).fillna(1.0)
    feature_df["delivery_gap_trailing_4"] = (
        grouped["units_ordered"].shift(1).rolling(4, min_periods=1).sum()
        - grouped["units_delivered"].shift(1).rolling(4, min_periods=1).sum()
    ).fillna(0.0)

    feature_df = add_split_labels(feature_df)
    feature_df = feature_df.dropna(subset=["lag_52"]).reset_index(drop=True)

    target_path = output_path or (ARTIFACTS_DIR / "feature_frame.csv")
    feature_df.to_csv(target_path, index=False)
    return feature_df


def build_extended_signals(output_path: Path | None = None) -> pd.DataFrame:
    ensure_directories()
    signals = load_signals()
    extended_signals = extend_signals(signals)
    target_path = output_path or (ARTIFACTS_DIR / "signals_extended.csv")
    extended_signals.to_csv(target_path, index=False)
    return extended_signals


def main() -> None:
    build_feature_frame()
    build_extended_signals()
    print(f"Feature pipeline complete. Artifacts written to {ARTIFACTS_DIR}")


if __name__ == "__main__":
    main()
