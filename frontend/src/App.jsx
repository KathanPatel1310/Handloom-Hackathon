import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const NAV_ITEMS = ["home", "assistant", "forecast", "orders", "profile"];

const TEXT = {
  en: {
    appTitle: "AI Weaver Companion",
    adminTitle: "Admin Insights",
    subtitle:
      "Demand prediction stays in the ML pipeline. The product explains what the weaver should do this week.",
    home: "Home",
    assistant: "AI Assistant",
    forecast: "Forecast",
    orders: "Orders",
    profile: "Profile",
    admin: "Admin",
    weaver: "Weaver",
    chooseLanguage: "Choose your language",
    yourName: "Your name",
    continue: "Continue",
    greeting: "Good Morning",
    fallbackName: "Weaver Friend",
    thisWeek: "This Week",
    demand: "Demand",
    reason: "Reason",
    buy: "Buy",
    expectedWindow: "Expected Selling Window",
    confidence: "Confidence",
    viewDetails: "View Details",
    printCard: "Print Card",
    askPlaceholder: "Ask in Gujarati, Hindi, or English",
    voiceInput: "Voice Input",
    send: "Send",
    assistantIntro: "Ask about the recommendation, raw material, demand, or cash risk.",
    assistantRule: "Gemini explains. ML predicts.",
    quick1: "How many units should I weave?",
    quick2: "Should I buy raw material this week?",
    quick3: "Why did you recommend this?",
    quick4: "Can I take a short-term loan?",
    ordersIntro: "Simple upcoming production windows for the next few weeks.",
    profileIntro: "Language and access preferences for the weaver experience.",
    accessMode: "Preferred access",
    accessValue: "Voice, quick actions, and printable card",
    cluster: "Cluster",
    language: "Language",
    currentFocus: "Current focus",
    currentFocusValue: "What should I do this week?",
    currentWeek: "Current week",
    currentCash: "Cash status",
    estimatedRevenue: "Estimated selling value",
    rawCost: "Estimated raw-material cost",
    wageCost: "Estimated wage cost",
    estimatedProfit: "Estimated margin after direct costs",
    weaveOptions: "What else can I weave?",
    optionRange: "Expected range",
    cashHealthy: "Healthy",
    cashCaution: "Caution",
    cashRisk: "Cash shortage likely",
    noAssistant:
      "Gemini is wired in the backend, but it needs GEMINI_API_KEY before live answers can appear here.",
    unsupportedVoice: "Voice input is not supported in this browser.",
    listening: "Listening...",
    demandHigh: "High",
    demandSteady: "Steady",
    demandLow: "Low",
    confidenceHigh: "High",
    confidenceMedium: "Medium",
    confidenceLow: "Low",
    reasonFestival: (festival) =>
      festival ? `${festival} demand is increasing.` : "Festival demand is increasing.",
    reasonMomentum: "Recent demand momentum is holding steady.",
    reasonCash: "Demand exists, but cashflow risk means planning carefully matters.",
    actionGreen: "Produce as planned and prepare material now.",
    actionYellow: "Produce carefully and keep a close watch on receivables.",
    actionRed: "Keep production selective and line up working capital early.",
    weekPlan: "Weave",
    units: "units",
    rawMaterialThisWeek: "this week",
    backtest: "Backtest",
    coverage: "Coverage",
    festivalVsNormal: "Festival vs Normal",
    cashProjection: "Cashflow Projection",
    forecastAnalytics: "Forecast Analytics",
    todayQuestion: "What should I do this week?",
  },
  hi: {
    appTitle: "एआई वीवर कंपैनियन",
    adminTitle: "एडमिन इनसाइट्स",
    subtitle:
      "डिमांड प्रेडिक्शन एमएल पाइपलाइन में रहता है। यह प्रोडक्ट बताता है कि बुनकर को इस हफ्ते क्या करना चाहिए।",
    home: "होम",
    assistant: "एआई सहायक",
    forecast: "पूर्वानुमान",
    orders: "ऑर्डर",
    profile: "प्रोफ़ाइल",
    admin: "एडमिन",
    weaver: "बुनकर",
    chooseLanguage: "अपनी भाषा चुनें",
    yourName: "आपका नाम",
    continue: "आगे बढ़ें",
    greeting: "नमस्ते",
    fallbackName: "बुनकर मित्र",
    thisWeek: "इस हफ्ते",
    demand: "मांग",
    reason: "कारण",
    buy: "खरीदें",
    expectedWindow: "संभावित बिक्री समय",
    confidence: "विश्वास स्तर",
    viewDetails: "विवरण देखें",
    printCard: "कार्ड प्रिंट करें",
    askPlaceholder: "गुजराती, हिंदी या अंग्रेज़ी में पूछें",
    voiceInput: "वॉइस इनपुट",
    send: "भेजें",
    assistantIntro: "सिफारिश, कच्चा माल, मांग या नकदी जोखिम के बारे में पूछें।",
    assistantRule: "Gemini समझाता है। ML अनुमान लगाता है।",
    quick1: "मुझे कितनी यूनिट बुननी चाहिए?",
    quick2: "क्या मुझे इस हफ्ते कच्चा माल खरीदना चाहिए?",
    quick3: "आपने यह सिफारिश क्यों दी?",
    quick4: "क्या मैं छोटा लोन ले सकता हूँ?",
    ordersIntro: "अगले कुछ हफ्तों की सरल उत्पादन विंडो।",
    profileIntro: "बुनकर अनुभव के लिए भाषा और उपयोग प्राथमिकताएँ।",
    accessMode: "पसंदीदा तरीका",
    accessValue: "वॉइस, क्विक एक्शन और प्रिंट कार्ड",
    cluster: "क्लस्टर",
    language: "भाषा",
    currentFocus: "मुख्य सवाल",
    currentFocusValue: "मुझे इस हफ्ते क्या करना चाहिए?",
    currentWeek: "मौजूदा हफ्ता",
    currentCash: "नकदी स्थिति",
    estimatedRevenue: "अनुमानित बिक्री मूल्य",
    rawCost: "अनुमानित कच्चा माल लागत",
    wageCost: "अनुमानित मजदूरी लागत",
    estimatedProfit: "सीधी लागत के बाद अनुमानित मार्जिन",
    weaveOptions: "मैं और क्या बुन सकता हूँ?",
    optionRange: "अनुमानित सीमा",
    cashHealthy: "ठीक",
    cashCaution: "सावधानी",
    cashRisk: "नकदी कमी की आशंका",
    noAssistant:
      "Gemini बैकएंड में जुड़ा है, लेकिन यहाँ लाइव जवाब दिखाने के लिए GEMINI_API_KEY चाहिए।",
    unsupportedVoice: "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है।",
    listening: "सुन रहा है...",
    demandHigh: "उच्च",
    demandSteady: "संतुलित",
    demandLow: "कम",
    confidenceHigh: "उच्च",
    confidenceMedium: "मध्यम",
    confidenceLow: "कम",
    reasonFestival: (festival) =>
      festival ? `${festival} के कारण मांग बढ़ रही है।` : "त्योहार की मांग बढ़ रही है।",
    reasonMomentum: "हाल की मांग स्थिर बनी हुई है।",
    reasonCash: "मांग है, लेकिन नकदी जोखिम के कारण सावधानी जरूरी है।",
    actionGreen: "योजना के अनुसार उत्पादन करें और कच्चा माल अभी तैयार रखें।",
    actionYellow: "सावधानी से उत्पादन करें और बकाया भुगतान पर नज़र रखें।",
    actionRed: "चयनात्मक उत्पादन करें और वर्किंग कैपिटल पहले से तय करें।",
    weekPlan: "बुनें",
    units: "यूनिट",
    rawMaterialThisWeek: "इस हफ्ते",
    backtest: "बैकटेस्ट",
    coverage: "कवरेज",
    festivalVsNormal: "त्योहार बनाम सामान्य",
    cashProjection: "कैशफ्लो प्रोजेक्शन",
    forecastAnalytics: "पूर्वानुमान विश्लेषण",
    todayQuestion: "मुझे इस हफ्ते क्या करना चाहिए?",
  },
  gu: {
    appTitle: "એઆઈ વીવર કમ્પેનિયન",
    adminTitle: "એડમિન ઇન્સાઇટ્સ",
    subtitle:
      "ડિમાન્ડ પ્રેડિક્શન એમએલ પાઇપલાઇનમાં જ રહે છે. આ પ્રોડક્ટ વણકરને આ અઠવાડિયે શું કરવું તે સમજાવે છે.",
    home: "હોમ",
    assistant: "એઆઈ સહાયક",
    forecast: "ફોરકાસ્ટ",
    orders: "ઓર્ડર્સ",
    profile: "પ્રોફાઇલ",
    admin: "એડમિન",
    weaver: "વણકર",
    chooseLanguage: "તમારી ભાષા પસંદ કરો",
    yourName: "તમારું નામ",
    continue: "આગળ વધો",
    greeting: "નમસ્તે",
    fallbackName: "વણકર મિત્ર",
    thisWeek: "આ અઠવાડિયે",
    demand: "માગ",
    reason: "કારણ",
    buy: "ખરીદો",
    expectedWindow: "અંદાજિત વેચાણ સમય",
    confidence: "વિશ્વાસ સ્તર",
    viewDetails: "વિગત જુઓ",
    printCard: "કાર્ડ પ્રિન્ટ કરો",
    askPlaceholder: "ગુજરાતી, હિન્દી અથવા અંગ્રેજીમાં પૂછો",
    voiceInput: "વૉઇસ ઇનપુટ",
    send: "મોકલો",
    assistantIntro: "ભલામણ, કાચામાલ, માંગ અથવા રોકડ જોખમ વિશે પૂછો.",
    assistantRule: "Gemini સમજાવે છે. ML અંદાજ આપે છે.",
    quick1: "મારે કેટલી યુનિટ વણવી જોઈએ?",
    quick2: "શું મને આ અઠવાડિયે કાચામાલ ખરીદવું જોઈએ?",
    quick3: "તમે આ ભલામણ કેમ કરી?",
    quick4: "શું હું નાનો લોન લઈ શકું?",
    ordersIntro: "આગામી થોડા અઠવાડિયાના સરળ ઉત્પાદન વિન્ડોઝ.",
    profileIntro: "વણકર અનુભવ માટે ભાષા અને ઉપયોગ પસંદગીઓ.",
    accessMode: "પસંદીદા રીત",
    accessValue: "વૉઇસ, ક્વિક એક્શન અને પ્રિન્ટ કાર્ડ",
    cluster: "ક્લસ્ટર",
    language: "ભાષા",
    currentFocus: "મુખ્ય પ્રશ્ન",
    currentFocusValue: "મારે આ અઠવાડિયે શું કરવું?",
    currentWeek: "હાલનું અઠવાડિયું",
    currentCash: "રોકડ સ્થિતિ",
    estimatedRevenue: "અંદાજિત વેચાણ મૂલ્ય",
    rawCost: "અંદાજિત કાચામાલ ખર્ચ",
    wageCost: "અંદાજિત મજૂરી ખર્ચ",
    estimatedProfit: "સીધી કિંમત પછીનો અંદાજિત માજિન",
    weaveOptions: "હજુ શું વણી શકું?",
    optionRange: "અંદાજિત રેન્જ",
    cashHealthy: "સારી",
    cashCaution: "સાવચેત",
    cashRisk: "રોકડની તંગી શક્ય",
    noAssistant:
      "Gemini બેકએન્ડમાં જોડાયેલું છે, પણ અહીં લાઇવ જવાબ માટે GEMINI_API_KEY જરૂરી છે.",
    unsupportedVoice: "આ બ્રાઉઝરમાં વૉઇસ ઇનપુટ ઉપલબ્ધ નથી.",
    listening: "સાંભળી રહ્યું છે...",
    demandHigh: "ઉંચી",
    demandSteady: "સ્થિર",
    demandLow: "ઓછી",
    confidenceHigh: "ઉંચું",
    confidenceMedium: "મધ્યમ",
    confidenceLow: "ઓછું",
    reasonFestival: (festival) =>
      festival ? `${festival} માટે માંગ વધી રહી છે.` : "તહેવાર માટે માંગ વધી રહી છે.",
    reasonMomentum: "તાજેતરની માંગ હાલ સ્થિર છે.",
    reasonCash: "માગ છે, પણ રોકડ જોખમને લીધે સાવચેત આયોજન જરૂરી છે.",
    actionGreen: "યોજનાનુસાર ઉત્પાદન કરો અને કાચામાલ હમણાં તૈયાર કરો.",
    actionYellow: "સાવચેતીથી ઉત્પાદન કરો અને વસૂલાત પર નજર રાખો.",
    actionRed: "ચોક્કસ ઉત્પાદન કરો અને વર્કિંગ કેપિટલ પહેલાંથી ગોઠવો.",
    weekPlan: "વણો",
    units: "યુનિટ",
    rawMaterialThisWeek: "આ અઠવાડિયે",
    backtest: "બેકટેસ્ટ",
    coverage: "કવરેજ",
    festivalVsNormal: "તહેવાર સામે સામાન્ય",
    cashProjection: "કેશફ્લો પ્રોજેક્શન",
    forecastAnalytics: "ફોરકાસ્ટ એનાલિટિક્સ",
    todayQuestion: "મારે આ અઠવાડિયે શું કરવું?",
  },
};

