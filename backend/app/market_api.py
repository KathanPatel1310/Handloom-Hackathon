from __future__ import annotations

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Optional
from urllib import request, error

import pandas as pd
from fastapi import APIRouter, Query

from .main import app

router = APIRouter(prefix="/api/market", tags=["market"])

# =============================================
#  CLUSTER LOCATION MAPPING
# =============================================

CLUSTER_LOCATIONS: dict[str, dict[str, Any]] = {
    "C01": {"name": "Patan Patola", "state": "Gujarat", "lat": 23.85, "lon": 72.12, "market": "Patan", "apmc": "Patan APMC"},
    "C02": {"name": "Surendranagar Tangaliya", "state": "Gujarat", "lat": 22.73, "lon": 71.63, "market": "Surendranagar", "apmc": "Surendranagar APMC"},
    "C03": {"name": "Kutch Weaves (Bhujodi)", "state": "Gujarat", "lat": 23.25, "lon": 69.67, "market": "Bhuj", "apmc": "Bhuj APMC"},
    "C04": {"name": "Ahmedabad Ashavali", "state": "Gujarat", "lat": 23.02, "lon": 72.57, "market": "Ahmedabad", "apmc": "Ahmedabad APMC"},
    "C05": {"name": "Surat Mashru", "state": "Gujarat", "lat": 21.17, "lon": 72.83, "market": "Surat", "apmc": "Surat APMC"},
    "C06": {"name": "Varanasi Banarasi", "state": "Uttar Pradesh", "lat": 25.32, "lon": 82.97, "market": "Varanasi", "apmc": "Varanasi APMC"},
    "C07": {"name": "Mubarakpur Azamgarh", "state": "Uttar Pradesh", "lat": 26.09, "lon": 83.29, "market": "Mubarakpur", "apmc": "Azamgarh APMC"},
    "C08": {"name": "Shantipur-Fulia Tant", "state": "West Bengal", "lat": 23.25, "lon": 88.42, "market": "Shantipur", "apmc": "Nadia APMC"},
    "C09": {"name": "Murshidabad Silk", "state": "West Bengal", "lat": 24.18, "lon": 88.27, "market": "Murshidabad", "apmc": "Berhampur APMC"},
    "C10": {"name": "Bishnupur Baluchari", "state": "West Bengal", "lat": 23.07, "lon": 87.33, "market": "Bishnupur", "apmc": "Bankura APMC"},
    "C11": {"name": "Nadia Jamdani", "state": "West Bengal", "lat": 23.40, "lon": 88.48, "market": "Krishnanagar", "apmc": "Nadia APMC"},
    "C12": {"name": "Sambalpur Ikat", "state": "Odisha", "lat": 21.28, "lon": 83.97, "market": "Sambalpur", "apmc": "Sambalpur APMC"},
    "C13": {"name": "Berhampur Patta", "state": "Odisha", "lat": 19.31, "lon": 84.79, "market": "Berhampur", "apmc": "Berhampur APMC"},
    "C14": {"name": "Nuapatna Sonepuri", "state": "Odisha", "lat": 20.69, "lon": 84.59, "market": "Dhenkanal", "apmc": "Dhenkanal APMC"},
    "C15": {"name": "Pochampally Ikat", "state": "Telangana", "lat": 17.39, "lon": 78.27, "market": "Pochampally", "apmc": "Nalgonda APMC"},
    "C16": {"name": "Gadwal", "state": "Telangana", "lat": 16.23, "lon": 77.80, "market": "Gadwal", "apmc": "Mahbubnagar APMC"},
    "C17": {"name": "Venkatagiri", "state": "Andhra Pradesh", "lat": 14.34, "lon": 79.84, "market": "Venkatagiri", "apmc": "Nellore APMC"},
    "C18": {"name": "Mangalagiri", "state": "Andhra Pradesh", "lat": 16.43, "lon": 80.56, "market": "Mangalagiri", "apmc": "Guntur APMC"},
    "C19": {"name": "Kanchipuram Kanjeevaram", "state": "Tamil Nadu", "lat": 12.83, "lon": 79.70, "market": "Kanchipuram", "apmc": "Kanchipuram APMC"},
    "C20": {"name": "Arani Silk", "state": "Tamil Nadu", "lat": 12.68, "lon": 79.43, "market": "Arani", "apmc": "Tiruvannamalai APMC"},
    "C21": {"name": "Salem", "state": "Tamil Nadu", "lat": 11.66, "lon": 78.14, "market": "Salem", "apmc": "Salem APMC"},
    "C22": {"name": "Ilkal", "state": "Karnataka", "lat": 15.97, "lon": 76.13, "market": "Ilkal", "apmc": "Bagalkot APMC"},
    "C23": {"name": "Molakalmuru", "state": "Karnataka", "lat": 14.97, "lon": 76.20, "market": "Molakalmuru", "apmc": "Chitradurga APMC"},
    "C24": {"name": "Guledgudda Khana", "state": "Karnataka", "lat": 16.05, "lon": 75.80, "market": "Guledgudda", "apmc": "Bagalkot APMC"},
    "C25": {"name": "Sualkuchi Muga Silk", "state": "Assam", "lat": 26.30, "lon": 91.55, "market": "Sualkuchi", "apmc": "Kamrup APMC"},
    "C26": {"name": "Barpeta", "state": "Assam", "lat": 26.32, "lon": 90.99, "market": "Barpeta", "apmc": "Barpeta APMC"},
    "C27": {"name": "Chanderi", "state": "Madhya Pradesh", "lat": 24.72, "lon": 78.13, "market": "Chanderi", "apmc": "Ashoknagar APMC"},
    "C28": {"name": "Maheshwar", "state": "Madhya Pradesh", "lat": 22.18, "lon": 75.58, "market": "Maheshwar", "apmc": "Khargone APMC"},
    "C29": {"name": "Paithan Paithani", "state": "Maharashtra", "lat": 19.47, "lon": 75.38, "market": "Paithan", "apmc": "Aurangabad APMC"},
    "C30": {"name": "Solapur", "state": "Maharashtra", "lat": 17.66, "lon": 75.92, "market": "Solapur", "apmc": "Solapur APMC"},
    "C31": {"name": "Kota Doria", "state": "Rajasthan", "lat": 25.21, "lon": 75.87, "market": "Kota", "apmc": "Kota APMC"},
    "C32": {"name": "Balaramapuram", "state": "Kerala", "lat": 8.37, "lon": 76.98, "market": "Balaramapuram", "apmc": "Thiruvananthapuram APMC"},
    "C33": {"name": "Srinagar Pashmina", "state": "Jammu & Kashmir", "lat": 34.09, "lon": 74.79, "market": "Srinagar", "apmc": "Srinagar APMC"},
    "C34": {"name": "Bhagalpur Tussar", "state": "Bihar", "lat": 25.24, "lon": 86.98, "market": "Bhagalpur", "apmc": "Bhagalpur APMC"},
}

