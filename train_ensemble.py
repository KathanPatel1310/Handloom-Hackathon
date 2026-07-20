from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from xgboost import XGBRegressor

from feature_pipeline import LAG_STEPS, build_extended_signals, build_feature_frame
from pipeline_common import (
    ARTIFACTS_DIR,
    FORECAST_HORIZON_WEEKS,
    MODEL_DIR,
    ensure_directories,
    get_split_config,
    load_clusters,
    read_json,
    write_json,
)


FEATURE_COLUMNS = [
    "lag_1",
    "lag_2",
    "lag_4",
    "lag_8",
    "lag_52",
    "rolling_mean_4",
    "rolling_std_4",
    "rolling_mean_12",
    "rolling_std_12",
    "festival_proximity",
    "is_wedding_season",
    "google_trends_index",
    "cotton_price_rel_12wk_avg",
    "cluster_code",
    "product_code",
    "avg_order_value_trailing_12",
    "delivery_rate_trailing_12",
    "delivery_gap_trailing_4",
]


def seasonal_naive_prediction(df: pd.DataFrame) -> np.ndarray:
    return df["lag_52"].to_numpy(dtype=float)


def wape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denom = np.abs(y_true).sum()
    if denom == 0:
        return 0.0
    return float(np.abs(y_true - y_pred).sum() / denom)


def conformal_quantile(residuals: np.ndarray, alpha: float = 0.1) -> float:
    sorted_residuals = np.sort(np.abs(residuals))
    if len(sorted_residuals) == 0:
        return 0.0
    index = int(np.ceil((len(sorted_residuals) + 1) * (1 - alpha))) - 1
    index = max(0, min(index, len(sorted_residuals) - 1))
    return float(sorted_residuals[index])


def _load_or_build_features() -> pd.DataFrame:
    path = ARTIFACTS_DIR / "feature_frame.csv"
    if path.exists():
        return pd.read_csv(path, parse_dates=["week_start_date"])
    return build_feature_frame()


def _load_or_build_extended_signals() -> pd.DataFrame:
    path = ARTIFACTS_DIR / "signals_extended.csv"
    if path.exists():
        return pd.read_csv(path, parse_dates=["week_start_date"])
    return build_extended_signals()


