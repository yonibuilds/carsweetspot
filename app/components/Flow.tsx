"use client";

import { useState, useEffect } from "react";

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

// ── Design tokens ────────────────────────────────────────────────
const T = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  surface: "#F1F5F9",
  border: "#E2E8F0",
  text: "#0F172A",
  body: "#475569",
  muted: "#94A3B8",
  red: "#D85A30",
  redBg: "#FAECE7",
  redBorder: "#F5C4B3",
  redText: "#4A1B0C",
  green: "#15803D",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  greenText: "#14532D",
  amber: "#B45309",
};

const H: React.CSSProperties = { fontFamily: "var(--font-jakarta)" };
const B: React.CSSProperties = { fontFamily: "var(--font-inter)" };

// ── Category config ───────────────────────────────────────────────
const CAT: Record<string, { label: string; icon: string }> = {
  trust:  { label: "Trust", icon: "🤝" },
  text:   { label: "Text", icon: "✍️" },
  photos: { label: "Photos", icon: "📸" },
};

// ── Fade ──────────────────────────────────────────────────────────
function Fade({ children, id }: { children: React.ReactNode; id: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 20); return () => clearTimeout(t); }, [id]);
  return (
    <div style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.3s ease, transform 0.3s ease" }}>
      {children}
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────
function Shell({ children, onReset, counter }: { children: React.ReactNode; onReset: () => void; counter?: string }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(248,250,252,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: 50,
      }}>
        <button onClick={onReset} style={{ ...H, fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          CarSweetSpot
        </button>
        {counter && <span style={{ ...B, fontSize: 12, color: T.muted }}>{counter}</span>}
        {!counter && (
          <button onClick={onReset} style={{ ...B, fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer" }}>
            ← New analysis
          </button>
        )}
      </nav>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "36px 24px 80px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────────
function Btn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick}
      onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)}
      style={{
        ...H, width: "100%", padding: "15px",
        background: T.text, color: "#fff", border: "none",
        borderRadius: 12, fontSize: 15, fontWeight: 700,
        cursor: "pointer", letterSpacing: "-0.01em",
        transform: p ? "scale(0.98)" : "scale(1)", transition: "transform 0.12s",
      }}>
      {children}
    </button>
  );
}

// ── Copy box ──────────────────────────────────────────────────────
function CopyBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ position: "relative", background: T.greenBg, borderLeft: `3px solid ${T.green}`, borderRadius: "0 10px 10px 0", padding: "16px 56px 16px 18px", ...B, fontSize: 14, color: T.greenText, lineHeight: 1.7 }}>
      {text}
      <button onClick={copy} style={{
        position: "absolute", top: 10, right: 10,
        ...B, fontSize: 11, fontWeight: 700,
        color: copied ? T.green : T.muted,
        background: copied ? T.greenBg : "#fff",
        border: `1px solid ${copied ? T.greenBorder : T.border}`,
        borderRadius: 6, padding: "5px 10px",
        cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
      }}>
        {copied ? "✓ הועתק" : "העתק"}
      </button>
    </div>
  );
}

