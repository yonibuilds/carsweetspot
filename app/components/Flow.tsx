"use client";

import { useState } from "react";

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

// ─── Design tokens ───────────────────────────────────────────────
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
  shadow: "0 10px 25px -5px rgba(0,0,0,0.04), 0 8px 10px -6px rgba(0,0,0,0.02)",
};

const H: React.CSSProperties = { fontFamily: "var(--font-jakarta)" };
const B: React.CSSProperties = { fontFamily: "var(--font-inter)" };

// ─── Shared primitives ────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: "16px 18px", ...style,
    }}>
      {children}
    </div>
  );
}

function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      ...B, fontSize: 11, fontWeight: 700, color,
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {children}
    </span>
  );
}

function PrimaryBtn({ onClick, children, style }: { onClick?: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        ...H, width: "100%", padding: "14px 20px",
        background: T.text, color: "#fff",
        border: "none", borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: "pointer",
        letterSpacing: "-0.01em",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.1s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
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

// ─── Shell ────────────────────────────────────────────────────────
function Shell({ children, onReset, wide }: { children: React.ReactNode; onReset: () => void; wide?: boolean }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, width: "100%",
        background: "rgba(248,250,252,0.9)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: 52,
      }}>
        <span style={{ ...H, fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>CarSweetSpot</span>
        <button onClick={onReset} style={{ ...B, fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer" }}>
          ← New analysis
        </button>
      </nav>

      {/* Floating card */}
      <div style={{
        width: "100%", maxWidth: wide ? 540 : 480,
        margin: "32px 0 64px",
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        boxShadow: T.shadow,
        padding: "28px 28px 32px",
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Speedometer ──────────────────────────────────────────────────
function Speedometer({ score }: { score: number }) {
  const R = 80, cx = 110, cy = 100;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const ax = (a: number) => cx + R * Math.cos(toRad(a));
  const ay = (a: number) => cy + R * Math.sin(toRad(a));
  const trackD = `M ${ax(-180)} ${ay(-180)} A ${R} ${R} 0 0 1 ${ax(0)} ${ay(0)}`;
  const pct = score / 100;
  const color = score >= 75 ? T.success : score >= 55 ? T.warning : T.problem;

  const needleAngle = -180 + pct * 180;
  const nLen = 62;
  const nx = cx + nLen * Math.cos(toRad(needleAngle));
  const ny = cy + nLen * Math.sin(toRad(needleAngle));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={220} height={120} viewBox="0 0 220 120" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={T.problem} />
            <stop offset="50%" stopColor={T.warning} />
            <stop offset="100%" stopColor={T.success} />
          </linearGradient>
        </defs>
        <path d={trackD} fill="none" stroke="#E2E8F0" strokeWidth={16} strokeLinecap="round" />
        <path d={trackD} fill="none" stroke="url(#g)" strokeWidth={16} strokeLinecap="round"
          strokeDasharray={`${pct * Math.PI * R} ${Math.PI * R}`}
          style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={T.text} strokeWidth={3} strokeLinecap="round"
          style={{ transition: "all 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <circle cx={cx} cy={cy} r={5} fill={T.text} />
      </svg>
      <div style={{ marginTop: -4, textAlign: "center" }}>
        <div style={{ ...H, fontSize: 80, fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.05em" }}>{score}</div>
        <div style={{ ...B, fontSize: 12, color: T.muted, marginTop: 2 }}>Sweet Spot Score</div>
      </div>
    </div>
  );
}

// ─── Screen 2 — Score reveal ──────────────────────────────────────
function Screen2({ result, onNext }: { result: AnalysisResult; onNext: () => void }) {
  return (
    <Shell onReset={() => {}} wide={false}>
      <p style={{ ...B, fontSize: 11, color: T.muted, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
        {result.vehicle}
      </p>
      <Speedometer score={result.overall_score} />

      {/* Category chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", margin: "24px 0 28px" }}>
        {["Pricing", "Listing", "Trust", "Financing"].map(cat => (
          <div key={cat} style={{
            ...B, display: "flex", alignItems: "center", gap: 5,
            background: "#F0FDF4", border: "1px solid #BBF7D0",
            borderRadius: 20, padding: "5px 12px",
            fontSize: 12, fontWeight: 600, color: "#15803D",
          }}>
            <span style={{ fontSize: 10 }}>✓</span> {cat}
          </div>
        ))}
      </div>

      <PrimaryBtn onClick={onNext}>See Your Diagnosis →</PrimaryBtn>
    </Shell>
  );
}

// ─── Screen 3 — Diagnosis ─────────────────────────────────────────
function Screen3({ result, onNext, onReset }: { result: AnalysisResult; onNext: () => void; onReset: () => void }) {
  return (
    <Shell onReset={onReset} wide>
      <ProgressBar current={2} total={7} />
      <h2 style={{ ...H, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 4 }}>
        Here&apos;s what&apos;s happening.
      </h2>
      <p style={{ ...B, fontSize: 13, color: T.body, marginBottom: 20, lineHeight: 1.5 }}>
        Sweet Spot Score: <strong style={{ color: T.text }}>{result.overall_score}</strong>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
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
    </Shell>
  );
}

// ─── Before / After snippet ───────────────────────────────────────
function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(after);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Before */}
      <div>
        <div style={{ ...B, fontSize: 10, fontWeight: 700, color: T.problem, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Before</div>
        <div style={{
          background: "#FAF7F7", borderLeft: `3px solid ${T.problem}`,
          borderRadius: "0 8px 8px 0", padding: "10px 12px",
          ...B, fontSize: 13, color: "#7F1D1D", lineHeight: 1.6,
        }}>
          {before}
        </div>
      </div>

      {/* After */}
      <div>
        <div style={{ ...B, fontSize: 10, fontWeight: 700, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>After</div>
        <div style={{
          position: "relative",
          background: "#F4FBF7", borderLeft: `3px solid ${T.success}`,
          borderRadius: "0 8px 8px 0", padding: "10px 12px 10px 12px",
          ...B, fontSize: 13, color: "#14532D", lineHeight: 1.6,
        }}>
          <span style={{ paddingRight: 52 }}>{after}</span>
          <button onClick={copy} style={{
            position: "absolute", top: 8, right: 8,
            ...B, fontSize: 11, fontWeight: 600,
            color: copied ? "#15803D" : T.body,
            background: copied ? "#DCFCE7" : T.card,
            border: `1px solid ${copied ? "#BBF7D0" : T.border}`,
            borderRadius: 6, padding: "3px 8px",
            cursor: "pointer", transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screens 4-6 — Problem detail ─────────────────────────────────
function ProblemScreen({
  problem, label, labelColor, current, total, onNext, nextLabel, onReset,
}: {
  problem: Problem; label: string; labelColor: string;
  current: number; total: number;
  onNext: () => void; nextLabel: string; onReset: () => void;
}) {
  return (
    <Shell onReset={onReset}>
      <ProgressBar current={current} total={total} />
      <Label color={labelColor}>{label}</Label>
      <h2 style={{ ...H, fontSize: 20, fontWeight: 800, color: T.text, margin: "8px 0 10px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
        {problem.title}
      </h2>
      <p style={{ ...B, fontSize: 13, color: T.body, lineHeight: 1.6, marginBottom: 14 }}>
        {problem.why_buyers_care}
      </p>

      <Card style={{ background: "#F8FAFC", marginBottom: 16 }}>
        <Label color={T.muted}>💡 Seller Insight</Label>
        <p style={{ ...B, fontSize: 13, color: T.body, marginTop: 6, marginBottom: 0, lineHeight: 1.6 }}>
          {problem.seller_insight}
        </p>
      </Card>

      <div style={{ marginBottom: 24 }}>
        <BeforeAfter before={problem.before} after={problem.after} />
      </div>

      <PrimaryBtn onClick={onNext}>{nextLabel}</PrimaryBtn>
    </Shell>
  );
}

// ─── Screen 7 — Opportunities ─────────────────────────────────────
function Screen7({ result, onNext, onReset }: { result: AnalysisResult; onNext: () => void; onReset: () => void }) {
  const icons: Record<string, string> = { financing: "💰", inspection: "🔧", carfax: "📋" };
  return (
    <Shell onReset={onReset} wide>
      <ProgressBar current={6} total={7} />
      <Label color={T.opportunity}>💡 Missed Opportunities</Label>
      <h2 style={{ ...H, fontSize: 20, fontWeight: 800, color: T.text, margin: "8px 0 18px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
        More buyers can reach this car than you think.
      </h2>

      {result.asking_price > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ ...B, fontSize: 11, color: T.muted, marginBottom: 3 }}>Vehicle Price</div>
              <div style={{ ...H, fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>
                ${result.asking_price.toLocaleString()}
              </div>
            </div>
            <div style={{ width: 1, height: 40, background: T.border }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ ...B, fontSize: 11, color: T.muted, marginBottom: 3 }}>Est. Monthly</div>
              <div style={{ ...H, fontSize: 24, fontWeight: 800, color: T.accent, letterSpacing: "-0.03em" }}>
                ${result.monthly_payment}/mo
              </div>
              <div style={{ ...B, fontSize: 10, color: T.muted }}>60 mo · 7% APR</div>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {result.opportunities.map(op => (
          <Card key={op.type}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icons[op.type]}</span>
              <div>
                <div style={{ ...H, fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{op.title}</div>
                <p style={{ ...B, fontSize: 13, color: T.body, margin: 0, lineHeight: 1.5 }}>{op.insight}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PrimaryBtn onClick={onNext}>See Summary →</PrimaryBtn>
    </Shell>
  );
}

// ─── Screen 8 — Summary ───────────────────────────────────────────
function Screen8({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Shell onReset={onReset} wide>
      <ProgressBar current={7} total={7} />
      <Label color={T.success}>✅ Analysis Complete</Label>
      <h2 style={{ ...H, fontSize: 20, fontWeight: 800, color: T.text, margin: "8px 0 18px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
        {result.vehicle} — Full Summary
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        <Card style={{ borderLeft: `3px solid ${T.problem}` }}>
          <Label color={T.problem}>🚨 Biggest Problem</Label>
          <p style={{ ...H, fontSize: 14, fontWeight: 700, color: T.text, margin: "6px 0 0" }}>{result.biggest_problem.title}</p>
        </Card>
        {result.also_hurting.map((p, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${T.warning}` }}>
            <Label color={T.warning}>⚠️ Also Hurting</Label>
            <p style={{ ...H, fontSize: 14, fontWeight: 700, color: T.text, margin: "6px 0 0" }}>{p.title}</p>
          </Card>
        ))}
        <Card style={{ borderLeft: `3px solid ${T.opportunity}` }}>
          <Label color={T.opportunity}>💡 Opportunities</Label>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
            {result.opportunities.map(o => (
              <p key={o.type} style={{ ...B, fontSize: 13, color: T.body, margin: 0 }}>· {o.title}</p>
            ))}
          </div>
        </Card>
      </div>

      {/* Premium */}
      <div style={{
        background: T.text, borderRadius: 14, padding: "22px 20px", marginBottom: 12, textAlign: "center",
      }}>
        <div style={{ ...H, fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-0.02em" }}>
          Want the complete fix?
        </div>
        <p style={{ ...B, fontSize: 13, color: "#94A3B8", marginBottom: 16, lineHeight: 1.5 }}>
          Word-for-word rewrites, exact pricing analysis, and a complete listing overhaul.
        </p>
        <button
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          style={{
            ...H, width: "100%", padding: "13px",
            background: "#fff", color: T.text,
            border: "none", borderRadius: 10,
            fontSize: 14, fontWeight: 800, cursor: "pointer",
            letterSpacing: "-0.01em",
            transform: pressed ? "scale(0.98)" : "scale(1)",
            transition: "transform 0.1s",
          }}
        >
          Unlock Full Report — $29
        </button>
        <p style={{ ...B, fontSize: 11, color: "#475569", marginTop: 8 }}>One-time · Instant access</p>
      </div>

      <button onClick={onReset} style={{
        ...B, width: "100%", padding: "13px",
        background: "transparent", color: T.muted,
        border: `1px solid ${T.border}`, borderRadius: 10,
        fontSize: 13, fontWeight: 500, cursor: "pointer",
      }}>
        ← Analyze another listing
      </button>
    </Shell>
  );
}

// ─── Root ─────────────────────────────────────────────────────────
export default function Flow({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [screen, setScreen] = useState(2);

  const screens: Record<number, React.ReactNode> = {
    2: <Screen2 result={result} onNext={() => setScreen(3)} />,
    3: <Screen3 result={result} onNext={() => setScreen(4)} onReset={onReset} />,
    4: <ProblemScreen problem={result.biggest_problem} label="🚨 Biggest Problem" labelColor={T.problem} current={3} total={7} onNext={() => setScreen(5)} nextLabel="Next Issue →" onReset={onReset} />,
    5: <ProblemScreen problem={result.also_hurting[0]} label="⚠️ Also Hurting" labelColor={T.warning} current={4} total={7} onNext={() => setScreen(6)} nextLabel="Next Issue →" onReset={onReset} />,
    6: <ProblemScreen problem={result.also_hurting[1]} label="⚠️ Also Hurting" labelColor={T.warning} current={5} total={7} onNext={() => setScreen(7)} nextLabel="See Opportunities →" onReset={onReset} />,
    7: <Screen7 result={result} onNext={() => setScreen(8)} onReset={onReset} />,
    8: <Screen8 result={result} onReset={onReset} />,
  };

  return <>{screens[screen]}</>;
}
