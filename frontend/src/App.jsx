import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Shield, AlertOctagon } from 'lucide-react';

import ControlPanel from './components/ControlPanel';
import VerdictCard   from './components/VerdictCard';
import AnalyticsRow  from './components/AnalyticsRow';

const API = '/api';

function App() {
  const [params, setParams]               = useState({ Amount: 150.0, Time: 3600.0, V17: 0.0, V14: 0.0, V12: 0.0 });
  const [result, setResult]               = useState(null);
  const [evalData, setEvalData]           = useState(null);
  const [loading, setLoading]             = useState(false);
  const [copied, setCopied]               = useState(false);
  const [threshold, setThreshold]         = useState(0.5);
  const [costThreshold, setCostThreshold] = useState(null);
  const [apiError, setApiError]           = useState(null);

  // Fetch eval data on mount
  useEffect(() => {
    axios.get(`${API}/eval_data`).then(res => {
      setEvalData(res.data);
      if (res.data.cost_optimized_threshold) {
        setCostThreshold(res.data.cost_optimized_threshold);
        setThreshold(res.data.cost_optimized_threshold);
      }
    }).catch(console.error);
  }, []);

  // ── Ctrl+Enter keyboard shortcut ──
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading) {
        e.preventDefault();
        handleAnalyze();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, params]);

  // Daily FP estimates (1M txns/day, 99.83% legitimate)
  const dailyLeg    = 1_000_000 * 0.9983;
  const fprAtThresh = (thresh) => {
    if (!evalData?.roc_fpr) return null;
    const idx = Math.max(0, Math.round((1 - thresh) * (evalData.roc_fpr.length - 1)));
    return evalData.roc_fpr[idx] || 0;
  };
  const dailyFP     = useMemo(() => { const f = fprAtThresh(threshold);     return f != null ? Math.round(f * dailyLeg) : null; }, [evalData, threshold]);
  const costDailyFP = useMemo(() => { const f = fprAtThresh(costThreshold); return f != null ? Math.round(f * dailyLeg) : null; }, [evalData, costThreshold]);

  // SHAP top features
  const shapData = useMemo(() => {
    if (!result?.shap_values) return [];
    return Object.entries(result.shap_values)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 6);
  }, [result]);

  const handleAnalyze = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const payload = {
        Amount: parseFloat(params.Amount) || 0,
        Time:   parseFloat(params.Time)   || 0,
        V17:    parseFloat(params.V17)    || 0,
        V14:    parseFloat(params.V14)    || 0,
        V12:    parseFloat(params.V12)    || 0,
      };
      const res = await axios.post(`${API}/predict`, payload);
      if (res.data && typeof res.data.probability === 'number') {
        setTimeout(() => { setResult(res.data); setLoading(false); }, 900);
      } else {
        setApiError('API returned unexpected data.');
        setLoading(false);
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Network error — is the API running on port 8000?';
      setApiError(String(msg));
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen font-sans text-text">

      {/* ── Fixed top bar ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.05]"
        style={{ background: 'rgba(10,10,16,0.92)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3.5"
          >
            <div className="p-2 rounded-xl text-primary"
              style={{ background: 'rgba(242,56,90,0.1)', border: '1px solid rgba(242,56,90,0.2)' }}
            >
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none">
                FRAUDX <span className="gradient-text">SENTINEL</span>
              </h1>
              <p className="label-xs mt-0.5 opacity-40" style={{ fontSize: '7.5px' }}>
                Credit Card Risk Assessment Platform
              </p>
            </div>
          </motion.div>

          {/* Status chips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="label-xs text-success" style={{ fontSize: '7.5px' }}>System Online</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="label-xs" style={{ fontSize: '7.5px' }}>XGB-SMOTE v2.4 · SHAP · Rules Engine</span>
            </div>
            {result && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={handleCopy}
                className="btn-secondary flex items-center gap-1.5"
              >
                {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                {copied ? 'Copied' : 'Copy JSON'}
              </motion.button>
            )}
          </motion.div>
        </div>
      </header>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="max-w-[1600px] mx-auto px-6 mt-4"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(242,56,90,0.1)', border: '1px solid rgba(242,56,90,0.3)', color: '#F2385A' }}
            >
              <AlertOctagon size={16} />
              <span>{apiError}</span>
              <button onClick={() => setApiError(null)} className="ml-auto text-primary/60 hover:text-primary transition-colors text-base">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">

        {/* Top row: 3-col control | 9-col verdict */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-3">
            <ControlPanel
              params={params} setParams={setParams}
              threshold={threshold} setThreshold={setThreshold}
              costThreshold={costThreshold}
              dailyFP={dailyFP} costDailyFP={costDailyFP}
              loading={loading} onAnalyze={handleAnalyze}
            />
          </div>
          <div className="lg:col-span-9">
            <VerdictCard
              result={result} loading={loading}
              threshold={threshold} shapData={shapData}
            />
          </div>
        </div>

        {/* Analytics row */}
        <AnalyticsRow
          result={result} evalData={evalData}
          threshold={threshold} shapData={shapData}
          loading={loading}
        />

      </main>

      {/* ── Footer ── */}
      <footer className="max-w-[1600px] mx-auto px-6 py-5 mt-4 border-t border-white/[0.04] flex items-center justify-between">
        <span className="label-xs opacity-20" style={{ fontSize: '7.5px' }}>
          FraudX Sentinel v2.0 · Enterprise Edition
        </span>
        <div className="flex gap-5">
          {['ISO 27001', 'PCI-DSS', 'GDPR', 'SOC 2'].map(c => (
            <span key={c} className="label-xs opacity-15" style={{ fontSize: '7px' }}>{c}</span>
          ))}
        </div>
      </footer>

    </div>
  );
}

export default App;