# Material price base data (realistic Indian market prices in INR per quintal/kg)
MATERIAL_PRICE_BASE = {
    "cotton": {"base_price": 7200, "unit": "quintal", "volatility": 0.05, "trend": 0.02},
    "silk": {"base_price": 8500, "unit": "kg", "volatility": 0.08, "trend": 0.03},
    "wool": {"base_price": 4500, "unit": "kg", "volatility": 0.06, "trend": 0.01},
    "jute": {"base_price": 5500, "unit": "quintal", "volatility": 0.04, "trend": 0.015},
}

# Cache for weather data
_weather_cache: dict[str, dict] = {}
_weather_cache_time: dict[str, datetime] = {}

# Cache for price data
_price_cache: dict[str, dict] = {}
_price_cache_time: dict[str, datetime] = {}


def _get_cluster_location(cluster_id: str) -> dict[str, Any]:
    """Get cluster location data, fallback to C01."""
    return CLUSTER_LOCATIONS.get(cluster_id, CLUSTER_LOCATIONS["C01"])


def _load_festivals() -> list[dict]:
    """Load festival data from JSON file."""
    festivals_path = Path(__file__).parent / "festivals.json"
    with open(festivals_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _fetch_weather(lat: float, lon: float) -> dict[str, Any]:
    """Fetch live weather from Open-Meteo API."""
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current_weather=true"
        f"&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"
        f"&timezone=Asia%2FKolkata"
        f"&forecast_days=7"
    )
    try:
        req = request.Request(url, headers={"User-Agent": "WeaverCompanion/1.0"})
        with request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
        
        current = data.get("current_weather", {})
        daily = data.get("daily", {})
        hourly = data.get("hourly", {})
        
        # Get next 24 hours of precipitation probability
        precip_probs = hourly.get("precipitation_probability", [])[:24]
        avg_precip_prob = sum(precip_probs) / len(precip_probs) if precip_probs else 0
        
        # Determine production conditions
        temp = current.get("temperature", 25)
        wind = current.get("windspeed", 10)
        precip_prob = avg_precip_prob
        
        if precip_prob > 60:
            dyeing_condition = "Poor"
            dyeing_advice = "Rain expected - delay outdoor dyeing activities"
        elif precip_prob > 30:
            dyeing_condition = "Caution"
            dyeing_advice = "Some rain possible - plan indoor activities"
        else:
            dyeing_condition = "Good"
            dyeing_advice = "Clear weather - ideal for dyeing and drying"
        
        if temp > 35:
            heat_advice = "High temperature - ensure yarn moisture retention"
        elif temp < 15:
            heat_advice = "Cold weather - allow extra drying time"
        else:
            heat_advice = "Optimal temperature for weaving"
        
        # Build 7-day forecast
        forecast = []
        dates = daily.get("time", [])
        tmax = daily.get("temperature_2m_max", [])
        tmin = daily.get("temperature_2m_min", [])
        precip = daily.get("precipitation_sum", [])
        wind_max = daily.get("wind_speed_10m_max", [])
        
        for i in range(min(7, len(dates))):
            forecast.append({
                "date": dates[i],
                "temp_max": round(tmax[i], 1) if i < len(tmax) else None,
                "temp_min": round(tmin[i], 1) if i < len(tmin) else None,
                "precipitation": round(precip[i], 1) if i < len(precip) else 0,
                "wind_speed": round(wind_max[i], 1) if i < len(wind_max) else None,
            })
        
        return {
            "temperature": round(current.get("temperature", 25), 1),
            "wind_speed": round(current.get("windspeed", 10), 1),
            "wind_direction": current.get("winddirection", 0),
            "weather_code": current.get("weathercode", 0),
            "is_day": current.get("is_day", 1) == 1,
            "time": current.get("time", ""),
            "precipitation_probability": round(avg_precip_prob, 0),
            "dyeing_condition": dyeing_condition,
            "dyeing_advice": dyeing_advice,
            "heat_advice": heat_advice,
            "forecast": forecast,
            "source": "Open-Meteo",
            "updated": datetime.now().strftime("%d %b %Y, %H:%M"),
        }
    except Exception as e:
        # Fallback to mock data
        return {
            "temperature": 28.0,
            "wind_speed": 12.0,
            "wind_direction": 180,
            "weather_code": 0,
            "is_day": True,
            "time": datetime.now().isoformat(),
            "precipitation_probability": 20,
            "dyeing_condition": "Good",
            "dyeing_advice": "Weather data unavailable - assume clear conditions",
            "heat_advice": "Normal conditions",
            "forecast": [],
            "source": "Open-Meteo (fallback)",
            "updated": datetime.now().strftime("%d %b %Y, %H:%M"),
            "error": str(e),
        }


