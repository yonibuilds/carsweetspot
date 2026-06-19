"use client";

import { useState, useEffect, useRef } from "react";

type Problem = {
  title: string;
  why_buyers_care: string;
  seller_insight: string;
  before: string;
  after: string;
};

type Opportunity = {
  title: string;
  insight: string;
  type: "financing" | "inspection" | "carfax";
};

export type AnalysisResult = {
  vehicle: string;
  asking_price: number;
  overall_score: number;
  monthly_payment: number;
  biggest_problem: Problem;
  also_hurting: Problem[];
  opportunities: Opportunity[];
  whats_working: string[];
};

// ── Tokens ──────────────────────────────────────────────────────
const T = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  body: "#475569",
  muted: "#94A3B8",
  accent: "#2563EB",
  problem: "#EF4444",
  warning: "#D97706",
  opportunity: "#7C3AED",
  success: "#22C55E",
};

const H: React.CSSProperties = { fontFamily: "var(--font-jakarta)" };
const B: React.CSSProperties = { fontFamily: "var(--font-inter)" };

const SHADOW = "0 8px 32px -4px rgba(0,0,0,0.06), 0 2px 8px -2px rgba(0,0,0,0.04)";

// ── Animated screen wrapper ──────────────────────────────────────
function AnimatedScreen({ children, id }: { children: React.ReactNode; id: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 20); return () => clearTimeout(t); }, [id]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.32s ease, transform 0.32s ease",
    }}>
      {children}
    </div>
  );
}

// ── Progress bar ────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 3, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 2, borderRadius: 99,
          background: i < current ? T.text : T.border,
          transition: "background 0.4s cubic-bezier(0.4,0,0.2,1)",
        }} />
      ))}
    </div>
  );
}

// ── Label ───────────────────────────────────────────────────────
function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ ...B, fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {children}
    </span>
  );
}

// ── Primary button ───────────────────────────────────────────────
function PrimaryBtn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick} onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)}
      style={{
        ...H, width: "100%", padding: "14px",
        background: T.text, color: "#fff", border: "none", borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.01em",
        transform: p ? "scale(0.98)" : "scale(1)", transition: "transform 0.12s",
      }}>
      {children}
    </button>
  );
}

// ── Card ─────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", ...style }}>
      {children}
    </div>
  );
}

