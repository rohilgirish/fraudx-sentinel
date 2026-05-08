import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Target, BarChart2, History, DollarSign, Copy, Check, FileText } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, BarChart, Bar, LineChart, Line, ReferenceLine,
  ComposedChart
} from 'recharts';

/* ── Recharts tooltip style ── */
const TT = (props) => (
  <Tooltip
    contentStyle={{
      background: 'rgba(10,10,16,0.97)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      fontSize: 10,
      color: '#e2e8f0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}
    cursor={{ stroke: 'rgba(255,255,255,0.06)' }}
    {...props}
  />
);

const BASELINE = Array.from({ length: 8 }).map((_, i) => ({
  time: `T-${8 - i}`,
  risk: 3 + i * 1.1 + Math.sin(i) * 2,
}));

const CHART_H = 170;

/* ── Skeleton loader for SHAP / Rules panels ── */
function SkeletonBars({ rows = 6 }) {
  return (
    <div className="space-y-2.5 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          {/* Label stub */}
          <div
            className="flex-shrink-0 rounded"
            style={{
              width: 30, height: 10,
              background: 'rgba(255,255,255,0.06)',
              animation: `skeleton-pulse ${1.2 + i * 0.1}s ease-in-out infinite`,
            }}
          />
          {/* Bar stub */}
          <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div
              className="h-full rounded"
              style={{
                width: `${30 + (i % 3) * 20}%`,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
                backgroundSize: '200% 100%',
                animation: `skeleton-shimmer 1.4s linear infinite`,
              }}
            />
          </div>
          {/* Value stub */}
          <div
            className="flex-shrink-0 rounded"
            style={{
              width: 36, height: 10,
              background: 'rgba(255,255,255,0.06)',
              animation: `skeleton-pulse ${1.3 + i * 0.1}s ease-in-out infinite`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Skeleton for a generic chart area ── */
function SkeletonChart({ height = 170 }) {
  return (
    <div
      className="w-full rounded-lg overflow-hidden"
      style={{
        height,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.6s linear infinite',
      }}
    />
  );
}

/* ── Panel wrapper with title ── */
function ChartPanel({ icon: Icon, iconColor = '#64748b', title, delay = 0, children, footer, headerRight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="panel p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="icon-wrap">
            <Icon size={13} style={{ color: iconColor }} />
          </div>
          <span className="label-xs text-white/70">{title}</span>
        </div>
        {headerRight}
      </div>
      <div className="flex-1 min-w-0 min-h-0">{children}</div>
      {footer && (
        <div className="flex justify-between pt-2 border-t border-white/[0.04]">
          {footer}
        </div>
      )}
    </motion.div>
  );
}

/* ── SHAP bar with custom render ── */
function ShapBars({ data }) {
  const max = Math.max(...data.map(d => Math.abs(d.value)), 0.001);

  return (
    <div className="space-y-2.5 py-1">
      {data.map((d, i) => {
        const pct = (Math.abs(d.value) / max) * 100;
        const isPos = d.value > 0;
        return (
          <motion.div
            key={d.name}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-2.5"
          >
            <span className="mono text-right flex-shrink-0" style={{ fontSize: '9px', color: '#64748b', width: 30 }}>{d.name}</span>
            <div className="flex-1 h-4 relative rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <motion.div
                className="absolute inset-y-0 rounded"
                style={{
                  background: isPos
                    ? 'linear-gradient(90deg, rgba(242,56,90,0.7), rgba(242,56,90,0.3))'
                    : 'linear-gradient(90deg, rgba(0,230,118,0.7), rgba(0,230,118,0.3))',
                  width: `${pct}%`,
                  left: isPos ? 0 : undefined,
                  right: isPos ? undefined : 0,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                style={{
                  transformOrigin: isPos ? 'left' : 'right',
                  width: `${pct}%`,
                  background: isPos
                    ? 'linear-gradient(90deg, rgba(242,56,90,0.9), rgba(242,56,90,0.3))'
                    : 'linear-gradient(90deg, rgba(0,230,118,0.3), rgba(0,230,118,0.9))',
                  left: isPos ? 0 : 'auto',
                  right: isPos ? 'auto' : 0,
                  position: 'absolute',
                  top: 0, bottom: 0,
                  borderRadius: 4,
                }}
                transition={{ duration: 0.6, delay: i * 0.07 }}
              />
            </div>
            <span
              className="mono font-bold text-right flex-shrink-0"
              style={{ fontSize: '9px', width: 42, color: isPos ? '#F2385A' : '#00E676' }}
            >
              {isPos ? '+' : ''}{d.value.toFixed(3)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Business impact panel ── */
function BusinessImpactPanel({ result, threshold, delay = 0.5 }) {
  const fraudCost = 2000;
  const fpCost = 50;
  const riskScore = result?.probability ?? 0;
  const isFraud = riskScore > threshold;

  // Simulate estimated daily impact
  const dailyTxns = 1_000_000;
  const fraudRate = 0.0017;
  const dailyFrauds = dailyTxns * fraudRate;
  const recall = isFraud ? 0.857 : 0.6;
  const caughtFrauds = Math.round(dailyFrauds * recall);
  const savedAmount = caughtFrauds * fraudCost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="panel p-5"
      style={{ borderColor: 'rgba(0,230,118,0.1)' }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="icon-wrap" style={{ borderColor: 'rgba(0,230,118,0.2)', background: 'rgba(0,230,118,0.06)' }}>
          <DollarSign size={13} className="text-success" />
        </div>
        <span className="label-xs text-white/70">Business Impact</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Est. Caught/Day', value: caughtFrauds.toLocaleString(), color: '#00E676', sub: 'fraud txns' },
          { label: 'Daily Savings', value: `₹${(savedAmount / 100000).toFixed(1)}L`, color: '#00E676', sub: 'avoided loss' },
          { label: 'Fraud Recall', value: `${(recall * 100).toFixed(1)}%`, color: '#F5A623', sub: 'detection rate' },
          { label: 'Cost Function', value: `2000×FN`, color: '#64748b', sub: '+ 50×FP' },
        ].map(({ label, value, color, sub }) => (
          <div key={label}
            className="rounded-xl p-3 flex flex-col gap-0.5"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="label-xs" style={{ fontSize: '7px' }}>{label}</span>
            <span className="mono font-black text-base leading-none" style={{ color }}>{value}</span>
            <span className="text-muted/50 font-bold" style={{ fontSize: '8px' }}>{sub}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function AnalyticsRow({ result, evalData, threshold, shapData, loading }) {

  const riskDistData = useMemo(() => Array.from({ length: 40 }).map((_, i) => {
    const x = i / 40;
    return {
      score: x,
      normal: Math.exp(-Math.pow(x - 0.12, 2) / 0.018) * 100,
      fraud: Math.exp(-Math.pow(x - 0.82, 2) / 0.055) * 35,
    };
  }), []);

  const prData = useMemo(() => {
    if (!evalData?.pr_recall?.length) return [];
    const len = evalData.pr_recall.length;
    const step = Math.max(1, Math.floor(len / 40));
    const data = [];
    for (let i = len - 1; i >= 0; i -= step) {
      data.push({
        recall: +evalData.pr_recall[i].toFixed(3),
        precision: +(evalData.pr_precision[i] || 0).toFixed(3)
      });
    }
    return data;
  }, [evalData]);

  const currentPR = useMemo(() => {
    if (!evalData?.pr_recall?.length) return [];
    const idx = Math.max(0, Math.floor((1 - threshold) * (evalData.pr_recall.length - 1)));
    return [{ recall: evalData.pr_recall[idx] || 0, precision: evalData.pr_precision[idx] || 1 }];
  }, [evalData, threshold]);


  // Copy Audit Log
  const [auditCopied, setAuditCopied] = useState(false);
  const handleCopyAudit = useCallback(() => {
    if (!result) return;
    const log = [
      `// FraudX Sentinel — Model Audit Log`,
      `// Generated: ${new Date().toISOString()}`,
      ``,
      `// Classification`,
      `prediction:   "${result.prediction}"`,
      `probability:  ${result.probability.toFixed(6)}`,
      `risk_score:   ${result.risk_score}%`,
      `threshold:    ${threshold.toFixed(3)}`,
      ``,
      `// Rules Engine`,
      `rules_count:  ${result.rules_triggered?.length ?? 0}`,
      ...(result.rules_triggered?.length > 0
        ? result.rules_triggered.map(r => `  → ${r}`)
        : ['  no_rules_matched']
      ),
      ``,
      `// SHAP Feature Contributions`,
      ...shapData.map(s => `  ${s.name.padEnd(8)}: ${s.value > 0 ? '+' : ''}${s.value.toFixed(4)}`),
    ].join('\n');
    navigator.clipboard.writeText(log);
    setAuditCopied(true);
    setTimeout(() => setAuditCopied(false), 2000);
  }, [result, threshold, shapData]);

  const timelineData = useMemo(() => {
    const base = BASELINE.map(d => ({ ...d }));
    if (result) base.push({ time: 'NOW', risk: +(result.probability * 100).toFixed(1) });
    return base;
  }, [result]);

  const emptyState = (label) => (
    <div style={{ height: CHART_H }} className="flex items-center justify-center label-xs opacity-20">
      {label}
    </div>
  );

  return (
    <div className="space-y-4">

      {/* ── Row 1: 4 charts ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Risk Distribution */}
        <ChartPanel
          icon={TrendingUp} iconColor="#00E676"
          title="Risk Distribution" delay={0.15}
          footer={<>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="label-xs" style={{ fontSize: '7px' }}>Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="label-xs" style={{ fontSize: '7px' }}>Fraud</span>
            </div>
          </>}
        >
          <ResponsiveContainer width="100%" height={CHART_H}>
            <AreaChart data={riskDistData} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
              <defs>
                <linearGradient id="gradNorm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E676" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#00E676" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradFraud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F2385A" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#F2385A" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <XAxis dataKey="score" hide />
              <YAxis hide />
              <TT />
              <Area type="monotone" dataKey="normal" stroke="#00E676" fill="url(#gradNorm)" strokeWidth={1.5} name="Normal" />
              <Area type="monotone" dataKey="fraud" stroke="#F2385A" fill="url(#gradFraud)" strokeWidth={1.5} name="Fraud" />
              {result && (
                <ReferenceLine
                  x={Math.round(result.probability * 40) / 40}
                  stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeDasharray="3 2"
                  label={{ value: 'NOW', fill: 'rgba(255,255,255,0.5)', fontSize: 7, position: 'top' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* PR Curve */}
        <ChartPanel
          icon={Target} iconColor="#F5A623"
          title="Precision-Recall Curve" delay={0.22}
        >
          {prData.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <ComposedChart data={prData} margin={{ top: 4, right: 8, bottom: 14, left: -22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.025)" />
                <XAxis
                  type="number" dataKey="recall" domain={[0, 1]}
                  tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false}
                  label={{ value: 'Recall', fill: '#374151', fontSize: 7, position: 'insideBottom', dy: 10 }}
                />
                <YAxis
                  type="number" dataKey="precision" domain={[0, 1]}
                  tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false}
                />
                <TT />
                <Area type="monotone" dataKey="precision" stroke="#F5A623" strokeWidth={1.5} fill="rgba(245,166,35,0.08)" isAnimationActive={false} />
                {currentPR.length > 0 && (
                  <Scatter data={currentPR} name="Current Threshold">
                    {currentPR.map((_, i) => (
                      <Cell key={i} fill="#fff" stroke="#F5A623" strokeWidth={2.5} r={5} />
                    ))}
                  </Scatter>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : emptyState('Loading PR data...')}
        </ChartPanel>

        {/* SHAP Impact */}
        <ChartPanel
          icon={BarChart2} iconColor="#F2385A"
          title="SHAP Feature Impact" delay={0.3}
          footer={<>
            <span className="label-xs text-success" style={{ fontSize: '7.5px' }}>← Reducing Risk</span>
            <span className="label-xs text-primary" style={{ fontSize: '7.5px' }}>Driving Risk →</span>
          </>}
        >
          {loading
            ? <SkeletonBars rows={6} />
            : shapData.length > 0
            ? <ShapBars data={shapData} />
            : emptyState('Run analysis to see SHAP impact')
          }
        </ChartPanel>

        {/* Timeline sparkline */}
        <ChartPanel
          icon={History} iconColor="#F2385A"
          title="Risk Timeline"
          delay={0.37}
          footer={<>
            <span className="label-xs" style={{ fontSize: '7px' }}>← Historical</span>
            {result && <span className="label-xs text-success" style={{ fontSize: '7px' }}>Live ●</span>}
            <span className="label-xs" style={{ fontSize: '7px' }}>Now →</span>
          </>}
        >
          <ResponsiveContainer width="100%" height={CHART_H}>
            <AreaChart data={timelineData} margin={{ top: 4, right: 10, bottom: 0, left: -32 }}>
              <defs>
                <linearGradient id="gradTimeline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F2385A" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F2385A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.025)" vertical={false} />
              <YAxis hide domain={[0, 100]} />
              <XAxis dataKey="time" hide />
              <TT formatter={(v) => [`${v.toFixed(1)}%`, 'Risk']} />
              <ReferenceLine y={threshold * 100} stroke="#F5A623" strokeDasharray="3 3" strokeOpacity={0.5}
                label={{ value: 'Threshold', fill: '#F5A623', fontSize: 7, position: 'insideTopRight' }}
              />
              <Area
                type="monotone" dataKey="risk"
                stroke="#F2385A" strokeWidth={2}
                fill="url(#gradTimeline)"
                isAnimationActive={false}
                dot={false}
              />
              {result && (
                <ReferenceLine x="NOW" stroke="#F2385A" strokeWidth={1.5} strokeOpacity={0.7} strokeDasharray="2 2" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

      </div>

      {/* ── Row 2: Business impact ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <BusinessImpactPanel result={result} threshold={threshold} delay={0.45} />
        </div>

        {/* Audit Trace spans 3 cols */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="panel p-5 h-full"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="icon-wrap">
                  <FileText size={13} className="text-muted" />
                </div>
                <span className="label-xs text-white/70">Model Audit Trace</span>
                {loading && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(242,56,90,0.08)', border: '1px solid rgba(242,56,90,0.2)' }}>
                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                    <span className="label-xs text-primary" style={{ fontSize: '7px' }}>Processing</span>
                  </span>
                )}
              </div>
              <AnimatePresence mode="wait">
                {result && (
                  <motion.button
                    key="copy-audit"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleCopyAudit}
                    className="btn-secondary flex items-center gap-1.5 flex-shrink-0"
                    style={auditCopied ? { color: '#00E676', borderColor: 'rgba(0,230,118,0.3)' } : {}}
                  >
                    {auditCopied
                      ? <><Check size={10} /><span>Copied!</span></>
                      : <><Copy size={10} /><span>Copy Audit Log</span></>
                    }
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div
              className="rounded-xl p-4 mono overflow-x-auto"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.04)', fontSize: '10px', lineHeight: 1.8 }}
            >
              {!result ? (
                <div className="text-center py-3 text-muted/20 tracking-widest uppercase" style={{ fontSize: '9px' }}>
                  WAITING_FOR_INFERENCE — Submit a transaction to populate trace
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <div className="text-muted/40 mb-2 text-xs">// Classification</div>
                    <div><span className="text-blue-400">prediction:</span> <span className={result.probability > threshold ? 'text-primary' : 'text-success'}>"{result.prediction}"</span></div>
                    <div><span className="text-blue-400">probability:</span> <span className="text-white/70">{result.probability.toFixed(4)}</span></div>
                    <div><span className="text-blue-400">risk_score:</span> <span className="text-white/70">{result.risk_score}%</span></div>
                    <div><span className="text-blue-400">threshold:</span> <span className="text-white/70">{threshold.toFixed(3)}</span></div>
                  </div>
                  <div className="space-y-1 md:border-l border-white/5 md:pl-6">
                    <div className="text-muted/40 mb-2 text-xs">// Rules Engine</div>
                    <div><span className="text-blue-400">rules_count:</span> <span className="text-white/70">{result.rules_triggered?.length ?? 0}</span></div>
                    {result.rules_triggered?.length > 0
                      ? result.rules_triggered.map((r, i) => (
                          <div key={i}><span className="text-white/40">→</span> <span className="text-secondary">{r}</span></div>
                        ))
                      : <div className="text-muted/30">no_rules_matched</div>
                    }
                  </div>
                  <div className="space-y-1 md:border-l border-white/5 md:pl-6">
                    <div className="text-muted/40 mb-2 text-xs">// SHAP Top Features</div>
                    {shapData.slice(0, 5).map((s, i) => (
                      <div key={i}>
                        <span className="text-blue-400">{s.name}:</span>{' '}
                        <span style={{ color: s.value > 0 ? '#F2385A' : '#00E676' }}>
                          {s.value > 0 ? '+' : ''}{s.value.toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
