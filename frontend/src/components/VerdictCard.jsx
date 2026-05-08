import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, AlertTriangle, Cpu, MousePointer2, Loader2, AlertCircle } from 'lucide-react';

/* ── Helpers ── */
const STEPS = [
  { id: 1, label: 'Input Parsed',   short: 'Parse' },
  { id: 2, label: 'ML Scored',      short: 'ML' },
  { id: 3, label: 'Rules Applied',  short: 'Rules' },
  { id: 4, label: 'Verdict Issued', short: 'Verdict' },
];

function getVerdict(probability, threshold) {
  if (probability > threshold) {
    return probability > 0.9
      ? { label: 'FRAUDULENT', cls: 'verdict-fraud',      decision: 'BLOCK',  color: '#F2385A', glowClass: 'animate-glow-fraud' }
      : { label: 'SUSPICIOUS', cls: 'verdict-suspicious', decision: 'REVIEW', color: '#F5A623', glowClass: '' };
  }
  return { label: 'LEGITIMATE', cls: 'verdict-legit', decision: 'ALLOW', color: '#00E676', glowClass: 'animate-glow-legit' };
}

/* ── Circular gauge ── */
function RiskGauge({ probability, color, glowClass }) {
  const R = 74;
  const CIRC = 2 * Math.PI * R;
  const pct = Math.min(Math.max(probability, 0), 1);

  return (
    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 180, height: 180 }}>
      {/* Outer ring glow */}
      <div
        className={`absolute inset-0 rounded-full ${glowClass}`}
        style={{
          background: `radial-gradient(circle, ${color}18 30%, transparent 70%)`,
        }}
      />

      {/* Track + fill */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 180 180">
        {/* Track */}
        <circle cx="90" cy="90" r={R} strokeWidth="8" fill="none" stroke="rgba(255,255,255,0.05)" />
        {/* Animated arc */}
        <motion.circle
          cx="90" cy="90" r={R}
          strokeWidth="8" fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: CIRC - pct * CIRC }}
          transition={{ duration: 1.6, ease: [0.34, 1.1, 0.64, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 14px ${color}80)` }}
        />
        {/* Tick markers */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const angle = -Math.PI / 2 + t * 2 * Math.PI;
          const x1 = 90 + (R - 6) * Math.cos(angle);
          const y1 = 90 + (R - 6) * Math.sin(angle);
          const x2 = 90 + (R + 2) * Math.cos(angle);
          const y2 = 90 + (R + 2) * Math.sin(angle);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />;
        })}
      </svg>

      {/* Center content */}
      <motion.div
        className="flex flex-col items-center gap-0.5 z-10"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
      >
        <span
          className="mono font-black leading-none"
          style={{ fontSize: 44, color }}
        >
          {Math.round(pct * 100)}
        </span>
        <span className="label-xs" style={{ fontSize: '9px' }}>% RISK SCORE</span>
      </motion.div>
    </div>
  );
}

/* ── Pipeline flow strip ── */
function PipelineStrip({ color, active }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1.5 w-full">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 300 }}
              className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs z-10"
              style={
                active
                  ? { border: `1.5px solid ${color}`, background: `${color}20`, color, boxShadow: `0 0 12px ${color}60` }
                  : { border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }
              }
            >
              {step.id}
            </motion.div>
            <span className="label-xs text-center leading-tight" style={{ fontSize: '7px', maxWidth: 56 }}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="h-px flex-1 mx-1 flex-shrink-0" style={{
              background: active
                ? `linear-gradient(90deg, ${color}60, ${color}20)`
                : 'rgba(255,255,255,0.05)'
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main export ── */
export default function VerdictCard({ result, loading, threshold, shapData }) {
  const hasResult = result && !loading;
  const v = hasResult ? getVerdict(result.probability, threshold) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="panel relative flex flex-col"
      style={{
        minHeight: 420,
        borderColor: v ? `${v.color}25` : undefined,
      }}
    >
      {/* Top ambient gradient when result present */}
      <AnimatePresence>
        {v && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{ background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${v.color}10 0%, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      {/* ── Card header ── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.05] relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="icon-wrap">
            <Cpu size={13} className="text-primary animate-pulse" />
          </div>
          <span className="label-xs text-white/70">Neural Risk Engine</span>
        </div>
        {hasResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="label-xs text-success" style={{ fontSize: '7.5px' }}>Live</span>
          </motion.div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col relative z-10">

        {/* Idle */}
        {!result && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-20 py-16">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted/40 flex items-center justify-center">
              <MousePointer2 size={28} className="text-muted" />
            </div>
            <span className="label-xs">System Idle — Awaiting Transaction</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 py-16">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border border-white/5 border-t-primary animate-spin" style={{ borderTopWidth: 3 }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={28} className="text-primary animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="label-xs text-primary" style={{ letterSpacing: '0.25em' }}>Processing Vectors</span>
              <span className="text-muted" style={{ fontSize: '9px' }}>XGB-SMOTE · SHAP · Rules Engine</span>
            </div>
          </div>
        )}

        {/* Result */}
        {hasResult && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {/* ── Hero row: Gauge + Verdict + SHAP ── */}
            <div className="flex items-center gap-6 px-6 py-5">

              {/* Gauge */}
              <RiskGauge probability={result.probability} color={v.color} glowClass={v.glowClass} />

              {/* Verdict + Decision + Rules */}
              <div className="flex-1 space-y-4">

                {/* Verdict badge */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div
                    className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-xl ${v.cls}`}
                    style={{
                      background: `${v.color}12`,
                      border: `1.5px solid ${v.color}40`,
                      boxShadow: `0 0 24px ${v.color}25`,
                    }}
                  >
                    {v.label === 'LEGITIMATE'
                      ? <ShieldCheck size={22} />
                      : v.label === 'FRAUDULENT'
                      ? <ShieldAlert size={22} />
                      : <AlertCircle size={22} />
                    }
                    <div>
                      <div className="font-black text-xl tracking-widest leading-none">{v.label}</div>
                      <div className="label-xs mt-0.5 opacity-60" style={{ color: v.color }}>ML Classification</div>
                    </div>
                  </div>
                </motion.div>

                {/* Decision action */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <span className="label-xs">Decision Engine</span>
                  <span className="text-white/20">→</span>
                  <span
                    className="mono font-black text-lg tracking-[0.15em]"
                    style={{ color: v.color }}
                  >
                    {v.decision}
                  </span>
                </motion.div>

                {/* Rules triggered */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={9} className="text-secondary opacity-60" />
                    <span className="label-xs">Rules Engine</span>
                  </div>
                  {result.rules_triggered?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.rules_triggered.map((r, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.08 }}
                          className="rule-badge"
                        >
                          <AlertTriangle size={8} />
                          {r}
                        </motion.span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted/35 font-bold" style={{ fontSize: '9px' }}>
                      No rules triggered for this transaction
                    </span>
                  )}
                </motion.div>

                {/* Top SHAP signal */}
                {shapData[0] && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="label-xs mb-1.5 block opacity-60">Top SHAP Signal</span>
                    <span className="text-white font-semibold" style={{ fontSize: '11px' }}>
                      <span className="mono text-secondary">{shapData[0].name}</span>
                      {' '}{shapData[0].value > 0 ? 'increased' : 'decreased'} fraud likelihood by{' '}
                      <span
                        className="mono font-black"
                        style={{ color: shapData[0].value > 0 ? '#F2385A' : '#00E676' }}
                      >
                        {Math.abs(shapData[0].value).toFixed(3)}
                      </span>
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ── Pipeline flow ── */}
            <div
              className="mx-6 mb-5 px-5 py-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <PipelineStrip color={v.color} active={true} />
            </div>

          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
