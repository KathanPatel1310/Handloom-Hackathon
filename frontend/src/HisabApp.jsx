import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : "http://127.0.0.1:8000";

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
    const error = await response.json();
    throw new Error(error.detail || `Request failed: ${path}`);
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

function formatDate(dateString) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

const TEXT = {
  en: {
    hisabTitle: "My Hisab",
    subtitle: "Your financial memory",
    netThisMonth: "Net this month",
    moneyIn: "Money In",
    moneyOut: "Money Out",
    toReceive: "To Receive",
    toPay: "To Pay",
    addMoneyIn: "+ Money In",
    addMoneyOut: "- Money Out",
    speak: "🎤 Speak",
    addEntry: "+ Add Entry",
    recentActivity: "Recent Activity",
    viewAll: "View all",
    financialInsight: "Financial Insight",
    importantAlert: "Important Alert",
    overdue: "overdue",
    days: "days",
    view: "View",
    today: "Today",
    yesterday: "Yesterday",
    received: "received",
    spent: "spent",
    from: "from",
    noTransactions: "No transactions yet",
    startRecording: "Start by recording your first payment or expense",
    buildingHistory: "Building your history",
    continueRecording: "Continue recording to see trends",
    amount: "Amount",
    from_: "From",
    reason: "Reason/Category",
    buyer: "Buyer (optional)",
    order: "Order (optional)",
    paymentMethod: "Payment method",
    date: "Date",
    business: "Business",
    personal: "Personal",
    notes: "Notes (optional)",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    edit: "Edit",
    delete: "Delete",
    reverse: "Reverse",
    income: "Income",
    expense: "Expense",
    sale: "Sale",
    purchase: "Purchase",
    paymentReceived: "Payment Received",
    paymentMade: "Payment Made",
    personalWithdrawal: "Personal Withdrawal",
    rawMaterial: "Raw Material",
    transport: "Transport",
    packaging: "Packaging",
    labour: "Labour",
    utilities: "Utilities",
    other: "Other",
    cash: "Cash",
    upi: "UPI",
    bank: "Bank",
    credit: "Credit",
    moneyInTitle: "Money In",
    moneyOutTitle: "Money Out",
    description: "Description",
    category: "Category",
    type: "Type",
    status: "Status",
    created: "Created",
    updated: "Updated",
    source: "Source",
    manual: "Manual",
    voice: "Voice",
    order_: "Order",
    inventory: "Inventory",
    system: "System",
    confirmed: "Confirmed",
    pending: "Pending",
    reversed: "Reversed",
    overdueAlert: "Overdue Alert",
    overdueMessage: "is overdue by",
    overdueFrom: "from",
    overdueTo: "to",
    totalBusiness: "Total Business",
    received_: "Received",
    pending_: "Pending",
    usuallyPaysIn: "Usually pays in",
    daysAvg: "days on average",
    purchase: "Purchase",
    paid: "Paid",
    remaining: "Remaining",
    due: "Due",
    supplier: "Supplier",
    material: "Material",
    quantity: "Quantity (kg)",
    pricePerKg: "Price per kg",
    totalAmount: "Total Amount",
    buyerIntelligence: "Buyer Intelligence",
    supplierIntelligence: "Supplier Intelligence",
    totalSales: "Total Sales",
    orderCount: "Order Count",
    avgPaymentDays: "Avg Payment Days",
    recentTrend: "Recent Trend",
    increasing: "Increasing",
    decreasing: "Decreasing",
    stable: "Stable",
    monthlyReport: "Monthly Report",
    weeklyReport: "Weekly Report",
    dailyReport: "Daily Report",
    insights: "Insights",
    alerts: "Alerts",
    transactions: "Transactions",
    receivables: "To Receive",
    payables: "To Pay",
    parties: "Parties",
    reports: "Reports",
    filter: "Filter",
    search: "Search",
    noResults: "No results found",
    error: "Error",
    tryAgain: "Try Again",
    saveSuccess: "Saved successfully",
    deleteSuccess: "Deleted successfully",
    reverseSuccess: "Reversed successfully",
    confirmDelete: "Are you sure you want to delete this?",
    confirmReverse: "Are you sure you want to reverse this transaction?",
    yes: "Yes",
    no: "No",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    noData: "No data available",
    loading: "Loading...",
    retry: "Retry",
    voiceNotSupported: "Voice input is not supported in this browser",
    listening: "Listening...",
    couldNotUnderstand: "I couldn't understand the amount",
    understood: "I understood",
    editEntry: "Edit Entry",
    addNewEntry: "Add New Entry",
    selectParty: "Select Party",
    createNewParty: "Create New Party",
    partyName: "Party Name",
    phone: "Phone",
    partyType: "Party Type",
    buyer_: "Buyer",
    supplier_: "Supplier",
    both: "Both",
    notes_: "Notes",
    create: "Create",
    select: "Select",
    none: "None",
    all: "All",
    business_: "Business",
    personal_: "Personal",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    customRange: "Custom Range",
    fromDate: "From Date",
    toDate: "To Date",
    apply: "Apply",
    clear: "Clear",
    export: "Export",
    print: "Print",
    share: "Share",
    noAlerts: "No alerts",
    allCaughtUp: "You're all caught up!",
    overduePayment: "Overdue Payment",
    overduePaymentPayable: "Overdue Supplier Payment",
    paymentFrom: "Payment from",
    paymentTo: "Payment to",
    daysOverdue: "days overdue",
    amountDue: "Amount Due",
    dueDate: "Due Date",
    paymentHistory: "Payment History",
    noPaymentHistory: "No payment history",
    partialPayment: "Partial Payment",
    fullPayment: "Full Payment",
    advancePayment: "Advance Payment",
    outstandingBalance: "Outstanding Balance",
    paymentStatus: "Payment Status",
    markAsPaid: "Mark as Paid",
    recordPayment: "Record Payment",
    paymentAmount: "Payment Amount",
    paymentDate: "Payment Date",
    paymentMethod_: "Payment Method",
    description_: "Description",
    record: "Record",
    update: "Update",
    cancel_: "Cancel",
    back_: "Back",
    save_: "Save",
    delete_: "Delete",
    edit_: "Edit",
    view_: "View",
    close_: "Close",
    confirm_: "Confirm",
    yes_: "Yes",
    no_: "No",
    retry_: "Retry",
    tryAgain_: "Try Again",
    loading_: "Loading...",
    noData_: "No data available",
    noResults_: "No results found",
    error_: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",
    critical: "Critical",
    important: "Important",
    informational: "Informational",
    high: "High",
    medium: "Medium",
    low: "Low",
    none_: "None",
    all_: "All",
    filter_: "Filter",
    search_: "Search",
    clear_: "Clear",
    apply_: "Apply",
    export_: "Export",
    print_: "Print",
    share_: "Share",
    refresh: "Refresh",
    settings: "Settings",
    help: "Help",
    about: "About",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    feedback: "Feedback",
    reportBug: "Report Bug",
    suggestFeature: "Suggest Feature",
    language: "Language",
    english: "English",
    hindi: "Hindi",
    gujarati: "Gujarati",
    selectLanguage: "Select Language",
    profile: "Profile",
    logout: "Logout",
    login: "Login",
    signup: "Signup",
    forgotPassword: "Forgot Password",
    resetPassword: "Reset Password",
    changePassword: "Change Password",
    updateProfile: "Update Profile",
    saveProfile: "Save Profile",
    cancel_: "Cancel",
    back_: "Back",
    next_: "Next",
    previous_: "Previous",
    submit: "Submit",
    reset: "Reset",
    reset_: "Reset",
    resetAll: "Reset All",
    resetFilters: "Reset Filters",
    resetAllFilters: "Reset All Filters",
    resetAllData: "Reset All Data",
    clearAll: "Clear All",
    clearAllData: "Clear All Data",
    clearAllFilters: "Clear All Filters",
    clearFilters: "Clear Filters",
    clearData: "Clear Data",
    clearHistory: "Clear History",
    clearCache: "Clear Cache",
    clearAllData_: "Clear All Data",
    clearAllHistory: "Clear All History",
    clearAllCache: "Clear All Cache",
    clearAllFilters_: "Clear All Filters",
    clearAllData__: "Clear All Data",
    clearAllHistory_: "Clear All History",
    clearAllCache_: "Clear All Cache",
  },
  hi: {
    hisabTitle: "मेरा हिसाब",
    subtitle: "आपकी वित्तीय यादें",
    netThisMonth: "इस महीने का नेट",
    moneyIn: "पैसा आया",
    moneyOut: "पैसा गया",
    toReceive: "मिलने वाला",
    toPay: "देने वाला",
    addMoneyIn: "+ पैसा आया",
    addMoneyOut: "- पैसा गया",
    speak: "🎤 बोलें",
    addEntry: "+ एंट्री जोड़ें",
    recentActivity: "हाल की गतिविधि",
    viewAll: "सभी देखें",
    financialInsight: "वित्तीय जानकारी",
    importantAlert: "महत्वपूर्ण अलर्ट",
    overdue: "देर से",
    days: "दिन",
    view: "देखें",
    today: "आज",
    yesterday: "कल",
    received: "मिला",
    spent: "खर्च",
    from: "से",
    noTransactions: "अभी तक कोई लेनदेन नहीं",
    startRecording: "अपना पहला भुगतान या खर्च दर्ज करके शुरुआत करें",
    buildingHistory: "इतिहास बना रहे हैं",
    continueRecording: "ट्रेंड देखने के लिए दर्ज करना जारी रखें",
    amount: "राशि",
    from_: "से",
    reason: "कारण/श्रेणी",
    buyer: "खरीदार (वैकल्पिक)",
    order: "ऑर्डर (वैकल्पिक)",
    paymentMethod: "भुगतान विधि",
    date: "तारीख",
    business: "व्यापार",
    personal: "व्यक्तिगत",
    notes: "नोट्स (वैकल्पिक)",
    save: "सहेजें",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    edit: "संपादित करें",
    delete: "हटाएं",
    reverse: "वापस लें",
    income: "आय",
    expense: "खर्च",
    sale: "बिक्री",
    purchase: "खरीद",
    paymentReceived: "भुगतान प्राप्त",
    paymentMade: "भुगतान किया",
    personalWithdrawal: "व्यक्तिगत निकासी",
    rawMaterial: "कच्चा माल",
    transport: "परिवहन",
    packaging: "पैकेजिंग",
    labour: "श्रम",
    utilities: "उपयोगिताएं",
    other: "अन्य",
    cash: "नकद",
    upi: "UPI",
    bank: "बैंक",
    credit: "क्रेडिट",
    moneyInTitle: "पैसा आया",
    moneyOutTitle: "पैसा गया",
    description: "विवरण",
    category: "श्रेणी",
    type: "प्रकार",
    status: "स्थिति",
    created: "बनाया गया",
    updated: "अपडेट किया गया",
    source: "स्रोत",
    manual: "मैन्युअल",
    voice: "आवाज",
    order_: "ऑर्डर",
    inventory: "इन्वेंटरी",
    system: "सिस्टम",
    confirmed: "पुष्टि",
    pending: "लंबित",
    reversed: "वापस",
    overdueAlert: "देर से अलर्ट",
    overdueMessage: "देर से",
    overdueFrom: "से",
    overdueTo: "तक",
    totalBusiness: "कुल व्यापार",
    received_: "प्राप्त",
    pending_: "लंबित",
    usuallyPaysIn: "आमतौर पर भुगतान करता है",
    daysAvg: "दिन औसत",
    purchase: "खरीद",
    paid: "भुगतान",
    remaining: "बचा हुआ",
    due: "देय",
    supplier: "आपूर्तिकर्ता",
    material: "सामग्री",
    quantity: "मात्रा (किग्रा)",
    pricePerKg: "प्रति किग्रा कीमत",
    totalAmount: "कुल राशि",
    buyerIntelligence: "खरीदार बुद्धिमत्ता",
    supplierIntelligence: "आपूर्तिकर्ता बुद्धिमत्ता",
    totalSales: "कुल बिक्री",
    orderCount: "ऑर्डर गणना",
    avgPaymentDays: "औसत भुगतान दिन",
    recentTrend: "हाल का ट्रेंड",
    increasing: "बढ़ रहा है",
    decreasing: "घट रहा है",
    stable: "स्थिर",
    monthlyReport: "मासिक रिपोर्ट",
    weeklyReport: "साप्ताहिक रिपोर्ट",
    dailyReport: "दैनिक रिपोर्ट",
    insights: "अंतर्दृष्टि",
    alerts: "अलर्ट",
    transactions: "लेनदेन",
    receivables: "मिलने वाला",
    payables: "देने वाला",
    parties: "पार्टियां",
    reports: "रिपोर्ट",
    filter: "फ़िल्टर",
    search: "खोजें",
    noResults: "कोई परिणाम नहीं मिला",
    error: "त्रुटि",
    tryAgain: "पुनः प्रयास करें",
    saveSuccess: "सफलतापूर्वक सहेजा गया",
    deleteSuccess: "सफलतापूर्वक हटाया गया",
    reverseSuccess: "सफलतापूर्वक वापस लिया गया",
    confirmDelete: "क्या आप वाकई इसे हटाना चाहते हैं?",
    confirmReverse: "क्या आप वाकई इस लेनदेन को वापस लेना चाहते हैं?",
    yes: "हां",
    no: "नहीं",
    close: "बंद करें",
    back: "वापस",
    next: "अगला",
    previous: "पिछला",
    noData: "कोई डेटा उपलब्ध नहीं",
    loading: "लोड हो रहा है...",
    retry: "पुनः प्रयास करें",
    voiceNotSupported: "इस ब्राउज़र में आवाज इनपुट समर्थित नहीं है",
    listening: "सुन रहा है...",
    couldNotUnderstand: "मैं राशि को समझ नहीं सका",
    understood: "मैंने समझा",
    editEntry: "एंट्री संपादित करें",
    addNewEntry: "नई एंट्री जोड़ें",
    selectParty: "पार्टी चुनें",
    createNewParty: "नई पार्टी बनाएं",
    partyName: "पार्टी का नाम",
    phone: "फोन",
    partyType: "पार्टी का प्रकार",
    buyer_: "खरीदार",
    supplier_: "आपूर्तिकर्ता",
    both: "दोनों",
    notes_: "नोट्स",
    create: "बनाएं",
    select: "चुनें",
    none: "कोई नहीं",
    all: "सभी",
    business_: "व्यापार",
    personal_: "व्यक्तिगत",
    thisMonth: "इस महीने",
    lastMonth: "पिछले महीने",
    customRange: "कस्टम रेंज",
    fromDate: "तारीख से",
    toDate: "तारीख तक",
    apply: "लागू करें",
    clear: "साफ़ करें",
    export: "निर्यात करें",
    print: "प्रिंट करें",
    share: "साझा करें",
    noAlerts: "कोई अलर्ट नहीं",
    allCaughtUp: "आप सब कुछ अपडेट कर चुके हैं!",
    overduePayment: "देर से भुगतान",
    overduePaymentPayable: "देर से आपूर्तिकर्ता भुगतान",
    paymentFrom: "भुगतान से",
    paymentTo: "भुगतान तक",
    daysOverdue: "दिन देर से",
    amountDue: "देय राशि",
    dueDate: "देय तारीख",
    paymentHistory: "भुगतान इतिहास",
    noPaymentHistory: "कोई भुगतान इतिहास नहीं",
    partialPayment: "आंशिक भुगतान",
    fullPayment: "पूर्ण भुगतान",
    advancePayment: "अग्रिम भुगतान",
    outstandingBalance: "बकाया शेष",
    paymentStatus: "भुगतान स्थिति",
    markAsPaid: "भुगतान के रूप में चिह्नित करें",
    recordPayment: "भुगतान दर्ज करें",
    paymentAmount: "भुगतान राशि",
    paymentDate: "भुगतान तारीख",
    paymentMethod_: "भुगतान विधि",
    description_: "विवरण",
    record: "दर्ज करें",
    update: "अपडेट करें",
    cancel_: "रद्द करें",
    back_: "वापस",
    save_: "सहेजें",
    delete_: "हटाएं",
    edit_: "संपादित करें",
    view_: "देखें",
    close_: "बंद करें",
    confirm_: "पुष्टि करें",
    yes_: "हां",
    no_: "नहीं",
    retry_: "पुनः प्रयास करें",
    tryAgain_: "पुनः प्रयास करें",
    loading_: "लोड हो रहा है...",
    noData_: "कोई डेटा उपलब्ध नहीं",
    noResults_: "कोई परिणाम नहीं मिला",
    error_: "त्रुटि",
    success: "सफलता",
    warning: "चेतावनी",
    info: "जानकारी",
    critical: "गंभीर",
    important: "महत्वपूर्ण",
    informational: "सूचनात्मक",
    high: "उच्च",
    medium: "मध्यम",
    low: "कम",
    none_: "कोई नहीं",
    all_: "सभी",
    filter_: "फ़िल्टर",
    search_: "खोजें",
    clear_: "साफ़ करें",
    apply_: "लागू करें",
    export_: "निर्यात करें",
    print_: "प्रिंट करें",
    share_: "साझा करें",
    refresh: "रिफ्रेश करें",
    settings: "सेटिंग्स",
    help: "मदद",
    about: "के बारे में",
    privacy: "गोपनीयता",
    terms: "नियम",
    contact: "संपर्क करें",
    feedback: "फीडबैक",
    reportBug: "बग रिपोर्ट करें",
    suggestFeature: "सुविधा सुझाएं",
    language: "भाषा",
    english: "अंग्रेजी",
    hindi: "हिंदी",
    gujarati: "गुजराती",
    selectLanguage: "भाषा चुनें",
    profile: "प्रोफ़ाइल",
    logout: "लॉगआउट",
    login: "लॉगिन",
    signup: "साइनअप",
    forgotPassword: "पासवर्ड भूल गए",
    resetPassword: "पासवर्ड रीसेट करें",
    changePassword: "पासवर्ड बदलें",
    updateProfile: "प्रोफ़ाइल अपडेट करें",
    saveProfile: "प्रोफ़ाइल सहेजें",
    cancel_: "रद्द करें",
    back_: "वापस",
    next_: "अगला",
    previous_: "पिछला",
    submit: "जमा करें",
    reset: "रीसेट",
    reset_: "रीसेट",
    resetAll: "सभी रीसेट करें",
    resetFilters: "फ़िल्टर रीसेट करें",
    resetAllFilters: "सभी फ़िल्टर रीसेट करें",
    resetAllData: "सभी डेटा रीसेट करें",
    clearAll: "सभी साफ़ करें",
    clearAllData: "सभी डेटा साफ़ करें",
    clearAllFilters: "सभी फ़िल्टर साफ़ करें",
    clearFilters: "फ़िल्टर साफ़ करें",
    clearData: "डेटा साफ़ करें",
    clearHistory: "इतिहास साफ़ करें",
    clearCache: "कैश साफ़ करें",
    clearAllData_: "सभी डेटा साफ़ करें",
    clearAllHistory: "सभी इतिहास साफ़ करें",
    clearAllCache: "सभी कैश साफ़ करें",
    clearAllFilters_: "सभी फ़िल्टर साफ़ करें",
    clearAllData__: "सभी डेटा साफ़ करें",
    clearAllHistory_: "सभी इतिहास साफ़ करें",
    clearAllCache_: "सभी कैश साफ़ करें",
  },
  gu: {
    hisabTitle: "મારો હિસાબ",
    subtitle: "તમારી નાણાકીય યાદો",
    netThisMonth: "આ મહિનાનો નેટ",
    moneyIn: "પૈસા આવ્યો",
    moneyOut: "પૈસા ગયો",
    toReceive: "મળવાનો",
    toPay: "ભરવાનો",
    addMoneyIn: "+ પૈસા આવ્યો",
    addMoneyOut: "- પૈસા ગયો",
    speak: "🎤 બોલો",
    addEntry: "+ એન્ટ્રી ઉમેરો",
    recentActivity: "તાજેતરની પ્રવૃત્તિ",
    viewAll: "બધા જુઓ",
    financialInsight: "નાણાકીય જાણકારી",
    importantAlert: "મહત્વપૂર્ણ અલર્ટ",
    overdue: "મોસે થયેલ",
    days: "દિવસ",
    view: "જુઓ",
    today: "આજે",
    yesterday: "ગયા કાલે",
    received: "મળ્યું",
    spent: "ખર્ચ",
    from: "થી",
    noTransactions: "હજું સુધી કોઈ લેનદેન નથી",
    startRecording: "તમારો પહેલો ચુકવણી અથવા ખર્ચ નોંધિત કરીને શરૂ કરો",
    buildingHistory: "ઇતિહાસ બનાવી રહ્યા છીએ",
    continueRecording: "ટ્રેન્ડ જોવા માટે નોંધિત કરવા ચાલુ રાખો",
    amount: "રકમ",
    from_: "થી",
    reason: "કારણ/શ્રેણી",
    buyer: "ખરીદનાર (વૈકલ્પિક)",
    order: "ઓર્ડર (વૈકલ્પિક)",
    paymentMethod: "ચુકવણી પદ્ધતિ",
    date: "તારીખ",
    business: "વ્યવસાય",
    personal: "વ્યક્તિગત",
    notes: "નોંધો (વૈકલ્પિક)",
    save: "સાચવો",
    cancel: "રદ કરો",
    confirm: "પુષ્ટિ કરો",
    edit: "સંપાદિત કરો",
    delete: "ડિલીટ કરો",
    reverse: "ઉલટાવો",
    income: "આવક",
    expense: "ખર્ચ",
    sale: "વેચાણ",
    purchase: "ખરીદ",
    paymentReceived: "ચુકવણી મળી",
    paymentMade: "ચુકવણી કરી",
    personalWithdrawal: "વ્યક્તિગત નિકાસ",
    rawMaterial: "કાચું માલ",
    transport: "પરિવહન",
    packaging: "પેકેજિંગ",
    labour: "શ્રમ",
    utilities: "સુવિધાઓ",
    other: "અન્ય",
    cash: "નકદ",
    upi: "UPI",
    bank: "બેંક",
    credit: "ક્રેડિટ",
    moneyInTitle: "પૈસા આવ્યો",
    moneyOutTitle: "પૈસા ગયો",
    description: "વર્ણન",
    category: "શ્રેણી",
    type: "પ્રકાર",
    status: "સ્થિતિ",
    created: "બનાવવામાં આવ્યું",
    updated: "અપડેટ કરવામાં આવ્યું",
    source: "સ્ત્રોત",
    manual: "મેન્યુઅલ",
    voice: "આવાજ",
    order_: "ઓર્ડર",
    inventory: "ઇન્વેન્ટરી",
    system: "સિસ્ટમ",
    confirmed: "પુષ્ટિ",
    pending: "બાકી",
    reversed: "ઉલટાવવામાં આવ્યું",
    overdueAlert: "મોસે થયેલ અલર્ટ",
    overdueMessage: "મોસે થયેલ",
    overdueFrom: "થી",
    overdueTo: "સુધી",
    totalBusiness: "કુલ વ્યવસાય",
    received_: "મળ્યું",
    pending_: "બાકી",
    usuallyPaysIn: "સામાન્ય રીતે ચુકવણી કરે છે",
    daysAvg: "દિવસ સરેરાશ",
    purchase: "ખરીદ",
    paid: "ચુકવણી",
    remaining: "બાકી",
    due: "દેવાદાર",
    supplier: "આપૂર્ટિકર્તા",
    material: "સામગ્રી",
    quantity: "માત્રા (કિગ્રા)",
    pricePerKg: "પ્રતિ કિગ્રા ભાવ",
    totalAmount: "કુલ રકમ",
    buyerIntelligence: "ખરીદનાર બુદ્ધિમત્તા",
    supplierIntelligence: "આપૂર્ટિકર્તા બુદ્ધિમત્તા",
    totalSales: "કુલ વેચાણ",
    orderCount: "ઓર્ડર ગણતરી",
    avgPaymentDays: "સરેરાશ ચુકવણી દિવસ",
    recentTrend: "તાજેતરનો ટ્રેન્ડ",
    increasing: "વધી રહ્યું છે",
    decreasing: "ઘટી રહ્યું છે",
    stable: "સ્થિર",
    monthlyReport: "માસિક રિપોર્ટ",
    weeklyReport: "સાપ્તાહિક રિપોર્ટ",
    dailyReport: "દૈનિક રિપોર્ટ",
    insights: "અંતરદૃષ્ટિ",
    alerts: "અલર્ટ",
    transactions: "લેનદેન",
    receivables: "મળવાનો",
    payables: "ભરવાનો",
    parties: "પક્ષો",
    reports: "રિપોર્ટ",
    filter: "ફિલ્ટર",
    search: "શોધો",
    noResults: "કોઈ પરિણામ મળ્યો નથી",
    error: "ભૂલ",
    tryAgain: "પુનઃ પ્રયાસ કરો",
    saveSuccess: "સફળતાથી સાચવ્યું",
    deleteSuccess: "સફળતાથી ડિલીટ કર્યું",
    reverseSuccess: "સફળતાથી ઉલટાવ્યું",
    confirmDelete: "શું તમે ખરેખર આને ડિલીટ કરવા માંગો છો?",
    confirmReverse: "શું તમે ખરેખર આ લેનદેનને ઉલટાવવા માંગો છો?",
    yes: "હા",
    no: "નહી",
    close: "બંધ કરો",
    back: "પાછા",
    next: "આગળ",
    previous: "પહેલાં",
    noData: "કોઈ ડેટા ઉપલબ્ધ નથી",
    loading: "લોડ થઈ રહ્યું છે...",
    retry: "પુનઃ પ્રયાસ કરો",
    voiceNotSupported: "આ બ્રાઉઝરમાં આવાજ ઇનપુટ સમર્થિત નથી",
    listening: "સાંભળી રહ્યું છે...",
    couldNotUnderstand: "મેં રકમ સમજી શક્યો નથી",
    understood: "મેં સમજ્યું",
    editEntry: "એન્ટ્રી સંપાદિત કરો",
    addNewEntry: "નવી એન્ટ્રી ઉમેરો",
    selectParty: "પક્ષ પસંદ કરો",
    createNewParty: "નવો પક્ષ બનાવો",
    partyName: "પક્ષનું નામ",
    phone: "ફોન",
    partyType: "પક્ષનો પ્રકાર",
    buyer_: "ખરીદનાર",
    supplier_: "આપૂર્ટિકર્તા",
    both: "બંને",
    notes_: "નોંધો",
    create: "બનાવો",
    select: "પસંદ કરો",
    none: "કોઈ નહીં",
    all: "બધા",
    business_: "વ્યવસાય",
    personal_: "વ્યક્તિગત",
    thisMonth: "આ મહિને",
    lastMonth: "ગયા મહિને",
    customRange: "કસ્ટમ રેજ",
    fromDate: "તારીખથી",
    toDate: "તારીખ સુધી",
    apply: "લાગુ કરો",
    clear: "સાફ કરો",
    export: "નિર્યાત કરો",
    print: "પ્રિન્ટ કરો",
    share: "શેર કરો",
    noAlerts: "કોઈ અલર્ટ નથી",
    allCaughtUp: "તમે બધું અપડેટ કરી લીધું છે!",
    overduePayment: "મોસે થયેલ ચુકવણી",
    overduePaymentPayable: "મોસે થયેલ આપૂર્ટિકર્તા ચુકવણી",
    paymentFrom: "ચુકવણી થી",
    paymentTo: "ચુકવણી સુધી",
    daysOverdue: "દિવસ મોસે",
    amountDue: "દેવાદાર રકમ",
    dueDate: "દેવાદાર તારીખ",
    paymentHistory: "ચુકવણી ઇતિહાસ",
    noPaymentHistory: "કોઈ ચુકવણી ઇતિહાસ નથી",
    partialPayment: "આંશિક ચુકવણી",
    fullPayment: "પૂર્ણ ચુકવણી",
    advancePayment: "અગ્રિમ ચુકવણી",
    outstandingBalance: "બાકી શેષ",
    paymentStatus: "ચુકવણી સ્થિતિ",
    markAsPaid: "ચુકવણી તરીકે ચિહ્નિત કરો",
    recordPayment: "ચુકવણી નોંધિત કરો",
    paymentAmount: "ચુકવણી રકમ",
    paymentDate: "ચુકવણી તારીખ",
    paymentMethod_: "ચુકવણી પદ્ધતિ",
    description_: "વર્ણન",
    record: "નોંધિત કરો",
    update: "અપડેટ કરો",
    cancel_: "રદ કરો",
    back_: "પાછા",
    save_: "સાચવો",
    delete_: "ડિલીટ કરો",
    edit_: "સંપાદિત કરો",
    view_: "જુઓ",
    close_: "બંધ કરો",
    confirm_: "પુષ્ટિ કરો",
    yes_: "હા",
    no_: "નહી",
    retry_: "પુનઃ પ્રયાસ કરો",
    tryAgain_: "પુનઃ પ્રયાસ કરો",
    loading_: "લોડ થઈ રહ્યું છે...",
    noData_: "કોઈ ડેટા ઉપલબ્ધ નથી",
    noResults_: "કોઈ પરિણામ મળ્યો નથી",
    error_: "ભૂલ",
    success: "સફળતા",
    warning: "ચેતવણી",
    info: "માહિતી",
    critical: "ગંભીર",
    important: "મહત્વપૂર્ણ",
    informational: "સૂચનાત્મક",
    high: "ઉચ્ચ",
    medium: "મધ્યમ",
    low: "નીચું",
    none_: "કોઈ નહીં",
    all_: "બધા",
    filter_: "ફિલ્ટર",
    search_: "શોધો",
    clear_: "સાફ કરો",
    apply_: "લાગુ કરો",
    export_: "નિર્યાત કરો",
    print_: "પ્રિન્ટ કરો",
    share_: "શેર કરો",
    refresh: "રિફ્રેશ કરો",
    settings: "સેટિંગ્સ",
    help: "મદદ",
    about: "વિશે",
    privacy: "ગોપનીયતા",
    terms: "નિબંધો",
    contact: "સંપર્ક કરો",
    feedback: "ફીડબેક",
    reportBug: "બગ રિપોર્ટ કરો",
    suggestFeature: "સુવિધા સૂચવો",
    language: "ભાષા",
    english: "અંગ્રેજી",
    hindi: "હિન્દી",
    gujarati: "ગુજરાતી",
    selectLanguage: "ભાષા પસંદ કરો",
    profile: "પ્રોફાઇલ",
    logout: "લોગઆઉટ",
    login: "લોગિન",
    signup: "સાઇનઅપ",
    forgotPassword: "પાસવર્ડ ભૂલી ગયા",
    resetPassword: "પાસવર્ડ રીસેટ કરો",
    changePassword: "પાસવર્ડ બદલો",
    updateProfile: "પ્રોફાઇલ અપડેટ કરો",
    saveProfile: "પ્રોફાઇલ સાચવો",
    cancel_: "રદ કરો",
    back_: "પાછા",
    next_: "આગળ",
    previous_: "પહેલાં",
    submit: "સબમિટ કરો",
    reset: "રીસેટ",
    reset_: "રીસેટ",
    resetAll: "બધું રીસેટ કરો",
    resetFilters: "ફિલ્ટર રીસેટ કરો",
    resetAllFilters: "બધા ફિલ્ટર રીસેટ કરો",
    resetAllData: "બધો ડેટા રીસેટ કરો",
    clearAll: "બધું સાફ કરો",
    clearAllData: "બધો ડેટા સાફ કરો",
    clearAllFilters: "બધા ફિલ્ટર સાફ કરો",
    clearFilters: "ફિલ્ટર સાફ કરો",
    clearData: "ડેટા સાફ કરો",
    clearHistory: "ઇતિહાસ સાફ કરો",
    clearCache: "કેશ સાફ કરો",
    clearAllData_: "બધો ડેટા સાફ કરો",
    clearAllHistory: "બધો ઇતિહાસ સાફ કરો",
    clearAllCache: "બધો કેશ સાફ કરો",
    clearAllFilters_: "બધા ફિલ્ટર સાફ કરો",
    clearAllData__: "બધો ડેટા સાફ કરો",
    clearAllHistory_: "બધો ઇતિહાસ સાફ કરો",
    clearAllCache_: "બધો કેશ સાફ કરો",
  },
};

