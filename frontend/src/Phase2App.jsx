import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : "http://127.0.0.1:8000";
const NAV_ITEMS = ["home", "assistant", "forecast", "orders", "profile"];

const TEXT = {
  en: {
    appTitle: "AI Weaver Companion",
    adminTitle: "Admin Insights",
    greeting: "Good morning",
    fallbackName: "Weaver friend",
    thisWeek: "This week",
    demand: "Demand",
    reason: "Reason",
    buy: "Buy",
    expectedWindow: "Expected selling window",
    confidence: "Confidence",
    viewDetails: "View details",
    askPlaceholder: "Ask in Gujarati, Hindi, or English",
    send: "Send",
    voiceInput: "Voice",
    voiceListening: "Listening...",
    assistantIntro: "Voice first. Gemini explains the forecast, translation, finance, and production guidance.",
    assistantRule: "Gemini explains. Demand stays in the forecasting pipeline.",
    noAssistant: "Gemini is not available yet. Add GEMINI_API_KEY in the backend.",
    geminiKey: "Gemini API key",
    geminiKeyHint: "Stored only in this browser and sent to the backend when you ask Gemini.",
    unsupportedVoice: "Voice input is not supported in this browser.",
    quick1: "How many sarees should I weave?",
    quick2: "Should I buy silk this week?",
    quick3: "Why did you recommend this?",
    quick4: "Can I take a loan?",
    quick5: "Will demand increase?",
    homeQuestion: "What should I do this week?",
    homeSubtext: "One action, one reason, one next step.",
    financialTitle: "Cash status",
    incomeIncrease: "Income change",
    riskLevel: "Risk level",
    trafficLight: "Traffic light",
    healthy: "Green = Healthy",
    caution: "Yellow = Caution",
    shortage: "Red = Cash shortage likely",
    cashOkTitle: "Cash OK",
    cashCarefulTitle: "Be careful",
    cashShortTitle: "Cash may run short",
    nextWeeksMoney: "Next 4 weeks cash-in",
    changeProduct: "Change what I weave",
    whatIWeave: "What I weave",
    email: "Email",
    emailOptional: "Email (optional)",
    state: "State",
    setupTitle: "Set up your weaving profile",
    setupSubtitle: "Tell us who you are and what you weave. We will show how many pieces to make this week.",
    setupStart: "Show my weekly plan",
    setupDemo: "Use demo: Patan Patola sarees",
    forecastTitle: "Your demand outlook",
    forecastHint: "Simple story first. Chart second.",
    forecastRising: "Demand is rising",
    forecastSteady: "Demand is steady",
    forecastSofter: "Demand is softer",
    forecastPlan: "This week plan",
    festivalLabel: "Festival",
    pastWeeks: "Past weeks",
    nextWeeks: "Coming weeks",
    selectState: "Select state",
    selectCluster: "Select cluster",
    selectProduct: "Select product",
    nameRequired: "Please enter your name.",
    setupIncomplete: "Please choose state, cluster, and product.",
    ordersTitle: "Orders",
    ordersHint: "Plain-language status for the next few weeks.",
    profileTitle: "Profile",
    profileHint: "Language, cluster, product, and print card.",
    language: "Language",
    name: "Name",
    cluster: "Cluster",
    product: "Primary product",
    textSize: "Text size",
    printCard: "Print card",
    admin: "Admin",
    weaver: "Weaver",
    home: "Home",
    assistant: "AI Assistant",
    forecast: "Forecast",
    orders: "Orders",
    profile: "Profile",
    homeAction: "Weave",
    confidenceHigh: "High",
    confidenceMedium: "Medium",
    confidenceLow: "Low",
    demandHigh: "High",
    demandSteady: "Steady",
    demandLow: "Low",
    cashHealthy: "Healthy",
    cashCaution: "Caution",
    cashRisk: "Cash shortage likely",
    buyNow: "Buy material now",
    sellBy: "Sell by",
    viewForecast: "View forecast",
    adminMetrics: "Forecast analytics",
    adminBacktest: "Backtest",
    adminCoverage: "Confidence coverage",
    adminFeature: "Feature importance",
    adminLoss: "Pinball loss",
    statusUpcoming: "Upcoming",
    statusProduction: "In production",
    statusAwaiting: "Waiting for payment",
    statusPaid: "Paid",
    statusCancelled: "Cancelled",
    onboardingLanguage: "Choose language",
    onboardingName: "Your name",
    onboardingCluster: "Select cluster",
    onboardingProduct: "Primary product",
    onboardingContinue: "Continue",
    onboardingDone: "Start home",
    onboardingSkip: "Skip",
    adminMode: "Admin mode",
    backToWeaver: "Back to weaver",
    weaveOptions: "What else can I weave?",
  },
  hi: {
    appTitle: "एआई वीवर कंपेनियन",
    adminTitle: "एडमिन इनसाइट्स",
    greeting: "नमस्ते",
    fallbackName: "बुनकर मित्र",
    thisWeek: "इस हफ्ते",
    demand: "मांग",
    reason: "कारण",
    buy: "खरीदें",
    expectedWindow: "संभावित बिक्री समय",
    confidence: "विश्वास स्तर",
    viewDetails: "विवरण देखें",
    askPlaceholder: "गुजराती, हिंदी या अंग्रेज़ी में पूछें",
    send: "भेजें",
    voiceInput: "वॉइस",
    voiceListening: "सुन रहा है...",
    assistantIntro: "वॉइस पहले। Gemini पूर्वानुमान, अनुवाद, वित्त और उत्पादन मार्गदर्शन समझाता है।",
    assistantRule: "Gemini समझाता है। मांग पूर्वानुमान पाइपलाइन में रहती है।",
    noAssistant: "Gemini अभी उपलब्ध नहीं है। बैकएंड में GEMINI_API_KEY जोड़ें।",
    geminiKey: "Gemini API key",
    geminiKeyHint: "इसे सिर्फ इस ब्राउज़र में रखा जाता है और Gemini पूछते समय बैकएंड को भेजा जाता है।",
    unsupportedVoice: "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है।",
    quick1: "मुझे कितनी साड़ियां बुननी चाहिए?",
    quick2: "क्या मुझे इस हफ्ते रेशम खरीदना चाहिए?",
    quick3: "आपने यह सिफारिश क्यों दी?",
    quick4: "क्या मैं लोन ले सकता हूँ?",
    quick5: "क्या मांग बढ़ेगी?",
    homeQuestion: "मुझे इस हफ्ते क्या करना चाहिए?",
    homeSubtext: "एक काम, एक कारण, एक अगला कदम।",
    financialTitle: "नकदी स्थिति",
    incomeIncrease: "आय बदलाव",
    riskLevel: "जोखिम स्तर",
    trafficLight: "ट्रैफिक लाइट",
    healthy: "हरा = स्थिति ठीक",
    caution: "पीला = सावधानी",
    shortage: "लाल = नकदी कमी की आशंका",
    cashOkTitle: "नकदी ठीक",
    cashCarefulTitle: "सावधानी रखें",
    cashShortTitle: "नकदी कम पड़ सकती है",
    nextWeeksMoney: "अगले 4 हफ्तों की नकदी",
    changeProduct: "क्या बुनना है बदलें",
    whatIWeave: "मैं क्या बुनता/बुनती हूँ",
    email: "ईमेल",
    emailOptional: "ईमेल (वैकल्पिक)",
    state: "राज्य",
    setupTitle: "अपनी बुनाई प्रोफ़ाइल बनाएं",
    setupSubtitle: "नाम, राज्य और उत्पाद बताएं। हम बताएंगे इस हफ्ते कितने बनाने हैं।",
    setupStart: "मेरा साप्ताहिक प्लान दिखाएं",
    setupDemo: "डेमो: पाटन पटोला साड़ियां",
    forecastTitle: "आपकी मांग का नज़ारा",
    forecastHint: "पहले आसान बात, फिर ग्राफ।",
    forecastRising: "मांग बढ़ रही है",
    forecastSteady: "मांग स्थिर है",
    forecastSofter: "मांग थोड़ी कमजोर है",
    forecastPlan: "इस हफ्ते का प्लान",
    festivalLabel: "त्योहार",
    pastWeeks: "पिछले हफ्ते",
    nextWeeks: "आने वाले हफ्ते",
    selectState: "राज्य चुनें",
    selectCluster: "क्लस्टर चुनें",
    selectProduct: "उत्पाद चुनें",
    nameRequired: "कृपया अपना नाम लिखें।",
    setupIncomplete: "कृपया राज्य, क्लस्टर और उत्पाद चुनें।",
    ordersTitle: "ऑर्डर",
    ordersHint: "आने वाले हफ्तों की सरल स्थिति।",
    profileTitle: "प्रोफ़ाइल",
    profileHint: "भाषा, क्लस्टर, उत्पाद और प्रिंट कार्ड।",
    language: "भाषा",
    name: "नाम",
    cluster: "क्लस्टर",
    product: "मुख्य उत्पाद",
    textSize: "टेक्स्ट आकार",
    printCard: "कार्ड प्रिंट करें",
    admin: "एडमिन",
    weaver: "बुनकर",
    home: "होम",
    assistant: "एआई सहायक",
    forecast: "पूर्वानुमान",
    orders: "ऑर्डर",
    profile: "प्रोफ़ाइल",
    homeAction: "बुनें",
    confidenceHigh: "उच्च",
    confidenceMedium: "मध्यम",
    confidenceLow: "कम",
    demandHigh: "उच्च",
    demandSteady: "स्थिर",
    demandLow: "कम",
    cashHealthy: "ठीक",
    cashCaution: "सावधानी",
    cashRisk: "नकदी कमी की आशंका",
    buyNow: "कच्चा माल अभी खरीदें",
    sellBy: "इस तारीख तक बेचें",
    viewForecast: "पूर्वानुमान देखें",
    adminMetrics: "पूर्वानुमान विश्लेषण",
    adminBacktest: "बैकटेस्ट",
    adminCoverage: "विश्वास कवरेज",
    adminFeature: "फीचर महत्व",
    adminLoss: "पिनबॉल लॉस",
    statusUpcoming: "आने वाला",
    statusProduction: "उत्पादन में",
    statusAwaiting: "भुगतान बाकी",
    statusPaid: "भुगतान हो गया",
    statusCancelled: "रद्द",
    onboardingLanguage: "भाषा चुनें",
    onboardingName: "आपका नाम",
    onboardingCluster: "क्लस्टर चुनें",
    onboardingProduct: "मुख्य उत्पाद",
    onboardingContinue: "आगे बढ़ें",
    onboardingDone: "होम शुरू करें",
    onboardingSkip: "छोड़ें",
    adminMode: "एडमिन मोड",
    backToWeaver: "बुनकर मोड",
    weaveOptions: "मैं और क्या बुन सकता हूँ?",
  },
  gu: {
    appTitle: "એઆઈ વીવર કમ્પેનિયન",
    adminTitle: "એડમિન ઇન્સાઇટ્સ",
    greeting: "નમસ્તે",
    fallbackName: "વણકર મિત્ર",
    thisWeek: "આ અઠવાડિયે",
    demand: "માગ",
    reason: "કારણ",
    buy: "ખરીદો",
    expectedWindow: "અંદાજિત વેચાણ સમય",
    confidence: "વિશ્વાસ સ્તર",
    viewDetails: "વિગત જુઓ",
    askPlaceholder: "ગુજરાતી, હિન્દી અથવા અંગ્રેજીમાં પૂછો",
    send: "મોકલો",
    voiceInput: "વૉઇસ",
    voiceListening: "સાંભળી રહ્યું છે...",
    assistantIntro: "વૉઇસ પહેલા. Gemini પૂર્વાનુમાન, અનુવાદ, નાણાકીય અને ઉત્પાદન માર્ગદર્શન સમજાવે છે.",
    assistantRule: "Gemini સમજાવે છે. માંગનું પૂર્વાનુમાન પાઇપલાઇનમાં રહે છે.",
    noAssistant: "Gemini હજી ઉપલબ્ધ નથી. બેકએન્ડમાં GEMINI_API_KEY ઉમેરો.",
    geminiKey: "Gemini API key",
    geminiKeyHint: "આ માત્ર આ બ્રાઉઝરમાં સેવ થાય છે અને Gemini પૂછતી વખતે બેકએન્ડને મોકલાય છે.",
    unsupportedVoice: "આ બ્રાઉઝરમાં વૉઇસ ઇનપુટ ઉપલબ્ધ નથી.",
    quick1: "મારે કેટલી સાડીઓ વણવી જોઈએ?",
    quick2: "શું હું આ અઠવાડિયે રેશમ ખરીદું?",
    quick3: "તમે આ ભલામણ કેમ કરી?",
    quick4: "શું હું લોન લઈ શકું?",
    quick5: "શું માંગ વધશે?",
    homeQuestion: "મારે આ અઠવાડિયે શું કરવું?",
    homeSubtext: "એક કામ, એક કારણ, એક આગળનું પગલું.",
    financialTitle: "રોકડ સ્થિતિ",
    incomeIncrease: "આવક ફેરફાર",
    riskLevel: "જોખમ સ્તર",
    trafficLight: "ટ્રાફિક લાઇટ",
    healthy: "લીલો = સ્થિતિ સારી",
    caution: "પીળો = સાવચેતી",
    shortage: "લાલ = રોકડ તંગી શક્ય",
    cashOkTitle: "રોકડ સારી",
    cashCarefulTitle: "સાવધાન રહો",
    cashShortTitle: "રોકડ ઓછી પડી શકે",
    nextWeeksMoney: "આગામી 4 અઠવાડિયાની રોકડ",
    changeProduct: "શું વણવું તે બદલો",
    whatIWeave: "હું શું વણું છું",
    email: "ઈમેઈલ",
    emailOptional: "ઈમેઈલ (વૈકલ્પિક)",
    state: "રાજ્ય",
    setupTitle: "તમારી વણાટ પ્રોફાઇલ બનાવો",
    setupSubtitle: "નામ, રાજ્ય અને ઉત્પાદન કહો. અમે કહીશું આ અઠવાડિયે કેટલા બનાવવા.",
    setupStart: "મારો સાપ્તાહિક પ્લાન બતાવો",
    setupDemo: "ડેમો: પાટણ પટોલા સાડીઓ",
    forecastTitle: "તમારી માગનું ચિત્ર",
    forecastHint: "પહેલા સરળ વાત, પછી ગ્રાફ.",
    forecastRising: "માગ વધી રહી છે",
    forecastSteady: "માગ સ્થિર છે",
    forecastSofter: "માગ થોડી નબળી છે",
    forecastPlan: "આ અઠવાડિયાનો પ્લાન",
    festivalLabel: "તહેવાર",
    pastWeeks: "ગયા અઠવાડિયા",
    nextWeeks: "આવતા અઠવાડિયા",
    selectState: "રાજ્ય પસંદ કરો",
    selectCluster: "ક્લસ્ટર પસંદ કરો",
    selectProduct: "ઉત્પાદન પસંદ કરો",
    nameRequired: "કૃપા કરીને તમારું નામ લખો.",
    setupIncomplete: "કૃપા કરીને રાજ્ય, ક્લસ્ટર અને ઉત્પાદન પસંદ કરો.",
    ordersTitle: "ઓર્ડર",
    ordersHint: "આવતા અઠવાડિયાની સરળ સ્થિતિ.",
    profileTitle: "પ્રોફાઇલ",
    profileHint: "ભાષા, ક્લસ્ટર, ઉત્પાદન અને પ્રિન્ટ કાર્ડ.",
    language: "ભાષા",
    name: "નામ",
    cluster: "ક્લસ્ટર",
    product: "મુખ્ય ઉત્પાદન",
    textSize: "ટેક્સ્ટ કદ",
    printCard: "કાર્ડ પ્રિન્ટ કરો",
    admin: "એડમિન",
    weaver: "વણકર",
    home: "હોમ",
    assistant: "એઆઈ સહાયક",
    forecast: "ફોરકાસ્ટ",
    orders: "ઓર્ડર્સ",
    profile: "પ્રોફાઇલ",
    homeAction: "વણો",
    confidenceHigh: "ઉંચું",
    confidenceMedium: "મધ્યમ",
    confidenceLow: "ઓછું",
    demandHigh: "ઉંચી",
    demandSteady: "સ્થિર",
    demandLow: "ઓછી",
    cashHealthy: "સારી",
    cashCaution: "સાવચેત",
    cashRisk: "રોકડની તંગી શક્ય",
    buyNow: "કાચામાલ હમણાં ખરીદો",
    sellBy: "આ તારીખ સુધી વેચો",
    viewForecast: "પૂર્વાનુમાન જુઓ",
    adminMetrics: "પૂર્વાનુમાન વિશ્લેષણ",
    adminBacktest: "બેકટેસ્ટ",
    adminCoverage: "વિશ્વાસ કવરેજ",
    adminFeature: "ફીચર મહત્વ",
    adminLoss: "પિનબોલ લોસ",
    statusUpcoming: "આવતું",
    statusProduction: "ઉત્પાદનમાં",
    statusAwaiting: "ચુકવણી બાકી",
    statusPaid: "ચૂકવાઈ ગયું",
    statusCancelled: "રદ",
    onboardingLanguage: "ભાષા પસંદ કરો",
    onboardingName: "તમારું નામ",
    onboardingCluster: "ક્લસ્ટર પસંદ કરો",
    onboardingProduct: "મુખ્ય ઉત્પાદન",
    onboardingContinue: "આગળ વધો",
    onboardingDone: "હોમ શરૂ કરો",
    onboardingSkip: "છોડો",
    adminMode: "એડમિન મોડ",
    backToWeaver: "વણકર મોડ",
    weaveOptions: "હું બીજું શું વણી શકું?",
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

function getJson(path) {
  return fetch(`${API_BASE}${path}`).then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed: ${path}`);
    }
    return response.json();
  });
}

function postJson(path, payload) {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed: ${path}`);
    }
    return response.json();
  });
}