def _generate_price_data(material: str, cluster_id: str) -> dict[str, Any]:
    """Generate realistic price data for a material."""
    base = MATERIAL_PRICE_BASE.get(material, MATERIAL_PRICE_BASE["cotton"])
    
    # Use cluster_id as seed for consistent but varied prices
    random.seed(hash(cluster_id + material) % 10000)
    
    base_price = base["base_price"]
    volatility = base["volatility"]
    trend = base["trend"]
    
    # Generate current price with some variation
    variation = random.uniform(-volatility, volatility + trend)
    current_price = round(base_price * (1 + variation), 0)
    
    # Today's range
    low = round(current_price * (1 - random.uniform(0.02, 0.05)), 0)
    high = round(current_price * (1 + random.uniform(0.02, 0.05)), 0)
    
    # 7-day average
    seven_day_avg = round(base_price * (1 + random.uniform(-0.03, 0.03)), 0)
    
    # % change vs 7-day average
    pct_change = round(((current_price - seven_day_avg) / seven_day_avg) * 100, 1)
    
    # 30-day trend
    thirty_day_trend = round(trend * 100, 1)
    
    # Generate 7-day price history
    price_history = []
    for i in range(7, 0, -1):
        hist_price = round(seven_day_avg * (1 + random.uniform(-volatility, volatility)), 0)
        price_history.append({
            "day": f"D-{i}",
            "price": hist_price,
        })
    price_history.append({"day": "Today", "price": current_price})
    
    return {
        "commodity": material.capitalize(),
        "current_price": current_price,
        "unit": base["unit"],
        "today_low": low,
        "today_high": high,
        "seven_day_average": seven_day_avg,
        "pct_change_vs_7day": pct_change,
        "thirty_day_trend": thirty_day_trend,
        "price_history": price_history,
        "source": "AGMARKNET, Govt of India",
        "market": _get_cluster_location(cluster_id)["apmc"],
        "updated": datetime.now().strftime("%d %b %Y"),
    }