const PRODUCT_LABELS = {
  saree: { en: "Sarees", hi: "साड़ियां", gu: "સાડીઓ" },
  shawl_wrap: { en: "Shawl Wraps", hi: "शॉल रैप", gu: "શૉલ રૅપ" },
  dupatta: { en: "Dupattas", hi: "दुपट्टे", gu: "દુપટ્ટા" },
  stole: { en: "Stoles", hi: "स्टोल", gu: "સ્ટોલ" },
  yardage_fabric: { en: "Fabric Lengths", hi: "फैब्रिक लंबाई", gu: "ફેબ્રિક લંબાઈ" },
  home_furnishing: { en: "Home Furnishing", hi: "होम फर्निशिंग", gu: "હોમ ફર્નિશિંગ" },
};

const MATERIAL_LABELS = {
  silk: { en: "silk", hi: "रेशम", gu: "રેશમ" },
  cotton: { en: "cotton", hi: "कपास", gu: "કપાસ" },
  wool: { en: "wool", hi: "ऊन", gu: "ઉન" },
  "wool/cotton": { en: "wool-cotton", hi: "ऊन-कपास", gu: "ઉન-કપાસ" },
  jute: { en: "jute", hi: "जूट", gu: "જૂટ" },
};

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  return response.json();
}

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  return response.json();
}

