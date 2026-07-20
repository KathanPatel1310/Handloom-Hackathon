from __future__ import annotations

from collections import defaultdict

import pandas as pd

from pipeline_common import ARTIFACTS_DIR, ensure_directories, load_clusters, write_json


def generate_insights() -> list[dict]:
    ensure_directories()
    clusters = load_clusters().set_index("cluster_id")
    future_forecasts = pd.read_csv(ARTIFACTS_DIR / "future_forecasts.csv", parse_dates=["week_start_date"])
    cashflow_projection = pd.read_csv(ARTIFACTS_DIR / "cashflow_projection.csv", parse_dates=["week_start_date"])
    signals_extended = pd.read_csv(ARTIFACTS_DIR / "signals_extended.csv", parse_dates=["week_start_date"])

    primary_products = clusters["product_specialty"].to_dict()
    future_dates = sorted(future_forecasts["week_start_date"].unique())
    next_festivals = signals_extended.loc[
        signals_extended["week_start_date"].isin(future_dates)
        & signals_extended["festival_name"].notna()
        & (signals_extended["festival_name"] != "")
    ][["week_start_date", "festival_name"]]
    festival_lookup = defaultdict(list)
    for row in next_festivals.itertuples():
        festival_lookup[pd.Timestamp(row.week_start_date)].append(row.festival_name)

    insights: list[dict] = []
    for cluster_id in sorted(future_forecasts["cluster_id"].unique()):
        cluster_name = clusters.loc[cluster_id, "cluster_name"]
        specialty = primary_products[cluster_id]
        primary_forecast = (
            future_forecasts.loc[
                (future_forecasts["cluster_id"] == cluster_id)
                & (future_forecasts["product_category"] == specialty)
            ]
            .sort_values("week_start_date")
            .reset_index(drop=True)
        )
        if primary_forecast.empty:
            primary_forecast = (
                future_forecasts.loc[future_forecasts["cluster_id"] == cluster_id]
                .groupby("week_start_date")
                .agg(
                    ensemble_pred=("ensemble_pred", "sum"),
                    lower_90=("lower_90", "sum"),
                    upper_90=("upper_90", "sum"),
                )
                .reset_index()
            )
        cashflow_rows = (
            cashflow_projection.loc[cashflow_projection["cluster_id"] == cluster_id]
            .sort_values("week_start_date")
            .reset_index(drop=True)
        )
        first_week = primary_forecast.iloc[0]
        peak_week = primary_forecast.loc[primary_forecast["ensemble_pred"].idxmax()]
        cash_gap = cashflow_rows.loc[cashflow_rows["projected_net_cashflow_inr"].idxmin()]
        credit_peak = cashflow_rows.loc[cashflow_rows["credit_need_probability"].idxmax()]
        festivals = festival_lookup.get(pd.Timestamp(peak_week["week_start_date"]), [])
        festival_text = ""
        if festivals:
            festival_text = f"{', '.join(festivals)} demand lift is expected around {peak_week['week_start_date'].date()}."
        status = str(cashflow_rows["credit_status"].iloc[-1])
        action_units = round(float(first_week["ensemble_pred"]))
        interval_width = round(float(first_week["upper_90"] - first_week["lower_90"]))
        message = (
            f"This week: plan for about {action_units} {specialty.replace('_', ' ')} units in {cluster_name}. "
            f"{festival_text} Keep {clusters.loc[cluster_id, 'primary_material']} ready now. "
            f"Confidence band is +/- {interval_width // 2 if interval_width else 0} units."
        ).strip()
        if float(cash_gap["projected_net_cashflow_inr"]) < 0:
            message += (
                f" Expect a cash gap near {pd.Timestamp(cash_gap['week_start_date']).date()}, "
                "so slow non-urgent spend and line up short-term working capital early."
            )
        else:
            message += " Cashflow stays workable over the next four weeks if delivery pace holds."

        why = (
            f"Why: forecast is driven by last-year seasonality, recent order momentum, trends interest, "
            f"and payment friction patterns observed in {cluster_name}."
        )
        insights.append(
            {
                "cluster_id": cluster_id,
                "cluster_name": cluster_name,
                "state": clusters.loc[cluster_id, "state"],
                "primary_material": clusters.loc[cluster_id, "primary_material"],
                "product_specialty": specialty,
                "action_units": action_units,
                "forecast_lower": round(float(first_week["lower_90"]), 1),
                "forecast_upper": round(float(first_week["upper_90"]), 1),
                "message": message,
                "why": why,
                "credit_status": status,
                "credit_need_probability": round(float(credit_peak["credit_need_probability"]), 3),
                "cash_gap_week": pd.Timestamp(cash_gap["week_start_date"]),
                "cash_gap_inr": round(float(cash_gap["projected_net_cashflow_inr"]), 2),
                "peak_week": pd.Timestamp(peak_week["week_start_date"]),
                "peak_week_units": round(float(peak_week["ensemble_pred"]), 1),
            }
        )

    write_json(ARTIFACTS_DIR / "cluster_insights.json", insights)
    return insights


def main() -> None:
    insights = generate_insights()
    print(f"Insight generation complete. Cluster cards={len(insights)}")


if __name__ == "__main__":
    main()
