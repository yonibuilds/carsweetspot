"use client";

import { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────
type Problem = {
  title: string;
  why_buyers_care: string;
  seller_insight: string;
  before: string;
  after: string;
  category?: "trust" | "text" | "photos";
};

type Opportunity = {
  title: string;
  insight: string;
  type: string;
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

// ── Design tokens ─────────────────────────────────────────────────
const T = {
  bg: "#FAFAFA",
  card: "#FFFFFF",
  surface: "#F1F5F9",
  border: "#E2E8F0",
  text: "#0F172A",
  body: "#475569",
  muted: "#94A3B8",
  red: "#EF4444",
  redBg: "#FAF7F7",
  green: "#22C55E",
  greenDark: "#15803D",
  greenBg: "#F4FBF7",
  greenBorder: "#BBF7D0",
  greenText: "#14532D",
  amber: "#D97706",
};

const H: React.CSSProperties = { fontFamily: "var(--font-jakarta)" };
const B: React.CSSProperties = { fontFamily: "var(--font-inter)" };

const CAT: Record<string, { label: string; icon: string }> = {
  trust:  { label: "Trust",  icon: "🤝" },
  text:   { label: "Text",   icon: "✍️" },
  photos: { label: "Photos", icon: "📸" },
};

function opIcon(type: string): string {
  const m: Record<string, string> = {
    financing: "💰", inspection: "🔧", carfax: "📋",
    title: "📄", photos: "📸", description: "✏️",
    garage: "🏠", warranty: "🛡️", price: "💲", payment: "💳", formatting: "📝",
  };
  return m[type] ?? "💡";
}

// ── Fade transition ───────────────────────────────────────────────
function Fade({ children, id }: { children: React.ReactNode; id: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 20); return () => clearTimeout(t); }, [id]);
  return (
    <div style={{
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.32s ease, transform 0.32s ease",
    }}>
      {children}
    </div>
  );
}