function fmtNumber(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value ?? 0);
}

function fmtCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDate(dateString, language) {
  const locale = language === "gu" ? "gu-IN" : language === "hi" ? "hi-IN" : "en-IN";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(dateString));
}

function mapLanguageToSpeech(language) {
  if (language === "gu") return "gu-IN";
  if (language === "hi") return "hi-IN";
  return "en-IN";
}

function screenLabel(screen, t) {
  if (screen === "assistant") return t.assistant;
  if (screen === "forecast") return t.forecast;
  if (screen === "orders") return t.orders;
  if (screen === "profile") return t.profile;
  return t.home;
}

function translateCategory(category, language) {
  return PRODUCT_LABELS[category]?.[language] || category.replaceAll("_", " ");
}

function translateMaterial(material, language) {
  return MATERIAL_LABELS[material]?.[language] || material;
}

function demandText(level, t) {
  if (level === "high") return t.demandHigh;
  if (level === "low") return t.demandLow;
  return t.demandSteady;
}

function confidenceText(level, t) {
  if (level === "high") return t.confidenceHigh;
  if (level === "low") return t.confidenceLow;
  return t.confidenceMedium;
}

function cashText(status, t) {
  if (status === "red") return t.cashRisk;
  if (status === "yellow") return t.cashCaution;
  return t.cashHealthy;
}

function reasonText(brief, t) {
  if (!brief) return "";
  if (brief.reason_code === "festival") {
    return t.reasonFestival(brief.festival_name);
  }
  if (brief.reason_code === "cash_caution") {
    return t.reasonCash;
  }
  return t.reasonMomentum;
}

function actionText(status, t) {
  if (status === "red") return t.actionRed;
  if (status === "yellow") return t.actionYellow;
  return t.actionGreen;
}

function BottomNav({ activeScreen, onChange, t }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item}
          className={activeScreen === item ? "nav-pill active" : "nav-pill"}
          onClick={() => onChange(item)}
        >
          {screenLabel(item, t)}
        </button>
      ))}
    </nav>
  );
}

