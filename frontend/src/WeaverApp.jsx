import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Printer, Calendar, ShieldCheck, ChevronDown, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import './WeaverStyles.css';

const API_BASE = 'http://localhost:8000/api';

export default function WeaverApp() {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'weekly_plan'
  const [chatOpen, setChatOpen] = useState(false);
  
  // Real catalog loaded from API
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/weaver/catalog`)
      .then(res => res.json())
      .then(data => setCatalog(data))
      .catch(err => {
        console.error("Failed to load catalog", err);
        setCatalogError("Failed to connect to the AI Backend.");
      });
  }, []);

  const handleOnboardingSubmit = (profile) => {
    setUserProfile(profile);
    setIsOnboarded(true);
  };

  if (!catalog) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        {catalogError ? <p style={{color:'red'}}>{catalogError}</p> : <p>Connecting to AI Engine...</p>}
      </div>
    );
  }

  if (!isOnboarded) {
    return <Onboarding catalog={catalog} onComplete={handleOnboardingSubmit} />;
  }

  return (
    <div className="app-container">
      <DailyCompanionCard profile={userProfile} onShowPlan={() => setCurrentScreen('weekly_plan')} />
      
      {currentScreen === 'weekly_plan' && (
        <WeeklyPlan profile={userProfile} onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'home' && (
        <div className="voice-container no-print">
          <button className="voice-btn" onClick={() => setChatOpen(true)}>
            <Mic size={24} />
            Ask me anything
          </button>
        </div>
      )}

      {chatOpen && (
        <AiChatOverlay 
          profile={userProfile}
          onClose={() => setChatOpen(false)} 
        />
      )}
    </div>
  );
}

function Onboarding({ catalog, onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ 
    name: '', 
    primary_product_key: '', 
    cluster_id: '', 
    looms: 1, 
    weavers: 1,
    average_weekly_output: 4,
    language: 'gu'
  });

  // Filter products by selected cluster later if needed, but for now allow any
  const products = catalog.products;
  const clusters = catalog.clusters;

  const handleNext = () => {
    if (step === 1 && !data.name) return alert("Please enter your name.");
    if (step === 2 && !data.primary_product_key) return alert("Please select a product.");
    if (step === 3 && !data.cluster_id) return alert("Please select your district.");
    
    if (step === 3) {
      onComplete({
        name: data.name,
        cluster_id: data.cluster_id,
        primary_product_key: data.primary_product_key,
        loom_count: data.looms,
        weaver_count: data.weavers,
        average_weekly_output: data.average_weekly_output,
        language: data.language
      });
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="card onboarding-card">
        {step === 1 && (
          <>
            <h2>Namaste! 🙏</h2>
            <p>I’m your AI weaving companion. Let me understand your work so I can help you better.</p>
            <div className="form-group" style={{ marginTop: '24px' }}>
              <label>What is your name?</label>
              <input 
                type="text" 
                className="form-control" 
                value={data.name} 
                onChange={e => setData({ ...data, name: e.target.value })} 
                placeholder="E.g., Rameshbhai"
              />
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2>What do you weave?</h2>
            <div className="product-grid" style={{ marginTop: '24px' }}>
              {products.map(p => (
                <div 
                  key={p.key} 
                  className={`product-select ${data.primary_product_key === p.key ? 'selected' : ''}`}
                  onClick={() => setData({ ...data, primary_product_key: p.key })}
                >
                  <span style={{fontSize: '2rem', display: 'block'}}>{p.icon}</span>
                  {p.label}
                </div>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2>Details about your setup</h2>
            <div className="form-group">
              <label>Which district/cluster are you from?</label>
              <select className="form-control" value={data.cluster_id} onChange={e => setData({ ...data, cluster_id: e.target.value })}>
                <option value="">-- Select --</option>
                {clusters.map(c => (
                  <option key={c.cluster_id} value={c.cluster_id}>{c.cluster_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>How many looms do you operate?</label>
              <input type="number" min="1" className="form-control" value={data.looms} onChange={e => setData({ ...data, looms: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>How many weavers work with you?</label>
              <input type="number" min="1" className="form-control" value={data.weavers} onChange={e => setData({ ...data, weavers: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Usual weekly output?</label>
              <input type="number" min="1" className="form-control" value={data.average_weekly_output} onChange={e => setData({ ...data, average_weekly_output: Number(e.target.value) })} />
            </div>
          </>
        )}
        <button className="primary-btn" onClick={handleNext} style={{ marginTop: '24px' }}>
          {step === 3 ? "Start" : "Next"}
        </button>
      </div>
    </div>
  );
}

function DailyCompanionCard({ profile, onShowPlan }) {
  const [packageData, setPackageData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/weaver/recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile })
    })
    .then(res => res.json())
    .then(data => {
      if (data.detail) {
        setError(data.detail);
      } else {
        setPackageData(data);
      }
    })
    .catch(err => setError(err.toString()));
  }, [profile]);

  if (error) return <div className="card"><p style={{color:'red'}}>Error: {error}</p></div>;
  if (!packageData) return <div className="card"><p>Generating your personalized plan...</p></div>;

  return (
    <>
      <div className="card">
        <div className="daily-card-header">
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}&backgroundColor=D05B43`} alt="Avatar" style={{ width: 48, height: 48, borderRadius: 24 }} />
          <div>
            <h2 className="greeting">👋 Namaste, {packageData.profile_name}.</h2>
            <span className="date-badge">Today’s Recommendation</span>
          </div>
        </div>

        <div className="rec-highlight">
          {packageData.summary_title}
        </div>
        <p className="rec-reason">
          {packageData.summary_reason}
        </p>

        <div className="advice-section">
          <div className="advice-item indigo">
            <CheckCircle2 className="advice-icon" size={20} color="var(--color-indigo)" />
            <div className="advice-content">
              <h4>Recommended Production This Week</h4>
              <p>{packageData.recommended_range_label}</p>
              <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Expected demand: {packageData.demand_band} | Confidence: {packageData.confidence_score}%</p>
            </div>
          </div>

          <div className="advice-item mustard">
            <Info className="advice-icon" size={20} color="var(--color-mustard)" />
            <div className="advice-content">
              <h4>Purchase Advice</h4>
              <p>{packageData.purchase_advice.text}</p>
            </div>
          </div>

          <div className="advice-item success">
            <ShieldCheck className="advice-icon" size={20} color="var(--color-success)" />
            <div className="advice-content">
              <h4>Loan Advice</h4>
              <p>{packageData.loan_advice.text}</p>
            </div>
          </div>
        </div>

        <button className="expander-btn no-print" onClick={() => setExpanded(!expanded)}>
          Why this recommendation? <ChevronDown size={16} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </button>

        {expanded && (
          <div className="expander-content no-print">
            <ul>
              {packageData.why_recommendation.map((bullet, idx) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>
            <hr style={{opacity: 0.2, margin: '12px 0'}} />
            <div style={{fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px'}}>
              <strong>Data Sources:</strong>
              <ul style={{paddingLeft: '16px', marginTop: '4px'}}>
                {packageData.data_sources.map((src, idx) => <li key={'src'+idx}>{src}</li>)}
              </ul>
            </div>
            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-terracotta)', fontWeight: 500 }}>
              <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {packageData.impact_statement}
            </p>
          </div>
        )}
      </div>

      <div className="action-grid no-print">
        <button className="action-btn" onClick={onShowPlan}>
          <Calendar size={24} />
          Weekly Plan
        </button>
        <button className="action-btn" onClick={() => window.print()}>
          <Printer size={24} />
          Print Plan
        </button>
      </div>
    </>
  );
}

function AiChatOverlay({ profile, onClose }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    setMessages([{ sender: 'ai', text: `Namaste ${profile.name}. I am your AI assistant. You can ask me anything about demand, prices, or your plan.` }]);
  }, [profile]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSuggestion = async (question) => {
    setMessages(prev => [...prev, { sender: 'user', text: question }]);
    setIsTyping(true);
    
    try {
      const res = await fetch(`${API_BASE}/assistant/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, question })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I am offline right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-overlay no-print">
      <div className="chat-header">
        <h3 style={{ margin: 0 }}>🎤 AI Assistant</h3>
        <button className="chat-close" onClick={onClose}><X size={24} /></button>
      </div>
      
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.sender}`}>
            {m.text}
          </div>
        ))}
        {isTyping && (
          <div className="msg ai" style={{ opacity: 0.7 }}>
            Thinking...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-suggestions">
        <button className="suggestion-btn" onClick={() => handleSuggestion(`Should I buy raw material now?`)}>
          "Should I buy raw material now?"
        </button>
        <button className="suggestion-btn" onClick={() => handleSuggestion("Can I take a loan?")}>
          "Can I take a loan?"
        </button>
        <button className="suggestion-btn" onClick={() => handleSuggestion("Will demand increase next month?")}>
          "Will demand increase next month?"
        </button>
      </div>
    </div>
  );
}