def train_models() -> tuple[pd.DataFrame, pd.DataFrame, dict]:
    ensure_directories()
    feature_df = _load_or_build_features()
    extended_signals = _load_or_build_extended_signals()
    clusters = load_clusters()
    split = get_split_config()

    feature_df["week_start_date"] = pd.to_datetime(feature_df["week_start_date"])
    extended_signals["week_start_date"] = pd.to_datetime(extended_signals["week_start_date"])

    all_predictions: list[pd.DataFrame] = []
    future_predictions: list[pd.DataFrame] = []
    model_manifest: dict[str, dict] = {}

    for product_category, product_df in feature_df.groupby("product_category"):
        product_df = product_df.sort_values(["cluster_id", "week_start_date"]).reset_index(drop=True)
        train_df = product_df.loc[product_df["split"] == "train"].copy()
        valid_df = product_df.loc[product_df["split"] == "validate"].copy()
        test_df = product_df.loc[product_df["split"] == "test"].copy()

        model = XGBRegressor(
            objective="reg:squarederror",
            n_estimators=450,
            learning_rate=0.05,
            max_depth=6,
            min_child_weight=3,
            subsample=0.85,
            colsample_bytree=0.85,
            reg_lambda=1.2,
            reg_alpha=0.05,
            random_state=42,
            tree_method="hist",
        )
        model.fit(
            train_df[FEATURE_COLUMNS],
            train_df["units_ordered"],
            eval_set=[(valid_df[FEATURE_COLUMNS], valid_df["units_ordered"])],
            verbose=False,
        )

        for split_name, split_df in [("validate", valid_df), ("test", test_df)]:
            baseline_pred = seasonal_naive_prediction(split_df)
            xgb_pred = model.predict(split_df[FEATURE_COLUMNS])
            split_df = split_df.copy()
            split_df["baseline_pred"] = baseline_pred
            split_df["xgb_pred"] = xgb_pred
            if split_name == "validate":
                baseline_error = wape(split_df["units_ordered"].to_numpy(), baseline_pred)
                xgb_error = wape(split_df["units_ordered"].to_numpy(), xgb_pred)
                total_error = baseline_error + xgb_error
                xgb_weight = 0.5 if total_error == 0 else baseline_error / total_error
                baseline_weight = 1.0 - xgb_weight
                qhat = conformal_quantile(
                    split_df["units_ordered"].to_numpy()
                    - (baseline_weight * baseline_pred + xgb_weight * xgb_pred),
                    alpha=0.1,
                )
                model_manifest[product_category] = {
                    "baseline_weight": baseline_weight,
                    "xgb_weight": xgb_weight,
                    "validation_wape_baseline": baseline_error,
                    "validation_wape_xgb": xgb_error,
                    "conformal_q90": qhat,
                }
                model.save_model(str(MODEL_DIR / f"{product_category}_xgb.json"))
                joblib.dump(FEATURE_COLUMNS, MODEL_DIR / f"{product_category}_features.joblib")

            weights = model_manifest[product_category]
            ensemble_pred = (
                weights["baseline_weight"] * split_df["baseline_pred"]
                + weights["xgb_weight"] * split_df["xgb_pred"]
            )
            split_df["ensemble_pred"] = ensemble_pred
            split_df["lower_90"] = np.maximum(0.0, split_df["ensemble_pred"] - weights["conformal_q90"])
            split_df["upper_90"] = np.maximum(split_df["ensemble_pred"], split_df["ensemble_pred"] + weights["conformal_q90"])
            all_predictions.append(split_df)

        final_model = XGBRegressor(
            objective="reg:squarederror",
            n_estimators=450,
            learning_rate=0.05,
            max_depth=6,
            min_child_weight=3,
            subsample=0.85,
            colsample_bytree=0.85,
            reg_lambda=1.2,
            reg_alpha=0.05,
            random_state=42,
            tree_method="hist",
        )
        full_product_df = product_df.copy()
        final_model.fit(full_product_df[FEATURE_COLUMNS], full_product_df["units_ordered"], verbose=False)
        final_model.save_model(str(MODEL_DIR / f"{product_category}_xgb_production.json"))

        product_future = recursive_forecast_product(
            product_df=full_product_df,
            model=final_model,
            product_category=product_category,
            extended_signals=extended_signals,
            clusters=clusters,
            weights=model_manifest[product_category],
        )
        future_predictions.append(product_future)

    predictions_df = pd.concat(all_predictions, ignore_index=True)
    future_df = pd.concat(future_predictions, ignore_index=True)
    predictions_df.to_csv(ARTIFACTS_DIR / "backtest_predictions.csv", index=False)
    future_df.to_csv(ARTIFACTS_DIR / "future_forecasts.csv", index=False)
    write_json(
        ARTIFACTS_DIR / "model_manifest.json",
        {
            "split": {
                "train_end": split.train_end,
                "valid_end": split.valid_end,
                "test_end": split.test_end,
            },
            "products": model_manifest,
        },
    )
    return predictions_df, future_df, model_manifest