function ModeSwitch({ mode, onChange, t }) {
  return (
    <div className="mode-switch">
      <button
        className={mode === "weaver" ? "mode-button active" : "mode-button"}
        onClick={() => onChange("weaver")}
      >
        {t.weaver}
      </button>
      <button
        className={mode === "admin" ? "mode-button active" : "mode-button"}
        onClick={() => onChange("admin")}
      >
        {t.admin}
      </button>
    </div>
  );
}

function Header({ mode, profile, t, activeScreen, cluster }) {
  return (
    <header className="top-banner">
      <div className="top-copy">
        <p className="eyebrow">Handloom Hackathon 2026 / Phase 2</p>
        <h1>{mode === "admin" ? t.adminTitle : t.appTitle}</h1>
        <p>{t.subtitle}</p>
        <div className="meta-row">
          <span>{cluster?.cluster_name}</span>
          <span>{screenLabel(activeScreen, t)}</span>
          <span>{profile.language.toUpperCase()}</span>
        </div>
      </div>
    </header>
  );
}

function Onboarding({ profile, setProfile, onClose }) {
  const t = TEXT[profile.language];
  return (
    <div className="modal-scrim">
      <div className="modal-card">
        <p className="eyebrow">{t.appTitle}</p>
        <h2>{t.chooseLanguage}</h2>
        <div className="language-row">
          {["gu", "hi", "en"].map((language) => (
            <button
              key={language}
              className={profile.language === language ? "language-pill active" : "language-pill"}
              onClick={() => setProfile((current) => ({ ...current, language }))}
            >
              {language === "gu" ? "ગુજરાતી" : language === "hi" ? "हिंदी" : "English"}
            </button>
          ))}
        </div>
        <label className="field">
          <span>{t.yourName}</span>
          <input
            className="text-input"
            value={profile.name}
            onChange={(event) =>
              setProfile((current) => ({ ...current, name: event.target.value }))
            }
            placeholder={t.fallbackName}
          />
        </label>
        <button className="primary-button" onClick={onClose}>
          {t.continue}
        </button>
      </div>
    </div>
  );
}

function HeroActionCard({ brief, cluster, profile, onViewDetails }) {
  const t = TEXT[profile.language];
  const product = translateCategory(brief?.product_specialty, profile.language);
  const material = translateMaterial(brief?.buy_material, profile.language);
  return (
    <section className="hero-card">
      <div className="hero-card-top">
        <div>
          <p className="eyebrow">
            {t.greeting}, {profile.name || t.fallbackName}
          </p>
          <h2>{t.todayQuestion}</h2>
        </div>
        <span className={`signal-badge ${brief?.credit_status || "green"}`}>
          {cashText(brief?.credit_status, t)}
        </span>
      </div>

      <div className="week-plan">
        <span>{t.thisWeek}</span>
        <strong>
          {t.weekPlan} {fmtNumber(brief?.recommended_units)} {product}
        </strong>
      </div>

      <div className="detail-grid">
        <article className="detail-block">
          <span>{t.demand}</span>
          <strong>{demandText(brief?.demand_level, t)}</strong>
        </article>
        <article className="detail-block wide">
          <span>{t.reason}</span>
          <strong>{reasonText(brief, t)}</strong>
        </article>
        <article className="detail-block">
          <span>{t.buy}</span>
          <strong>
            {material} {t.rawMaterialThisWeek}
          </strong>
        </article>
        <article className="detail-block">
          <span>{t.expectedWindow}</span>
          <strong>
            {formatDate(brief?.expected_sell_start, profile.language)} -{" "}
            {formatDate(brief?.expected_sell_end, profile.language)}
          </strong>
        </article>
        <article className="detail-block">
          <span>{t.confidence}</span>
          <strong>{confidenceText(brief?.confidence_level, t)}</strong>
        </article>
      </div>

      <div className="action-summary">
        <p>{actionText(brief?.credit_status, t)}</p>
      </div>

      <div className="primary-row">
        <button className="primary-button" onClick={onViewDetails}>
          {t.viewDetails}
        </button>
        <button className="secondary-button" onClick={() => window.print()}>
          {t.printCard}
        </button>
      </div>

      <div className="support-strip">
        <span>
          {cluster?.cluster_name} / {translateMaterial(cluster?.primary_material, profile.language)}
        </span>
        <span>
          {t.currentWeek}: {formatDate(brief?.week_start_date, profile.language)}
        </span>
      </div>
    </section>
  );
}

function statusLabel(status, t) {
  if (status === "tight") return t.cashRisk;
  if (status === "watch") return t.cashCaution;
  return t.cashHealthy;
}

