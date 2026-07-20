"""
Fetch real external signals for the handloom dataset.

Outputs:
  external_inputs/cotton_prices_weekly.csv
  external_inputs/cpi_weekly.csv

Sources:
  - Cotton: Agmarknet data via CEDA Agri Market Data API
  - CPI: MoSPI eSankhyiki / CPI API
"""

from __future__ import annotations

import ssl
import time
from pathlib import Path

import pandas as pd
import requests
from agmarknet import Agmarknet


class UnsafeLegacyTLSAdapter(requests.adapters.HTTPAdapter):
    def init_poolmanager(self, connections, maxsize, block=False, **pool_kwargs):
        context = ssl.create_default_context()
        context.check_hostname = False
        if hasattr(ssl, "OP_LEGACY_SERVER_CONNECT"):
            context.options |= ssl.OP_LEGACY_SERVER_CONNECT
        pool_kwargs["ssl_context"] = context
        return super().init_poolmanager(connections, maxsize, block, **pool_kwargs)


START_DATE = "2021-07-05"
END_DATE = "2026-06-22"

# Major cotton market states.
COTTON_STATE_IDS = {
    "Gujarat",
    "Maharashtra",
    "Telangana",
    "Karnataka",
    "Andhra Pradesh",
    "Madhya Pradesh",
}


def fetch_json(url: str, method: str = "GET", payload: dict | None = None) -> dict:
    last_error = None
    session = requests.Session()
    session.mount("https://", UnsafeLegacyTLSAdapter())
    for attempt in range(5):
        try:
            response = session.request(
                method=method,
                url=url,
                headers={"User-Agent": "Mozilla/5.0"},
                json=payload,
                timeout=120,
                verify=False,
            )
            response.raise_for_status()
            return response.json()
        except requests.HTTPError as exc:
            last_error = exc
            if exc.response is not None and exc.response.status_code == 429:
                time.sleep(2 + attempt * 2)
                continue
            raise
    raise last_error


def monday_floor(series: pd.Series) -> pd.Series:
    series = pd.to_datetime(series)
    return series - pd.to_timedelta(series.dt.weekday, unit="D")


def build_cotton_prices_weekly(output_dir: Path) -> pd.DataFrame:
    api = Agmarknet()
    frames = []
    for state_name in sorted(COTTON_STATE_IDS):
        df = api.report(
            start=START_DATE,
            end=END_DATE,
            commodity="Cotton",
            state=state_name,
            data_type="price",
            progress=False,
            timeout=120,
        )
        time.sleep(0.5)
        if df.empty:
            continue
        df = df.copy()
        df["date"] = pd.to_datetime(df["arrival_date"], format="%d-%m-%Y")
        frames.append(df[["date", "state_name", "market_name", "model_price"]])

    if not frames:
        raise RuntimeError("No cotton market data could be fetched from the CEDA API.")

    cotton_daily = pd.concat(frames, ignore_index=True)
    # Agmarknet modal prices are in INR / quintal. Convert to INR / kg.
    cotton_daily["cotton_price_inr_per_kg"] = (
        cotton_daily["model_price"].astype(str).str.replace(",", "", regex=False).astype(float) / 100.0
    )
    cotton_daily["week_start_date"] = monday_floor(cotton_daily["date"])

    weekly = (
        cotton_daily.groupby("week_start_date", as_index=False)
        .agg(
            cotton_price_inr_per_kg=("cotton_price_inr_per_kg", "mean"),
            reporting_markets=("market_name", "nunique"),
            reporting_states=("state_name", "nunique"),
        )
        .sort_values("week_start_date")
    )
    full_weeks = pd.DataFrame(
        {"week_start_date": pd.date_range(START_DATE, END_DATE, freq="W-MON")}
    )
    weekly = full_weeks.merge(weekly, on="week_start_date", how="left")
    weekly["cotton_price_inr_per_kg"] = weekly["cotton_price_inr_per_kg"].interpolate(
        limit_direction="both"
    )
    weekly["reporting_markets"] = weekly["reporting_markets"].fillna(0).astype(int)
    weekly["reporting_states"] = weekly["reporting_states"].fillna(0).astype(int)
    weekly.to_csv(output_dir / "cotton_prices_weekly.csv", index=False)
    return weekly


def build_cpi_weekly(output_dir: Path) -> pd.DataFrame:
    body = {
        "food": 0,
        "tobacco": 0,
        "clothing": 0,
        "housing": 0,
        "furnishings": 0,
        "health": 0,
        "transport": 0,
        "communication": 0,
        "recreation": 0,
        "education": 0,
        "restaurants": 0,
        "personal": 0,
    }

    monthly_rows = []
    for year in range(2021, 2027):
        response = fetch_json(
            (
                "https://api.mospi.gov.in/api/cpi/getInflation"
                f"?year={year}&state_code=1&sector_code=3&month_code=12"
            ),
            method="POST",
            payload=body,
        )
        for row in response.get("national_current_index", []):
            monthly_rows.append(
                {
                    "month_start_date": pd.Timestamp(
                        year=int(row["year"]),
                        month=int(row["month"]),
                        day=1,
                    ),
                    "cpi_inflation_index": float(row["index"]),
                }
            )

    monthly = (
        pd.DataFrame(monthly_rows)
        .drop_duplicates("month_start_date", keep="last")
        .sort_values("month_start_date")
    )
    if monthly.empty:
        raise RuntimeError("No CPI data could be fetched from MoSPI.")

    weekly = pd.DataFrame({"week_start_date": pd.date_range(START_DATE, END_DATE, freq="W-MON")})
    monthly["month_end_date"] = monthly["month_start_date"] + pd.offsets.MonthEnd(1)
    points = pd.concat(
        [
            monthly[["month_start_date", "cpi_inflation_index"]].rename(
                columns={"month_start_date": "date"}
            ),
            monthly[["month_end_date", "cpi_inflation_index"]].rename(
                columns={"month_end_date": "date"}
            ),
        ],
        ignore_index=True,
    ).sort_values("date")

    weekly = weekly.merge(
        points.rename(columns={"date": "week_start_date"}),
        on="week_start_date",
        how="left",
    )
    weekly["cpi_inflation_index"] = weekly["cpi_inflation_index"].interpolate(
        limit_direction="both"
    )
    weekly.to_csv(output_dir / "cpi_weekly.csv", index=False)
    return weekly


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    output_dir = base_dir / "external_inputs"
    output_dir.mkdir(exist_ok=True)

    cotton = build_cotton_prices_weekly(output_dir)
    cpi = build_cpi_weekly(output_dir)

    print("Saved:", output_dir / "cotton_prices_weekly.csv", len(cotton), "rows")
    print("Saved:", output_dir / "cpi_weekly.csv", len(cpi), "rows")
    print(
        "Cotton INR/kg range:",
        round(float(cotton["cotton_price_inr_per_kg"].min()), 2),
        "to",
        round(float(cotton["cotton_price_inr_per_kg"].max()), 2),
    )
    print(
        "CPI index range:",
        round(float(cpi["cpi_inflation_index"].min()), 2),
        "to",
        round(float(cpi["cpi_inflation_index"].max()), 2),
    )


if __name__ == "__main__":
    main()