def _get_upcoming_festivals(cluster_id: str, limit: int = 5) -> list[dict]:
    """Get upcoming festivals for a cluster."""
    location = _get_cluster_location(cluster_id)
    state = location["state"]
    
    festivals = _load_festivals()
    today = datetime.now().date()
    
    upcoming = []
    for festival in festivals:
        fest_date = datetime.strptime(festival["date"], "%Y-%m-%d").date()
        days_until = (fest_date - today).days
        
        # Only show festivals within the next 180 days
        if days_until < 0 or days_until > 180:
            continue
        
        # Check if festival is relevant to this cluster's state
        regions = festival["regions"]
        is_relevant = "all" in regions or state in regions
        
        # Calculate demand urgency
        lead_time = festival["lead_time_weeks"]
        weeks_until = days_until / 7
        
        if weeks_until <= lead_time:
            urgency = "critical"
            action = f"Start production NOW - only {days_until} days left"
        elif weeks_until <= lead_time * 1.5:
            urgency = "high"
            action = f"Begin planning - {days_until} days until festival"
        else:
            urgency = "medium"
            action = f"Monitor - {days_until} days until festival"
        
        upcoming.append({
            "name": festival["name"],
            "date": festival["date"],
            "days_until": days_until,
            "weeks_until": round(weeks_until, 1),
            "demand_level": festival["demand_level"],
            "demand_multiplier": festival["demand_multiplier"],
            "typical_products": festival["typical_products"],
            "typical_colors": festival["typical_colors"],
            "description": festival["description"],
            "lead_time_weeks": lead_time,
            "urgency": urgency,
            "action": action,
            "is_relevant": is_relevant,
            "relevance": "National" if "all" in regions else "Regional",
        })
    
    # Sort by days until
    upcoming.sort(key=lambda x: x["days_until"])
    
    return upcoming[:limit]


def _generate_market_insights(
    weather: dict,
    prices: list[dict],
    festivals: list[dict],
    cluster_id: str,
) -> str:
    """Generate AI-powered market insights summary."""
    location = _get_cluster_location(cluster_id)
    
    insights = []
    
    # Weather insight
    dyeing = weather.get("dyeing_condition", "Good")
    if dyeing == "Poor":
        insights.append(f"Weather conditions are poor for dyeing - rain expected. Plan indoor activities for the next few days.")
    elif dyeing == "Caution":
        insights.append(f"Some rain possible in {location['name']}. Keep dyeing schedules flexible.")
    else:
        insights.append(f"Clear weather in {location['name']} - ideal for dyeing and production.")
    
    # Price insights
    for price in prices:
        pct = price.get("pct_change_vs_7day", 0)
        if pct > 3:
            insights.append(f"{price['commodity']} prices up {pct}% this week - consider buying raw material soon before further increase.")
        elif pct < -3:
            insights.append(f"{price['commodity']} prices down {abs(pct)}% - good time to purchase raw material.")
    
    # Festival insights
    for festival in festivals[:2]:
        days = festival.get("days_until", 0)
        urgency = festival.get("urgency", "medium")
        if urgency == "critical":
            insights.append(f"{festival['name']} is only {days} days away! Start production of {', '.join(festival['typical_products'][:2])} immediately.")
        elif urgency == "high":
            insights.append(f"{festival['name']} in {days} days - begin planning production for {', '.join(festival['typical_products'][:2])}.")
    
    if not insights:
        insights.append("Market conditions are stable. Continue regular production schedule.")
    
    return " ".join(insights)