export default function HisabApp({ profile, cluster }) {
  const [language, setLanguage] = useState(profile?.language || "en");
  const [activeTab, setActiveTab] = useState("home");
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [parties, setParties] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState("income");
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBusinessPersonal, setFilterBusinessPersonal] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const t = TEXT[language];

  const weaverId = useMemo(() => {
    return cluster?.cluster_id || "C01";
  }, [cluster]);

  useEffect(() => {
    loadData();
  }, [weaverId, language]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [summaryData, transactionsData, receivablesData, payablesData, partiesData, alertsData, insightsData] = await Promise.all([
        getJson(`/api/hisab/summary?weaver_id=${weaverId}`),
        getJson(`/api/hisab/transactions?weaver_id=${weaverId}&limit=50`),
        getJson(`/api/hisab/receivables?weaver_id=${weaverId}`),
        getJson(`/api/hisab/payables?weaver_id=${weaverId}`),
        getJson(`/api/hisab/parties?weaver_id=${weaverId}`),
        getJson(`/api/hisab/alerts?weaver_id=${weaverId}`),
        getJson(`/api/hisab/insights?weaver_id=${weaverId}`),
      ]);

      setSummary(summaryData);
      setTransactions(transactionsData.transactions || []);
      setReceivables(receivablesData.receivables || []);
      setPayables(payablesData.payables || []);
      setParties(partiesData.parties || []);
      setAlerts(alertsData.alerts || []);
      setInsights(insightsData.insights || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTransaction(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      weaver_id: weaverId,
      transaction_type: formType,
      amount_inr: parseFloat(formData.get("amount")),
      category: formData.get("category") || "other",
      business_or_personal: formData.get("business_or_personal") || "business",
      payment_method: formData.get("payment_method") || "cash",
      party_id: formData.get("party_id") || null,
      order_id: formData.get("order_id") || null,
      description: formData.get("description") || "",
      transaction_date: formData.get("transaction_date") || new Date().toISOString().split("T")[0],
      source: "manual",
    };

    try {
      if (editingTransaction) {
        await postJson(`/api/hisab/transactions/${editingTransaction.id}`, payload);
      } else {
        await postJson("/api/hisab/transactions", payload);
      }
      setShowAddForm(false);
      setEditingTransaction(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReverseTransaction(transactionId) {
    if (!confirm(t.confirmReverse)) return;
    try {
      await postJson(`/api/hisab/transactions/${transactionId}/reverse`, {});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddParty(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      weaver_id: weaverId,
      name: formData.get("name"),
      phone: formData.get("phone") || null,
      type: formData.get("type") || "buyer",
      notes: formData.get("notes") || null,
    };

    try {
      const newParty = await postJson("/api/hisab/parties", payload);
      setParties([...parties, newParty]);
      setShowPartyForm(false);
    } catch (err) {
      setError(err.message);
    }
  }

  function getTransactionIcon(type) {
    switch (type) {
      case "income":
      case "sale":
      case "payment_received":
        return "↓";
      case "expense":
      case "purchase":
      case "payment_made":
        return "↑";
      case "personal_withdrawal":
        return "←";
      default:
        return "•";
    }
  }

  function getCategoryLabel(category) {
    const labels = {
      raw_material: t.rawMaterial,
      transport: t.transport,
      packaging: t.packaging,
      labour: t.labour,
      utilities: t.utilities,
      other: t.other,
    };
    return labels[category] || category;
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (tx.description && tx.description.toLowerCase().includes(query)) ||
          (tx.party_name && tx.party_name.toLowerCase().includes(query)) ||
          tx.category.toLowerCase().includes(query) ||
          tx.amount_inr.toString().includes(query);
        if (!matchesSearch) return false;
      }
      if (filterType !== "all" && tx.transaction_type !== filterType) return false;
      if (filterCategory !== "all" && tx.category !== filterCategory) return false;
      if (filterBusinessPersonal !== "all" && tx.business_or_personal !== filterBusinessPersonal) return false;
      if (dateRange.start && tx.transaction_date < dateRange.start) return false;
      if (dateRange.end && tx.transaction_date > dateRange.end) return false;
      return true;
    });
  }, [transactions, searchQuery, filterType, filterCategory, filterBusinessPersonal, dateRange]);

  if (loading) {
    return (
      <div className="hisab-shell">
        <div className="card">{t.loading}</div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="hisab-shell">
        <div className="card error-card">
          <p>{t.error}: {error}</p>
          <button className="primary-button" onClick={loadData}>{t.tryAgain}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hisab-shell">
      {showAddForm && (
        <div className="modal-scrim">
          <div className="modal-card">
            <h2>{editingTransaction ? t.editEntry : t.addNewEntry}</h2>
            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label>{t.amount} *</label>
                <input type="number" name="amount" required min="0.01" step="0.01" defaultValue={editingTransaction?.amount_inr || ""} />
              </div>
              <div className="form-group">
                <label>{t.reason}</label>
                <select name="category" defaultValue={editingTransaction?.category || "other"}>
                  <option value="raw_material">{t.rawMaterial}</option>
                  <option value="transport">{t.transport}</option>
                  <option value="packaging">{t.packaging}</option>
                  <option value="labour">{t.labour}</option>
                  <option value="utilities">{t.utilities}</option>
                  <option value="other">{t.other}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.buyer}</label>
                <select name="party_id" defaultValue={editingTransaction?.party_id || ""}>
                  <option value="">{t.none}</option>
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>{party.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t.paymentMethod}</label>
                <select name="payment_method" defaultValue={editingTransaction?.payment_method || "cash"}>
                  <option value="cash">{t.cash}</option>
                  <option value="upi">{t.upi}</option>
                  <option value="bank">{t.bank}</option>
                  <option value="credit">{t.credit}</option>
                  <option value="other">{t.other}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.date}</label>
                <input type="date" name="transaction_date" defaultValue={editingTransaction?.transaction_date || new Date().toISOString().split("T")[0]} />
              </div>
              <div className="form-group">
                <label>{t.business}</label>
                <select name="business_or_personal" defaultValue={editingTransaction?.business_or_personal || "business"}>
                  <option value="business">{t.business}</option>
                  <option value="personal">{t.personal}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.notes}</label>
                <textarea name="description" defaultValue={editingTransaction?.description || ""}></textarea>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-button">{t.save}</button>
                <button type="button" className="secondary-button" onClick={() => { setShowAddForm(false); setEditingTransaction(null); }}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPartyForm && (
        <div className="modal-scrim">
          <div className="modal-card">
            <h2>{t.createNewParty}</h2>
            <form onSubmit={handleAddParty}>
              <div className="form-group">
                <label>{t.partyName} *</label>
                <input type="text" name="name" required />
              </div>
              <div className="form-group">
                <label>{t.phone}</label>
                <input type="tel" name="phone" />
              </div>
              <div className="form-group">
                <label>{t.partyType}</label>
                <select name="type" defaultValue="buyer">
                  <option value="buyer">{t.buyer_}</option>
                  <option value="supplier">{t.supplier_}</option>
                  <option value="both">{t.both}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.notes_}</label>
                <textarea name="notes"></textarea>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-button">{t.create}</button>
                <button type="button" className="secondary-button" onClick={() => setShowPartyForm(false)}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="hisab-header">
        <h1>{t.hisabTitle}</h1>
        <p>{t.subtitle}</p>
      </div>

      {activeTab === "home" && (
        <div className="hisab-home">
          {summary && (
            <>
              <div className="hisab-summary-card">
                <p className="eyebrow">{summary.month}</p>
                <h2>{fmtCurrency(summary.net_cash_movement)}</h2>
                <p className="label">{t.netThisMonth}</p>
                <div className="summary-row">
                  <div className="summary-item">
                    <span className="icon">↓</span>
                    <div>
                      <p className="label">{t.moneyIn}</p>
                      <p className="value">{fmtCurrency(summary.money_in)}</p>
                    </div>
                  </div>
                  <div className="summary-item">
                    <span className="icon">↑</span>
                    <div>
                      <p className="label">{t.moneyOut}</p>
                      <p className="value">{fmtCurrency(summary.money_out)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hisab-actions">
                <button className="action-button money-in" onClick={() => { setFormType("income"); setShowAddForm(true); }}>
                  {t.addMoneyIn}
                </button>
                <button className="action-button money-out" onClick={() => { setFormType("expense"); setShowAddForm(true); }}>
                  {t.addMoneyOut}
                </button>
                <button className="action-button speak" onClick={() => alert(t.voiceNotSupported)}>
                  {t.speak}
                </button>
              </div>

              {alerts.length > 0 && (
                <div className="hisab-alerts">
                  <h3>{t.importantAlert}</h3>
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.entity_id} className={`alert-card ${alert.priority}`}>
                      <div className="alert-content">
                        <p className="alert-message">{alert.message}</p>
                        <p className="alert-subtitle">{alert.subtitle}</p>
                      </div>
                      <button className="alert-action" onClick={() => setActiveTab("receivables")}>{t.view}</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="hisab-quick-stats">
                <div className="quick-stat">
                  <p className="label">{t.toReceive}</p>
                  <p className="value">{fmtCurrency(summary.to_receive)}</p>
                </div>
                <div className="quick-stat">
                  <p className="label">{t.toPay}</p>
                  <p className="value">{fmtCurrency(summary.to_pay)}</p>
                </div>
              </div>

              {insights.length > 0 && (
                <div className="hisab-insights">
                  <h3>{t.financialInsight}</h3>
                  {insights.map((insight, index) => (
                    <div key={index} className="insight-card">
                      <p className="insight-title">{insight.title}</p>
                      <p className="insight-message">{insight.message}</p>
                      {insight.comparison && <p className="insight-comparison">{insight.comparison}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div className="hisab-recent">
                <div className="section-header">
                  <h3>{t.recentActivity}</h3>
                  <button className="text-button" onClick={() => setActiveTab("transactions")}>{t.viewAll}</button>
                </div>
                {filteredTransactions.length === 0 ? (
                  <div className="empty-state">
                    <p>{t.noTransactions}</p>
                    <p>{t.startRecording}</p>
                  </div>
                ) : (
                  <div className="transaction-list">
                    {filteredTransactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="transaction-item">
                        <div className="tx-icon">{getTransactionIcon(tx.transaction_type)}</div>
                        <div className="tx-details">
                          <p className="tx-description">{tx.description || getCategoryLabel(tx.category)}</p>
                          <p className="tx-meta">
                            {tx.party_name && <span>{tx.party_name}</span>}
                            <span>{formatDate(tx.transaction_date)}</span>
                          </p>
                        </div>
                        <div className={`tx-amount ${tx.transaction_type.includes("received") || tx.transaction_type.includes("income") || tx.transaction_type.includes("sale") ? "positive" : "negative"}`}>
                          {fmtCurrency(tx.amount_inr)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="hisab-transactions">
          <div className="hisab-filters">
            <input
              type="text"
              placeholder={t.search_}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">{t.all_}</option>
              <option value="income">{t.income}</option>
              <option value="expense">{t.expense}</option>
              <option value="sale">{t.sale}</option>
              <option value="purchase">{t.purchase}</option>
              <option value="payment_received">{t.paymentReceived}</option>
              <option value="payment_made">{t.paymentMade}</option>
            </select>
            <select value={filterBusinessPersonal} onChange={(e) => setFilterBusinessPersonal(e.target.value)}>
              <option value="all">{t.all_}</option>
              <option value="business">{t.business_}</option>
              <option value="personal">{t.personal_}</option>
            </select>
          </div>

          <div className="hisab-actions">
            <button className="action-button money-in" onClick={() => { setFormType("income"); setShowAddForm(true); }}>
              {t.addMoneyIn}
            </button>
            <button className="action-button money-out" onClick={() => { setFormType("expense"); setShowAddForm(true); }}>
              {t.addMoneyOut}
            </button>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <p>{t.noTransactions}</p>
            </div>
          ) : (
            <div className="transaction-list">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="transaction-item">
                  <div className="tx-icon">{getTransactionIcon(tx.transaction_type)}</div>
                  <div className="tx-details">
                    <p className="tx-description">{tx.description || getCategoryLabel(tx.category)}</p>
                    <p className="tx-meta">
                      {tx.party_name && <span>{tx.party_name}</span>}
                      <span>{formatDate(tx.transaction_date)}</span>
                      <span>{tx.business_or_personal}</span>
                    </p>
                  </div>
                  <div className={`tx-amount ${tx.transaction_type.includes("received") || tx.transaction_type.includes("income") || tx.transaction_type.includes("sale") ? "positive" : "negative"}`}>
                    {fmtCurrency(tx.amount_inr)}
                  </div>
                  <div className="tx-actions">
                    <button onClick={() => { setEditingTransaction(tx); setShowAddForm(true); }}>{t.edit}</button>
                    <button onClick={() => handleReverseTransaction(tx.id)}>{t.reverse}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "receivables" && (
        <div className="hisab-receivables">
          <h3>{t.receivables}</h3>
          {receivables.length === 0 ? (
            <div className="empty-state">
              <p>{t.noData}</p>
            </div>
          ) : (
            <div className="receivable-list">
              {receivables.map((r) => (
                <div key={r.id} className="receivable-card">
                  <div className="receivable-header">
                    <h4>{r.party_name}</h4>
                    <span className={`status-badge ${r.status}`}>{r.status}</span>
                  </div>
                  <div className="receivable-amounts">
                    <div>
                      <p className="label">{t.totalBusiness}</p>
                      <p className="value">{fmtCurrency(r.total_amount_inr)}</p>
                    </div>
                    <div>
                      <p className="label">{t.received_}</p>
                      <p className="value">{fmtCurrency(r.paid_amount_inr)}</p>
                    </div>
                    <div>
                      <p className="label">{t.pending_}</p>
                      <p className="value highlight">{fmtCurrency(r.pending_amount_inr)}</p>
                    </div>
                  </div>
                  {r.due_date && (
                    <p className="due-date">
                      {t.dueDate}: {formatDate(r.due_date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "payables" && (
        <div className="hisab-payables">
          <h3>{t.toPay}</h3>
          {payables.length === 0 ? (
            <div className="empty-state">
              <p>{t.noData}</p>
            </div>
          ) : (
            <div className="payable-list">
              {payables.map((p) => (
                <div key={p.id} className="payable-card">
                  <div className="payable-header">
                    <h4>{p.party_name}</h4>
                    <span className={`status-badge ${p.status}`}>{p.status}</span>
                  </div>
                  <div className="payable-amounts">
                    <div>
                      <p className="label">{t.totalAmount}</p>
                      <p className="value">{fmtCurrency(p.total_amount_inr)}</p>
                    </div>
                    <div>
                      <p className="label">{t.paid}</p>
                      <p className="value">{fmtCurrency(p.paid_amount_inr)}</p>
                    </div>
                    <div>
                      <p className="label">{t.remaining}</p>
                      <p className="value highlight">{fmtCurrency(p.total_amount_inr - p.paid_amount_inr)}</p>
                    </div>
                  </div>
                  {p.due_date && (
                    <p className="due-date">
                      {t.dueDate}: {formatDate(p.due_date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "parties" && (
        <div className="hisab-parties">
          <div className="hisab-actions">
            <button className="primary-button" onClick={() => setShowPartyForm(true)}>
              {t.createNewParty}
            </button>
          </div>
          {parties.length === 0 ? (
            <div className="empty-state">
              <p>{t.noData}</p>
            </div>
          ) : (
            <div className="party-list">
              {parties.map((party) => (
                <div key={party.id} className="party-card">
                  <h4>{party.name}</h4>
                  <p className="party-type">{party.type}</p>
                  {party.phone && <p className="party-phone">{party.phone}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <div className="hisab-error">{error}</div>}
    </div>
  );
}