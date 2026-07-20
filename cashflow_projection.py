from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

from pipeline_common import ARTIFACTS_DIR, ensure_directories, load_cashflow, load_orders, write_json


def build_cashflow_projection() -> tuple[pd.DataFrame, pd.DataFrame]:
    ensure_directories()
    future_forecasts = pd.read_csv(ARTIFACTS_DIR / "future_forecasts.csv", parse_dates=["week_start_date"])
    cashflow = load_cashflow()
    orders = load_orders()

    orders["delivery_to_cash_weeks"] = (
        (orders["payment_received_date"] - orders["actual_delivery_date"]).dt.days.clip(lower=0) / 7.0
    )
    orders["delivery_to_cash_bucket"] = np.clip(np.floor(orders["delivery_to_cash_weeks"]).astype(int), 0, 8)
    delay_curve = (
        orders.groupby(["cluster_id", "delivery_to_cash_bucket"]).size().rename("count").reset_index()
    )
    delay_curve["probability"] = delay_curve["count"] / delay_curve.groupby("cluster_id")["count"].transform("sum")

    recent_revenue = (
        cashflow.sort_values("week_start_date")
        .groupby("cluster_id")
        .tail(26)
        .groupby("cluster_id")
        .agg(
            raw_material_ratio=("raw_material_cost_inr", lambda s: s.sum()),
            wage_ratio=("wage_cost_inr", lambda s: s.sum()),
            maintenance_ratio=("loom_maintenance_cost_inr", lambda s: s.sum()),
            drag_ratio=("working_capital_drag_inr", lambda s: s.sum()),
            delivered_revenue=("delivered_revenue_inr", lambda s: s.sum()),
            volatility=("income_volatility_score", "mean"),
            recent_active_weavers=("active_weavers_est", "mean"),
        )
        .reset_index()
    )
    for ratio_col in ["raw_material_ratio", "wage_ratio", "maintenance_ratio", "drag_ratio"]:
        recent_revenue[ratio_col] = recent_revenue[ratio_col] / recent_revenue["delivered_revenue"].replace(0, np.nan)
        recent_revenue[ratio_col] = recent_revenue[ratio_col].fillna(0.0)

    latest_cashflow = cashflow.sort_values("week_start_date").groupby("cluster_id").tail(1)
    history_features = cashflow.copy()
    history_features["pending_ratio"] = history_features["pending_receivables_inr"] / (
        history_features["delivered_revenue_inr"].rolling(4, min_periods=1).mean().replace(0, np.nan)
    )
    history_features["pending_ratio"] = history_features["pending_ratio"].replace([np.inf, -np.inf], np.nan).fillna(0.0)
    history_features["net_cashflow_margin"] = history_features["net_cashflow_inr"] / (
        history_features["cash_in_inr"].replace(0, np.nan)
    )
    history_features["net_cashflow_margin"] = (
        history_features["net_cashflow_margin"].replace([np.inf, -np.inf], np.nan).fillna(0.0)
    )
    classifier = LogisticRegression(max_iter=1000)
    classifier.fit(
        history_features[
            [
                "pending_ratio",
                "receivable_weeks_outstanding",
                "income_volatility_score",
                "net_cashflow_margin",
            ]
        ],
        history_features["credit_need_flag"].astype(int),
    )

    future_agg = (
        future_forecasts.groupby(["cluster_id", "week_start_date"])
        .agg(
            forecast_units=("ensemble_pred", "sum"),
            forecast_units_lower=("lower_90", "sum"),
            forecast_units_upper=("upper_90", "sum"),
            delivered_units=("units_delivered", "sum"),
            forecast_revenue_inr=("avg_order_value_inr", lambda s: float((s * future_forecasts.loc[s.index, "ensemble_pred"]).sum())),
            cluster_name=("cluster_name", "first"),
            state=("state", "first"),
            primary_material=("primary_material", "first"),
        )
        .reset_index()
    )

    projection = future_agg.merge(recent_revenue, on="cluster_id", how="left")
    projection = projection.merge(
        latest_cashflow[
            [
                "cluster_id",
                "pending_receivables_inr",
                "receivable_weeks_outstanding",
                "active_weavers_est",
            ]
        ],
        on="cluster_id",
        how="left",
    )
    projection = projection.sort_values(["cluster_id", "week_start_date"]).reset_index(drop=True)

    projected_rows: list[dict] = []
    for cluster_id, cluster_df in projection.groupby("cluster_id"):
        cluster_df = cluster_df.sort_values("week_start_date").reset_index(drop=True)
        cluster_delay = delay_curve.loc[delay_curve["cluster_id"] == cluster_id, ["delivery_to_cash_bucket", "probability"]]
        delay_probs = {int(row.delivery_to_cash_bucket): float(row.probability) for row in cluster_delay.itertuples()}
        backlog_remaining = float(cluster_df["pending_receivables_inr"].iloc[0] or 0.0)
        backlog_weeks = float(cluster_df["receivable_weeks_outstanding"].iloc[0] or 0.0)

        for idx, row in cluster_df.iterrows():
            revenue = float(row["forecast_revenue_inr"])
            raw_cost = revenue * float(row["raw_material_ratio"])
            wage_cost = revenue * float(row["wage_ratio"])
            maintenance = revenue * float(row["maintenance_ratio"])
            backlog_collection = min(backlog_remaining, backlog_remaining / max(backlog_weeks, 1.0))
            scheduled_cash = 0.0
            for prior_idx in range(idx + 1):
                prior_revenue = float(cluster_df.loc[prior_idx, "forecast_revenue_inr"])
                lag = idx - prior_idx
                scheduled_cash += prior_revenue * delay_probs.get(lag, 0.0)
            cash_in = scheduled_cash + backlog_collection
            projected_pending = max(0.0, backlog_remaining + revenue - cash_in)
            working_capital_drag = projected_pending * float(row["drag_ratio"])
            net_cashflow = cash_in - raw_cost - wage_cost - maintenance - working_capital_drag
            pending_ratio = projected_pending / max(revenue, 1.0)
            credit_need_probability = float(
                classifier.predict_proba(
                    pd.DataFrame(
                        [
                            {
                                "pending_ratio": pending_ratio,
                                "receivable_weeks_outstanding": max(backlog_weeks, 0.0),
                                "income_volatility_score": float(row["volatility"]),
                                "net_cashflow_margin": net_cashflow / max(cash_in, 1.0),
                            }
                        ]
                    )
                )[0, 1]
            )
            status = "green"
            if credit_need_probability >= 0.7 or net_cashflow < 0:
                status = "red"
            elif credit_need_probability >= 0.4:
                status = "yellow"

            backlog_remaining = projected_pending
            projected_rows.append(
                {
                    **row.to_dict(),
                    "raw_material_cost_inr": raw_cost,
                    "wage_cost_inr": wage_cost,
                    "loom_maintenance_cost_inr": maintenance,
                    "working_capital_drag_inr": working_capital_drag,
                    "projected_cash_in_inr": cash_in,
                    "projected_net_cashflow_inr": net_cashflow,
                    "projected_pending_receivables_inr": projected_pending,
                    "credit_need_probability": credit_need_probability,
                    "credit_status": status,
                    "backlog_collection_inr": backlog_collection,
                }
            )

    projected_df = pd.DataFrame(projected_rows)
    summary_df = (
        projected_df.groupby("cluster_id")
        .agg(
            cluster_name=("cluster_name", "first"),
            state=("state", "first"),
            primary_material=("primary_material", "first"),
            four_week_units=("forecast_units", "sum"),
            four_week_revenue_inr=("forecast_revenue_inr", "sum"),
            four_week_net_cashflow_inr=("projected_net_cashflow_inr", "sum"),
            max_credit_need_probability=("credit_need_probability", "max"),
            final_credit_status=("credit_status", "last"),
        )
        .reset_index()
    )

    projected_df.to_csv(ARTIFACTS_DIR / "cashflow_projection.csv", index=False)
    summary_df.to_csv(ARTIFACTS_DIR / "cashflow_summary.csv", index=False)
    write_json(ARTIFACTS_DIR / "cashflow_summary.json", summary_df.to_dict(orient="records"))
    return projected_df, summary_df


def main() -> None:
    projected_df, summary_df = build_cashflow_projection()
    print(
        f"Cashflow projection complete. Weekly rows={len(projected_df)}, cluster summaries={len(summary_df)}"
    )


if __name__ == "__main__":
    main()