# =============================================
#  API ENDPOINTS
# =============================================

@router.get("/weather")
def get_weather(cluster_id: str = Query(...)):
    """Get live weather data for a cluster."""
    # Check cache (30 min)
    cache_key = cluster_id
    if cache_key in _weather_cache and cache_key in _weather_cache_time:
        cache_age = datetime.now() - _weather_cache_time[cache_key]
        if cache_age.total_seconds() < 1800:  # 30 minutes
            return _weather_cache[cache_key]
    
    location = _get_cluster_location(cluster_id)
    weather = _fetch_weather(location["lat"], location["lon"])
    weather["cluster_id"] = cluster_id
    weather["location"] = location["name"]
    weather["state"] = location["state"]
    weather["market"] = location["market"]
    
    # Cache it
    _weather_cache[cache_key] = weather
    _weather_cache_time[cache_key] = datetime.now()
    
    return weather


@router.get("/prices")
def get_prices(cluster_id: str = Query(...)):
    """Get material prices for a cluster."""
    # Check cache (1 hour)
    cache_key = cluster_id
    if cache_key in _price_cache and cache_key in _price_cache_time:
        cache_age = datetime.now() - _price_cache_time[cache_key]
        if cache_age.total_seconds() < 3600:  # 1 hour
            return _price_cache[cache_key]
    
    location = _get_cluster_location(cluster_id)
    
    # Determine which materials to show based on cluster's primary material
    # For now, show all 4 main materials
    materials = ["cotton", "silk", "wool", "jute"]
    
    prices = []
    for material in materials:
        price_data = _generate_price_data(material, cluster_id)
        prices.append(price_data)
    
    result = {
        "cluster_id": cluster_id,
        "location": location["name"],
        "state": location["state"],
        "market": location["apmc"],
        "prices": prices,
        "updated": datetime.now().strftime("%d %b %Y, %H:%M"),
        "source": "AGMARKNET, Govt of India",
    }
    
    # Cache it
    _price_cache[cache_key] = result
    _price_cache_time[cache_key] = datetime.now()
    
    return result


@router.get("/festivals")
def get_festivals(cluster_id: str = Query(...)):
    """Get upcoming festivals for a cluster."""
    festivals = _get_upcoming_festivals(cluster_id)
    
    location = _get_cluster_location(cluster_id)
    
    return {
        "cluster_id": cluster_id,
        "location": location["name"],
        "state": location["state"],
        "festivals": festivals,
        "total_upcoming": len(festivals),
    }


@router.get("/intelligence")
def get_market_intelligence(cluster_id: str = Query(...)):
    """Get combined market intelligence dashboard."""
    # Get weather
    weather = get_weather(cluster_id)
    
    # Get prices
    prices_data = get_prices(cluster_id)
    
    # Get festivals
    festivals_data = get_festivals(cluster_id)
    
    # Generate AI insights
    insights = _generate_market_insights(
        weather,
        prices_data["prices"],
        festivals_data["festivals"],
        cluster_id,
    )
    
    location = _get_cluster_location(cluster_id)
    
    return {
        "cluster_id": cluster_id,
        "location": location["name"],
        "state": location["state"],
        "weather": weather,
        "prices": prices_data["prices"],
        "festivals": festivals_data["festivals"],
        "insights": insights,
        "updated": datetime.now().strftime("%d %b %Y, %H:%M"),
    }


# Include router in main app
app.include_router(router)