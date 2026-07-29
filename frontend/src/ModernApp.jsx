import React, { useState, useEffect, useCallback } from "react";
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
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import HisabApp from "./HisabApp";
import "./HisabStyles.css";
import "./ModernStyles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

// Default cluster used on load; will be replaced by the one selected at onboarding or first in list.
const DEFAULT_CLUSTER = "C01";

// =============================================
//  HELPERS
// =============================================

function fmt(n) {
  if (n == null) return "—";
  if (Math.abs(n) >= 100000) return `Rs ${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `Rs ${Math.round(n).toLocaleString("en-IN")}`;
  return `Rs ${Math.round(n)}`;
}

function fmtK(n) {
  if (n == null) return "—";
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${Math.round(n)}`;
}

function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// =============================================
//  MODULES CONFIG
// =============================================

const MODULES = [
  { id: "overview",   label: "Overview",           group: "MAIN" },
  { id: "forecast",   label: "Demand Forecast",    group: "MAIN" },
  { id: "finance",    label: "Finance & Cashflow", group: "MAIN" },
  { id: "planner",    label: "Production Planner", group: "MAIN" },
  { id: "orders",     label: "Order History",      group: "MAIN" },
  { id: "cluster",    label: "Cluster Analytics",  group: "MAIN" },
  { id: "assistant",  label: "AI Assistant",       group: "MAIN" },
  { id: "hisab",      label: "My Hisab",           group: "MAIN" },
  { id: "profile",    label: "Profile & Settings", group: "SETTINGS" },
];

// =============================================
//  ONBOARDING
// =============================================