// ── Thin progress line ────────────────────────────────────────────
function ProgressLine({ value }: { value: number }) {
  return (
    <div style={{ width: "100%", height: 2, background: T.border, borderRadius: 1, marginBottom: 32, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${Math.round(value * 100)}%`,
        background: T.text,
        borderRadius: 1,
        transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

// ── Left sidebar (desktop only) ───────────────────────────────────
function Sidebar({ result }: { result: AnalysisResult }) {
  const score = result.overall_score;
  const scoreColor = score >= 75 ? T.greenDark : score >= 55 ? T.amber : "#DC2626";

  return (
    <div style={{
      height: "100%",
      background: "#F1F5F9",
      borderRight: `1px solid ${T.border}`,
      padding: "44px 40px",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    }}>
      <p style={{ ...B, fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 24 }}>
        Listing Analysis
      </p>

      {/* Vehicle card mockup */}
      <div style={{
        background: "rgba(255,255,255,0.80)",
        borderRadius: 14,
        padding: "22px 20px",
        marginBottom: 20,
        border: `1px solid ${T.border}`,
        textAlign: "center",
        opacity: 0.9,
      }}>
        <div style={{ fontSize: 56, marginBottom: 10, filter: "drop-shadow(0 2px 6px rgba(0,0,0,.08))" }}>🚗</div>
        <p style={{ ...H, fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", margin: "0 0 6px", lineHeight: 1.2 }}>
          {result.vehicle}
        </p>
        {result.asking_price > 0 && (
          <p style={{ ...H, fontSize: 24, fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.03em" }}>
            ${result.asking_price.toLocaleString()}
          </p>
        )}
      </div>

      {/* Score badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        background: "#fff", borderRadius: 12, padding: "14px 18px",
        border: `1px solid ${T.border}`, marginBottom: 28,
      }}>
        <div style={{ ...H, fontSize: 42, fontWeight: 900, color: scoreColor, lineHeight: 1, letterSpacing: "-0.04em" }}>
          {score}
        </div>
        <div>
          <p style={{ ...H, fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Sweet Spot Score</p>
          <p style={{ ...B, fontSize: 12, color: T.muted, margin: "2px 0 0" }}>out of 100</p>
        </div>
      </div>

      {/* What's working */}
      {result.whats_working?.length > 0 && (
        <div>
          <p style={{ ...B, fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            What&apos;s working
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.whats_working.map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: T.greenDark, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                <p style={{ ...B, fontSize: 13, color: T.body, lineHeight: 1.5, margin: 0 }}>{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Split shell ───────────────────────────────────────────────────
function SplitShell({ children, result, onReset, progress }: {
  children: React.ReactNode;
  result: AnalysisResult;
  onReset: () => void;
  progress: number;
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250,250,250,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: 50,
      }}>
        <button onClick={onReset} style={{
          ...H, fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: "-0.02em",
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}>
          CarSweetSpot
        </button>
        <button onClick={onReset} style={{
          ...B, fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer",
        }}>
          ← New analysis
        </button>
      </nav>

      {/* Split body */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 50px)", alignItems: "flex-start" }}>
        {/* Left column — desktop only */}
        {isDesktop && (
          <div style={{
            flex: "0 0 42%", position: "sticky", top: 50,
            height: "calc(100vh - 50px)", display: "flex", flexDirection: "column",
          }}>
            <Sidebar result={result} />
          </div>
        )}
        {/* Right column */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          padding: isDesktop ? "44px 28px 80px" : "28px 16px 80px",
        }}>
          <div style={{ width: "100%", maxWidth: 440 }}>
            <ProgressLine value={progress} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────────
function Btn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  const [p, setP] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)}
      style={{
        ...H, width: "100%", padding: "15px",
        background: T.text, color: "#fff", border: "none",
        borderRadius: 12, fontSize: 15, fontWeight: 700,
        cursor: "pointer", letterSpacing: "-0.01em",
        transform: p ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.12s",
      }}>
      {children}
    </button>
  );
}

// ── Speedometer ───────────────────────────────────────────────────
function Speedometer({ score }: { score: number }) {
  const R = 76, cx = 100, cy = 86;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const ax = (a: number) => cx + R * Math.cos(toRad(a));
  const ay = (a: number) => cy + R * Math.sin(toRad(a));
  const trackD = `M ${ax(-180)} ${ay(-180)} A ${R} ${R} 0 0 1 ${ax(0)} ${ay(0)}`;
  const pct = score / 100;
  const needleAngle = -180 + pct * 180;
  const nx = cx + 56 * Math.cos(toRad(needleAngle));
  const ny = cy + 56 * Math.sin(toRad(needleAngle));
  const scoreColor = score >= 75 ? T.greenDark : score >= 55 ? T.amber : "#DC2626";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={200} height={104} viewBox="0 0 200 104" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="42%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        {/* Track — thick mechanical arc */}
        <path d={trackD} fill="none" stroke="#E2E8F0" strokeWidth={20} strokeLinecap="round" />
        {/* Fill */}
        <path d={trackD} fill="none" stroke="url(#gauge-grad)" strokeWidth={20} strokeLinecap="round"
          strokeDasharray={`${pct * Math.PI * R} ${Math.PI * R}`}
          style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={T.text} strokeWidth={3} strokeLinecap="round"
          style={{ transition: "all 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
        <circle cx={cx} cy={cy} r={6} fill={T.text} />
        <circle cx={cx} cy={cy} r={3} fill="#fff" />
      </svg>
      <div style={{ marginTop: -4, textAlign: "center" }}>
        <div style={{ ...H, fontSize: 84, fontWeight: 900, color: scoreColor, lineHeight: 1, letterSpacing: "-0.05em" }}>
          {score}
        </div>
        <div style={{ ...B, fontSize: 11, color: T.muted, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Sweet Spot Score
        </div>
      </div>
    </div>
  );
}

// ── Score screen ──────────────────────────────────────────────────
function ScoreScreen({ result, problems, onNext }: {
  result: AnalysisResult;
  problems: Problem[];
  onNext: () => void;
}) {
  const catMap: Record<string, Problem | null> = { trust: null, text: null, photos: null };
  problems.forEach(p => { if (p.category && catMap[p.category] === null) catMap[p.category] = p; });
  const lost = 100 - result.overall_score;

  return (
    <Fade id={2}>
      <p style={{ ...B, fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", marginBottom: 16 }}>
        {result.vehicle}
      </p>

      <Speedometer score={result.overall_score} />

      <p style={{ ...H, fontSize: 16, fontWeight: 700, color: T.text, textAlign: "center", margin: "20px 0 18px", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
        Your listing is missing ~{lost}% of potential buyers
      </p>

      {/* Category pill chips */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
        {(["trust", "text", "photos"] as const).map(cat => {
          const pass = !catMap[cat];
          return (
            <div key={cat} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: pass ? "#F0FDF4" : "#FEF2F2",
              border: `1px solid ${pass ? "#BBF7D0" : "#FECACA"}`,
              borderRadius: 9999, padding: "7px 14px",
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: pass ? T.greenDark : "#DC2626" }}>
                {pass ? "✓" : "✕"}
              </span>
              <span style={{ ...B, fontSize: 11, fontWeight: 700, color: pass ? T.greenDark : "#DC2626", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {CAT[cat].label}
              </span>
            </div>
          );
        })}
      </div>

      <Btn onClick={onNext}>Fix these →</Btn>
    </Fade>
  );
}

// ── Before / After cards ──────────────────────────────────────────
function BeforeAfterCard({ problem }: { problem: Problem }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(problem.after);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
      {/* Before */}
      {problem.before && (
        <div style={{
          background: "#FAF7F7",
          borderLeft: "3px solid #EF4444",
          borderRadius: "0 8px 8px 0",
          padding: "12px 16px",
        }}>
          <p style={{ ...B, fontSize: 10, fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 6px" }}>
            Before
          </p>
          <p style={{ ...B, fontSize: 13, color: "#6B2020", lineHeight: 1.6, margin: 0 }}>{problem.before}</p>
        </div>
      )}

      {/* After — copy button integrated top-right */}
      <div style={{ position: "relative", background: T.greenBg, borderLeft: "3px solid #22C55E", borderRadius: "0 8px 8px 0", padding: "12px 70px 12px 16px" }}>
        <p style={{ ...B, fontSize: 10, fontWeight: 700, color: T.greenDark, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 6px" }}>
          After
        </p>
        <p style={{ ...B, fontSize: 13, color: T.greenText, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{problem.after}</p>
        <button onClick={copy} style={{
          position: "absolute", top: 10, right: 10,
          ...B, fontSize: 11, fontWeight: 700,
          color: copied ? T.greenDark : T.muted,
          background: copied ? "#E0F2E9" : "#fff",
          border: `1px solid ${copied ? T.greenBorder : T.border}`,
          borderRadius: 6, padding: "5px 10px",
          cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
        }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// ── Fix screen ────────────────────────────────────────────────────
function FixScreen({ problem, index, total, onNext, isLast }: {
  problem: Problem;
  index: number;
  total: number;
  onNext: () => void;
  isLast: boolean;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const cat = problem.category ? CAT[problem.category] : { label: "Issue", icon: "⚠️" };

  return (
    <Fade id={10 + index}>
      {/* Badge + counter row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ ...B, fontSize: 11, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {cat.icon} {cat.label}
        </span>
        <span style={{ ...B, fontSize: 11, color: T.muted }}>{index + 1} / {total}</span>
      </div>

      <h2 style={{ ...H, fontSize: 22, fontWeight: 800, color: T.text, margin: "0 0 20px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
        {problem.title}
      </h2>

      <BeforeAfterCard problem={problem} />

      {/* Why toggle */}
      <button onClick={() => setShowWhy(w => !w)} style={{
        background: "none", border: "none", cursor: "pointer", padding: "8px 0",
        display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
      }}>
        <span style={{ fontSize: 13, color: T.muted }}>ⓘ</span>
        <span style={{ ...B, fontSize: 12, color: T.muted, borderBottom: `1px dashed ${T.border}` }}>
          Why does this matter?
        </span>
        <span style={{
          fontSize: 10, color: T.muted, display: "inline-block",
          transform: showWhy ? "rotate(180deg)" : "none",
          transition: "transform 0.2s",
        }}>▾</span>
      </button>

      {showWhy && (
        <div style={{ background: T.surface, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <p style={{ ...B, fontSize: 13, color: T.body, margin: 0, lineHeight: 1.6 }}>{problem.why_buyers_care}</p>
        </div>
      )}

      <Btn onClick={onNext}>{isLast ? "Done →" : "Next →"}</Btn>
    </Fade>
  );
}

// ── Summary screen ────────────────────────────────────────────────
function SummaryScreen({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [p, setP] = useState(false);

  return (
    <Fade id={99}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
        <h2 style={{ ...H, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          You&apos;re done with the fixes
        </h2>
        <p style={{ ...B, fontSize: 14, color: T.body }}>{result.vehicle}</p>
      </div>

      {/* Financial insight split row */}
      {result.asking_price > 0 && result.monthly_payment > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div style={{ background: T.surface, borderRadius: 12, padding: "16px", textAlign: "center" }}>
            <p style={{ ...B, fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
              Asking Price
            </p>
            <p style={{ ...H, fontSize: 20, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.03em" }}>
              ${result.asking_price.toLocaleString()}
            </p>
          </div>
          <div style={{ background: T.text, borderRadius: 12, padding: "16px", textAlign: "center" }}>
            <p style={{ ...B, fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
              Est. Monthly
            </p>
            <p style={{ ...H, fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
              ${result.monthly_payment}/mo
            </p>
            <p style={{ ...B, fontSize: 10, color: "#64748B", margin: "4px 0 0" }}>7% APR · 60 mo</p>
          </div>
        </div>
      )}

      {/* Opportunities — compact vertical stack */}
      {result.opportunities.length > 0 && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ background: T.surface, padding: "10px 16px", borderBottom: `1px solid ${T.border}` }}>
            <p style={{ ...B, fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.09em", margin: 0 }}>
              More opportunities
            </p>
          </div>
          {result.opportunities.map((o, i) => (
            <div key={o.type} style={{
              display: "flex", gap: 12, alignItems: "flex-start",
              padding: "13px 16px",
              background: "#fff",
              borderBottom: i < result.opportunities.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{opIcon(o.type)}</span>
              <div style={{ overflow: "hidden" }}>
                <p style={{ ...H, fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 2px" }}>{o.title}</p>
                <p style={{ ...B, fontSize: 12, color: T.body, margin: 0, lineHeight: 1.5 }}>
                  {o.insight.length > 110 ? o.insight.slice(0, 110) + "…" : o.insight}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upsell */}
      <div style={{ background: T.text, borderRadius: 16, padding: "22px 20px", marginBottom: 10, textAlign: "center" }}>
        <p style={{ ...H, fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          Want the full rewrite?
        </p>
        <p style={{ ...B, fontSize: 13, color: "#94A3B8", margin: "0 0 16px", lineHeight: 1.5 }}>
          Word-for-word rewrites, pricing analysis, full listing overhaul.
        </p>
        <button
          onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)}
          style={{
            ...H, width: "100%", padding: "13px",
            background: "#fff", color: T.text, border: "none", borderRadius: 10,
            fontSize: 14, fontWeight: 800, cursor: "pointer",
            transform: p ? "scale(0.98)" : "scale(1)", transition: "transform 0.12s",
          }}>
          Unlock Full Report — $29
        </button>
        <p style={{ ...B, fontSize: 11, color: "#64748B", margin: "8px 0 0" }}>One-time · Instant access</p>
      </div>

      <button onClick={onReset} style={{
        ...B, width: "100%", padding: "13px", background: "transparent",
        color: T.muted, border: `1px solid ${T.border}`, borderRadius: 12,
        fontSize: 14, cursor: "pointer",
      }}>
        ← Analyze another listing
      </button>
    </Fade>
  );
}

// ── Root ──────────────────────────────────────────────────────────
export default function Flow({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [screen, setScreen] = useState(0);

  useEffect(() => {
    const onPop = () => onReset();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onReset]);

  const fixProblems = [result.biggest_problem, ...(result.also_hurting ?? [])].filter(p => p?.title && p?.after);
  const totalScreens = 1 + fixProblems.length + 1;
  const progress = screen / Math.max(1, totalScreens - 1);

  const renderContent = () => {
    if (screen === 0) {
      return <ScoreScreen result={result} problems={fixProblems} onNext={() => setScreen(1)} />;
    }
    const fixIndex = screen - 1;
    if (fixIndex < fixProblems.length) {
      return (
        <FixScreen
          problem={fixProblems[fixIndex]}
          index={fixIndex}
          total={fixProblems.length}
          onNext={() => setScreen(screen + 1)}
          isLast={fixIndex === fixProblems.length - 1}
        />
      );
    }
    return <SummaryScreen result={result} onReset={onReset} />;
  };

  return (
    <SplitShell result={result} onReset={onReset} progress={progress}>
      {renderContent()}
    </SplitShell>
  );
}