function WeeklyPlan({ profile, onBack }) {
  const [planData, setPlanData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/weaver/weekly-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile })
    })
    .then(res => res.json())
    .then(data => setPlanData(data))
    .catch(console.error);
  }, [profile]);

  if (!planData) {
    return <div className="card">Loading Weekly Plan...</div>;
  }

  return (
    <div className="card" style={{ backgroundColor: 'white', marginTop: '-20px', zIndex: 10, position: 'relative' }}>
      <button className="no-print" onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--color-indigo)', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
        ← Back to Home
      </button>

      <div className="print-header">
        <h1>{planData.print_plan.title}</h1>
        <p><strong>Weaver:</strong> {profile.name} | <strong>Quantity:</strong> {planData.print_plan.quantity}</p>
        <hr style={{ borderColor: 'var(--color-border)', margin: '16px 0' }} />
      </div>

      <h2 className="no-print" style={{ marginBottom: '24px' }}>Weekly Plan ({planData.print_plan.quantity})</h2>

      {planData.weekly_plan.map((day, idx) => (
        <div className="plan-day" key={idx}>
          <div className="day-name">{day.day}</div>
          <div className="day-task">{day.task} {day.note && <span style={{display: 'block', marginTop: '4px', fontSize: '0.85rem', color: 'var(--color-text-muted)'}}>{day.note}</span>}</div>
        </div>
      ))}

      <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f5f3ef', borderRadius: '8px' }}>
        <strong>Expected Payment Window:</strong> {planData.expected_payment_window.start} to {planData.expected_payment_window.end}
      </div>
      
      <button className="primary-btn no-print" onClick={() => window.print()} style={{ marginTop: '32px' }}>
        Print This Plan
      </button>
    </div>
  );
}
