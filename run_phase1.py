from __future__ import annotations

from backtest_report import build_backtest_report
from cashflow_projection import build_cashflow_projection
from feature_pipeline import build_extended_signals, build_feature_frame
from insight_generator import generate_insights
from train_ensemble import train_models


def main() -> None:
    build_feature_frame()
    build_extended_signals()
    train_models()
    build_backtest_report()
    build_cashflow_projection()
    generate_insights()
    print("Phase 1 pipeline completed successfully.")


if __name__ == "__main__":
    main()
