import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity, Target, SlidersHorizontal, DollarSign, CreditCard, Clock, Keyboard } from 'lucide-react';

const FeatureSlider = ({ name, value, onChange }) => {
  const numVal = parseFloat(value) || 0;
  const pct = ((numVal + 20) / 30) * 100;
  const isHigh = numVal > 3;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="label-xs">{name}</span>
        <span
          className="mono font-bold text-xs transition-colors duration-200"
          style={{ color: isHigh ? '#F2385A' : '#64748b' }}
        >
          {numVal.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min="-20" max="10" step="0.1"
        value={numVal}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ accentColor: isHigh ? '#F2385A' : '#F5A623' }}
      />
    </div>
  );
};

export default function ControlPanel({
  params, setParams,
  threshold, setThreshold,
  costThreshold, dailyFP, costDailyFP,
  loading, onAnalyze
}) {

  const handleNumber = (key, val) => setParams(p => ({ ...p, [key]: val }));

  // Estimated daily savings at current threshold (simplified model)
  // Recall ≈ 1 − threshold^0.6, daily frauds = 1700, FP cost = 50
  const estSavings = useMemo(() => {
    const recall = Math.max(0, 1 - Math.pow(threshold, 0.6));
    const caughtFrauds = Math.round(1700 * recall);
    const fpCost = (dailyFP || 0) * 50;
    return Math.max(0, caughtFrauds * 2000 - fpCost);
  }, [threshold, dailyFP]);

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* ── Transaction Input ── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
        className="panel p-5 flex-shrink-0"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="icon-wrap">
            <CreditCard size={13} className="text-primary" />
          </div>
          <span className="label-xs text-white/70">Transaction Input</span>
        </div>

        <div className="space-y-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <label className="label-xs flex items-center gap-1.5">
              <DollarSign size={9} className="text-muted" /> Amount (USD)
            </label>
            <input
              type="number"
              value={params.Amount}
              onChange={e => handleNumber('Amount', e.target.value)}
              onBlur={e => handleNumber('Amount', parseFloat(e.target.value) || 0)}
              className="glass-input mono"
              placeholder="0.00"
            />
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <label className="label-xs flex items-center gap-1.5">
              <Clock size={9} className="text-muted" /> Time (seconds)
            </label>
            <input
              type="number"
              value={params.Time}
              onChange={e => handleNumber('Time', e.target.value)}
              onBlur={e => handleNumber('Time', parseFloat(e.target.value) || 0)}
              className="glass-input mono"
              placeholder="0"
            />
          </div>

          {/* Feature sliders */}
          <div className="pt-4 border-t border-white/[0.05] space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal size={11} className="text-muted" />
              <span className="label-xs">PCA Feature Vectors</span>
            </div>
            {['V17', 'V14', 'V12'].map(v => (
              <FeatureSlider
                key={v} name={`Feature ${v}`}
                value={params[v]}
                onChange={val => setParams(p => ({ ...p, [v]: val }))}
              />
            ))}
          </div>

          {/* Run button */}
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            onClick={onAnalyze}
            disabled={loading}
            className="btn-run mt-1"
          >
            {loading ? (
              <>
                <Activity size={14} className="animate-spin" />
                <span>Analyzing Transaction</span>
              </>
            ) : (
              <>
                <Zap size={14} fill="currentColor" />
                <span>Run Inference</span>
              </>
            )}
          </motion.button>

          {/* Keyboard hint */}
          <div className="flex items-center justify-center gap-1.5 mt-1 opacity-30">
            <Keyboard size={9} className="text-muted" />
            <span className="label-xs" style={{ fontSize: '7px' }}>Ctrl + Enter to run</span>
          </div>
        </div>
      </motion.div>

      {/* ── Threshold & Business Impact ── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08 }}
        className="panel p-5 flex-shrink-0"
        style={{ borderColor: 'rgba(245,166,35,0.12)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="icon-wrap" style={{ borderColor: 'rgba(245,166,35,0.2)', background: 'rgba(245,166,35,0.08)' }}>
              <Target size={13} className="text-secondary" />
            </div>
            <span className="label-xs text-white/70">Decision Threshold</span>
          </div>
          <span className="mono font-black text-secondary text-sm">{threshold.toFixed(3)}</span>
        </div>

        {/* Slider with tooltip */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="range" min="0" max="1" step="0.001"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              style={{ accentColor: '#F5A623' }}
            />
            {/* Floating tooltip */}
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-full mb-2 mono rounded-lg px-3 py-2 z-50 pointer-events-none"
                style={{
                  left: `clamp(0px, calc(${threshold * 100}% - 70px), calc(100% - 140px))`,
                  background: 'rgba(10,10,16,0.97)',
                  border: '1px solid rgba(245,166,35,0.3)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 12px rgba(245,166,35,0.1)',
                  minWidth: 140,
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center gap-3">
                    <span style={{ fontSize: '8px', color: '#64748b' }}>Threshold</span>
                    <span style={{ fontSize: '10px', color: '#F5A623', fontWeight: 900 }}>{threshold.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span style={{ fontSize: '8px', color: '#64748b' }}>Est. Savings</span>
                    <span style={{ fontSize: '10px', color: '#00E676', fontWeight: 700 }}>₹{(estSavings / 100000).toFixed(1)}L/day</span>
                  </div>
                  <div style={{ fontSize: '7px', color: '#374151', marginTop: 2 }}>2000×FN − 50×FP</div>
                </div>
                {/* Arrow */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45"
                  style={{ background: 'rgba(10,10,16,0.97)', border: '1px solid rgba(245,166,35,0.3)', borderTop: 'none', borderLeft: 'none' }}
                />
              </motion.div>
            )}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="label-xs" style={{ fontSize: '7px' }}>High Precision</span>
            <span className="label-xs" style={{ fontSize: '7px' }}>Balanced</span>
            <span className="label-xs" style={{ fontSize: '7px' }}>High Recall</span>
          </div>
        </div>

        {/* Cost-optimal recommendation */}
        {costThreshold && (
          <div className="rounded-xl p-3.5 space-y-3 mb-3"
            style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.18)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="label-xs text-secondary mb-1">Cost-Optimal Recommendation</div>
                <p className="text-muted leading-relaxed" style={{ fontSize: '9px' }}>
                  Minimises <span className="text-white font-bold">Rs 2,000 × FN</span> + <span className="text-white font-bold">Rs 50 × FP</span> loss function
                </p>
              </div>
              <span className="mono font-black text-white text-sm flex-shrink-0">{costThreshold.toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted" style={{ fontSize: '8px' }}>Daily FP at optimal</span>
              <span className="text-secondary font-black mono">{costDailyFP?.toLocaleString() ?? '—'}</span>
            </div>
            <button
              onClick={() => setThreshold(costThreshold)}
              className="btn-secondary w-full text-center"
              style={{ color: '#F5A623', borderColor: 'rgba(245,166,35,0.25)', background: 'rgba(245,166,35,0.08)' }}
            >
              ↩ Snap to Optimal
            </button>
          </div>
        )}

        {/* Daily FP at current threshold */}
        <div className="rounded-xl p-3 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div>
            <div className="label-xs mb-0.5">Daily False Positives</div>
            <div className="text-muted" style={{ fontSize: '8px' }}>@ current threshold · 1M txns/day</div>
          </div>
          <div className="text-right">
            <div className="mono font-black text-white text-xl leading-none">{dailyFP?.toLocaleString() ?? '—'}</div>
            <div className="text-muted mt-0.5" style={{ fontSize: '7px' }}>flagged/day</div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