function Onboarding({ onComplete }) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [clusters, setClusters] = useState([]);
  const [clusterId, setClusterId] = useState(DEFAULT_CLUSTER);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/clusters")
      .then((data) => {
        setClusters(data);
        if (data.length) setClusterId(data[0].cluster_id);
      })
      .catch(() => setClusters([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name to continue."); return; }
    const cluster = clusters.find((c) => c.cluster_id === clusterId);
    onComplete({ 
      name: name.trim(), 
      language, 
      clusterId, 
      clusterName: cluster?.cluster_name ?? clusterId,
      productSpecialty: cluster?.product_specialty ?? "saree"
    });
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-panel">
        <div className="onboarding-header">
          <span className="onboarding-eyebrow">Handloom Hackathon · PS 4.2</span>
          <h1 className="onboarding-title">AI Weaver Companion</h1>
        </div>
        <div className="onboarding-body">
          <p className="onboarding-subtitle">
            Enter your details to access your personalised demand forecast, cashflow
            analysis, and weekly production plan.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rameshbhai Patel"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
              />
              {error && <p className="form-error">{error}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Your Weaving Cluster</label>
              {loading ? (
                <div className="form-input" style={{ color: "var(--color-ink-400)" }}>Loading clusters...</div>
              ) : (
                <select className="form-select" value={clusterId} onChange={(e) => setClusterId(e.target.value)}>
                  {clusters.map((c) => (
                    <option key={c.cluster_id} value={c.cluster_id}>
                      {c.cluster_name} ({c.state})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Language</label>
              <select className="form-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="gu">Gujarati</option>
              </select>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              Open Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// =============================================
//  NAV ICONS (SVG, no emojis)
// =============================================

function NavIcon({ id }) {
  const s = { className: "nav-item-icon", viewBox: "0 0 16 16", fill: "none" };
  switch (id) {
    case "overview":    return <svg {...s} fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="0.5"/><rect x="9" y="1" width="6" height="6" rx="0.5"/><rect x="1" y="9" width="6" height="6" rx="0.5"/><rect x="9" y="9" width="6" height="6" rx="0.5"/></svg>;
    case "forecast":    return <svg {...s} stroke="currentColor" strokeWidth="1.5"><polyline points="1,12 5,7 8,9 12,4 15,6"/><line x1="15" y1="6" x2="15" y2="14"/><line x1="1" y1="14" x2="15" y2="14"/></svg>;
    case "finance":     return <svg {...s} stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 4v1.5M8 10.5V12M6 7.5c0-1.1.9-2 2-2s2 .9 2 2c0 1.1-1.2 2-2 2s-2 .9-2 2"/></svg>;
    case "orders":      return <svg {...s} stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12"/><line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="11" y2="9"/><line x1="5" y1="12" x2="8" y2="12"/></svg>;
    case "planner":     return <svg {...s} stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12M2 8h12M2 13h12M5 3v10M11 3v10"/></svg>;
    case "cluster":     return <svg {...s} stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="1.5" fill="currentColor" /><circle cx="3" cy="4" r="1.5" fill="currentColor" /><circle cx="13" cy="12" r="1.5" fill="currentColor" /><line x1="4.5" y1="5" x2="6.5" y2="6.5" /><line x1="9.5" y1="9.5" x2="11.5" y2="11" /></svg>;
    case "assistant":   return <svg {...s} stroke="currentColor" strokeWidth="1.5"><path d="M2 5.5v3c0 1 .6 1.8 1.4 2.1l4.1 1.7c.3.1.7.1 1 0l4.1-1.7c.8-.3 1.4-1.1 1.4-2.1v-3M8 2l-6 3.5M8 2l6 3.5M8 2v7.5" /></svg>;
    case "hisab":       return <svg {...s} stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="12" height="10" rx="1"/><line x1="5" y1="7" x2="11" y2="7"/><line x1="5" y1="10" x2="9" y2="10"/></svg>;
    case "profile":     return <svg {...s} stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>;
    default:            return null;
  }
}

// =============================================
//  SIDEBAR
// =============================================

function Sidebar({ activeModule, onNavigate, sidebarOpen }) {
  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-brand">
        <span className="brand-eyebrow">PS 4.2 · Handloom AI</span>
        <span className="brand-name">Weaver Companion</span>
      </div>
      <nav className="sidebar-nav">
        {["MAIN", "SETTINGS"].map((grp) => (
          <React.Fragment key={grp}>
            <div className="nav-section-label">{grp}</div>
            {MODULES.filter((m) => m.group === grp).map((mod) => (
              <div
                key={mod.id}
                className={`nav-item ${activeModule === mod.id ? "active" : ""}`}
                onClick={() => onNavigate(mod.id)}
              >
                <NavIcon id={mod.id} />
                {mod.label}
              </div>
            ))}
          </React.Fragment>
        ))}
      </nav>
    </aside>
  );
}

// =============================================
//  TOPBAR
// =============================================

function Topbar({ profile, activeModule, onHamburger, onLogout }) {
  const mod = MODULES.find((m) => m.id === activeModule);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger" onClick={onHamburger} aria-label="Toggle menu">&#9776;</button>
        <span className="topbar-breadcrumb">
          Weaver Companion &nbsp;/&nbsp; <strong>{mod?.label}</strong>
        </span>
      </div>
      <div className="topbar-right">
        <span className="topbar-badge">Live · 20 Jul 2026</span>
        <div className="profile-pill" onClick={onLogout} title="Click to sign out">
          <div className="profile-avatar">{profile.name.charAt(0).toUpperCase()}</div>
          <div className="profile-details">
            <span className="profile-name">{profile.name}</span>
            <span className="profile-sub">{profile.clusterName} · {profile.language.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// =============================================
//  CUSTOM TOOLTIP
// =============================================

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--color-ink-900)", border:"1px solid var(--color-ink-800)", padding:"10px 14px", fontSize:"0.8rem", color:"var(--color-cotton-100)" }}>
      <p style={{ fontWeight:700, marginBottom:6, color:"var(--color-cotton-300)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color ?? "#fff" }}>
          {p.name}: {typeof p.value === "number" && Math.abs(p.value) > 500 ? fmtK(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// =============================================
//  LOADING / ERROR STATES
// =============================================

function PanelLoading() {
  return <div className="panel-loading">Loading data from backend...</div>;
}

function PanelError({ msg }) {
  return <div className="panel-error">Could not load data — {msg}. Is the backend running at port 8000?</div>;
}

// =============================================
//  OVERVIEW PAGE
// =============================================

function OverviewPage({ clusterId }) {
  const [clusterData, setClusterData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [cashflowData, setCashflowData] = useState(null);
  const [loadingState, setLoadingState] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = useCallback(async () => {
    setLoadingState("loading");
    try {
      const [cd, cf] = await Promise.all([
        apiFetch(`/api/clusters/${clusterId}`),
        apiFetch(`/api/admin/cashflow?cluster_id=${clusterId}`),
      ]);
      setClusterData(cd);
      setCashflowData(cf);

      // Fetch forecast: last 8 historical actual vs predicted + 4 future weeks
      const fc = await apiFetch(`/api/admin/forecast?cluster_id=${clusterId}&product_category=${cd.product_specialty}`);
      const last8History = (fc.history ?? []).slice(-8).map((r) => ({
        week: fmtDate(r.week_start_date),
        actual: Math.round(r.actual),
        predicted: Math.round(r.predicted),
        lower_90: Math.round(r.lower_90),
        upper_90: Math.round(r.upper_90),
      }));
      const futureRows = (fc.future ?? []).slice(0, 4).map((r) => ({
        week: fmtDate(r.week_start_date) + " *",
        predicted: Math.round(r.predicted),
        lower_90: Math.round(r.lower_90),
        upper_90: Math.round(r.upper_90),
      }));
      setForecastData([...last8History, ...futureRows]);
      setLoadingState("done");
    } catch (e) {
      setErrorMsg(e.message);
      setLoadingState("error");
    }
  }, [clusterId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loadingState === "loading") return <PanelLoading />;
  if (loadingState === "error") return <PanelError msg={errorMsg} />;

  const brief = clusterData?.weaver_brief ?? {};
  const finance = brief?.finance_summary ?? {};
  const cashStatus = brief?.credit_status ?? "green";
  const cashStatusLabel = cashStatus === "green" ? "Healthy" : cashStatus === "yellow" ? "Caution" : "At Risk";
  const cashStatusClass = cashStatus === "green" ? "accent-leaf" : cashStatus === "yellow" ? "accent-turmeric" : "accent-madder";

  // cashflow chart: combine history + projection using correct API keys
  const cashRows = [
    ...(cashflowData?.history_rows ?? []).slice(-5).map((r) => ({
      week: fmtDate(r.week_start_date),
      inflow: Math.round(r.cash_in_inr ?? r.projected_cash_in_inr ?? 0),
      netflow: Math.round(r.net_cashflow_inr ?? r.projected_net_cashflow_inr ?? 0),
    })),
    ...(cashflowData?.projection_rows ?? []).slice(0, 4).map((r) => ({
      week: fmtDate(r.week_start_date) + "*",
      inflow: Math.round(r.projected_cash_in_inr ?? 0),
      netflow: Math.round(r.projected_net_cashflow_inr ?? 0),
    })),
  ];

  return (
    <>
      {/* Stat Strip — 3 cells */}
      <div className="stat-strip stat-strip-3">
        <div className="stat-cell accent-indigo">
          <div className="stat-label">Recommended Units</div>
          <div className="stat-value">{brief?.recommended_units ?? "—"}</div>
          <div className="stat-delta">{brief?.product_specialty ?? clusterData?.product_specialty} · {brief?.demand_level ?? "—"} demand</div>
        </div>
        <div className={`stat-cell ${cashStatusClass}`}>
          <div className="stat-label">Cashflow Status</div>
          <div className="stat-value">{cashStatusLabel}</div>
          <div className="stat-delta">{brief?.plain_finance_advice?.slice(0, 60) ?? "—"}</div>
        </div>
        <div className="stat-cell accent-turmeric">
          <div className="stat-label">Estimated Revenue</div>
          <div className="stat-value">{fmt(finance?.gross_revenue_inr)}</div>
          <div className="stat-delta">Net margin: {finance?.profit_margin_pct != null ? `${finance.profit_margin_pct}%` : "—"}</div>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="chart-grid">
        {/* Demand Forecast */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <div>
              <div className="chart-panel-title">Demand Forecast</div>
              <div className="chart-panel-subtitle">Actual vs Ensemble · 90% confidence interval</div>
            </div>
            <span className="chart-panel-tag tag-indigo">XGBoost Ensemble</span>
          </div>
          <div className="chart-panel-body">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={forecastData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3e5e82" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#3e5e82" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,83,71,0.1)"/>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#8a7f74" }}/>
                <YAxis tick={{ fontSize: 11, fill: "#8a7f74" }}/>
                <Tooltip content={<ChartTooltip />}/>
                <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#5c5347" }}/>
                <Area type="monotone" dataKey="upper_90" stroke="none" fill="url(#ciGrad)" name="Upper 90%" legendType="none"/>
                <Area type="monotone" dataKey="lower_90" stroke="none" fill="var(--color-cotton-50)" name="Lower 90%" legendType="none"/>
                <Line type="monotone" dataKey="actual" stroke="var(--color-ink-800)" strokeWidth={2} dot={{ r: 2 }} name="Actual" connectNulls/>
                <Line type="monotone" dataKey="predicted" stroke="var(--color-indigo-500)" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} name="Forecast" connectNulls/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cashflow */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <div>
              <div className="chart-panel-title">Cashflow</div>
              <div className="chart-panel-subtitle">Cash in · Net (INR) · * = projected</div>
            </div>
            <span className="chart-panel-tag tag-turmeric">4-Week Proj.</span>
          </div>
          <div className="chart-panel-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cashRows} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,83,71,0.1)"/>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#8a7f74" }}/>
                <YAxis tick={{ fontSize: 11, fill: "#8a7f74" }} tickFormatter={fmtK}/>
                <Tooltip content={<ChartTooltip />}/>
                <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#5c5347" }}/>
                <ReferenceLine y={0} stroke="var(--color-madder-600)" strokeWidth={1}/>
                <Bar dataKey="inflow" fill="var(--color-leaf-600)" name="Cash In" radius={0}/>
                <Bar dataKey="netflow" fill="var(--color-indigo-500)" name="Net Cashflow" radius={0} opacity={0.85}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="table-panel">
        <div className="table-panel-header">
          <div className="chart-panel-title">Recent Orders — {clusterData?.cluster_name}</div>
          <span className="chart-panel-tag tag-indigo">Last {clusterData?.orders?.length ?? 0}</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Product</th>
              <th>Qty</th>
              <th className="col-hide-mobile">Buyer Type</th>
              <th className="col-hide-mobile">Delivery</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(clusterData?.orders ?? []).length === 0 && (
              <tr><td colSpan={6} style={{ textAlign:"center", color:"var(--color-ink-400)", padding:"20px" }}>No orders found for this cluster.</td></tr>
            )}
            {(clusterData?.orders ?? []).map((o) => (
              <tr key={o.order_id}>
                <td style={{ fontWeight:700, fontFamily:"monospace", color:"var(--color-indigo-700)", fontSize:"0.8rem" }}>{o.order_id}</td>
                <td>{o.product_category}</td>
                <td>{o.quantity}</td>
                <td className="col-hide-mobile" style={{ textTransform:"capitalize" }}>{o.buyer_type}</td>
                <td className="col-hide-mobile">{fmtDate(o.delivery_date) || "—"}</td>
                <td>
                  <span className={`status-badge ${o.status === "paid" ? "status-green" : "status-amber"}`}>
                    {o.status?.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// =============================================
//  FORECAST PAGE — Interactive Demand Engine
// =============================================

function ForecastPage({ clusterId, clusterName }) {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // product_category string
  const [rec, setRec] = useState(null);         // recommendation package
  const [chartData, setChartData] = useState([]);
  const [initLoading, setInitLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [initErr, setInitErr] = useState("");
  const [recErr, setRecErr] = useState("");

  // Step 1: On mount, load cluster to get available products
  useEffect(() => {
    setInitLoading(true);
    apiFetch(`/api/clusters/${clusterId}`)
      .then((cd) => {
        const prods = cd.available_products ?? [];
        setAvailableProducts(prods);
        if (prods.length > 0) setSelectedProduct(prods[0]);
      })
      .catch((e) => setInitErr(e.message))
      .finally(() => setInitLoading(false));
  }, [clusterId]);

  // Step 2: When product changes, fetch recommendation + forecast chart
  useEffect(() => {
    if (!selectedProduct) return;
    setRecLoading(true);
    setRecErr("");
    setRec(null);
    setChartData([]);

    // Map product_category to a product_key for the recommendation call
    const profilePayload = {
      profile: {
        name: "Weaver",
        cluster_id: clusterId,
        primary_product_key: categoryToKey(selectedProduct),
        selected_product_keys: [],
        loom_count: 1,
        weaver_count: 1,
        average_weekly_output: 8.0,
        language: "en",
      },
    };

    Promise.all([
      fetch(`${API_BASE}/api/weaver/recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      }).then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
      apiFetch(`/api/admin/forecast?cluster_id=${clusterId}&product_category=${selectedProduct}`),
    ])
      .then(([pkg, fc]) => {
        setRec(pkg);
        const history = (fc.history ?? []).slice(-10).map((r) => ({
          week: fmtDate(r.week_start_date),
          actual: Math.round(r.actual),
          predicted: Math.round(r.predicted),
          lower_90: Math.round(r.lower_90),
          upper_90: Math.round(r.upper_90),
        }));
        const future = (fc.future ?? []).slice(0, 4).map((r) => ({
          week: fmtDate(r.week_start_date) + " *",
          predicted: Math.round(r.predicted),
          lower_90: Math.round(r.lower_90),
          upper_90: Math.round(r.upper_90),
          festival: r.festival_name,
        }));
        setChartData([...history, ...future]);
      })
      .catch((e) => setRecErr(e.message))
      .finally(() => setRecLoading(false));
  }, [clusterId, selectedProduct]);

  if (initLoading) return <PanelLoading />;
  if (initErr) return <PanelError msg={initErr} />;

  const brief = rec ? buildBrief(rec) : null;
  const weaveOptions = rec?.weave_options ?? [];
  const whyBullets = rec?.why_recommendation ?? [];
  const demandBand = rec?.demand_band ?? "";
  const demandLevel = demandBand.toLowerCase().includes("high") ? "High"
    : demandBand.toLowerCase().includes("low") || demandBand.toLowerCase().includes("cautious") ? "Low"
    : "Steady";
  const demandAccent = demandLevel === "High" ? "accent-leaf"
    : demandLevel === "Low" ? "accent-madder" : "accent-turmeric";

  return (
    <>
      {/* Product Selector */}
      <div className="product-selector-bar">
        <span className="product-selector-label">Select Product</span>
        <div className="product-selector-tabs">
          {availableProducts.map((cat) => (
            <button
              key={cat}
              className={`product-tab ${selectedProduct === cat ? "active" : ""}`}
              onClick={() => setSelectedProduct(cat)}
            >
              {cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {recLoading && <PanelLoading />}

      {recErr && <PanelError msg={recErr} />}

      {!recLoading && rec && (
        <>
          {/* Recommendation Summary Strip */}
          <div className="stat-strip stat-strip-3" style={{ marginBottom: 20 }}>
            <div className={`stat-cell ${demandAccent}`}>
              <div className="stat-label">Demand Signal</div>
              <div className="stat-value">{demandLevel}</div>
              <div className="stat-delta">{rec.confidence_label ?? ""} confidence</div>
            </div>
            <div className="stat-cell accent-indigo">
              <div className="stat-label">Recommended Units</div>
              <div className="stat-value">
                {rec.recommended_min_units ?? "—"} – {rec.recommended_max_units ?? "—"}
              </div>
              <div className="stat-delta">Range for this week</div>
            </div>
            <div className="stat-cell accent-turmeric">
              <div className="stat-label">Estimated Revenue</div>
              <div className="stat-value">{fmt(rec.finance_summary?.gross_revenue_inr)}</div>
              <div className="stat-delta">Margin: {rec.finance_summary?.profit_margin_pct ?? "—"}%</div>
            </div>
          </div>

          {/* Reason & Why panel */}
          <div className="chart-panel" style={{ marginBottom: 20 }}>
            <div className="chart-panel-header">
              <div>
                <div className="chart-panel-title">Recommendation — {(selectedProduct ?? "").replace(/_/g, " ")}</div>
                <div className="chart-panel-subtitle">{rec.action_line}</div>
              </div>
              <span className={`chart-panel-tag ${
                rec.finance_summary?.cash_status === "healthy" ? "tag-leaf"
                : rec.finance_summary?.cash_status === "watch" ? "tag-turmeric"
                : "tag-madder"
              }`}>{rec.finance_summary?.cash_status ?? "—"}</span>
            </div>
            <div className="reason-body">
              <p className="reason-summary">{rec.summary_reason}</p>
              {whyBullets.length > 0 && (
                <ul className="why-list">
                  {whyBullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
              {rec.purchase_advice?.text && (
                <div className="advice-row">
                  <span className="advice-label">Material Advice</span>
                  <span className="advice-text">{rec.purchase_advice.text}</span>
                </div>
              )}
              {rec.loan_advice?.text && (
                <div className="advice-row">
                  <span className="advice-label">Loan Advice</span>
                  <span className="advice-text">{rec.loan_advice.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Demand Forecast Chart */}
          {chartData.length > 0 && (
            <div className="chart-panel" style={{ marginBottom: 20 }}>
              <div className="chart-panel-header">
                <div>
                  <div className="chart-panel-title">Demand Forecast — {(selectedProduct ?? "").replace(/_/g, " ")}</div>
                  <div className="chart-panel-subtitle">10-week history · 4-week forecast · 90% CI · * = projected</div>
                </div>
                <span className="chart-panel-tag tag-indigo">XGBoost Ensemble</span>
              </div>
              <div className="chart-panel-body">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3e5e82" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3e5e82" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,83,71,0.1)"/>
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#8a7f74" }}/>
                    <YAxis tick={{ fontSize: 11, fill: "#8a7f74" }}/>
                    <Tooltip content={<ChartTooltip />}/>
                    <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#5c5347" }}/>
                    <Area type="monotone" dataKey="upper_90" stroke="none" fill="url(#fcGrad)" name="Upper CI" legendType="none"/>
                    <Area type="monotone" dataKey="lower_90" stroke="none" fill="var(--color-cotton-50)" name="Lower CI" legendType="none"/>
                    <Line type="monotone" dataKey="actual" stroke="var(--color-ink-800)" strokeWidth={2.5} dot={{ r: 2 }} name="Actual" connectNulls/>
                    <Line type="monotone" dataKey="predicted" stroke="var(--color-indigo-500)" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3 }} name="Forecast" connectNulls/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* What else can I weave? */}
          {weaveOptions.length > 0 && (
            <div className="chart-panel">
              <div className="chart-panel-header">
                <div className="chart-panel-title">What Else Can I Weave?</div>
                <div className="chart-panel-subtitle">Other products available for this cluster based on ML forecast</div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Rec. Units</th>
                    <th className="col-hide-mobile">Range</th>
                    <th>Revenue</th>
                    <th className="col-hide-mobile">Profit</th>
                    <th>Cash</th>
                  </tr>
                </thead>
                <tbody>
                  {weaveOptions.map((opt) => (
                    <tr
                      key={opt.product_key}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        if (availableProducts.includes(opt.product_category)) {
                          setSelectedProduct(opt.product_category);
                        }
                      }}
                    >
                      <td style={{ fontWeight: 700 }}>
                        {opt.display_name}
                        {opt.best_choice && (
                          <span style={{ marginLeft: 8, fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-leaf-700)", background: "var(--color-leaf-100)", padding: "1px 6px", borderRadius: 2 }}>Best</span>
                        )}
                      </td>
                      <td>{opt.recommended_units}</td>
                      <td className="col-hide-mobile" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{opt.recommended_range}</td>
                      <td>{fmt(opt.estimated_revenue_inr)}</td>
                      <td className="col-hide-mobile" style={{ color: (opt.estimated_profit_inr ?? 0) > 0 ? "var(--color-leaf-700)" : "var(--color-madder-600)", fontWeight: 600 }}>
                        {fmt(opt.estimated_profit_inr)}
                      </td>
                      <td>
                        <span className={`status-badge ${
                          opt.cash_status === "healthy" ? "status-green"
                          : opt.cash_status === "watch" ? "status-amber"
                          : "status-red"
                        }`}>{opt.cash_status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

// Utility: map product_category → nearest product_key for recommendation call
function categoryToKey(cat) {
  const map = {
    saree: "sarees",
    dupatta: "dupattas",
    shawl_wrap: "shawls",
    stole: "stoles",
    home_furnishing: "bedsheets",
    yardage_fabric: "cotton_fabric",
  };
  return map[cat] ?? "sarees";
}

// Utility: extract brief from raw recommendation package
function buildBrief(pkg) {
  return {
    recommended_units: Math.round((pkg.recommended_min_units + pkg.recommended_max_units) / 2),
    min: pkg.recommended_min_units,
    max: pkg.recommended_max_units,
  };
}

// =============================================
//  FINANCE & CASH PAGE (History + Budget Planner)
// =============================================

function FinancePage({ clusterId }) {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyErr, setHistoryErr] = useState("");

  const [budgetInput, setBudgetInput] = useState("15000");
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planErr, setPlanErr] = useState("");

  // 1. Fetch available products on mount
  useEffect(() => {
    setHistoryLoading(true);
    apiFetch(`/api/clusters/${clusterId}`)
      .then((cd) => {
        const prods = cd.available_products ?? [];
        setAvailableProducts(prods);
        if (prods.length > 0) setSelectedProduct(prods[0]);
      })
      .catch((e) => setHistoryErr(e.message));
  }, [clusterId]);

  // 2. Fetch history when product changes
  useEffect(() => {
    if (!selectedProduct) return;
    setHistoryLoading(true);
    setHistoryErr("");
    
    apiFetch(`/api/weaver/history?cluster_id=${clusterId}&product_category=${selectedProduct}`)
      .then(setHistoryData)
      .catch((e) => setHistoryErr(e.message))
      .finally(() => setHistoryLoading(false));
  }, [clusterId, selectedProduct]);

  // 3. Clear budget plan when product changes, or optionally auto-fetch (but user wants form)
  useEffect(() => {
    setPlan(null);
    setPlanErr("");
  }, [selectedProduct]);

  const handlePlanSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const budget = parseFloat(budgetInput);
    if (isNaN(budget) || budget <= 0) return;
    setPlanLoading(true);
    setPlanErr("");
    
    fetch(`${API_BASE}/api/weaver/budget-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cluster_id: clusterId, product_category: selectedProduct, budget_inr: budget, language: "en" }),
    })
      .then((r) => { if (!r.ok) throw new Error("Failed to fetch plan"); return r.json(); })
      .then(setPlan)
      .catch((e) => setPlanErr(e.message))
      .finally(() => setPlanLoading(false));
  };

  if (historyLoading && !historyData) return <PanelLoading />;
  if (historyErr && !historyData) return <PanelError msg={historyErr} />;

  const trendPct = historyData?.income_trend_pct ?? 0;
  
  // Format cashflow for chart
  const cashRows = (historyData?.cashflow_history ?? []).map((r) => ({
    week: fmtDate(r.week_start_date),
    inflow: Math.round(r.cash_in_inr ?? 0),
    netflow: Math.round(r.net_cashflow_inr ?? 0),
  }));

  return (
    <>
      {/* Product Selector */}
      <div className="product-selector-bar" style={{ marginBottom: 20 }}>
        <span className="product-selector-label">Select Product</span>
        <div className="product-selector-tabs">
          {availableProducts.map((cat) => (
            <button
              key={cat}
              className={`product-tab ${selectedProduct === cat ? "active" : ""}`}
              onClick={() => setSelectedProduct(cat)}
            >
              {cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {historyLoading && <PanelLoading />}

      {!historyLoading && historyData && (
        <>
          <div className="stat-strip stat-strip-3" style={{ marginBottom: 20 }}>
            <div className="stat-cell accent-indigo">
              <div className="stat-label">Avg Monthly Earnings</div>
              <div className="stat-value">{fmt(historyData.recent3_avg_monthly_inr)}</div>
              <div className="stat-delta">Last 3 months average</div>
            </div>
            <div className={`stat-cell ${trendPct > 0 ? "accent-leaf" : trendPct < 0 ? "accent-madder" : "accent-turmeric"}`}>
              <div className="stat-label">Income Trend</div>
              <div className="stat-value">{trendPct > 0 ? "+" : ""}{trendPct}%</div>
              <div className="stat-delta">vs previous 3 months</div>
            </div>
            <div className="stat-cell accent-turmeric">
              <div className="stat-label">AI Target Income</div>
              <div className="stat-value">{fmt(historyData.with_ai_monthly_inr)}</div>
              <div className="stat-delta">+{historyData.income_improvement_pct}% estimated uplift</div>
            </div>
          </div>

          <div className="chart-grid">
            {/* Cashflow Chart */}
            <div className="chart-panel">
              <div className="chart-panel-header">
                <div>
                  <div className="chart-panel-title">Weekly Cash Flow</div>
                  <div className="chart-panel-subtitle">Cash in vs net cash flow over time</div>
                </div>
                <span className="chart-panel-tag tag-indigo">Historical</span>
              </div>
              <div className="chart-panel-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={cashRows} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,83,71,0.1)"/>
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#8a7f74" }}/>
                    <YAxis tick={{ fontSize: 11, fill: "#8a7f74" }} tickFormatter={fmtK}/>
                    <Tooltip content={<ChartTooltip />}/>
                    <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#5c5347" }}/>
                    <ReferenceLine y={0} stroke="var(--color-madder-600)" strokeWidth={1}/>
                    <Bar dataKey="inflow" fill="var(--color-leaf-600)" name="Cash In" radius={0}/>
                    <Bar dataKey="netflow" fill="var(--color-indigo-500)" name="Net Cashflow" radius={0} opacity={0.85}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

        {/* Budget Planner Form */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <div>
              <div className="chart-panel-title">Budget Planner</div>
              <div className="chart-panel-subtitle">Enter your available cash to get a production plan</div>
            </div>
            <span className="chart-panel-tag tag-turmeric">Calculator</span>
          </div>
          <div className="chart-panel-body" style={{ minHeight: "260px" }}>
            <form onSubmit={handlePlanSubmit} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: "1", minWidth: "150px" }}>
                  <label className="stat-label">Available Budget (INR)</label>
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border-color)", fontSize: "1rem" }}
                  />
                </div>
                <button type="submit" disabled={planLoading} style={{ padding: "10px 20px", background: "var(--color-indigo-700)", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer", fontSize: "1rem" }}>
                  {planLoading ? "Planning..." : "Get Plan"}
                </button>
              </div>
            </form>

            {planErr && <div style={{ color: "var(--color-madder-600)", fontSize: "0.9rem" }}>{planErr}</div>}

            {plan && (
              <div className="money-plan-container">
                <div className="money-plan-header">
                  <span className="money-plan-eyebrow">💰 THIS WEEK MONEY PLAN</span>
                  <div className="money-plan-title">If you weave {plan.recommended_units} {plan.product_label}</div>
                  <div className="money-plan-subtitle">{plan.advice}</div>
                </div>

                <div className="money-plan-cards">
                  <div className="money-card bg-green">
                    <div className="money-card-label">YOU MAY EARN</div>
                    <div className="money-card-value">{fmt(plan.expected_revenue_inr)}</div>
                    <div className="money-card-sub">{fmt(plan.unit_price_inr)} per piece</div>
                  </div>
                  <div className="money-card bg-red">
                    <div className="money-card-label">TOTAL COSTS</div>
                    <div className="money-card-value">{fmt(plan.total_cost_inr)}</div>
                    <div className="money-card-sub">material + wages + misc</div>
                  </div>
                  <div className="money-card bg-green">
                    <div className="money-card-label">MONEY LEFT (PROFIT)</div>
                    <div className="money-card-value">{fmt(plan.expected_profit_inr)}</div>
                    <div className="money-card-sub">
                      {Math.round((plan.expected_profit_inr / (plan.expected_revenue_inr || 1)) * 100)}% margin · {fmt(plan.profit_per_unit_inr)}/piece
                    </div>
                  </div>
                </div>

                <div className="money-plan-section">
                  <div className="money-plan-section-title">COST BREAKDOWN</div>
                  <div className="cost-breakdown-row">
                    <div className="cost-label">Raw material</div>
                    <div className="cost-bar-container">
                      <div className="cost-bar bg-madder" style={{ width: `${(plan.material_cost_inr / plan.total_cost_inr) * 100}%` }}></div>
                    </div>
                    <div className="cost-value">{fmt(plan.material_cost_inr)}</div>
                  </div>
                  <div className="cost-breakdown-row">
                    <div className="cost-label">Wages</div>
                    <div className="cost-bar-container">
                      <div className="cost-bar bg-indigo" style={{ width: `${((plan.total_cost_inr - plan.material_cost_inr) * 0.85 / plan.total_cost_inr) * 100}%` }}></div>
                    </div>
                    <div className="cost-value">{fmt((plan.total_cost_inr - plan.material_cost_inr) * 0.85)}</div>
                  </div>
                  <div className="cost-breakdown-row">
                    <div className="cost-label">Loom & misc</div>
                    <div className="cost-bar-container">
                      <div className="cost-bar bg-ink" style={{ width: `${((plan.total_cost_inr - plan.material_cost_inr) * 0.15 / plan.total_cost_inr) * 100}%` }}></div>
                    </div>
                    <div className="cost-value">{fmt((plan.total_cost_inr - plan.material_cost_inr) * 0.15)}</div>
                  </div>
                </div>

                <div className="money-plan-section">
                  <div className="money-plan-section-title">TIPS TO MAXIMIZE EARNINGS</div>
                  <ul className="money-plan-tips">
                    <li>For {plan.recommended_units} {plan.product_label}, keep about {fmt(plan.total_cost_inr)} ready for costs.</li>
                    <li>Every extra piece adds about {fmt(plan.profit_per_unit_inr)} after material, wages, and small expenses.</li>
                    <li>Demand is strong, so finish confirmed work first and ask buyers for an advance on larger orders.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </>
  );
}

// =============================================
//  PRODUCTION PLANNER PAGE (NEW)
// =============================================

function ProductionPlannerPage({ profile }) {
  const [catalog, setCatalog] = useState(null);
  const [productKey, setProductKey] = useState("");
  const [quantity, setQuantity] = useState(20);
  const [loading, setLoading] = useState(false);
  const [finance, setFinance] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    apiFetch("/api/weaver/catalog")
      .then((data) => {
        setCatalog(data);
        // Default to first product in catalog
        if (data.products && data.products.length > 0) {
          setProductKey(data.products[0].key);
        }
      })
      .catch((e) => setErrorMsg(e.message));
  }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!catalog) return;
    const selectedProduct = catalog.products.find(p => p.key === productKey);
    if (!selectedProduct) return;
    setLoading(true);
    setErrorMsg("");
    try {
      // Build a proper WeaverProfile object with snake_case keys for the backend
      const weaverProfile = {
        name: profile.name || "Rameshbhai",
        cluster_id: profile.clusterId,
        primary_product_key: productKey,
        selected_product_keys: [productKey],
        loom_count: profile.loom_count || 2,
        weaver_count: profile.weaver_count || 2,
        average_weekly_output: profile.average_weekly_output || 10.0,
        language: profile.language || "en",
      };
      const res = await fetch(`${API_BASE}/api/weaver/finance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: weaverProfile,
          product_category: selectedProduct.model_category,
          quantity: Number(quantity),
          language: profile.language || "en",
          weaver_name: profile.name || "Rameshbhai",
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail ? JSON.stringify(errData.detail) : "Failed to calculate plan");
      }
      const data = await res.json();
      
      // Attach product details for display
      data.product_details = selectedProduct;
      
      setFinance(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!catalog) return <div style={{ padding: 40, textAlign: "center", color: "var(--color-ink-400)" }}>Loading catalog...</div>;

  const currentProduct = catalog.products.find(p => p.key === productKey);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40 }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: 20, color: "var(--color-ink-900)" }}>Production Planner Engine</h2>
      <p style={{ color: "var(--color-ink-600)", marginBottom: 24, lineHeight: 1.5 }}>
        Enter your order details below. The engine will calculate your exact material requirements, weaving time, and a full financial breakdown based on your cluster's cost rates and your available looms.
      </p>

      <form onSubmit={handleCalculate} style={{ background: "#fff", padding: 24, borderRadius: 8, border: "1px solid var(--border-color)", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ flex: "1 1 200px" }}>
            <label className="form-label">Product to Weave</label>
            <select className="form-select" value={productKey} onChange={(e) => setProductKey(e.target.value)}>
              {catalog.products.map(p => (
                <option key={p.key} value={p.key}>{p.icon} {p.label}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label className="form-label">Order Quantity (Units)</label>
            <input type="number" className="form-input" min="1" max="1000" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label className="form-label">Active Looms Available</label>
            <input type="number" className="form-input" value={profile.loom_count} disabled title="Update this in Profile & Settings" />
            <div style={{ fontSize: "0.75rem", color: "var(--color-ink-400)", marginTop: 4 }}>Edit in Profile & Settings</div>
          </div>
        </div>
        <button type="submit" className="submit-btn" disabled={loading} style={{ maxWidth: 200 }}>
          {loading ? "Calculating..." : "Generate Plan"}
        </button>
        {errorMsg && <p style={{ color: "var(--color-madder-600)", marginTop: 12 }}>{errorMsg}</p>}
      </form>

      {finance && finance.product_details && (() => {
        const fs = finance.finance_summary || {};
        const pd = finance.product_details;
        const avgCap = (pd.capacity_per_loom[0] + pd.capacity_per_loom[1]) / 2;
        const looms = profile.loom_count || 2;
        const weeksNeeded = Math.ceil(quantity / avgCap / looms * 4);
        return (
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            
            <div className="chart-panel" style={{ padding: 20, margin: 0 }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: 16 }}>Production Requirements</h3>
              <table className="data-table">
                <tbody>
                  <tr>
                    <td style={{ color: "var(--color-ink-600)", width: "60%" }}>Total Units</td>
                    <td style={{ fontWeight: 700 }}>{quantity} {pd.label}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--color-ink-600)" }}>Loom Capacity / Week</td>
                    <td style={{ fontWeight: 700 }}>{pd.capacity_per_loom[0]}–{pd.capacity_per_loom[1]} units per loom</td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--color-ink-600)" }}>Your Active Looms</td>
                    <td style={{ fontWeight: 700 }}>{looms}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--color-ink-600)" }}>Estimated Time</td>
                    <td style={{ fontWeight: 700, color: "var(--color-indigo-700)" }}>{weeksNeeded} week{weeksNeeded !== 1 ? "s" : ""}</td>
                  </tr>
                  {fs.capacity_warning && (
                    <tr>
                      <td colSpan={2} style={{ color: "var(--color-turmeric-600)", fontSize: "0.85rem", fontStyle: "italic", paddingTop: 8 }}>⚠️ {fs.capacity_warning}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="chart-panel" style={{ padding: 20, margin: 0, background: "var(--color-cotton-50)" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: 16 }}>Financial Breakdown</h3>
              <table className="data-table">
                <tbody>
                  <tr>
                    <td style={{ color: "var(--color-ink-600)", width: "60%" }}>Gross Revenue</td>
                    <td style={{ fontWeight: 700 }}>{fmt(fs.gross_revenue_inr)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--color-ink-600)" }}>Raw Material Cost</td>
                    <td style={{ fontWeight: 700, color: "var(--color-madder-600)" }}>-{fmt(fs.raw_material_cost_inr)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--color-ink-600)" }}>Wages & Maintenance</td>
                    <td style={{ fontWeight: 700, color: "var(--color-madder-600)" }}>-{fmt((fs.wage_cost_inr || 0) + (fs.maintenance_cost_inr || 0))}</td>
                  </tr>
                  <tr style={{ borderTop: "2px solid var(--color-cotton-300)" }}>
                    <td style={{ color: "var(--color-ink-900)", fontWeight: 700, paddingTop: 12 }}>Estimated Net Profit</td>
                    <td style={{ fontWeight: 800, color: "var(--color-leaf-700)", fontSize: "1.1rem", paddingTop: 12 }}>{fmt(fs.net_profit_inr)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--color-ink-600)" }}>Profit per Unit</td>
                    <td style={{ fontWeight: 700, color: "var(--color-leaf-600)" }}>{fmt(fs.profit_per_unit_inr)}</td>
                  </tr>
                </tbody>
              </table>
              {fs.plain_advice && (
                <p style={{ marginTop: 16, padding: 12, background: "var(--color-cotton-100)", borderRadius: 4, fontSize: "0.9rem", color: "var(--color-ink-600)", lineHeight: 1.5 }}>
                  💡 {fs.plain_advice}
                </p>
              )}
            </div>

          </div>
        );
      })()}
    </div>
  );
}

// =============================================
//  ORDERS PAGE
// =============================================

function OrdersPage({ clusterId, clusterName }) {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/clusters/${clusterId}`)
      .then((d) => setOrders(d.orders ?? []))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [clusterId]);

  if (loading) return <PanelLoading />;
  if (err) return <PanelError msg={err} />;

  return (
    <div className="table-panel">
      <div className="table-panel-header">
        <div className="chart-panel-title">Order History — {clusterName}</div>
        <span className="chart-panel-tag tag-indigo">{orders?.length ?? 0} records</span>
      </div>
      {/* Desktop Table View */}
      <table className="data-table desktop-only-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Order Date</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Buyer Type</th>
            <th>Delivery Date</th>
            <th>Payment Due</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {(orders ?? []).length === 0 && (
            <tr><td colSpan={8} style={{ textAlign:"center", color:"var(--color-ink-400)", padding:"20px" }}>No orders found.</td></tr>
          )}
          {(orders ?? []).map((o) => (
            <tr key={o.order_id}>
              <td style={{ fontWeight:700, fontFamily:"monospace", color:"var(--color-indigo-700)", fontSize:"0.8rem" }}>{o.order_id}</td>
              <td>{fmtDate(o.week_start_date)}</td>
              <td>{o.product_category}</td>
              <td>{o.quantity}</td>
              <td style={{ textTransform:"capitalize" }}>{o.buyer_type}</td>
              <td>{fmtDate(o.delivery_date) || "—"}</td>
              <td>{fmtDate(o.payment_due_date) || "—"}</td>
              <td>
                <span className={`status-badge ${o.status === "paid" ? "status-green" : "status-amber"}`}>
                  {o.status?.replace("_", " ")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="mobile-order-cards">
        {(orders ?? []).length === 0 && (
          <div style={{ textAlign:"center", color:"var(--color-ink-400)", padding:"20px" }}>No orders found.</div>
        )}
        {(orders ?? []).map((o) => (
          <div className="order-card-mobile" key={o.order_id}>
            <div className="order-card-date">{fmtDate(o.week_start_date)}</div>
            <div className="order-card-product">{o.quantity} {o.product_category.replace(/_/g, " ")}</div>
            <div className={`order-card-status ${o.status === "paid" ? "bg-leaf-100 text-leaf" : "bg-amber-100 text-amber"}`}>
              {o.status?.replace("_", " ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================
//  CLUSTER ANALYTICS PAGE (NEW)
// =============================================

function ClusterAnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/admin/metrics").catch(() => null),
      apiFetch("/api/clusters").catch(() => [])
    ]).then(([metricsData, clustersData]) => {
      setMetrics(metricsData);
      setClusters(clustersData);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--color-ink-400)" }}>Loading cluster data...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {metrics && metrics.overall && (
        <>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: 12, color: "var(--color-ink-600)" }}>Global ML Prediction Performance</h2>
            <div className="stat-strip stat-strip-3" style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: 4 }}>
              <div className="stat-cell">
                <div className="stat-label">Model WAPE</div>
                <div className="stat-value" style={{ color: "var(--color-leaf-700)" }}>
                  {(metrics.overall.xgb_wape * 100).toFixed(1)}%
                </div>
                <div className="stat-trend trend-up">Weighted Absolute Pct Error</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Baseline WAPE</div>
                <div className="stat-value" style={{ color: "var(--color-madder-700)" }}>
                  {(metrics.overall.baseline_wape * 100).toFixed(1)}%
                </div>
                <div className="stat-trend trend-down">Simple Moving Average</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Prediction Coverage</div>
                <div className="stat-value">
                  {(metrics.overall.coverage_90 * 100).toFixed(1)}%
                </div>
                <div className="stat-trend">Within 90% confidence interval</div>
              </div>
            </div>
          </div>
        </>
      )}

      <h2 style={{ fontSize: "1.1rem", margin: "32px 0 16px", color: "var(--color-ink-600)" }}>Cluster AI Insights &amp; Cashflow</h2>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {clusters.map((c) => (
          <div key={c.cluster_id} style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: 6, padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 4px" }}>{c.cluster_name}</h3>
                <div style={{ fontSize: "0.8rem", color: "var(--color-ink-400)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  {c.state} · Specialty: {c.product_specialty.replace("_", " ")}
                </div>
              </div>
              {c.insight && (
                <div style={{ padding: "6px 12px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase",
                  background: c.insight.credit_status === "red" ? "var(--color-madder-100)" : c.insight.credit_status === "yellow" ? "var(--color-turmeric-100)" : "var(--color-leaf-100)",
                  color: c.insight.credit_status === "red" ? "var(--color-madder-700)" : c.insight.credit_status === "yellow" ? "var(--color-turmeric-600)" : "var(--color-leaf-700)"
                }}>
                  Credit Status: {c.insight.credit_status}
                </div>
              )}
            </div>
            
            {c.insight && (
              <div style={{ background: "#fbf6ec", padding: 16, borderRadius: 4, borderLeft: "3px solid var(--color-turmeric-500)", marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--color-ink-900)" }}>AI Forecast:</strong> {c.insight.message}
                </p>
                <div style={{ marginTop: 10, display: "flex", gap: 20, fontSize: "0.85rem", color: "var(--color-ink-600)" }}>
                  <span><strong>Peak Week:</strong> {fmtDate(c.insight.peak_week)}</span>
                  <span><strong>Recommended Actions:</strong> {c.insight.action_units} units</span>
                  <span><strong>Cash Gap:</strong> {fmt(c.insight.cash_gap_inr)}</span>
                </div>
              </div>
            )}
            
            {c.insight && (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-ink-400)", fontStyle: "italic" }}>
                {c.insight.why}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================
//  ASSISTANT PAGE
// =============================================

function AssistantPage({ profile }) {
  const getGreeting = () => {
    const greetings = {
      en: `Hello ${profile.name}! I am your Handloom AI Assistant 'SAATHI'. How can I help you today with your weaving plans, cashflow, or local market questions?`,
      hi: `नमस्ते ${profile.name}! मैं आपका हैंडलूम AI सहायक 'SAATHI' हूँ। आज मैं आपकी बुनाई योजनाओं, कैशफ्लो या स्थानीय बाजार के सवालों में आपकी कैसे मदद कर सकता हूँ?`,
      gu: `નમસ્તે ${profile.name}! હું તમારો હેન્ડલૂમ AI સહાયક 'SAATHI' છું. આજે હું તમારી વણાટ યોજનાઓ, કેશફ્લો અથવા સ્થાનિક બજારના પ્રશ્નોમાં તમને કેવી રીતે મદદ કરી શકું?`
    };
    return greetings[profile.language] || greetings.en;
  };

  const [messages, setMessages] = useState([
    { role: "assistant", content: getGreeting() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(!localStorage.getItem("GEMINI_API_KEY"));
  const [apiKey, setApiKey] = useState(localStorage.getItem("GEMINI_API_KEY") || "");
  const messagesEndRef = React.useRef(null);

  const saveApiKey = () => {
    localStorage.setItem("GEMINI_API_KEY", apiKey);
    setShowApiKey(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/assistant/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          cluster_id: profile.clusterId,
          language: profile.language,
          weaver_name: profile.name,
          product_category: profile.productSpecialty || "saree",
          gemini_api_key: localStorage.getItem("GEMINI_API_KEY")
        }),
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Sorry, I couldn't generate a response." }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops! Something went wrong trying to connect to the AI backend." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat-panel">
      <div className="ai-chat-header">
        <div>
          <div className="chart-panel-title">AI Assistant</div>
          <div className="chart-panel-subtitle">Powered by Gemini</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            className="chart-panel-tag tag-indigo" 
            style={{ border: "none", cursor: "pointer" }}
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {apiKey ? "Settings" : "Setup API"}
          </button>
          <span className="chart-panel-tag tag-leaf">Online</span>
        </div>
      </div>

      {showApiKey && (
        <div style={{ padding: "16px", borderBottom: "1px solid var(--color-ink-100)", background: "var(--color-cotton-50)" }}>
          <p style={{ fontSize: "0.8rem", marginBottom: "8px", color: "var(--color-ink-600)" }}>
            Enter your Google Gemini API Key to enable natural conversation.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Paste your API key here..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ flex: 1, padding: "8px" }}
            />
            <button className="submit-btn" style={{ width: "auto", padding: "0 16px" }} onClick={saveApiKey}>
              Save
            </button>
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.role === "assistant" && (
              <div className="chat-avatar" title="AI Weaver Assistant">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:18,height:18}}>
                  <rect x="3" y="6" width="14" height="10" rx="3" fill="rgba(255,255,255,0.9)"/>
                  <circle cx="7.5" cy="11" r="1.5" fill="#26415e"/>
                  <circle cx="12.5" cy="11" r="1.5" fill="#26415e"/>
                  <rect x="8" y="13.5" width="4" height="1" rx="0.5" fill="#26415e"/>
                  <rect x="9" y="3" width="2" height="3" rx="1" fill="rgba(255,255,255,0.9)"/>
                  <circle cx="10" cy="2.5" r="1" fill="rgba(255,255,255,0.9)"/>
                  <rect x="1" y="8" width="2" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
                  <rect x="17" y="8" width="2" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
                </svg>
              </div>
            )}
            {msg.role === "user" && (
              <div className="chat-avatar user-avatar" title={profile.name}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="chat-bubble">
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <div className="chat-avatar" title="AI Weaver Assistant">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:18,height:18}}>
                <rect x="3" y="6" width="14" height="10" rx="3" fill="rgba(255,255,255,0.9)"/>
                <circle cx="7.5" cy="11" r="1.5" fill="#26415e"/>
                <circle cx="12.5" cy="11" r="1.5" fill="#26415e"/>
                <rect x="8" y="13.5" width="4" height="1" rx="0.5" fill="#26415e"/>
                <rect x="9" y="3" width="2" height="3" rx="1" fill="rgba(255,255,255,0.9)"/>
                <circle cx="10" cy="2.5" r="1" fill="rgba(255,255,255,0.9)"/>
                <rect x="1" y="8" width="2" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
                <rect x="17" y="8" width="2" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
              </svg>
            </div>
            <div className="chat-bubble typing">
              <span className="dot-anim">●</span>
              <span className="dot-anim" style={{animationDelay:"0.2s"}}>●</span>
              <span className="dot-anim" style={{animationDelay:"0.4s"}}>●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <form onSubmit={handleSend} className="chat-form">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask anything about weaving, cashflow, or orders..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()} aria-label="Send">
            &#8593;
          </button>
        </form>
      </div>
    </div>
  );
}

// =============================================
//  PROFILE PAGE
// =============================================

function ProfilePage({ profile, setProfile, onLogout }) {
  const [loomCount, setLoomCount] = useState(profile.loom_count || 2);
  const [weaverCount, setWeaverCount] = useState(profile.weaver_count || 2);
  const [weeklyOutput, setWeeklyOutput] = useState(profile.average_weekly_output || 10);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setProfile({
      ...profile,
      loom_count: Number(loomCount),
      weaver_count: Number(weaverCount),
      average_weekly_output: Number(weeklyOutput),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="chart-panel" style={{ padding: 0, maxWidth: 600, margin: "0 auto" }}>
      <div className="chart-panel-header">
        <div className="chart-panel-title">Weaver Profile & Settings</div>
      </div>
      <div className="chart-panel-body">
        
        <div style={{ padding: "0 0 24px", marginBottom: 24, borderBottom: "1px solid var(--color-cotton-300)" }}>
          <table className="data-table">
            <tbody>
              <tr><td style={{fontWeight:700,color:"var(--color-ink-400)",width:180}}>Name</td><td>{profile.name}</td></tr>
              <tr><td style={{fontWeight:700,color:"var(--color-ink-400)"}}>Cluster</td><td>{profile.clusterName} ({profile.clusterId})</td></tr>
              <tr><td style={{fontWeight:700,color:"var(--color-ink-400)"}}>Language</td><td style={{textTransform:"uppercase"}}>{profile.language}</td></tr>
              <tr><td style={{fontWeight:700,color:"var(--color-ink-400)"}}>Backend</td><td style={{fontFamily:"monospace"}}>{API_BASE}</td></tr>
            </tbody>
          </table>
        </div>

        <form onSubmit={handleSave}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: 16 }}>Production Settings</h3>
          <p style={{ color: "var(--color-ink-600)", fontSize: "0.9rem", marginBottom: 20 }}>
            These settings are used by the Production Planner Engine to calculate required weaving time and financial estimates.
          </p>
          
          <div className="form-group">
            <label className="form-label">Active Looms</label>
            <input type="number" className="form-input" min="1" max="100" value={loomCount} onChange={(e) => setLoomCount(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Employed Weavers</label>
            <input type="number" className="form-input" min="1" max="500" value={weaverCount} onChange={(e) => setWeaverCount(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Average Weekly Output (Units)</label>
            <input type="number" step="0.1" className="form-input" min="0.1" value={weeklyOutput} onChange={(e) => setWeeklyOutput(e.target.value)} required />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32 }}>
            <button type="submit" className="submit-btn" style={{ maxWidth: 200, margin: 0 }}>Save Settings</button>
            {saved && <span style={{ color: "var(--color-leaf-700)", fontWeight: 600 }}>✓ Saved!</span>}
          </div>
        </form>

        <div style={{ padding: "40px 0 0", marginTop: 40, borderTop: "1px solid var(--color-cotton-300)" }}>
          <button className="submit-btn" style={{ maxWidth: 220, background: "var(--color-madder-600)" }} onClick={onLogout}>Sign Out & Reset</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
//  DASHBOARD LAYOUT
// =============================================

function DashboardLayout({ profile, setProfile, onLogout }) {
  const [activeModule, setActiveModule] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (id) => { setActiveModule(id); setSidebarOpen(false); };
  const mod = MODULES.find((m) => m.id === activeModule);

  const renderPage = () => {
    switch (activeModule) {
      case "overview":  return <OverviewPage clusterId={profile.clusterId} />;
      case "forecast":  return <ForecastPage clusterId={profile.clusterId} clusterName={profile.clusterName} />;
      case "finance":   return <FinancePage clusterId={profile.clusterId} />;
      case "planner":   return <ProductionPlannerPage profile={profile} />;
      case "orders":    return <OrdersPage clusterId={profile.clusterId} clusterName={profile.clusterName} />;
      case "cluster":   return <ClusterAnalyticsPage clusterId={profile.clusterId} />;
      case "assistant": return <AssistantPage profile={profile} />;
      case "hisab":     return <HisabApp profile={profile} cluster={{ cluster_id: profile.clusterId, cluster_name: profile.clusterName }} />;
      case "profile":   return <ProfilePage profile={profile} setProfile={setProfile} onLogout={onLogout} />;
      default:          return <OverviewPage clusterId={profile.clusterId} />;
    }
  };

  return (
    <div className="dashboard-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)}/>
      <Sidebar activeModule={activeModule} onNavigate={navigate} sidebarOpen={sidebarOpen}/>
      <div className="main-area">
        <Topbar
          profile={profile}
          activeModule={activeModule}
          onHamburger={() => setSidebarOpen((v) => !v)}
          onLogout={onLogout}
        />
        {activeModule === "assistant" ? (
          <main className="page-content chat-page-content">
            {renderPage()}
          </main>
        ) : (
          <main className="page-content">
            <div className="page-header">
              <div>
                <div className="page-title-eyebrow">AI Weaver Companion · {profile.clusterName}</div>
                <h1 className="page-title">{mod?.label}</h1>
                {activeModule === "overview" && (
                  <p className="page-subtitle">Week of 14 Jul 2026 &mdash; All figures sourced live from the backend ML pipeline.</p>
                )}
              </div>
            </div>
            {renderPage()}
          </main>
        )}
      </div>
    </div>
  );
}

// =============================================
//  ROOT
// =============================================

export default function ModernApp() {
  const [profile, setProfile] = useState(null);
  
  const handleSetProfile = (newProfile) => {
    // Fill default weaver metrics if they are undefined
    const finalProfile = {
      loom_count: 2,
      weaver_count: 2,
      average_weekly_output: 10.0,
      ...newProfile
    };
    setProfile(finalProfile);
  };

  if (!profile) return <Onboarding onComplete={handleSetProfile} />;
  return <DashboardLayout profile={profile} setProfile={setProfile} onLogout={() => setProfile(null)} />;
}