function HomeScreen({ brief, cluster, profile, onViewDetails }) {
  const t = TEXT[profile.language];
  const finance = brief?.finance_summary || {};
  const [customQty, setCustomQty] = useState(brief?.recommended_units || 1);
  const [customPrice, setCustomPrice] = useState("");
  const [customMisc, setCustomMisc] = useState("");
  const [customFinance, setCustomFinance] = useState(null);

  useEffect(() => {
    setCustomQty(brief?.recommended_units || 1);
    setCustomFinance(null);
  }, [brief?.recommended_units, brief?.product_specialty, cluster?.cluster_id]);

  useEffect(() => {
    let cancelled = false;
    async function calculateCustomFinance() {
      if (!cluster?.cluster_id || !brief?.product_specialty || !customQty) return;
      try {
        const payload = {
          cluster_id: cluster.cluster_id,
          product_category: brief.product_specialty,
          quantity: Number(customQty),
          unit_price_inr: customPrice ? Number(customPrice) : null,
          misc_cost_inr: customMisc ? Number(customMisc) : null,
          language: profile.language,
          weaver_name: profile.name || t.fallbackName,
        };
        const result = await postJson("/api/weaver/finance", payload);
        if (!cancelled) setCustomFinance(result.finance_summary);
      } catch {
        if (!cancelled) setCustomFinance(null);
      }
    }
    calculateCustomFinance();
    return () => {
      cancelled = true;
    };
  }, [cluster?.cluster_id, brief?.product_specialty, customQty, customPrice, customMisc, profile.language, profile.name]);

  return (
    <div className="screen-shell">
      <HeroActionCard
        brief={brief}
        cluster={cluster}
        profile={profile}
        onViewDetails={onViewDetails}
      />
      <section className="summary-grid">
        <div className="card money-card">
          <p className="eyebrow">This Week Money Plan</p>
          <h3>
            If you weave {fmtNumber(finance.recommended_units || brief?.recommended_units)}{" "}
            {translateCategory(brief?.product_specialty, profile.language)}
          </h3>
          <p>{finance.plain_advice || actionText(brief?.credit_status, t)}</p>
          <div className="mini-stats">
            <div>
              <span>You may earn</span>
              <strong>{fmtCurrency(finance.gross_revenue_inr)}</strong>
            </div>
            <div>
              <span>Costs</span>
              <strong>{fmtCurrency(finance.total_cost_inr)}</strong>
            </div>
            <div>
              <span>Money left</span>
              <strong>{fmtCurrency(finance.net_profit_inr)}</strong>
            </div>
          </div>
          <div className={`status-pill ${finance.cash_status === "tight" ? "red" : finance.cash_status === "watch" ? "yellow" : "green"}`}>
            {statusLabel(finance.cash_status, t)}
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">{t.currentFocus}</p>
          <h3>{t.currentFocusValue}</h3>
          <p>
            {cluster?.cluster_name} / {translateCategory(cluster?.product_specialty, profile.language)}
          </p>
          <div className="mini-stats">
            <div>
              <span>{t.confidence}</span>
              <strong>{confidenceText(brief?.confidence_level, t)}</strong>
            </div>
            <div>
              <span>{t.demand}</span>
              <strong>{demandText(brief?.demand_level, t)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="summary-grid">
        <div className="card">
          <p className="eyebrow">Cost Breakdown</p>
          <h3>Money left = selling value - total cost</h3>
          <div className="mini-stats">
            <div>
              <span>{t.rawCost}</span>
              <strong>{fmtCurrency(finance.raw_material_cost_inr)}</strong>
            </div>
            <div>
              <span>{t.wageCost}</span>
              <strong>{fmtCurrency(finance.wage_cost_inr)}</strong>
            </div>
            <div>
              <span>Loom + misc.</span>
              <strong>{fmtCurrency((finance.maintenance_cost_inr || 0) + (finance.misc_cost_inr || 0))}</strong>
            </div>
          </div>
        </div>
        <div className="card calculator-card">
          <p className="eyebrow">Try Your Own Quantity</p>
          <h3>What if I weave a different number?</h3>
          <div className="calculator-grid">
            <label className="field">
              <span>Quantity</span>
              <input className="text-input" type="number" min="1" value={customQty} onChange={(event) => setCustomQty(event.target.value)} />
            </label>
            <label className="field">
              <span>Price per piece</span>
              <input className="text-input" type="number" min="1" placeholder={fmtNumber(finance.unit_price_inr)} value={customPrice} onChange={(event) => setCustomPrice(event.target.value)} />
            </label>
            <label className="field">
              <span>Misc. cost</span>
              <input className="text-input" type="number" min="0" placeholder={fmtNumber(finance.misc_cost_inr)} value={customMisc} onChange={(event) => setCustomMisc(event.target.value)} />
            </label>
          </div>
          <p>
            For {fmtNumber(customQty)} pieces, keep around {fmtCurrency(customFinance?.total_cost_inr)} ready.
            Expected money left is {fmtCurrency(customFinance?.net_profit_inr)}.
          </p>
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Maximize Earnings</p>
        <h3>Small steps for this week</h3>
        <ul className="simple-list">
          {(finance.maximize_income_tips || []).map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <p className="eyebrow">{t.weaveOptions}</p>
        <h3>{cluster?.cluster_name}</h3>
        <div className="options-grid">
          {(brief?.weave_options || []).map((option) => (
            <article key={option.product_category} className="option-card">
              <span>
                {translateCategory(option.product_category, profile.language)}
                {option.best_choice ? " | Best choice this week" : ""}
              </span>
              <strong>
                {fmtNumber(option.recommended_units)} {t.units}
              </strong>
              <p>
                {t.optionRange}: {fmtNumber(option.forecast_lower)} -{" "}
                {fmtNumber(option.forecast_upper)}
              </p>
              <div className="option-metrics">
                <div>
                  <span>{t.estimatedRevenue}</span>
                  <strong>{fmtCurrency(option.estimated_revenue_inr)}</strong>
                </div>
                <div>
                  <span>{t.rawCost}</span>
                  <strong>{fmtCurrency(option.estimated_raw_material_cost_inr)}</strong>
                </div>
                <div>
                  <span>{t.estimatedProfit}</span>
                  <strong>{fmtCurrency(option.estimated_profit_inr)}</strong>
                </div>
                <div>
                  <span>Total cost</span>
                  <strong>{fmtCurrency(option.estimated_total_cost_inr)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AssistantScreen({
  brief,
  cluster,
  profile,
  assistantStatus,
  messages,
  input,
  setInput,
  onSend,
  assistantBusy,
  voiceState,
  onVoice,
}) {
  const t = TEXT[profile.language];
  return (
    <div className="screen-shell">
      <section className="assistant-card">
        <div className="assistant-top">
          <div>
            <p className="eyebrow">{t.assistant}</p>
            <h2>{t.assistantRule}</h2>
          </div>
          <span className="helper-chip">{cluster?.cluster_name}</span>
        </div>

        <p className="assistant-intro">{t.assistantIntro}</p>
        <div className={assistantStatus?.gemini_configured ? "helper-chip green" : "helper-chip yellow"}>
          {assistantStatus?.gemini_configured
            ? "Gemini connected. Fallback still protects finance answers."
            : "Gemini key not detected. Simple local answers are active."}
        </div>

        <div className="assistant-context">
          <strong>
            {t.thisWeek}: {fmtNumber(brief?.recommended_units)}{" "}
            {translateCategory(brief?.product_specialty, profile.language)}
          </strong>
          <span>{reasonText(brief, t)}</span>
        </div>

        <div className="quick-question-row">
          {[t.quick1, t.quick2, t.quick3, t.quick4].map((question) => (
            <button
              key={question}
              className="quick-question"
              onClick={() => setInput(question)}
            >
              {question}
            </button>
          ))}
        </div>

        <div className="message-stack">
          {messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={message.role === "assistant" ? "message assistant" : "message user"}
            >
              <strong>{message.role === "assistant" ? t.assistant : "You"}</strong>
              <p>{message.text}</p>
            </article>
          ))}
        </div>

        <div className="assistant-controls">
          <button className="voice-button" onClick={onVoice} type="button">
            {voiceState === "listening" ? t.listening : t.voiceInput}
          </button>
          <input
            className="text-input grow"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t.askPlaceholder}
          />
          <button className="primary-button compact" onClick={onSend} disabled={assistantBusy}>
            {assistantBusy ? "..." : t.send}
          </button>
        </div>
      </section>
    </div>
  );
}

function ForecastScreen({ forecastData, brief, profile, onProductChange, products }) {
  const t = TEXT[profile.language];
  const chartRows = [...(forecastData?.history || []), ...(forecastData?.future || [])];
  return (
    <div className="screen-shell">
      <section className="card large-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">{t.forecast}</p>
            <h2>{t.todayQuestion}</h2>
          </div>
          <label className="field compact">
            <span>Product</span>
            <select
              value={forecastData?.product_category || ""}
              onChange={(event) => onProductChange(event.target.value)}
            >
              {products.map((item) => (
                <option key={item} value={item}>
                  {translateCategory(item, profile.language)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartRows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cfba9d" />
            <XAxis dataKey="week_start_date" tick={{ fill: "#4f3b2a", fontSize: 12 }} />
            <YAxis tick={{ fill: "#4f3b2a", fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="upper_90" stroke="none" fill="#d6ab3e33" />
            <Area type="monotone" dataKey="lower_90" stroke="none" fill="#f8f1e1" />
            <Line type="monotone" dataKey="actual" stroke="#b2473f" strokeWidth={2.5} />
            <Line type="monotone" dataKey="predicted" stroke="#1f4465" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="forecast-footer">
          <div className="forecast-pill">
            <span>{t.thisWeek}</span>
            <strong>{fmtNumber(brief?.recommended_units)} {t.units}</strong>
          </div>
          <div className="forecast-pill">
            <span>{t.confidence}</span>
            <strong>{confidenceText(brief?.confidence_level, t)}</strong>
          </div>
          <div className="forecast-pill">
            <span>{t.reason}</span>
            <strong>{reasonText(brief, t)}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function OrdersScreen({ detail, profile }) {
  const t = TEXT[profile.language];
  const groupedRows = useMemo(() => {
    const rows = detail?.future_forecasts || [];
    const byWeek = new Map();
    rows.forEach((row) => {
      const current = byWeek.get(row.week_start_date) || {
        week_start_date: row.week_start_date,
        total: 0,
        lower: 0,
        upper: 0,
      };
      current.total += row.ensemble_pred || 0;
      current.lower += row.lower_90 || 0;
      current.upper += row.upper_90 || 0;
      byWeek.set(row.week_start_date, current);
    });
    return Array.from(byWeek.values());
  }, [detail]);

  return (
    <div className="screen-shell">
      <section className="card">
        <p className="eyebrow">{t.orders}</p>
        <h2>{t.ordersIntro}</h2>
        <div className="orders-list">
          {groupedRows.map((row) => (
            <article key={row.week_start_date} className="order-row">
              <div>
                <strong>{formatDate(row.week_start_date, profile.language)}</strong>
                <p>{fmtNumber(row.total)} {t.units}</p>
              </div>
              <div className="range-tag">
                {fmtNumber(row.lower)} - {fmtNumber(row.upper)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">{t.weaveOptions}</p>
        <h2>{formatDate(detail?.weaver_brief?.week_start_date, profile.language)}</h2>
        <div className="orders-list">
          {(detail?.weaver_brief?.weave_options || []).map((option) => (
            <article key={option.product_category} className="order-row detailed">
              <div>
                <strong>{translateCategory(option.product_category, profile.language)}</strong>
                <p>
                  {fmtNumber(option.recommended_units)} {t.units} / {t.optionRange}{" "}
                  {fmtNumber(option.forecast_lower)} - {fmtNumber(option.forecast_upper)}
                </p>
              </div>
              <div className="range-tag tall">
                <span>{t.rawCost}</span>
                <strong>{fmtCurrency(option.estimated_raw_material_cost_inr)}</strong>
                <span>{t.estimatedProfit}</span>
                <strong>{fmtCurrency(option.estimated_profit_inr)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfileScreen({ cluster, profile, setProfile, onClusterChange }) {
  const t = TEXT[profile.language];
  return (
    <div className="screen-shell">
      <section className="card">
        <p className="eyebrow">{t.profile}</p>
        <h2>{t.profileIntro}</h2>
        <div className="profile-grid">
          <label className="field">
            <span>{t.cluster}</span>
            <select value={cluster?.cluster_id || ""} onChange={(event) => onClusterChange(event.target.value)}>
              {cluster?.allClusters?.map((item) => (
                <option key={item.cluster_id} value={item.cluster_id}>
                  {item.cluster_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t.language}</span>
            <select
              value={profile.language}
              onChange={(event) =>
                setProfile((current) => ({ ...current, language: event.target.value }))
              }
            >
              <option value="gu">ગુજરાતી</option>
              <option value="hi">हिंदी</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="field">
            <span>{t.yourName}</span>
            <input
              className="text-input"
              value={profile.name}
              onChange={(event) =>
                setProfile((current) => ({ ...current, name: event.target.value }))
              }
              placeholder={t.fallbackName}
            />
          </label>
          <div className="profile-panel">
            <span>{t.accessMode}</span>
            <strong>{t.accessValue}</strong>
          </div>
          <div className="profile-panel">
            <span>{t.currentFocus}</span>
            <strong>{t.currentFocusValue}</strong>
          </div>
          <div className="profile-panel">
            <span>{t.buy}</span>
            <strong>{translateMaterial(cluster?.primary_material, profile.language)}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminView({ cluster, forecastData, cashflowData, metrics, onClusterChange, onProductChange }) {
  return (
    <section className="admin-shell">
      <div className="toolbar-card">
        <label className="field compact">
          <span>Cluster</span>
          <select value={cluster?.cluster_id || ""} onChange={(event) => onClusterChange(event.target.value)}>
            {cluster?.allClusters?.map((item) => (
              <option key={item.cluster_id} value={item.cluster_id}>
                {item.cluster_name}
              </option>
            ))}
          </select>
        </label>
        <label className="field compact">
          <span>Product</span>
          <select
            value={forecastData?.product_category || ""}
            onChange={(event) => onProductChange(event.target.value)}
          >
            {cluster?.products?.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-grid">
        <section className="card large-card">
          <p className="eyebrow">Forecast Analytics</p>
          <h2>{cluster?.cluster_name}</h2>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={[...(forecastData?.history || []), ...(forecastData?.future || [])]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfba9d" />
              <XAxis dataKey="week_start_date" tick={{ fill: "#4f3b2a", fontSize: 12 }} />
              <YAxis tick={{ fill: "#4f3b2a", fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="upper_90" stroke="none" fill="#d6ab3e44" name="Upper 90%" />
              <Area type="monotone" dataKey="lower_90" stroke="none" fill="#f8f1e1" name="Lower 90%" />
              <Line type="monotone" dataKey="actual" stroke="#b2473f" strokeWidth={2.5} name="Actual" />
              <Line type="monotone" dataKey="predicted" stroke="#1f4465" strokeWidth={2.5} name="Predicted" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="card large-card">
          <p className="eyebrow">Cashflow Projection</p>
          <h2>{cluster?.cluster_name}</h2>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={cashflowData?.rows || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cfba9d" />
              <XAxis dataKey="week_start_date" tick={{ fill: "#4f3b2a", fontSize: 12 }} />
              <YAxis tick={{ fill: "#4f3b2a", fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="projected_cash_in_inr" fill="#66744f" name="Cash In" />
              <Bar dataKey="projected_net_cashflow_inr" fill="#d6ab3e" name="Net Cashflow" />
              <Line
                type="monotone"
                dataKey="credit_need_probability"
                stroke="#b2473f"
                strokeWidth={2.5}
                name="Credit Probability"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="metrics-strip">
        <div className="metric-card">
          <span>MAPE</span>
          <strong>{metrics?.overall?.mape?.toFixed(3)}</strong>
        </div>
        <div className="metric-card">
          <span>WAPE</span>
          <strong>{metrics?.overall?.wape?.toFixed(3)}</strong>
        </div>
        <div className="metric-card">
          <span>Coverage</span>
          <strong>{metrics?.overall?.coverage_90?.toFixed(3)}</strong>
        </div>
        <div className="metric-card">
          <span>Pinball</span>
          <strong>{metrics?.overall?.pinball_loss?.toFixed(3)}</strong>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [mode, setMode] = useState("weaver");
  const [activeScreen, setActiveScreen] = useState("home");
  const [clusters, setClusters] = useState([]);
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [clusterDetail, setClusterDetail] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [cashflowData, setCashflowData] = useState(null);
  const [assistantStatus, setAssistantStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(() => {
    const stored = window.localStorage.getItem("weaver-profile");
    return stored ? JSON.parse(stored) : { name: "", language: "gu" };
  });
  const [showOnboarding, setShowOnboarding] = useState(
    !window.localStorage.getItem("weaver-profile"),
  );
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [voiceState, setVoiceState] = useState("idle");

  useEffect(() => {
    window.localStorage.setItem("weaver-profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [clusterPayload, metricPayload] = await Promise.all([
          getJson("/api/clusters"),
          getJson("/api/admin/metrics"),
        ]);
        setClusters(clusterPayload);
        setMetrics(metricPayload);
        getJson("/api/assistant/status")
          .then(setAssistantStatus)
          .catch(() => setAssistantStatus({ gemini_configured: false }));
        if (clusterPayload.length > 0) {
          setSelectedClusterId(clusterPayload[0].cluster_id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, []);

  const selectedCluster = useMemo(() => {
    const cluster = clusters.find((item) => item.cluster_id === selectedClusterId);
    if (!cluster) return null;
    return {
      ...cluster,
      allClusters: clusters,
      products: cluster.available_products || [cluster.product_specialty],
    };
  }, [clusters, selectedClusterId]);

  useEffect(() => {
    async function loadClusterData() {
      if (!selectedClusterId) return;
      try {
        const initialProduct = selectedProduct || selectedCluster?.product_specialty || "saree";
        const [detailPayload, forecastPayload, cashflowPayload] = await Promise.all([
          getJson(`/api/clusters/${selectedClusterId}`),
          getJson(
            `/api/admin/forecast?cluster_id=${selectedClusterId}&product_category=${initialProduct}`,
          ),
          getJson(`/api/admin/cashflow?cluster_id=${selectedClusterId}`),
        ]);
        setClusterDetail(detailPayload);
        setForecastData(forecastPayload);
        setCashflowData(cashflowPayload);
        setSelectedProduct(forecastPayload.product_category);
        setAssistantMessages([]);
      } catch (err) {
        setError(err.message);
      }
    }

    loadClusterData();
  }, [selectedClusterId, selectedCluster?.product_specialty]);

  async function changeProduct(product) {
    setSelectedProduct(product);
    try {
      const forecastPayload = await getJson(
        `/api/admin/forecast?cluster_id=${selectedClusterId}&product_category=${product}`,
      );
      setForecastData(forecastPayload);
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendAssistantMessage(messageText = assistantInput) {
    const trimmed = messageText.trim();
    if (!trimmed) return;
    const userMessage = { role: "user", text: trimmed };
    setAssistantMessages((current) => [...current, userMessage]);
    setAssistantInput("");
    setAssistantBusy(true);
    try {
      const response = await postJson("/api/assistant/respond", {
        cluster_id: selectedClusterId,
        question: trimmed,
        language: profile.language,
        weaver_name: profile.name || TEXT[profile.language].fallbackName,
        product_category: selectedProduct || selectedCluster?.product_specialty,
      });
      setAssistantMessages((current) => [
        ...current,
        { role: "assistant", text: response.reply },
      ]);
    } catch (err) {
      setAssistantMessages((current) => [
        ...current,
        { role: "assistant", text: TEXT[profile.language].noAssistant },
      ]);
      setError(err.message);
    } finally {
      setAssistantBusy(false);
    }
  }

  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAssistantMessages((current) => [
        ...current,
        { role: "assistant", text: TEXT[profile.language].unsupportedVoice },
      ]);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = mapLanguageToSpeech(profile.language);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setVoiceState("listening");
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setAssistantInput(transcript);
      setVoiceState("idle");
    };
    recognition.onerror = () => {
      setVoiceState("idle");
    };
    recognition.onend = () => {
      setVoiceState("idle");
    };
    recognition.start();
  }

  const t = TEXT[profile.language];
  const brief = clusterDetail?.weaver_brief;

  if (loading) {
    return (
      <div className="shell">
        <div className="card">Loading AI Weaver Companion...</div>
      </div>
    );
  }

  if (error && !selectedCluster) {
    return (
      <div className="shell">
        <div className="card error-card">{error}</div>
      </div>
    );
  }

  return (
    <div className="shell phase-two-app">
      {showOnboarding ? (
        <Onboarding
          profile={profile}
          setProfile={setProfile}
          onClose={() => setShowOnboarding(false)}
        />
      ) : null}

      <div className="header-row">
        <Header
          mode={mode}
          profile={profile}
          t={t}
          activeScreen={activeScreen}
          cluster={selectedCluster}
        />
        <ModeSwitch mode={mode} onChange={setMode} t={t} />
      </div>

      {mode === "admin" ? (
        <AdminView
          cluster={selectedCluster}
          forecastData={forecastData}
          cashflowData={cashflowData}
          metrics={metrics}
          onClusterChange={(clusterId) => {
            setSelectedClusterId(clusterId);
            setSelectedProduct("");
          }}
          onProductChange={changeProduct}
        />
      ) : (
        <>
          {activeScreen === "assistant" ? (
            <AssistantScreen
              brief={brief}
              cluster={selectedCluster}
              profile={profile}
              assistantStatus={assistantStatus}
              messages={assistantMessages}
              input={assistantInput}
              setInput={setAssistantInput}
              onSend={() => sendAssistantMessage()}
              assistantBusy={assistantBusy}
              voiceState={voiceState}
              onVoice={startVoiceInput}
            />
          ) : null}

          {activeScreen === "forecast" ? (
            <ForecastScreen
              forecastData={forecastData}
              brief={brief}
              profile={profile}
              onProductChange={changeProduct}
              products={selectedCluster?.products || []}
            />
          ) : null}

          {activeScreen === "orders" ? (
            <OrdersScreen detail={clusterDetail} profile={profile} />
          ) : null}

          {activeScreen === "profile" ? (
            <ProfileScreen
              cluster={selectedCluster}
              profile={profile}
              setProfile={setProfile}
              onClusterChange={(clusterId) => {
                setSelectedClusterId(clusterId);
                setSelectedProduct("");
              }}
            />
          ) : null}

          {activeScreen === "home" ? (
            <HomeScreen
              brief={brief}
              cluster={selectedCluster}
              profile={profile}
              onViewDetails={() => setActiveScreen("forecast")}
            />
          ) : null}

          <BottomNav activeScreen={activeScreen} onChange={setActiveScreen} t={t} />
        </>
      )}

      {error && selectedCluster ? <div className="inline-error">{error}</div> : null}
    </div>
  );
}