function fmtNumber(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value ?? 0);
}

function fmtPercent(value) {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(0)}%`;
}

function fmtCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDate(dateString, language) {
  if (!dateString) return "";
  const locale = language === "gu" ? "gu-IN" : language === "hi" ? "hi-IN" : "en-IN";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
    new Date(dateString),
  );
}

function mapLanguageToSpeech(language) {
  if (language === "gu") return "gu-IN";
  if (language === "hi") return "hi-IN";
  return "en-IN";
}

function translateCategory(category, language) {
  return PRODUCT_LABELS[category]?.[language] || category?.replaceAll("_", " ") || "";
}

function translateMaterial(material, language) {
  return MATERIAL_LABELS[material]?.[language] || material || "";
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

function statusTone(status) {
  if (status === "red") return "red";
  if (status === "yellow") return "yellow";
  return "green";
}

function reasonText(brief, t) {
  if (!brief) return "";
  if (brief.reason_code === "festival") {
    return `${brief.festival_name || "Festival"} demand is rising.`;
  }
  if (brief.reason_code === "cash_caution") {
    return t.reasonCash || "Cashflow is tight, so plan carefully.";
  }
  return t.reasonMomentum || "Recent demand is holding steady.";
}

function actionText(status, t) {
  if (status === "red") return t.actionRed || "Keep production selective and line up working capital early.";
  if (status === "yellow") return t.actionYellow || "Produce carefully and watch receivables.";
  return t.actionGreen || "Produce as planned and prepare material now.";
}

function deriveOrderStatus(row, today = new Date()) {
  if (row?.status) return row.status;
  if (row?.payment_received_date) return "paid";
  if (row?.payment_due_date && new Date(row.payment_due_date) < today) return "awaiting_payment";
  if (row?.delivery_date && new Date(row.delivery_date) > today) return "upcoming";
  if (row?.week_start_date && new Date(row.week_start_date) > today) return "upcoming";
  return "in_production";
}

function orderStatusLabel(status, t) {
  if (status === "paid") return t.statusPaid;
  if (status === "awaiting_payment") return t.statusAwaiting;
  if (status === "cancelled") return t.statusCancelled;
  if (status === "in_production") return t.statusProduction;
  return t.statusUpcoming;
}

function weeklyTrendPercent(rows) {
  const usable = (rows || [])
    .map((row) => Number(row.projected_net_cashflow_inr ?? row.net_cashflow_inr ?? row.cash_in_inr ?? 0))
    .filter((value) => Number.isFinite(value));
  if (usable.length < 8) return 0;
  const recent = usable.slice(-4);
  const previous = usable.slice(-8, -4);
  const recentAvg = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const previousAvg = previous.reduce((sum, value) => sum + value, 0) / previous.length;
  if (!previousAvg) return 0;
  return ((recentAvg - previousAvg) / Math.abs(previousAvg)) * 100;
}

function BottomNav({ activeScreen, onChange, t }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item}
          type="button"
          className={activeScreen === item ? "nav-button active" : "nav-button"}
          onClick={() => onChange(item)}
        >
          {t[item]}
        </button>
      ))}
    </nav>
  );
}

function ModeSwitch({ mode, onChange, t }) {
  return (
    <div className="mode-switch" aria-label="Mode switch">
      <button
        type="button"
        className={mode === "weaver" ? "mode-pill active" : "mode-pill"}
        onClick={() => onChange("weaver")}
      >
        {t.weaver}
      </button>
      <button
        type="button"
        className={mode === "admin" ? "mode-pill active" : "mode-pill"}
        onClick={() => onChange("admin")}
      >
        {t.admin}
      </button>
    </div>
  );
}

function QuickChip({ label, onTap }) {
  return (
    <button type="button" className="quick-chip" onClick={onTap}>
      {label}
    </button>
  );
}

function VoiceInputButton({ state, label, onClick }) {
  return (
    <button
      type="button"
      className={state === "listening" ? "voice-button listening" : "voice-button"}
      onClick={onClick}
    >
      {state === "listening" ? "◉" : "🎙"} {label}
    </button>
  );
}

function ActionCard({ brief, profile, t, onViewDetails, productOptions, onProductChange }) {
  const product = translateCategory(brief?.product_specialty || profile.productCategory, profile.language);
  const quantity = Number(brief?.recommended_units || 0);
  const quantityLow = Number(brief?.recommended_min_units ?? Math.max(0, Math.round(quantity * 0.8)));
  const quantityHigh = Number(
    brief?.recommended_max_units ?? Math.max(quantityLow + 1, Math.round(quantity * 1.2)),
  );
  const weekStart = formatDate(brief?.expected_sell_start || brief?.week_start_date, profile.language);
  const weekEnd = formatDate(brief?.expected_sell_end || brief?.week_start_date, profile.language);
  const options = productOptions?.length
    ? productOptions
    : [brief?.product_specialty || profile.productCategory].filter(Boolean);

  return (
    <section className="action-card">
      <div className="action-card-top">
        <div>
          <p className="eyebrow">
            {t.greeting} {profile.name || t.fallbackName}
          </p>
          <h2>{t.homeQuestion}</h2>
          <p className="subtle-copy">{t.homeSubtext}</p>
        </div>
        <span className={`status-pill ${statusTone(brief?.credit_status)}`}>
          {cashText(brief?.credit_status, t)}
        </span>
      </div>

      <label className="product-switcher">
        <span>{t.changeProduct}</span>
        <select
          className="select-input"
          value={profile.productCategory || brief?.product_specialty || ""}
          onChange={(event) => onProductChange?.(event.target.value)}
        >
          {options.map((item) => (
            <option key={item} value={item}>
              {translateCategory(item, profile.language)}
            </option>
          ))}
        </select>
      </label>

      <div className="hero-plan">
        <span>{t.thisWeek}</span>
        <strong>
          {t.homeAction} {fmtNumber(quantityLow)}–{fmtNumber(quantityHigh)} {product}
        </strong>
        <small>
          {fmtNumber(quantity)} {product} mid-plan
        </small>
      </div>

      <div className="action-grid">
        <article>
          <span>{t.demand}</span>
          <strong>{demandText(brief?.demand_level, t)}</strong>
        </article>
        <article className="wide">
          <span>{t.reason}</span>
          <strong>{reasonText(brief, t)}</strong>
        </article>
        <article>
          <span>{t.buy}</span>
          <strong>{translateMaterial(brief?.buy_material, profile.language)} {t.buyNow}</strong>
        </article>
        <article>
          <span>{t.expectedWindow}</span>
          <strong>{weekStart && weekEnd ? `${weekStart} - ${weekEnd}` : ""}</strong>
        </article>
        <article>
          <span>{t.confidence}</span>
          <strong>{confidenceText(brief?.confidence_level, t)}</strong>
        </article>
      </div>

      <div className="action-footer">
        <button type="button" className="button button-accent" onClick={onViewDetails}>
          {t.viewDetails}
        </button>
      </div>
    </section>
  );
}

function FinancialTrafficLightCard({ brief, cashflowData, t }) {
  const status = cashflowData?.credit_status || brief?.credit_status || "green";
  const incomeChange =
    cashflowData?.income_change_pct != null
      ? Number(cashflowData.income_change_pct)
      : weeklyTrendPercent(cashflowData?.rows || []);
  const title =
    status === "red" ? t.cashShortTitle : status === "yellow" ? t.cashCarefulTitle : t.cashOkTitle;
  const story = cashflowData?.cash_story || actionText(status, t);
  const cashIn = cashflowData?.next_4_week_cash_in_inr;
  const activeWeavers = cashflowData?.active_weavers;

  return (
    <section className={`financial-card ${statusTone(status)}`}>
      <div className="financial-top">
        <div>
          <p className="eyebrow">{t.financialTitle}</p>
          <h3>{title}</h3>
        </div>
        <span className={`traffic-dot ${statusTone(status)}`} aria-hidden="true" />
      </div>
      <div className="financial-metrics simple">
        <div>
          <span>{t.incomeIncrease}</span>
          <strong>{fmtPercent(incomeChange)}</strong>
        </div>
        {cashIn != null ? (
          <div>
            <span>{t.nextWeeksMoney}</span>
            <strong>{fmtCurrency(cashIn)}</strong>
            {activeWeavers && activeWeavers > 1 ? (
              <small style={{ color: "var(--color-ink-600)", fontSize: "0.75rem", display: "block", marginTop: 2 }}>
                your share (÷{activeWeavers} weavers in cluster)
              </small>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="financial-action">{story}</p>
    </section>
  );
}

function PrintableCard({ brief, cluster, profile, t }) {
  const product = translateCategory(brief?.product_specialty || profile.productCategory, profile.language);
  const quantity = fmtNumber(brief?.recommended_units || 0);
  const weekStart = formatDate(brief?.expected_sell_start || brief?.week_start_date, profile.language);
  const weekEnd = formatDate(brief?.expected_sell_end || brief?.week_start_date, profile.language);

  return (
    <section className="printable-card">
      <p className="eyebrow">{t.appTitle}</p>
      <h2>
        {t.greeting} {profile.name || t.fallbackName}
      </h2>
      <p className="print-hero">
        {t.homeAction} {quantity} {product}
      </p>
      <p>{reasonText(brief, t)}</p>
      <p>
        {t.buy}: {translateMaterial(brief?.buy_material, profile.language)}
      </p>
      <p>
        {t.sellBy}: {weekStart && weekEnd ? `${weekStart} - ${weekEnd}` : ""}
      </p>
      <p>
        {t.confidence}: {confidenceText(brief?.confidence_level, t)}
      </p>
      <p>
        {cluster?.cluster_name} · {translateMaterial(cluster?.primary_material, profile.language)}
      </p>
    </section>
  );
}

function SetupScreen({ clusters, profile, setProfile, onDone, loading }) {
  const t = TEXT[profile.language];
  const [formError, setFormError] = useState("");
  const [stateFilter, setStateFilter] = useState(profile.state || "");

  const states = useMemo(() => {
    return [...new Set((clusters || []).map((item) => item.state).filter(Boolean))].sort();
  }, [clusters]);

  const clustersInState = useMemo(() => {
    if (!stateFilter) return clusters || [];
    return (clusters || []).filter((item) => item.state === stateFilter);
  }, [clusters, stateFilter]);

  const selectedCluster =
    clustersInState.find((item) => item.cluster_id === profile.clusterId) || clustersInState[0];
  const productOptions =
    selectedCluster?.available_products ||
    (selectedCluster?.product_specialty ? [selectedCluster.product_specialty] : []);

  useEffect(() => {
    if (!stateFilter && states.length) {
      const preferred = profile.state || selectedCluster?.state || states[0];
      setStateFilter(preferred);
    }
  }, [stateFilter, states, profile.state, selectedCluster?.state]);

  useEffect(() => {
    if (!selectedCluster) return;
    if (profile.clusterId !== selectedCluster.cluster_id) {
      setProfile((current) => ({
        ...current,
        clusterId: selectedCluster.cluster_id,
        state: selectedCluster.state,
        productCategory: "",
      }));
    }
  }, [selectedCluster?.cluster_id]);

  useEffect(() => {
    if (!profile.productCategory && productOptions[0]) {
      setProfile((current) => ({ ...current, productCategory: productOptions[0] }));
    }
  }, [profile.productCategory, productOptions, setProfile]);

  function applyDemo() {
    const demo = (clusters || []).find((item) => item.cluster_id === "C01") || clusters?.[0];
    if (!demo) return;
    setStateFilter(demo.state);
    setProfile((current) => ({
      ...current,
      name: current.name || "Rameshbhai",
      email: current.email || "",
      state: demo.state,
      clusterId: demo.cluster_id,
      productCategory: "saree",
      language: current.language || "gu",
    }));
    setFormError("");
  }

  function handleStart() {
    if (!profile.name?.trim()) {
      setFormError(t.nameRequired);
      return;
    }
    if (!stateFilter || !profile.clusterId || !profile.productCategory) {
      setFormError(t.setupIncomplete);
      return;
    }
    const nextProfile = { ...profile, state: stateFilter, name: profile.name.trim() };
    setProfile(nextProfile);
    setFormError("");
    onDone(nextProfile);
  }

  return (
    <div className="onboarding-scrim">
      <section className="onboarding-card setup-card">
        <div className="onboarding-head">
          <div>
            <p className="eyebrow">{t.appTitle}</p>
            <h2>{t.setupTitle}</h2>
            <p className="subtle-copy">{t.setupSubtitle}</p>
          </div>
        </div>

        {loading ? <p className="subtle-copy">Loading clusters...</p> : null}

        <div className="setup-form">
          <label className="field">
            <span>{t.language}</span>
            <div className="language-row compact">
              {[
                ["gu", "ગુજરાતી"],
                ["hi", "हिंदी"],
                ["en", "English"],
              ].map(([language, label]) => (
                <button
                  key={language}
                  type="button"
                  className={profile.language === language ? "language-pill active" : "language-pill"}
                  onClick={() => setProfile((current) => ({ ...current, language }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </label>

          <label className="field">
            <span>{t.name}</span>
            <input
              className="text-input"
              value={profile.name}
              onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              placeholder={t.fallbackName}
            />
          </label>

          <label className="field">
            <span>{t.emailOptional}</span>
            <input
              className="text-input"
              type="email"
              value={profile.email || ""}
              onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
              placeholder="weaver@example.com"
            />
          </label>

          <label className="field">
            <span>{t.state}</span>
            <select
              className="select-input"
              value={stateFilter}
              onChange={(event) => {
                const nextState = event.target.value;
                setStateFilter(nextState);
                const firstCluster = (clusters || []).find((item) => item.state === nextState);
                setProfile((current) => ({
                  ...current,
                  state: nextState,
                  clusterId: firstCluster?.cluster_id || "",
                  productCategory: "",
                }));
              }}
            >
              <option value="">{t.selectState}</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t.cluster}</span>
            <select
              className="select-input"
              value={profile.clusterId || ""}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  clusterId: event.target.value,
                  productCategory: "",
                }))
              }
            >
              <option value="">{t.selectCluster}</option>
              {clustersInState.map((item) => (
                <option key={item.cluster_id} value={item.cluster_id}>
                  {item.cluster_name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t.whatIWeave}</span>
            <select
              className="select-input"
              value={profile.productCategory || ""}
              onChange={(event) => setProfile((current) => ({ ...current, productCategory: event.target.value }))}
            >
              <option value="">{t.selectProduct}</option>
              {productOptions.map((item) => (
                <option key={item} value={item}>
                  {translateCategory(item, profile.language)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {formError ? <p className="form-error">{formError}</p> : null}

        <div className="onboarding-actions">
          <button type="button" className="button button-ghost" onClick={applyDemo}>
            {t.setupDemo}
          </button>
          <button type="button" className="button button-accent" onClick={handleStart}>
            {t.setupStart}
          </button>
        </div>
      </section>
    </div>
  );
}

// ─── Festival Countdown Card ────────────────────────────────────────────────
function FestivalCountdownCard({ brief, profile }) {
  const festivals = brief?.upcoming_festivals || [];
  if (!festivals.length) return null;

  // Show next 2 upcoming festivals
  const next = festivals.slice(0, 2);

  return (
    <section className="card-surface festival-countdown-card">
      <p className="eyebrow">🪔 Festival Demand Alert</p>
      <div className="festival-list">
        {next.map((f) => {
          const urgency = f.days_away <= 7 ? "red" : f.days_away <= 21 ? "yellow" : "green";
          return (
            <div key={f.name} className={`festival-item festival-${urgency}`}>
              <div className="festival-name-row">
                <strong>{f.name}</strong>
                <span className={`festival-days-badge ${urgency}`}>
                  {f.days_away === 0 ? "Today!" : f.days_away === 1 ? "Tomorrow" : `${f.days_away} days away`}
                </span>
              </div>
              <p className="festival-date">📅 {f.display_date}</p>
              {f.days_away <= 21 && (
                <p className="festival-action">
                  {f.days_away <= 7
                    ? "⚡ Buy raw material today — demand peaks this week."
                    : f.days_away <= 14
                    ? "🛒 Start buying material now to be ready in time."
                    : "📋 Plan your production batch for this festival window."}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Finance Detail Card ─────────────────────────────────────────────────────
function FinanceDetailCard({ brief, profile }) {
  const t = TEXT[profile.language];
  const finance = brief?.finance_summary || {};
  const units = brief?.recommended_units || 0;
  const product = translateCategory(brief?.product_specialty || profile.productCategory, profile.language);

  if (!finance.gross_revenue_inr) return null;

  const marginColor = finance.profit_margin_pct >= 25 ? "green" : finance.profit_margin_pct >= 15 ? "yellow" : "red";

  return (
    <section className="card-surface finance-detail-card">
      <p className="eyebrow">💰 This Week Money Plan</p>
      <h3>
        If you weave {fmtNumber(units)} {product}
      </h3>
      <p className="subtle-copy">{finance.plain_advice}</p>

      <div className="finance-big-numbers">
        <div className="finance-number-block green">
          <span>You may earn</span>
          <strong>{fmtCurrency(finance.gross_revenue_inr)}</strong>
          <small>{fmtCurrency(finance.unit_price_inr)} per piece</small>
        </div>
        <div className="finance-number-block red">
          <span>Total costs</span>
          <strong>{fmtCurrency(finance.total_cost_inr)}</strong>
          <small>material + wages + misc</small>
        </div>
        <div className={`finance-number-block ${marginColor}`}>
          <span>Money left (profit)</span>
          <strong>{fmtCurrency(finance.net_profit_inr)}</strong>
          <small>{finance.profit_margin_pct}% margin · {fmtCurrency(finance.profit_per_unit_inr)}/piece</small>
        </div>
      </div>

      <div className="cost-breakdown">
        <p className="eyebrow" style={{ marginBottom: 8 }}>Cost breakdown</p>
        <div className="cost-bars">
          {[
            { label: "Raw material", value: finance.raw_material_cost_inr, color: "#B3462C" },
            { label: "Wages", value: finance.wage_cost_inr, color: "#26415E" },
            { label: "Loom & misc", value: (finance.maintenance_cost_inr || 0) + (finance.misc_cost_inr || 0), color: "#5c5347" },
          ].map((item) => (
            <div key={item.label} className="cost-bar-row">
              <span>{item.label}</span>
              <div className="cost-bar-track">
                <div
                  className="cost-bar-fill"
                  style={{
                    width: `${Math.min(100, (item.value / finance.total_cost_inr) * 100).toFixed(0)}%`,
                    background: item.color,
                  }}
                />
              </div>
              <strong>{fmtCurrency(item.value)}</strong>
            </div>
          ))}
        </div>
      </div>

      {(finance.maximize_income_tips || []).length > 0 && (
        <div className="tips-list">
          <p className="eyebrow" style={{ marginBottom: 6 }}>Tips to maximize earnings</p>
          <ul>
            {finance.maximize_income_tips.slice(0, 3).map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ─── Income History Section ──────────────────────────────────────────────────
function IncomeHistorySection({ historyData, profile }) {
  if (!historyData) {
    return (
      <section className="card-surface income-history-card">
        <p className="eyebrow">📈 Past Earnings</p>
        <p className="subtle-copy">Loading income history...</p>
      </section>
    );
  }

  const monthly = (historyData.monthly_earnings || []).map((m) => ({
    ...m,
    month_short: m.month_str ? m.month_str.slice(0, 7) : "",
    revenue_k: Math.round(m.total_revenue / 1000),
  }));

  const trend = Number(historyData.income_trend_pct || 0);
  const trendColor = trend >= 0 ? "green" : "red";
  const trendArrow = trend >= 0 ? "▲" : "▼";

  return (
    <section className="card-surface income-history-card">
      <div className="income-history-head">
        <div>
          <p className="eyebrow">📈 Past Earnings</p>
          <h3>Your income over last 18 months</h3>
          {historyData.active_weavers && historyData.active_weavers > 1 && (
            <p className="subtle-copy" style={{ fontSize: "0.78rem", marginTop: 2 }}>
              Cluster orders ÷ {historyData.active_weavers} weavers = your estimated share
            </p>
          )}
        </div>
        <div className="income-trend-badge" style={{ color: trendColor === "green" ? "#2e7d32" : "#B3462C" }}>
          <span>{trendArrow} {Math.abs(trend).toFixed(1)}%</span>
          <small>vs 3 months ago</small>
        </div>
      </div>

      <div className="income-stats-row">
        <div>
          <span>Best product</span>
          <strong>{translateCategory(historyData.best_product, profile.language)}</strong>
        </div>
        <div>
          <span>Avg per order</span>
          <strong>{fmtCurrency(historyData.avg_order_revenue_inr)}</strong>
        </div>
        <div>
          <span>Total (all time)</span>
          <strong>{fmtCurrency(historyData.total_lifetime_revenue_inr)}</strong>
        </div>
      </div>

      {monthly.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthly} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,83,71,0.15)" />
            <XAxis dataKey="month_short" tick={{ fill: "#5c5347", fontSize: 11 }} interval={2} />
            <YAxis tick={{ fill: "#5c5347", fontSize: 11 }} tickFormatter={(v) => `₹${v}k`} />
            <Tooltip
              formatter={(value) => [`₹${(value * 1000).toLocaleString("en-IN")}`, "Revenue"]}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Bar dataKey="revenue_k" fill="#26415E" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {(historyData.cashflow_history || []).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Weekly cash-in (last 12 weeks)</p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={historyData.cashflow_history} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,83,71,0.12)" />
              <XAxis dataKey="week_start_date" tick={{ fill: "#5c5347", fontSize: 10 }}
                tickFormatter={(d) => d ? d.slice(5) : ""} />
              <YAxis tick={{ fill: "#5c5347", fontSize: 10 }}
                tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => [fmtCurrency(v), "Cash in"]} />
              <Area type="monotone" dataKey="cash_in_inr" stroke="#B3462C" fill="rgba(179,70,44,0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

// ─── Budget Planner Section ──────────────────────────────────────────────────
function BudgetPlannerSection({ clusterId, productCategory, profile }) {
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function calculate() {
    const val = parseFloat(budget);
    if (!val || val <= 0) { setError("Please enter a valid budget amount."); return; }
    if (!clusterId) { setError("No cluster selected."); return; }
    setError(""); setLoading(true);
    try {
      const data = await postJson("/api/weaver/budget-plan", {
        cluster_id: clusterId,
        product_category: productCategory || undefined,
        budget_inr: val,
        language: profile.language,
        weaver_name: profile.name || "Weaver",
      });
      setResult(data);
    } catch (e) {
      setError("Could not calculate. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card-surface budget-planner-card">
      <p className="eyebrow">🧮 Budget Planner</p>
      <h3>How much can I earn with my budget?</h3>
      <p className="subtle-copy">
        Enter how much money you have. The AI will tell you how many pieces to make,
        how much raw material to buy, and your expected profit.
      </p>

      <div className="budget-input-row">
        <label className="field" style={{ flex: 1 }}>
          <span>My budget (₹)</span>
          <input
            className="text-input"
            type="number"
            min="100"
            step="500"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 15000"
            onKeyDown={(e) => e.key === "Enter" && calculate()}
          />
        </label>
        <button
          type="button"
          className="button button-accent"
          onClick={calculate}
          disabled={loading}
          style={{ alignSelf: "flex-end", minWidth: 90 }}
        >
          {loading ? "..." : "Calculate"}
        </button>
      </div>
      {error && <p style={{ color: "#B3462C", fontSize: "0.85rem", marginTop: 4 }}>{error}</p>}

      {result && (
        <div className="budget-result">
          <p className="budget-advice">{result.advice}</p>

          <div className="budget-scenarios">
            {Object.entries(result.scenarios).map(([key, sc]) => (
              <div key={key} className={`budget-scenario ${key === "recommended" ? "highlight" : ""}`}>
                <span className="scenario-label">
                  {key === "conservative" ? "🐢 Safe" : key === "recommended" ? "⭐ Recommended" : "🚀 Stretch"}
                </span>
                <div className="scenario-numbers">
                  <div><span>Units</span><strong>{fmtNumber(sc.units)}</strong></div>
                  <div><span>Material</span><strong>{sc.material_kg} kg</strong></div>
                  <div><span>You earn</span><strong>{fmtCurrency(sc.expected_revenue_inr)}</strong></div>
                  <div><span>Costs</span><strong>{fmtCurrency(sc.total_cost_inr)}</strong></div>
                  <div><span>Profit</span><strong style={{ color: sc.expected_profit_inr >= 0 ? "#2e7d32" : "#B3462C" }}>{fmtCurrency(sc.expected_profit_inr)}</strong></div>
                  <div><span>Margin</span><strong>{sc.profit_margin_pct}%</strong></div>
                </div>
                {key === "recommended" && (
                  <p className="scenario-note">
                    Buy {sc.material_kg} kg raw material (≈{fmtCurrency(sc.material_cost_inr)}) · Sell for {fmtCurrency(sc.expected_revenue_inr)} · Keep {fmtCurrency(sc.budget_remaining_inr)} as backup
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="budget-unit-economics">
            <div><span>Price per piece</span><strong>{fmtCurrency(result.unit_price_inr)}</strong></div>
            <div><span>Cost per piece</span><strong>{fmtCurrency(result.cost_per_unit_inr)}</strong></div>
            <div><span>Profit per piece</span><strong>{fmtCurrency(result.profit_per_unit_inr)}</strong></div>
            <div><span>Material/piece</span><strong>{result.material_kg_per_unit} kg</strong></div>
            {result.material_price_per_kg_inr > 0 && (
              <div><span>Raw material price</span><strong>₹{result.material_price_per_kg_inr}/kg</strong></div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Weave Options Card ──────────────────────────────────────────────────────
function WeaveOptionsCard({ brief, profile }) {
  const t = TEXT[profile.language];
  const options = brief?.weave_options || [];
  if (!options.length) return null;

  return (
    <section className="card-surface weave-options-card">
      <p className="eyebrow">{t.weaveOptions || "What else can I weave?"}</p>
      <h3>Alternative products this week</h3>
      <div className="weave-options-grid">
        {options.map((opt) => (
          <article key={opt.product_key} className={`weave-option-item ${opt.best_choice ? "best" : ""}`}>
            {opt.best_choice && <span className="best-badge">⭐ Best this week</span>}
            <strong>{opt.display_name}</strong>
            <div className="option-stats">
              <div><span>Units</span><strong>{fmtNumber(opt.recommended_units)}</strong></div>
              <div><span>Range</span><strong>{opt.forecast_lower}–{opt.forecast_upper}</strong></div>
              <div><span>Expected earn</span><strong>{fmtCurrency(opt.estimated_revenue_inr)}</strong></div>
              <div><span>Profit</span><strong style={{ color: opt.estimated_profit_inr >= 0 ? "#2e7d32" : "#B3462C" }}>{fmtCurrency(opt.estimated_profit_inr)}</strong></div>
            </div>
            <div className={`option-cash-pill ${opt.cash_status === "tight" ? "red" : opt.cash_status === "watch" ? "yellow" : "green"}`}>
              {opt.cash_status === "tight" ? "Tight cash" : opt.cash_status === "watch" ? "Watch cash" : "Healthy"}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HomeScreen({ brief, cluster, profile, cashflowData, historyData, onViewDetails, onAsk, onProductChange }) {
  const t = TEXT[profile.language];
  const chips = [t.quick1, t.quick3, t.quick4];
  const productOptions =
    cluster?.available_products ||
    cluster?.products ||
    (brief?.product_specialty ? [brief.product_specialty] : []);
  return (
    <div className="screen-stack">
      <ActionCard
        brief={brief}
        profile={profile}
        t={t}
        onViewDetails={onViewDetails}
        productOptions={productOptions}
        onProductChange={onProductChange}
      />
      <FestivalCountdownCard brief={brief} profile={profile} />
      <FinancialTrafficLightCard brief={brief} cashflowData={cashflowData} t={t} />
      <FinanceDetailCard brief={brief} profile={profile} />
      <WeaveOptionsCard brief={brief} profile={profile} />
      <BudgetPlannerSection
        clusterId={cluster?.cluster_id}
        productCategory={brief?.product_specialty || profile.productCategory}
        profile={profile}
      />
      <IncomeHistorySection historyData={historyData} profile={profile} />
      <div className="chip-row" aria-label="Quick questions">
        {chips.map((label) => (
          <QuickChip key={label} label={label} onTap={() => onAsk?.(label)} />
        ))}
      </div>
    </div>
  );
}

function AssistantScreen({ brief, cluster, profile, messages, input, setInput, onSend, busy, voiceState, onVoice }) {
  const t = TEXT[profile.language];
  const chips = [t.quick1, t.quick2, t.quick3, t.quick4].filter(Boolean);
  return (
    <section className="assistant-layout">
      <div className="assistant-header card-surface">
        <div>
          <p className="eyebrow">{t.assistant}</p>
          <h2>{t.assistantRule}</h2>
          <p className="subtle-copy">{t.assistantIntro}</p>
        </div>
        <span className="helper-tag">{cluster?.cluster_name}</span>
      </div>

      <div className="assistant-context card-surface">
        <strong>
          {t.thisWeek}: {fmtNumber(brief?.recommended_units || 0)} {translateCategory(brief?.product_specialty, profile.language)}
        </strong>
        <span>{reasonText(brief, t)}</span>
      </div>

      <div className="chip-row assistant-chips">
        {chips.map((label) => (
          <QuickChip key={label} label={label} onTap={() => onSend(label)} />
        ))}
      </div>

      <div className="message-stack card-surface">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>{t.assistantIntro}</p>
          </div>
        ) : null}
        {messages.map((message, index) => (
          <article key={`${message.role}-${index}`} className={message.role === "assistant" ? "message assistant" : "message user"}>
            <strong>{message.role === "assistant" ? t.assistant : "You"}</strong>
            <p>{message.text}</p>
          </article>
        ))}
      </div>

      <div className="assistant-input-row card-surface">
        <VoiceInputButton state={voiceState} label={voiceState === "listening" ? t.voiceListening : t.voiceInput} onClick={onVoice} />
        <input
          className="text-input grow"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t.askPlaceholder}
        />
        <button type="button" className="button button-primary" onClick={onSend} disabled={busy}>
          {busy ? "..." : t.send}
        </button>
      </div>
    </section>
  );
}

function ForecastScreen({ forecastData, brief, profile }) {
  const t = TEXT[profile.language];
  const history = forecastData?.history || [];
  const future = forecastData?.future || [];
  const rows = [
    ...history.map((row) => ({ ...row, period: t.pastWeeks })),
    ...future.map((row) => ({ ...row, period: t.nextWeeks, actual: undefined })),
  ];
  const festivalRows = rows.filter((row) => row.festival_name).slice(0, 4);
  const demandLevel = brief?.demand_level;
  const demandStory =
    demandLevel === "high" ? t.forecastRising : demandLevel === "low" ? t.forecastSofter : t.forecastSteady;
  const quantityLow = Number(brief?.recommended_min_units ?? brief?.recommended_units ?? 0);
  const quantityHigh = Number(brief?.recommended_max_units ?? brief?.recommended_units ?? 0);
  const festivalName = brief?.festival_name || festivalRows[0]?.festival_name || "";

  return (
    <section className="forecast-layout">
      <div className="card-surface forecast-head">
        <div>
          <p className="eyebrow">{t.forecast}</p>
          <h2>{t.forecastTitle}</h2>
          <p className="subtle-copy">{t.forecastHint}</p>
        </div>
        <span className="helper-tag">
          {translateCategory(forecastData?.product_category || brief?.product_specialty, profile.language)}
        </span>
      </div>

      <div className="forecast-story card-surface">
        <div>
          <span>{t.demand}</span>
          <strong>{demandStory}</strong>
        </div>
        <div>
          <span>{t.forecastPlan}</span>
          <strong>
            {t.homeAction} {fmtNumber(quantityLow)}–{fmtNumber(quantityHigh)}{" "}
            {translateCategory(brief?.product_specialty || profile.productCategory, profile.language)}
          </strong>
        </div>
        {festivalName ? (
          <div>
            <span>{t.festivalLabel}</span>
            <strong>{String(festivalName).replaceAll("_", " ")}</strong>
          </div>
        ) : null}
        <div>
          <span>{t.confidence}</span>
          <strong>{confidenceText(brief?.confidence_level, t)}</strong>
        </div>
        <p className="subtle-copy">{reasonText(brief, t)}</p>
      </div>

      <div className="chart-card card-surface">
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92, 83, 71, 0.18)" />
            <XAxis dataKey="week_start_date" tick={{ fill: "#5c5347", fontSize: 12 }} />
            <YAxis tick={{ fill: "#5c5347", fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [
                fmtNumber(value),
                name === "actual" ? t.pastWeeks : name === "predicted" ? t.nextWeeks : name,
              ]}
            />
            <Area type="monotone" dataKey="upper_90" stroke="none" fill="rgba(212, 174, 78, 0.18)" />
            <Area type="monotone" dataKey="lower_90" stroke="none" fill="rgba(251, 246, 236, 0.92)" />
            <Line type="monotone" dataKey="actual" stroke="#B3462C" strokeWidth={2.5} dot={false} name="actual" />
            <Line type="monotone" dataKey="predicted" stroke="#26415E" strokeWidth={2.8} dot={false} name="predicted" />
            {festivalRows.map((row) => (
              <ReferenceLine
                key={`${row.week_start_date}-${row.festival_name}`}
                x={row.week_start_date}
                stroke="#D9A441"
                strokeDasharray="4 4"
                label={{ value: row.festival_name, position: "top", fill: "#5c5347", fontSize: 10 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function OrdersScreen({ detail, profile }) {
  const t = TEXT[profile.language];
  const today = new Date();
  const rows = useMemo(() => {
    const rawRows = detail?.orders || detail?.order_rows || detail?.future_forecasts || [];
    return rawRows.map((row) => {
      const status = deriveOrderStatus(row, today);
      const quantity = Number(row.quantity ?? row.units_ordered ?? row.ensemble_pred ?? 0);
      return {
        ...row,
        status,
        quantity,
      };
    });
  }, [detail, today]);

  return (
    <section className="orders-layout">
      <div className="card-surface orders-head">
        <div>
          <p className="eyebrow">{t.orders}</p>
          <h2>{t.ordersTitle}</h2>
          <p className="subtle-copy">{t.ordersHint}</p>
        </div>
      </div>
      <div className="orders-list card-surface">
        {rows.slice(0, 8).map((row, index) => (
          <article key={`${row.week_start_date || row.order_id || index}`} className="order-item">
            <div>
              <strong>
                {formatDate(row.week_start_date || row.delivery_date || row.created_at, profile.language) || row.order_id || `Order ${index + 1}`}
              </strong>
              <p>
                {fmtNumber(row.quantity)} {translateCategory(row.product_category || row.product_specialty || "saree", profile.language)}
              </p>
            </div>
            <span className={`status-pill ${row.status === "paid" ? "green" : row.status === "awaiting_payment" ? "yellow" : "red"}`}>
              {orderStatusLabel(row.status, t)}
            </span>
          </article>
        ))}
        {rows.length === 0 ? <p className="subtle-copy">No order data available yet.</p> : null}
      </div>
    </section>
  );
}

// ─── My Earnings Card (Profile screen) ──────────────────────────────────────
function MyEarningsCard({ historyData, profile }) {
  if (!historyData) return null;

  const current = historyData.current_month_revenue_inr || 0;
  const prev = historyData.prev_month_revenue_inr || 0;
  const avg3 = historyData.recent3_avg_monthly_inr || current;
  const benchmark = historyData.benchmark_monthly_inr || 7000;
  const withAI = historyData.with_ai_monthly_inr || avg3;
  const improvPct = historyData.income_improvement_pct || 0;
  const state = historyData.state || "";

  // Month-on-month change
  const momChange = prev > 0 ? ((current - prev) / prev) * 100 : 0;
  const momArrow = momChange >= 0 ? "▲" : "▼";
  const momColor = momChange >= 0 ? "#2e7d32" : "#B3462C";

  // vs state benchmark
  const vsBenchmark = benchmark > 0 ? ((avg3 - benchmark) / benchmark) * 100 : 0;
  const benchmarkLabel = vsBenchmark >= 5 ? "Above average" : vsBenchmark <= -5 ? "Below average" : "Near average";
  const benchmarkColor = vsBenchmark >= 5 ? "#2e7d32" : vsBenchmark <= -15 ? "#B3462C" : "#b97a2a";

  // AI improvement sign
  const aiArrow = improvPct >= 0 ? "▲" : "▼";
  const aiColor = improvPct >= 0 ? "#2e7d32" : "#B3462C";

  return (
    <section className="card-surface my-earnings-card">
      <div className="my-earnings-header">
        <div>
          <p className="eyebrow">💼 My Earnings</p>
          <h3>{profile.name || "Your"} monthly income</h3>
          <p className="subtle-copy" style={{ fontSize: "0.8rem" }}>
            Your share of cluster orders · divided by weavers in your cluster
          </p>
        </div>
      </div>

      {/* Big current month number */}
      <div className="earnings-hero">
        <div className="earnings-main-number">
          <span className="earnings-label">This month</span>
          <strong className="earnings-value">{fmtCurrency(current)}</strong>
          <span className="earnings-mom" style={{ color: momColor }}>
            {momArrow} {Math.abs(momChange).toFixed(1)}% vs last month
          </span>
        </div>
        <div className="earnings-avg-number">
          <span className="earnings-label">3-month average</span>
          <strong>{fmtCurrency(avg3)}</strong>
        </div>
      </div>

      {/* Comparison row */}
      <div className="earnings-compare-row">
        <div className="earnings-compare-block">
          <span>Your avg (3 months)</span>
          <strong>{fmtCurrency(avg3)}</strong>
        </div>
        <div className="earnings-compare-divider">vs</div>
        <div className="earnings-compare-block">
          <span>{state || "State"} avg weaver</span>
          <strong>{fmtCurrency(benchmark)}</strong>
          <small style={{ color: benchmarkColor, fontWeight: 600 }}>{benchmarkLabel}</small>
        </div>
      </div>

      {/* Progress bar: your avg vs benchmark */}
      <div className="earnings-progress-wrap">
        <div className="earnings-progress-track">
          <div
            className="earnings-progress-fill"
            style={{
              width: `${Math.min(100, (avg3 / Math.max(benchmark, withAI)) * 100).toFixed(0)}%`,
              background: vsBenchmark >= 0 ? "#26415E" : "#B3462C",
            }}
          />
          <div
            className="earnings-progress-marker"
            style={{ left: `${Math.min(100, (benchmark / Math.max(benchmark, withAI)) * 100).toFixed(0)}%` }}
            title={`${state} avg: ${fmtCurrency(benchmark)}`}
          />
          <div
            className="earnings-progress-marker ai"
            style={{ left: `${Math.min(100, (withAI / Math.max(benchmark, withAI)) * 100).toFixed(0)}%` }}
            title={`With AI plan: ${fmtCurrency(withAI)}`}
          />
        </div>
        <div className="earnings-progress-legend">
          <span><span className="legend-dot you" /> You (avg)</span>
          <span><span className="legend-dot bench" /> State avg</span>
          <span><span className="legend-dot ai" /> With AI plan</span>
        </div>
      </div>

      {/* AI uplift box */}
      <div className="earnings-ai-uplift">
        <div className="ai-uplift-left">
          <p className="eyebrow" style={{ marginBottom: 4 }}>🤖 With AI recommendations</p>
          <strong className="ai-income-value">{fmtCurrency(withAI)}/month</strong>
          <p className="subtle-copy" style={{ fontSize: "0.8rem", marginTop: 2 }}>
            Based on following this week's plan (+15% on your 3-month average)
          </p>
        </div>
        <div className="ai-uplift-badge" style={{ color: aiColor }}>
          <span>{aiArrow} {Math.abs(improvPct).toFixed(1)}%</span>
          <small>vs your earlier pace</small>
        </div>
      </div>

      {/* Source note */}
      <p className="earnings-source-note">
        State benchmark from NCAER/The Hindu 2024 handloom income study.
        AI projection = your 3-month average × 1.15 (conservative 15% uplift from demand-timed production).
      </p>
    </section>
  );
}

function ProfileScreen({ cluster, profile, setProfile, onClusterChange, onProductChange, onPrint, onAdmin, historyData }) {
  const t = TEXT[profile.language];
  const productOptions = cluster?.available_products || (cluster?.product_specialty ? [cluster.product_specialty] : []);

  return (
    <section className="profile-layout">
      <div className="card-surface profile-head">
        <div>
          <p className="eyebrow">{t.profile}</p>
          <h2>{t.profileTitle}</h2>
          <p className="subtle-copy">{t.profileHint}</p>
        </div>
        <div className="profile-actions">
          <button type="button" className="button button-secondary" onClick={onAdmin}>
            {t.adminMode || t.admin}
          </button>
          <button type="button" className="button button-accent" onClick={onPrint}>
            {t.printCard}
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <label className="field card-surface">
          <span>{t.geminiKey}</span>
          <input
            className="text-input"
            value={profile.geminiApiKey || ""}
            onChange={(event) => setProfile((current) => ({ ...current, geminiApiKey: event.target.value }))}
            placeholder="AIza..."
            type="password"
            autoComplete="off"
          />
          <small className="field-help">{t.geminiKeyHint}</small>
        </label>
        <label className="field card-surface">
          <span>{t.language}</span>
          <div className="language-row compact">
            {[
              ["gu", "ગુજરાતી"],
              ["hi", "हिंदी"],
              ["en", "English"],
            ].map(([language, label]) => (
              <button
                key={language}
                type="button"
                className={profile.language === language ? "language-pill active" : "language-pill"}
                onClick={() => setProfile((current) => ({ ...current, language }))}
              >
                {label}
              </button>
            ))}
          </div>
        </label>
        <label className="field card-surface">
          <span>{t.name}</span>
          <input className="text-input" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} placeholder={TEXT[profile.language].fallbackName} />
        </label>
        <label className="field card-surface">
          <span>{t.emailOptional}</span>
          <input
            className="text-input"
            type="email"
            value={profile.email || ""}
            onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
            placeholder="weaver@example.com"
          />
        </label>
        <label className="field card-surface">
          <span>{t.cluster}</span>
          <select className="select-input" value={cluster?.cluster_id || ""} onChange={(event) => onClusterChange(event.target.value)}>
            {cluster?.allClusters?.map((item) => (
              <option key={item.cluster_id} value={item.cluster_id}>
                {item.cluster_name}
              </option>
            ))}
          </select>
        </label>
        <label className="field card-surface">
          <span>{t.product}</span>
          <select className="select-input" value={profile.productCategory || ""} onChange={(event) => onProductChange(event.target.value)}>
            {productOptions.map((item) => (
              <option key={item} value={item}>
                {translateCategory(item, profile.language)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <MyEarningsCard historyData={historyData} profile={profile} />
      <PrintableCard brief={cluster?.weaver_brief} cluster={cluster} profile={profile} t={t} />
    </section>
  );
}

function AdminView({ cluster, forecastData, cashflowData, metrics, onClusterChange, onProductChange, profile }) {
  const t = TEXT[profile.language];
  const rows = [...(forecastData?.history || []), ...(forecastData?.future || [])];
  return (
    <section className="admin-layout">
      <div className="card-surface admin-head">
        <div>
          <p className="eyebrow">{t.adminMode || t.admin}</p>
          <h2>{t.adminTitle}</h2>
          <p className="subtle-copy">{t.adminMetrics}</p>
        </div>
        <div className="admin-filters">
          <label className="field compact">
            <span>{t.cluster}</span>
            <select className="select-input" value={cluster?.cluster_id || ""} onChange={(event) => onClusterChange(event.target.value)}>
              {cluster?.allClusters?.map((item) => (
                <option key={item.cluster_id} value={item.cluster_id}>
                  {item.cluster_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field compact">
            <span>{t.product}</span>
            <select className="select-input" value={forecastData?.product_category || ""} onChange={(event) => onProductChange(event.target.value)}>
              {cluster?.products?.map((item) => (
                <option key={item} value={item}>
                  {translateCategory(item, profile.language)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="admin-grid">
        <section className="card-surface">
          <p className="eyebrow">{t.forecast}</p>
          <h3>{cluster?.cluster_name}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(92, 83, 71, 0.18)" />
              <XAxis dataKey="week_start_date" tick={{ fill: "#5c5347", fontSize: 12 }} />
              <YAxis tick={{ fill: "#5c5347", fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="upper_90" stroke="none" fill="rgba(215, 169, 60, 0.16)" />
              <Area type="monotone" dataKey="lower_90" stroke="none" fill="rgba(251, 246, 236, 0.94)" />
              <Line type="monotone" dataKey="actual" stroke="#B3462C" strokeWidth={2.3} dot={false} />
              <Line type="monotone" dataKey="predicted" stroke="#26415E" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="card-surface">
          <p className="eyebrow">{t.financialTitle}</p>
          <h3>{cluster?.cluster_name}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cashflowData?.projection_rows || cashflowData?.rows || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(92, 83, 71, 0.18)" />
              <XAxis dataKey="week_start_date" tick={{ fill: "#5c5347", fontSize: 12 }} />
              <YAxis tick={{ fill: "#5c5347", fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="projected_cash_in_inr" stroke="none" fill="rgba(92, 122, 82, 0.16)" />
              <Line type="monotone" dataKey="projected_net_cashflow_inr" stroke="#26415E" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="credit_need_probability" stroke="#B3462C" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span>MAPE</span>
          <strong>{metrics?.overall?.mape?.toFixed?.(3) || "—"}</strong>
        </div>
        <div className="metric-card">
          <span>Ensemble WAPE</span>
          <strong>{metrics?.overall?.wape?.toFixed?.(3) || "—"}</strong>
        </div>
        <div className="metric-card">
          <span>Baseline WAPE</span>
          <strong>{metrics?.overall?.baseline_wape?.toFixed?.(3) || "—"}</strong>
        </div>
        <div className="metric-card">
          <span>{t.adminCoverage}</span>
          <strong>{metrics?.overall?.coverage_90?.toFixed?.(3) || "—"}</strong>
        </div>
        <div className="metric-card">
          <span>{t.adminLoss}</span>
          <strong>{metrics?.overall?.pinball_loss?.toFixed?.(3) || "—"}</strong>
        </div>
        <div className="metric-card">
          <span>Lift vs baseline</span>
          <strong>
            {metrics?.overall?.wape != null && metrics?.overall?.baseline_wape
              ? `${(((metrics.overall.baseline_wape - metrics.overall.wape) / metrics.overall.baseline_wape) * 100).toFixed(1)}%`
              : "—"}
          </strong>
        </div>
      </div>
      <p className="subtle-copy center-note">
        Walk-forward backtest on provided demand history. Ensemble beats seasonal-naive baseline while 90% conformal bands stay calibrated.
      </p>
    </section>
  );
}

export default function Phase2App() {
  const [mode, setMode] = useState("weaver");
  const [activeScreen, setActiveScreen] = useState("home");
  const [clusters, setClusters] = useState([]);
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [clusterDetail, setClusterDetail] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [cashflowData, setCashflowData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(() => {
    const stored = window.localStorage.getItem("weaver-profile");
    const geminiApiKey = window.localStorage.getItem("gemini-api-key") || "";
    const base = stored
      ? { ...JSON.parse(stored), geminiApiKey: JSON.parse(stored).geminiApiKey || geminiApiKey }
      : {
          name: "",
          email: "",
          language: "gu",
          state: "",
          clusterId: "",
          productCategory: "",
          textSize: "large",
          geminiApiKey,
        };
    return { email: "", state: "", ...base };
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem("weaver-profile") || "null");
      return !(stored?.name && stored?.clusterId && stored?.productCategory);
    } catch {
      return true;
    }
  });
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [voiceState, setVoiceState] = useState("idle");

  useEffect(() => {
    window.localStorage.setItem("weaver-profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (profile.geminiApiKey) {
      window.localStorage.setItem("gemini-api-key", profile.geminiApiKey);
    } else {
      window.localStorage.removeItem("gemini-api-key");
    }
  }, [profile.geminiApiKey]);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [clusterPayload, metricPayload] = await Promise.all([
          getJson("/api/clusters"),
          getJson("/api/admin/metrics"),
        ]);
        setClusters(clusterPayload);
        setMetrics(metricPayload);
        const preferredCluster = profile.clusterId || clusterPayload[0]?.cluster_id || "";
        setSelectedClusterId(preferredCluster);
        if (preferredCluster && !profile.clusterId) {
          setProfile((current) => ({ ...current, clusterId: preferredCluster }));
        }
      } catch (fetchError) {
        setError(fetchError.message);
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
      products: cluster.available_products || (cluster.product_specialty ? [cluster.product_specialty] : []),
    };
  }, [clusters, selectedClusterId]);

  useEffect(() => {
    async function loadClusterData() {
      if (!selectedClusterId) return;
      try {
        const initialProduct = selectedProduct || profile.productCategory || selectedCluster?.product_specialty || "saree";
        const [detailPayload, forecastPayload, cashflowPayload, historyPayload] = await Promise.all([
          getJson(`/api/clusters/${selectedClusterId}?product_category=${initialProduct}`),
          getJson(`/api/admin/forecast?cluster_id=${selectedClusterId}&product_category=${initialProduct}`),
          getJson(`/api/admin/cashflow?cluster_id=${selectedClusterId}`),
          getJson(`/api/weaver/history?cluster_id=${selectedClusterId}&product_category=${initialProduct}`),
        ]);
        setClusterDetail(detailPayload);
        setForecastData(forecastPayload);
        setCashflowData(cashflowPayload);
        setHistoryData(historyPayload);
        setSelectedProduct(forecastPayload.product_category || initialProduct);
        setProfile((current) => ({
          ...current,
          clusterId: selectedClusterId,
          productCategory: forecastPayload.product_category || initialProduct,
        }));
        setAssistantMessages([]);
      } catch (fetchError) {
        setError(fetchError.message);
      }
    }

    loadClusterData();
  }, [selectedClusterId, selectedCluster?.product_specialty]);

  async function changeProduct(product) {
    setSelectedProduct(product);
    setProfile((current) => ({ ...current, productCategory: product }));
    try {
      const [detailPayload, forecastPayload, historyPayload] = await Promise.all([
        getJson(`/api/clusters/${selectedClusterId}?product_category=${product}`),
        getJson(`/api/admin/forecast?cluster_id=${selectedClusterId}&product_category=${product}`),
        getJson(`/api/weaver/history?cluster_id=${selectedClusterId}&product_category=${product}`),
      ]);
      setClusterDetail(detailPayload);
      setForecastData(forecastPayload);
      setHistoryData(historyPayload);
    } catch (fetchError) {
      setError(fetchError.message);
    }
  }

  async function sendAssistantMessage(messageText = assistantInput) {
    if (typeof messageText !== "string") {
      messageText = assistantInput;
    }
    const trimmed = messageText.trim();
    if (!trimmed) return;
    setAssistantMessages((current) => [...current, { role: "user", text: trimmed }]);
    setAssistantInput("");
    setAssistantBusy(true);
    try {
      const response = await postJson("/api/assistant/respond", {
        cluster_id: selectedClusterId,
        question: trimmed,
        language: profile.language,
        weaver_name: profile.name || TEXT[profile.language].fallbackName,
        product_category: selectedProduct || profile.productCategory || undefined,
        gemini_api_key: profile.geminiApiKey || undefined,
      });
      setAssistantMessages((current) => [
        ...current,
        { role: "assistant", text: response.reply || TEXT[profile.language].noAssistant },
      ]);
    } catch (assistantError) {
      setAssistantMessages((current) => [
        ...current,
        { role: "assistant", text: TEXT[profile.language].noAssistant },
      ]);
      setError(assistantError.message);
    } finally {
      setAssistantBusy(false);
    }
  }

  function askFromHome(question) {
    setActiveScreen("assistant");
    if (question) {
      window.setTimeout(() => {
        sendAssistantMessage(question);
      }, 0);
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
    recognition.onerror = () => setVoiceState("idle");
    recognition.onend = () => setVoiceState("idle");
    recognition.start();
  }

  const t = TEXT[profile.language];
  const brief = clusterDetail?.weaver_brief || {};

  if (loading) {
    return (
      <div className="shell">
        <div className="loading-card card-surface">Loading AI Weaver Companion...</div>
      </div>
    );
  }

  if (error && !selectedCluster) {
    return (
      <div className="shell">
        <div className="loading-card card-surface">{error}</div>
      </div>
    );
  }

  return (
    <div className="shell phase-two-app">
      {showOnboarding ? (
        <SetupScreen
          clusters={clusters}
          profile={profile}
          setProfile={setProfile}
          loading={loading || clusters.length === 0}
          onDone={(nextProfile) => {
            const ready = nextProfile || profile;
            if (ready.clusterId) {
              setSelectedClusterId(ready.clusterId);
            }
            if (ready.productCategory) {
              setSelectedProduct(ready.productCategory);
            }
            setShowOnboarding(false);
            setActiveScreen("home");
          }}
        />
      ) : null}

      <header className="top-bar card-surface">
        <div className="top-copy">
          <p className="eyebrow">{mode === "admin" ? t.adminTitle : t.appTitle}</p>
          <h1>
            {t.greeting} {profile.name || t.fallbackName}
          </h1>
          <p className="subtle-copy">{mode === "admin" ? t.adminMetrics : t.homeSubtext}</p>
        </div>
        <div className="top-controls">
          <button type="button" className="language-pill active">{profile.language.toUpperCase()}</button>
          <ModeSwitch mode={mode} onChange={setMode} t={t} />
        </div>
      </header>

      {mode === "admin" ? (
        <AdminView
          cluster={selectedCluster}
          forecastData={forecastData}
          cashflowData={cashflowData}
          metrics={metrics}
          onClusterChange={(clusterId) => {
            setSelectedClusterId(clusterId);
            setSelectedProduct("");
            setProfile((current) => ({ ...current, clusterId, productCategory: "" }));
          }}
          onProductChange={changeProduct}
          profile={profile}
        />
      ) : (
        <>
          {activeScreen === "home" ? (
            <HomeScreen
              brief={brief}
              cluster={selectedCluster}
              profile={profile}
              cashflowData={cashflowData}
              historyData={historyData}
              onViewDetails={() => setActiveScreen("forecast")}
              onAsk={askFromHome}
              onProductChange={changeProduct}
            />
          ) : null}
          {activeScreen === "assistant" ? (
            <AssistantScreen
              brief={brief}
              cluster={selectedCluster}
              profile={profile}
              messages={assistantMessages}
              input={assistantInput}
              setInput={setAssistantInput}
              onSend={sendAssistantMessage}
              busy={assistantBusy}
              voiceState={voiceState}
              onVoice={startVoiceInput}
            />
          ) : null}
          {activeScreen === "forecast" ? (
            <ForecastScreen forecastData={forecastData} brief={brief} profile={profile} />
          ) : null}
          {activeScreen === "orders" ? (
            <OrdersScreen detail={clusterDetail} profile={profile} />
          ) : null}
          {activeScreen === "profile" ? (
            <ProfileScreen
              cluster={selectedCluster}
              profile={profile}
              setProfile={setProfile}
              historyData={historyData}
              onClusterChange={(clusterId) => {
                setSelectedClusterId(clusterId);
                setSelectedProduct("");
                setProfile((current) => ({ ...current, clusterId, productCategory: "" }));
              }}
              onProductChange={changeProduct}
              onPrint={() => window.print()}
              onAdmin={() => setMode("admin")}
            />
          ) : null}
          <BottomNav activeScreen={activeScreen} onChange={setActiveScreen} t={t} />
        </>
      )}

      {error && selectedCluster ? <div className="inline-error card-surface">{error}</div> : null}
    </div>
  );
}