// ── Shell (floating card) ────────────────────────────────────────
function Shell({ children, onReset, maxW = 440 }: { children: React.ReactNode; onReset: () => void; maxW?: number }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(248,250,252,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 50,
      }}>
        <span style={{ ...H, fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>CarSweetSpot</span>
        <button onClick={onReset} style={{ ...B, fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer" }}>
          ← New analysis
        </button>
      </nav>

      {/* Centered floating card */}
      <div style={{ display: "flex", justifyContent: "center", padding: "28px 16px 72px" }}>
        <div style={{
          width: "100%", maxWidth: maxW,
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 24,
          boxShadow: SHADOW,
          padding: "28px 24px 28px",
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Speedometer ──────────────────────────────────────────────────
function Speedometer({ score }: { score: number }) {
  const R = 90, cx = 130, cy = 110;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const ax = (a: number) => cx + R * Math.cos(toRad(a));
  const ay = (a: number) => cy + R * Math.sin(toRad(a));

  const trackD = `M ${ax(-180)} ${ay(-180)} A ${R} ${R} 0 0 1 ${ax(0)} ${ay(0)}`;
  const pct = score / 100;
  const needleAngle = -180 + pct * 180;
  const nLen = 70;
  const nx = cx + nLen * Math.cos(toRad(needleAngle));
  const ny = cy + nLen * Math.sin(toRad(needleAngle));

  const scoreColor = score >= 75 ? "#16A34A" : score >= 55 ? T.warning : T.problem;

  // Ticker marks
  const tickers = Array.from({ length: 9 }, (_, i) => {
    const angle = -180 + i * (180 / 8);
    const inner = R - 10;
    const outer = R - 2;
    return {
      x1: cx + inner * Math.cos(toRad(angle)),
      y1: cy + inner * Math.sin(toRad(angle)),
      x2: cx + outer * Math.cos(toRad(angle)),
      y2: cy + outer * Math.sin(toRad(angle)),
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={260} height={130} viewBox="0 0 260 130" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={T.problem} />
            <stop offset="40%" stopColor={T.warning} />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path d={trackD} fill="none" stroke="#F1F5F9" strokeWidth={18} strokeLinecap="round" />
        {/* Gradient fill */}
        <path d={trackD} fill="none" stroke="url(#arcGrad)" strokeWidth={18} strokeLinecap="round"
          strokeDasharray={`${pct * Math.PI * R} ${Math.PI * R}`}
          style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Ticker marks */}
        {tickers.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#CBD5E1" strokeWidth={1.5} strokeLinecap="round" />
        ))}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={T.text} strokeWidth={2.5} strokeLinecap="round"
          style={{ transition: "all 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <circle cx={cx} cy={cy} r={6} fill={T.text} />
        <circle cx={cx} cy={cy} r={3} fill="#fff" />
      </svg>

      {/* Score */}
      <div style={{ marginTop: -8, textAlign: "center" }}>
        <div style={{ ...H, fontSize: 88, fontWeight: 800, color: scoreColor, lineHeight: 1, letterSpacing: "-0.05em" }}>
          {score}
        </div>
        <div style={{ ...B, fontSize: 12, color: T.muted, marginTop: 2 }}>Sweet Spot Score</div>
      </div>
    </div>
  );
}

// ── Screen 2 — Reveal ────────────────────────────────────────────
function Screen2({ result, onNext, onReset }: { result: AnalysisResult; onNext: () => void; onReset: () => void }) {
  return (
    <Shell onReset={onReset}>
      <AnimatedScreen id={2}>
        <p style={{ ...B, fontSize: 11, color: T.muted, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          {result.vehicle}
        </p>

        <Speedometer score={result.overall_score} />

        {/* What's coming summary */}
        <div style={{ margin: "20px 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>🚨</span>
            <div>
              <div style={{ ...B, fontSize: 11, fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Biggest Problem</div>
              <div style={{ ...H, fontSize: 13, fontWeight: 700, color: T.text, marginTop: 2 }}>{result.biggest_problem.title}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>⚠️</span>
            <div style={{ ...B, fontSize: 13, color: "#92400E" }}>
              <strong>{(result.also_hurting ?? []).length} more issues</strong> we&apos;ll walk you through
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>💡</span>
            <div style={{ ...B, fontSize: 13, color: "#5B21B6" }}>
              <strong>{(result.opportunities ?? []).length} opportunities</strong> to attract more buyers
            </div>
          </div>
        </div>

        <PrimaryBtn onClick={onNext}>See Your Diagnosis →</PrimaryBtn>
      </AnimatedScreen>
    </Shell>
  );
}

// ── Screen 3 — Diagnosis ─────────────────────────────────────────
function Screen3({ result, onNext, onReset }: { result: AnalysisResult; onNext: () => void; onReset: () => void }) {
  return (
    <Shell onReset={onReset} maxW={500}>
      <AnimatedScreen id={3}>
        <ProgressBar current={2} total={7} />
        <h2 style={{ ...H, fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 4 }}>
          Here&apos;s what&apos;s happening.
        </h2>
        <p style={{ ...B, fontSize: 13, color: T.body, marginBottom: 18, lineHeight: 1.5 }}>
          Sweet Spot Score: <strong style={{ color: T.text }}>{result.overall_score}</strong>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          <Card style={{ borderLeft: `3px solid ${T.problem}` }}>
            <Label color={T.problem}>🚨 Biggest Problem</Label>
            <p style={{ ...H, fontSize: 14, fontWeight: 700, color: T.text, margin: "6px 0 0", lineHeight: 1.3 }}>{result.biggest_problem.title}</p>
          </Card>
          {result.also_hurting.map((p, i) => (
            <Card key={i} style={{ borderLeft: `3px solid ${T.warning}` }}>
              <Label color={T.warning}>⚠️ Also Hurting</Label>
              <p style={{ ...H, fontSize: 14, fontWeight: 700, color: T.text, margin: "6px 0 0", lineHeight: 1.3 }}>{p.title}</p>
            </Card>
          ))}
          <Card style={{ borderLeft: `3px solid ${T.opportunity}` }}>
            <Label color={T.opportunity}>💡 Missed Opportunities</Label>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
              {result.opportunities.map(o => (
                <p key={o.type} style={{ ...B, fontSize: 13, color: T.body, margin: 0 }}>· {o.title}</p>
              ))}
            </div>
          </Card>
          {result.whats_working.length > 0 && (
            <Card style={{ borderLeft: `3px solid ${T.success}` }}>
              <Label color={T.success}>✅ What&apos;s Working</Label>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                {result.whats_working.map((w, i) => (
                  <p key={i} style={{ ...B, fontSize: 13, color: T.body, margin: 0 }}>· {w}</p>
                ))}
              </div>
            </Card>
          )}
        </div>

        <PrimaryBtn onClick={onNext}>Show Me How To Improve →</PrimaryBtn>
      </AnimatedScreen>
    </Shell>
  );
}

// ── Before / After ───────────────────────────────────────────────
function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(after); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <div style={{ ...B, fontSize: 10, fontWeight: 700, color: T.problem, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Before</div>
        <div style={{
          background: "#FEF2F2", borderLeft: `3px solid ${T.problem}`,
          borderRadius: "0 8px 8px 0", padding: "10px 12px",
          ...B, fontSize: 13, color: "#7F1D1D", lineHeight: 1.6,
        }}>
          {before}
        </div>
      </div>
      <div>
        <div style={{ ...B, fontSize: 10, fontWeight: 700, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>After</div>
        <div style={{
          position: "relative",
          background: "#F0FDF4", borderLeft: `3px solid ${T.success}`,
          borderRadius: "0 8px 8px 0", padding: "10px 44px 10px 12px",
          ...B, fontSize: 13, color: "#14532D", lineHeight: 1.6,
        }}>
          {after}
          <button onClick={copy} style={{
            position: "absolute", top: 8, right: 8,
            ...B, fontSize: 10, fontWeight: 700,
            color: copied ? "#15803D" : T.muted,
            background: copied ? "#DCFCE7" : "#fff",
            border: `1px solid ${copied ? "#BBF7D0" : T.border}`,
            borderRadius: 6, padding: "3px 7px",
            cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
          }}>
            {copied ? "✓" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Screens 4-6 — Problem detail ─────────────────────────────────
function ProblemScreen({ problem, label, labelColor, current, total, onNext, nextLabel, onReset }: {
  problem: Problem; label: string; labelColor: string;
  current: number; total: number; onNext: () => void; nextLabel: string; onReset: () => void;
}) {
  return (
    <Shell onReset={onReset}>
      <AnimatedScreen id={current}>
        <ProgressBar current={current} total={total} />
        <Label color={labelColor}>{label}</Label>
        <h2 style={{ ...H, fontSize: 19, fontWeight: 800, color: T.text, margin: "8px 0 10px", letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          {problem.title}
        </h2>
        <p style={{ ...B, fontSize: 13, color: T.body, lineHeight: 1.6, marginBottom: 14 }}>
          {problem.why_buyers_care}
        </p>
        <Card style={{ background: "#F8FAFC", marginBottom: 14 }}>
          <Label color={T.muted}>💡 Seller Insight</Label>
          <p style={{ ...B, fontSize: 13, color: T.body, marginTop: 6, marginBottom: 0, lineHeight: 1.6 }}>{problem.seller_insight}</p>
        </Card>
        <div style={{ marginBottom: 22 }}>
          <BeforeAfter before={problem.before} after={problem.after} />
        </div>
        <PrimaryBtn onClick={onNext}>{nextLabel}</PrimaryBtn>
      </AnimatedScreen>
    </Shell>
  );
}

// ── Screen 7 — Opportunities ─────────────────────────────────────
function Screen7({ result, onNext, onReset }: { result: AnalysisResult; onNext: () => void; onReset: () => void }) {
  const icons: Record<string, string> = {
    financing: "💰", inspection: "🔧", carfax: "📋",
    title: "📄", photos: "📸", description: "✏️",
    garage: "🏠", warranty: "🛡️", price: "💲", payment: "💳",
  };
  return (
    <Shell onReset={onReset} maxW={500}>
      <AnimatedScreen id={7}>
        <ProgressBar current={6} total={7} />
        <Label color={T.opportunity}>💡 Missed Opportunities</Label>
        <h2 style={{ ...H, fontSize: 19, fontWeight: 800, color: T.text, margin: "8px 0 18px", letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          More buyers can reach this car than you think.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          {result.opportunities.map(op => (
            <Card key={op.type}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{icons[op.type]}</span>
                <div>
                  <div style={{ ...H, fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>{op.title}</div>
                  <p style={{ ...B, fontSize: 12, color: T.body, margin: 0, lineHeight: 1.5 }}>{op.insight}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <PrimaryBtn onClick={onNext}>See Summary →</PrimaryBtn>
      </AnimatedScreen>
    </Shell>
  );
}

// ── Screen 8 — Summary ───────────────────────────────────────────
function Screen8({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [p, setP] = useState(false);
  return (
    <Shell onReset={onReset} maxW={500}>
      <AnimatedScreen id={8}>
        <ProgressBar current={7} total={7} />
        <Label color={T.success}>✅ Analysis Complete</Label>
        <h2 style={{ ...H, fontSize: 19, fontWeight: 800, color: T.text, margin: "8px 0 18px", letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          {result.vehicle}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          <Card style={{ borderLeft: `3px solid ${T.problem}` }}>
            <Label color={T.problem}>🚨 Biggest Problem</Label>
            <p style={{ ...H, fontSize: 13, fontWeight: 700, color: T.text, margin: "6px 0 0" }}>{result.biggest_problem.title}</p>
          </Card>
          {result.also_hurting.map((p, i) => (
            <Card key={i} style={{ borderLeft: `3px solid ${T.warning}` }}>
              <Label color={T.warning}>⚠️ Also Hurting</Label>
              <p style={{ ...H, fontSize: 13, fontWeight: 700, color: T.text, margin: "6px 0 0" }}>{p.title}</p>
            </Card>
          ))}
          <Card style={{ borderLeft: `3px solid ${T.opportunity}` }}>
            <Label color={T.opportunity}>💡 Opportunities</Label>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
              {result.opportunities.map(o => (
                <p key={o.type} style={{ ...B, fontSize: 12, color: T.body, margin: 0 }}>· {o.title}</p>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ background: T.text, borderRadius: 14, padding: "20px 18px", marginBottom: 10, textAlign: "center" }}>
          <div style={{ ...H, fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-0.02em" }}>
            Want the complete fix?
          </div>
          <p style={{ ...B, fontSize: 12, color: "#94A3B8", marginBottom: 14, lineHeight: 1.5 }}>
            Word-for-word rewrites, exact pricing analysis, full listing overhaul.
          </p>
          <button
            onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)}
            style={{
              ...H, width: "100%", padding: "13px",
              background: "#fff", color: T.text, border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 800, cursor: "pointer", letterSpacing: "-0.01em",
              transform: p ? "scale(0.98)" : "scale(1)", transition: "transform 0.12s",
            }}>
            Unlock Full Report — $29
          </button>
          <p style={{ ...B, fontSize: 11, color: "#475569", marginTop: 8 }}>One-time · Instant access</p>
        </div>

        <button onClick={onReset} style={{
          ...B, width: "100%", padding: "12px",
          background: "transparent", color: T.muted,
          border: `1px solid ${T.border}`, borderRadius: 10,
          fontSize: 13, fontWeight: 500, cursor: "pointer",
        }}>
          ← Analyze another listing
        </button>
      </AnimatedScreen>
    </Shell>
  );
}

// ── Root ─────────────────────────────────────────────────────────
export default function Flow({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [screen, setScreen] = useState(2);
  const also = result.also_hurting ?? [];

  useEffect(() => {
    const onPop = () => onReset();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onReset]);

  const screens: Record<number, React.ReactNode> = {
    2: <Screen2 result={result} onNext={() => setScreen(3)} onReset={onReset} />,
    3: <Screen3 result={result} onNext={() => setScreen(4)} onReset={onReset} />,
    4: <ProblemScreen problem={result.biggest_problem} label="🚨 Biggest Problem" labelColor={T.problem} current={3} total={7} onNext={() => setScreen(5)} nextLabel="Next Issue →" onReset={onReset} />,
    5: <ProblemScreen problem={also[0]} label="⚠️ Also Hurting" labelColor={T.warning} current={4} total={7} onNext={() => setScreen(6)} nextLabel="Next Issue →" onReset={onReset} />,
    6: <ProblemScreen problem={also[1]} label="⚠️ Also Hurting" labelColor={T.warning} current={5} total={7} onNext={() => setScreen(7)} nextLabel="See Opportunities →" onReset={onReset} />,
    7: <Screen7 result={result} onNext={() => setScreen(8)} onReset={onReset} />,
    8: <Screen8 result={result} onReset={onReset} />,
  };

  return <>{screens[screen]}</>;
}