def recursive_forecast_product(
    product_df: pd.DataFrame,
    model: XGBRegressor,
    product_category: str,
    extended_signals: pd.DataFrame,
    clusters: pd.DataFrame,
    weights: dict,
) -> pd.DataFrame:
    history_cols = [
        "cluster_id",
        "product_category",
        "week_start_date",
        "units_ordered",
        "units_delivered",
        "avg_order_value_inr",
        "cluster_name",
        "state",
        "primary_material",
        "product_specialty",
    ]
    history = product_df[history_cols].copy()
    history["week_start_date"] = pd.to_datetime(history["week_start_date"])
    future_rows: list[dict] = []

    future_dates = sorted(extended_signals["week_start_date"].unique())[-FORECAST_HORIZON_WEEKS:]
    cluster_lookup = (
        clusters[["cluster_id", "cluster_name", "state", "primary_material", "product_specialty"]]
        .drop_duplicates()
        .set_index("cluster_id")
    )

    for cluster_id in sorted(product_df["cluster_id"].unique()):
        cluster_history = history.loc[history["cluster_id"] == cluster_id].copy()
        cluster_history = cluster_history.sort_values("week_start_date").reset_index(drop=True)
        cluster_meta = cluster_lookup.loc[cluster_id].to_dict()
        for future_date in future_dates:
            signal_row = extended_signals.loc[extended_signals["week_start_date"] == future_date].iloc[0]
            lag_source = cluster_history.sort_values("week_start_date").reset_index(drop=True)
            row = {
                "cluster_id": cluster_id,
                "product_category": product_category,
                "week_start_date": pd.Timestamp(future_date),
                "festival_proximity": signal_row["festival_proximity"],
                "is_wedding_season": bool(signal_row["is_wedding_season"]),
                "google_trends_index": signal_row["google_trends_index"],
                "cotton_price_rel_12wk_avg": signal_row["cotton_price_rel_12wk_avg"],
                "cluster_code": int(cluster_id.replace("C", "")) - 1,
                "product_code": int(product_df["product_code"].iloc[0]),
                "cluster_name": cluster_meta["cluster_name"],
                "state": cluster_meta["state"],
                "primary_material": cluster_meta["primary_material"],
                "product_specialty": cluster_meta["product_specialty"],
            }
            for lag in LAG_STEPS:
                row[f"lag_{lag}"] = float(lag_source["units_ordered"].iloc[-lag])
            row["rolling_mean_4"] = float(lag_source["units_ordered"].tail(4).mean())
            row["rolling_std_4"] = float(lag_source["units_ordered"].tail(4).std(ddof=0))
            row["rolling_mean_12"] = float(lag_source["units_ordered"].tail(12).mean())
            row["rolling_std_12"] = float(lag_source["units_ordered"].tail(12).std(ddof=0))
            row["avg_order_value_trailing_12"] = float(lag_source["avg_order_value_inr"].tail(12).mean())
            recent_ordered = lag_source["units_ordered"].tail(12).sum()
            recent_delivered = lag_source["units_delivered"].tail(12).sum()
            row["delivery_rate_trailing_12"] = float(recent_delivered / recent_ordered) if recent_ordered else 1.0
            row["delivery_gap_trailing_4"] = float(
                lag_source["units_ordered"].tail(4).sum() - lag_source["units_delivered"].tail(4).sum()
            )

            xgb_pred = float(model.predict(pd.DataFrame([row])[FEATURE_COLUMNS])[0])
            baseline_pred = float(row["lag_52"])
            ensemble_pred = max(
                0.0,
                weights["baseline_weight"] * baseline_pred + weights["xgb_weight"] * xgb_pred,
            )
            delivered_units = max(0.0, ensemble_pred * row["delivery_rate_trailing_12"])
            row["baseline_pred"] = baseline_pred
            row["xgb_pred"] = xgb_pred
            row["ensemble_pred"] = ensemble_pred
            row["lower_90"] = max(0.0, ensemble_pred - weights["conformal_q90"])
            row["upper_90"] = max(ensemble_pred, ensemble_pred + weights["conformal_q90"])
            row["units_ordered"] = ensemble_pred
            row["units_delivered"] = delivered_units
            row["avg_order_value_inr"] = row["avg_order_value_trailing_12"]
            future_rows.append(row.copy())

            history_append = {
                "cluster_id": cluster_id,
                "product_category": product_category,
                "week_start_date": pd.Timestamp(future_date),
                "units_ordered": ensemble_pred,
                "units_delivered": delivered_units,
                "avg_order_value_inr": row["avg_order_value_trailing_12"],
                "cluster_name": cluster_meta["cluster_name"],
                "state": cluster_meta["state"],
                "primary_material": cluster_meta["primary_material"],
                "product_specialty": cluster_meta["product_specialty"],
            }
            cluster_history = pd.concat([cluster_history, pd.DataFrame([history_append])], ignore_index=True)

    return pd.DataFrame(future_rows)


def main() -> None:
    predictions_df, future_df, manifest = train_models()
    print(
        f"Training complete. Backtest rows={len(predictions_df)}, future forecasts={len(future_df)}, "
        f"products={len(manifest)}"
    )


if __name__ == "__main__":
    main()