// ── Speedometer ───────────────────────────────────────────────────
function Speedometer({ score }: { score: number }) {
  const R = 80, cx = 110, cy = 95;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const ax = (a: number) => cx + R * Math.cos(toRad(a));
  const ay = (a: number) => cy + R * Math.sin(toRad(a));
  const trackD = `M ${ax(-180)} ${ay(-180)} A ${R} ${R} 0 0 1 ${ax(0)} ${ay(0)}`;
  const pct = score / 100;
  const needleAngle = -180 + pct * 180;
  const nx = cx + 60 * Math.cos(toRad(needleAngle));
  const ny = cy + 60 * Math.sin(toRad(needleAngle));
  const color = score >= 75 ? T.green : score >= 55 ? T.amber : T.red;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={220} height={110} viewBox="0 0 220 110" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={T.red} />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor={T.green} />
          </linearGradient>
        </defs>
        <path d={trackD} fill="none" stroke="#F1F5F9" strokeWidth={14} strokeLinecap="round" />
        <path d={trackD} fill="none" stroke="url(#ag)" strokeWidth={14} strokeLinecap="round"
          strokeDasharray={`${pct * Math.PI * R} ${Math.PI * R}`}
          style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={T.text} strokeWidth={2.5} strokeLinecap="round"
          style={{ transition: "all 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
        <circle cx={cx} cy={cy} r={5} fill={T.text} />
        <circle cx={cx} cy={cy} r={2.5} fill="#fff" />
      </svg>
      <div style={{ marginTop: -4, textAlign: "center" }}>
        <div style={{ ...H, fontSize: 72, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.05em" }}>{score}</div>
        <div style={{ ...B, fontSize: 11, color: T.muted, marginTop: 2 }}>Sweet Spot Score</div>
      </div>
    </div>
  );
}

// ── Screen 2 — Score + 3 categories ──────────────────────────────
function Screen2({ result, problems, onNext, onReset }: {
  result: AnalysisResult;
  problems: Problem[];
  onNext: () => void;
  onReset: () => void;
}) {
  // Build category map: which problems fall in which category
  const catMap: Record<string, Problem | null> = { trust: null, text: null, photos: null };
  problems.forEach(p => { if (p.category && catMap[p.category] === null) catMap[p.category] = p; });

  const lost = 100 - result.overall_score;

  return (
    <Shell onReset={onReset}>
      <Fade id={2}>
        <p style={{ ...B, fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center", marginBottom: 12 }}>
          {result.vehicle}
        </p>
        <Speedometer score={result.overall_score} />

        <div style={{ marginTop: 24, marginBottom: 20 }}>
          <p style={{ ...H, fontSize: 16, fontWeight: 700, color: T.text, textAlign: "center", marginBottom: 16, letterSpacing: "-0.02em" }}>
            Your listing is missing ~{lost}% of potential buyers
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(["trust", "text", "photos"] as const).map(cat => {
              const problem = catMap[cat];
              const pass = !problem;
              return (
                <div key={cat} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  background: pass ? T.greenBg : T.redBg,
                  border: `1px solid ${pass ? T.greenBorder : T.redBorder}`,
                  borderRadius: 12, padding: "12px 16px",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: pass ? T.green : T.red,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 13, fontWeight: 700, marginTop: 1,
                  }}>
                    {pass ? "✓" : "✕"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...B, fontSize: 11, fontWeight: 700, color: pass ? T.green : T.red, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
                      {CAT[cat].icon} {CAT[cat].label}
                    </div>
                    <div style={{ ...H, fontSize: 14, fontWeight: 700, color: pass ? T.greenText : T.redText, lineHeight: 1.3 }}>
                      {pass ? "Good — don't touch" : problem!.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Btn onClick={onNext}>Fix these →</Btn>
      </Fade>
    </Shell>
  );
}

// ── Fix screen — one problem at a time ────────────────────────────
function FixScreen({ problem, index, total, onNext, isLast, onReset }: {
  problem: Problem;
  index: number;
  total: number;
  onNext: () => void;
  isLast: boolean;
  onReset: () => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const cat = problem.category ? CAT[problem.category] : { label: "בעיה", icon: "⚠️" };
  return (
    <Shell onReset={onReset} counter={`${index + 1} / ${total}`}>
      <Fade id={10 + index}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ ...B, fontSize: 11, fontWeight: 700, color: T.red, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {cat.icon} {cat.label}
          </span>
        </div>
        <h2 style={{ ...H, fontSize: 24, fontWeight: 800, color: T.text, margin: "0 0 24px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {problem.title}
        </h2>

        <p style={{ ...B, fontSize: 12, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          Add this to your listing
        </p>
        <CopyBox text={problem.after} />

        <button onClick={() => setShowWhy(w => !w)} style={{
          background: "none", border: "none", cursor: "pointer", padding: "12px 0",
          display: "flex", alignItems: "center", gap: 0,
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: showWhy ? "#FEF3C7" : "#FFFBEB",
            border: `1px solid ${showWhy ? "#F59E0B" : "#FDE68A"}`,
            borderRadius: 99, padding: "5px 12px 5px 8px",
            transition: "all 0.2s",
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%",
              background: showWhy ? "#F59E0B" : "#FCD34D",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#fff",
              transition: "background 0.2s", flexShrink: 0,
            }}>!</span>
            <span style={{ ...B, fontSize: 12, fontWeight: 600, color: "#92400E" }}>
              Why does this matter?
            </span>
            <span style={{ fontSize: 10, color: "#B45309", transform: showWhy ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
          </span>
        </button>

        {showWhy && (
          <div style={{ background: T.surface, borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
            <p style={{ ...B, fontSize: 13, color: T.body, margin: 0, lineHeight: 1.6 }}>{problem.why_buyers_care}</p>
          </div>
        )}

        <div style={{ marginTop: showWhy ? 16 : 0 }}>
          <Btn onClick={onNext}>{isLast ? "Done →" : "Next →"}</Btn>
        </div>
      </Fade>
    </Shell>
  );
}

// ── Summary screen ────────────────────────────────────────────────
function SummaryScreen({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [p, setP] = useState(false);
  return (
    <Shell onReset={onReset}>
      <Fade id={99}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
          <h2 style={{ ...H, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", margin: "0 0 8px" }}>
            You&apos;re done with the fixes
          </h2>
          <p style={{ ...B, fontSize: 14, color: T.body, lineHeight: 1.6 }}>
            {result.vehicle} · ציון {result.overall_score}/100
          </p>
        </div>

        {result.opportunities.length > 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
            <p style={{ ...B, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
              More opportunities
            </p>
            {result.opportunities.map(o => (
              <div key={o.type} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{opIcon(o.type)}</span>
                <div>
                  <p style={{ ...H, fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 2px" }}>{o.title}</p>
                  <p style={{ ...B, fontSize: 12, color: T.body, margin: 0, lineHeight: 1.5 }}>{o.insight}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: T.text, borderRadius: 16, padding: "22px 20px", marginBottom: 12, textAlign: "center" }}>
          <p style={{ ...H, fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>רוצה את התיקון המלא?</p>
          <p style={{ ...B, fontSize: 13, color: "#94A3B8", margin: "0 0 16px", lineHeight: 1.5 }}>Word-for-word rewrites, pricing analysis, full listing overhaul.</p>
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
    </Shell>
  );
}

// ── Icon map ──────────────────────────────────────────────────────
function opIcon(type: string): string {
  const icons: Record<string, string> = {
    financing: "💰", inspection: "🔧", carfax: "📋",
    title: "📄", photos: "📸", description: "✏️",
    garage: "🏠", warranty: "🛡️", price: "💲", payment: "💳", formatting: "📝",
  };
  return icons[type] ?? "💡";
}

// ── Root ──────────────────────────────────────────────────────────
export default function Flow({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [screen, setScreen] = useState(0);

  useEffect(() => {
    const onPop = () => onReset();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onReset]);

  const also = result.also_hurting ?? [];
  const allProblems = [result.biggest_problem, ...also];

  // Only show fix screens for problems that have content
  const fixProblems = allProblems.filter(p => p && p.title && p.after);

  if (screen === 0) {
    return <Screen2 result={result} problems={allProblems} onNext={() => setScreen(1)} onReset={onReset} />;
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
        onReset={onReset}
      />
    );
  }

  return <SummaryScreen result={result} onReset={onReset} />;
}
