import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import "./MarketStyles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function fmtCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "🌤️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌡️";
}

function getUrgencyClass(urgency) {
  if (urgency === "critical") return "urgency-critical";
  if (urgency === "high") return "urgency-high";
  return "urgency-medium";
}

function getDemandClass(level) {
  if (level === "high") return "demand-high";
  if (level === "medium") return "demand-medium";
  return "demand-low";
}

function PanelLoading() {
  return <div className="market-panel-loading">Loading live market data...</div>;
}

function PanelError({ msg }) {
  return <div className="market-panel-error">Could not load data — {msg}. Is the backend running?</div>;
}

export default function MarketIntelligence({ profile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch(`/api/market/intelligence?cluster_id=${profile.clusterId}`);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile.clusterId]);

  useEffect(() => {
    loadData();
    // Refresh every 30 minutes
    const interval = setInterval(loadData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) return <PanelLoading />;
  if (error) return <PanelError msg={error} />;

  const { weather, prices, festivals, insights, location, state } = data;

  return (
    <div className="market-intelligence-container">
      {/* Header */}
      <div className="market-header">
        <div>
          <h2 className="market-title">Market Intelligence</h2>
          <p className="market-subtitle">
            {location}, {state} · Live data · Updated {data.updated}
          </p>
        </div>
        <button className="market-refresh-btn" onClick={loadData}>
          ↻ Refresh
        </button>
      </div>

      {/* AI Insights Banner */}
      {insights && (
        <div className="market-insights-banner">
          <div className="insights-icon">🤖</div>
          <div className="insights-content">
            <div className="insights-label">AI Market Summary</div>
            <p className="insights-text">{insights}</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="market-grid">
        {/* Weather Card */}
        {weather && (
          <div className="market-card weather-card">
            <div className="card-header">
              <div>
                <div className="card-title">Weather</div>
                <div className="card-subtitle">{weather.location}, {weather.state}</div>
              </div>
              <div className="weather-source-badge">{weather.source}</div>
            </div>
            <div className="weather-main">
              <div className="weather-icon-large">{getWeatherIcon(weather.weather_code)}</div>
              <div className="weather-temp">{weather.temperature}°C</div>
            </div>
            <div className="weather-details">
              <div className="weather-detail-item">
                <span className="detail-label">Wind</span>
                <span className="detail-value">{weather.wind_speed} km/h</span>
              </div>
              <div className="weather-detail-item">
                <span className="detail-label">Rain Chance</span>
                <span className="detail-value">{weather.precipitation_probability}%</span>
              </div>
            </div>
            <div className={`dyeing-condition ${weather.dyeing_condition.toLowerCase()}`}>
              <div className="dyeing-label">Dyeing Conditions: {weather.dyeing_condition}</div>
              <div className="dyeing-advice">{weather.dyeing_advice}</div>
            </div>
            {weather.heat_advice && (
              <div className="heat-advice">🌡️ {weather.heat_advice}</div>
            )}
            {weather.forecast && weather.forecast.length > 0 && (
              <div className="weather-forecast">
                <div className="forecast-label">7-Day Forecast</div>
                <div className="forecast-days">
                  {weather.forecast.map((day, i) => (
                    <div key={i} className="forecast-day">
                      <div className="forecast-date">{fmtDate(day.date)}</div>
                      <div className="forecast-temps">
                        <span className="temp-max">{day.temp_max}°</span>
                        <span className="temp-min">{day.temp_min}°</span>
                      </div>
                      <div className="forecast-precip">
                        {day.precipitation > 0 ? `🌧️ ${day.precipitation}mm` : "☀️"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Material Prices Card */}
        {prices && prices.length > 0 && (
          <div className="market-card prices-card">
            <div className="card-header">
              <div>
                <div className="card-title">Raw Material Prices</div>
                <div className="card-subtitle">{prices[0]?.market} · Source: {prices[0]?.source}</div>
              </div>
              <div className="price-source-badge">AGMARKNET</div>
            </div>
            <div className="prices-list">
              {prices.map((price, i) => (
                <div key={i} className="price-item">
                  <div className="price-header">
                    <div className="price-commodity">{price.commodity}</div>
                    <div className={`price-change ${price.pct_change_vs_7day >= 0 ? "price-up" : "price-down"}`}>
                      {price.pct_change_vs_7day >= 0 ? "📈" : "📉"} {price.pct_change_vs_7day >= 0 ? "+" : ""}{price.pct_change_vs_7day}%
                    </div>
                  </div>
                  <div className="price-value">
                    {fmtCurrency(price.current_price)}
                    <span className="price-unit">/{price.unit}</span>
                  </div>
                  <div className="price-range">
                    Today's range: {fmtCurrency(price.today_low)} - {fmtCurrency(price.today_high)}
                  </div>
                  <div className="price-avg">
                    7-day avg: {fmtCurrency(price.seven_day_average)}
                  </div>
                  {/* Mini price chart */}
                  {price.price_history && price.price_history.length > 0 && (
                    <div className="price-chart-container">
                      <ResponsiveContainer width="100%" height={40}>
                        <LineChart data={price.price_history}>
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke={price.pct_change_vs_7day >= 0 ? "#16a34a" : "#dc2626"}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Festival Calendar Card */}
        {festivals && festivals.length > 0 && (
          <div className="market-card festivals-card">
            <div className="card-header">
              <div>
                <div className="card-title">Festival Demand Calendar</div>
                <div className="card-subtitle">Upcoming festivals & demand predictions</div>
              </div>
              <div className="festival-badge">{festivals.length} upcoming</div>
            </div>
            <div className="festivals-list">
              {festivals.map((festival, i) => (
                <div key={i} className={`festival-item ${getUrgencyClass(festival.urgency)}`}>
                  <div className="festival-header">
                    <div className="festival-name">🎉 {festival.name}</div>
                    <div className={`festival-days ${getUrgencyClass(festival.urgency)}`}>
                      {festival.days_until} days
                    </div>
                  </div>
                  <div className="festival-date">{fmtDate(festival.date)}</div>
                  <div className={`festival-demand ${getDemandClass(festival.demand_level)}`}>
                    Demand: {festival.demand_level.toUpperCase()} ({festival.demand_multiplier}x)
                  </div>
                  <div className="festival-products">
                    <span className="products-label">Products:</span> {festival.typical_products.join(", ").replace(/_/g, " ")}
                  </div>
                  <div className="festival-colors">
                    <span className="colors-label">Colors:</span> {festival.typical_colors.join(", ")}
                  </div>
                  <div className="festival-action">{festival.action}</div>
                  <div className="festival-relevance">
                    {festival.relevance} {festival.is_relevant ? "✓" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Sources Footer */}
      <div className="market-footer">
        <div className="data-sources">
          <span className="source-label">Data Sources:</span>
          <span className="source-item">🌤️ Open-Meteo (Live Weather)</span>
          <span className="source-item">📦 AGMARKNET, Govt of India (Prices)</span>
          <span className="source-item">🎉 Festival Calendar (Static)</span>
          <span className="source-item">🤖 AI Insights (Dynamic)</span>
        </div>
      </div>
    </div>
  );
}