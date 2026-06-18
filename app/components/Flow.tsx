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

const COLORS = {
  bg: "#FAFAFA",
  text: "#0F172A",
  accent: "#2563EB",
  muted: "#64748B",
  border: "#E2E8F0",
  problem: "#DC2626",
  warning: "#D97706",
  opportunity: "#7C3AED",
  success: "#16A34A",
  white: "#FFFFFF",
};

const H = { fontFamily: "var(--font-jakarta)" };
const B = { fontFamily: "var(--font-inter)" };

function Nav({ onReset }: { onReset: () => void }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(250,250,250,0.92)", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${COLORS.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px", height: 56,
    }}>
      <span style={{ ...H, fontSize: 15, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>
        CarSweetSpot
      </span>
      <button onClick={onReset} style={{ ...B, fontSize: 13, color: COLORS.muted, background: "none", border: "none", cursor: "pointer" }}>
        ← New analysis
      </button>
    </nav>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 40 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 99,
          background: i < current ? COLORS.text : COLORS.border,
          transition: "background 0.4s",
        }} />
      ))}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 16,
      padding: "24px",
      ...style,
    }}>
      {children}
    </div>
  );
}

function PrimaryBtn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      ...H,
      width: "100%", padding: "16px",
      background: COLORS.text, color: COLORS.white,
      border: "none", borderRadius: 12,
      fontSize: 15, fontWeight: 700, cursor: "pointer",
      letterSpacing: "-0.01em",
      transition: "opacity 0.2s",
    }}>
      {children}
    </button>
  );
}

function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      ...B, fontSize: 11, fontWeight: 600,
      color, textTransform: "uppercase", letterSpacing: "0.08em",
    }}>
      {children}
    </span>
  );
}

// SPEEDOMETER
function Speedometer({ score }: { score: number }) {
  const R = 90;
  const cx = 120;
  const cy = 110;
  const startAngle = -180;
  const endAngle = 0;
  const totalArc = endAngle - startAngle;
  const pct = score / 100;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcX = (angle: number) => cx + R * Math.cos(toRad(angle));
  const arcY = (angle: number) => cy + R * Math.sin(toRad(angle));

  const trackD = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${R} ${R} 0 0 1 ${arcX(endAngle)} ${arcY(endAngle)}`;

  const needleAngle = startAngle + pct * totalArc;
  const needleLen = 70;
  const nx = cx + needleLen * Math.cos(toRad(needleAngle));
  const ny = cy + needleLen * Math.sin(toRad(needleAngle));

  const scoreToColor = (s: number) => {
    if (s >= 75) return COLORS.success;
    if (s >= 55) return COLORS.warning;
    return COLORS.problem;
  };

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={240} height={130} viewBox="0 0 240 130" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.problem} />
            <stop offset="50%" stopColor={COLORS.warning} />
            <stop offset="100%" stopColor={COLORS.success} />
          </linearGradient>
        </defs>
        {/* Track */}
        <path d={trackD} fill="none" stroke="#E2E8F0" strokeWidth={12} strokeLinecap="round" />
        {/* Colored arc */}
        <path d={trackD} fill="none" stroke="url(#arcGrad)" strokeWidth={12} strokeLinecap="round"
          strokeDasharray={`${pct * Math.PI * R} ${Math.PI * R}`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={COLORS.text} strokeWidth={2.5} strokeLinecap="round"
          style={{ transformOrigin: `${cx}px ${cy}px`, transition: "all 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <circle cx={cx} cy={cy} r={6} fill={COLORS.text} />
      </svg>
      <div style={{ marginTop: -8 }}>
        <div style={{ ...H, fontSize: 72, fontWeight: 800, color: scoreToColor(score), lineHeight: 1, letterSpacing: "-0.04em" }}>
          {score}
        </div>
        <div style={{ ...B, fontSize: 13, color: COLORS.muted, marginTop: 4 }}>Sweet Spot Score</div>
      </div>
    </div>
  );
}

// SCREEN 2 — SPEEDOMETER
function Screen2({ result, onNext }: { result: AnalysisResult; onNext: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "0 24px 48px" }}>
      <p style={{ ...B, fontSize: 12, color: COLORS.muted, marginBottom: 32, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {result.vehicle}
      </p>
      <Speedometer score={result.overall_score} />
      <div style={{ marginTop: 48, maxWidth: 400, margin: "48px auto 0" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 40 }}>
          {[
            { label: "Pricing", done: true },
            { label: "Listing", done: true },
            { label: "Trust", done: true },
            { label: "Financing", done: true },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>✓</div>
              <div style={{ ...B, fontSize: 11, color: COLORS.muted }}>{item.label}</div>
            </div>
          ))}
        </div>
        <PrimaryBtn onClick={onNext}>See Your Diagnosis →</PrimaryBtn>
      </div>
    </div>
  );
}

// SCREEN 3 — DIAGNOSIS
function Screen3({ result, onNext }: { result: AnalysisResult; onNext: () => void }) {
  return (
    <div style={{ maxWidth: 560, width: "100%", padding: "0 24px 48px" }}>
      <ProgressBar current={2} total={7} />

      <h1 style={{ ...H, fontSize: 28, fontWeight: 800, color: COLORS.text, marginBottom: 8, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
        Here&apos;s what&apos;s happening.
      </h1>
      <p style={{ ...B, fontSize: 15, color: COLORS.muted, marginBottom: 32, lineHeight: 1.6 }}>
        Your listing has a Sweet Spot Score of <strong style={{ color: COLORS.text }}>{result.overall_score}</strong>. Here&apos;s the full picture.
      </p>

      {/* Biggest Problem */}
      <Card style={{ marginBottom: 12, borderLeft: `4px solid ${COLORS.problem}` }}>
        <Label color={COLORS.problem}>🚨 Biggest Problem</Label>
        <p style={{ ...H, fontSize: 17, fontWeight: 700, color: COLORS.text, marginTop: 8, marginBottom: 0 }}>
          {result.biggest_problem.title}
        </p>
      </Card>

      {/* Also Hurting */}
      {result.also_hurting.map((p, i) => (
        <Card key={i} style={{ marginBottom: 12, borderLeft: `4px solid ${COLORS.warning}` }}>
          <Label color={COLORS.warning}>⚠️ Also Hurting</Label>
          <p style={{ ...H, fontSize: 16, fontWeight: 700, color: COLORS.text, marginTop: 8, marginBottom: 0 }}>
            {p.title}
          </p>
        </Card>
      ))}

      {/* Opportunities */}
      <Card style={{ marginBottom: 12, borderLeft: `4px solid ${COLORS.opportunity}` }}>
        <Label color={COLORS.opportunity}>💡 Missed Opportunities</Label>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {result.opportunities.map((o) => (
            <p key={o.type} style={{ ...B, fontSize: 14, color: COLORS.muted, margin: 0 }}>· {o.title}</p>
          ))}
        </div>
      </Card>

      {/* What's Working */}
      {result.whats_working.length > 0 && (
        <Card style={{ marginBottom: 40, borderLeft: `4px solid ${COLORS.success}` }}>
          <Label color={COLORS.success}>✅ What&apos;s Working</Label>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {result.whats_working.map((w, i) => (
              <p key={i} style={{ ...B, fontSize: 14, color: COLORS.muted, margin: 0 }}>· {w}</p>
            ))}
          </div>
        </Card>
      )}

      <PrimaryBtn onClick={onNext}>Show Me How To Improve →</PrimaryBtn>
    </div>
  );
}

// SCREEN 4/5/6 — PROBLEM DETAIL
function ProblemScreen({
  problem,
  label,
  labelColor,
  screenNum,
  totalScreens,
  onNext,
  nextLabel,
}: {
  problem: Problem;
  label: string;
  labelColor: string;
  screenNum: number;
  totalScreens: number;
  onNext: () => void;
  nextLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(problem.after);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 560, width: "100%", padding: "0 24px 48px" }}>
      <ProgressBar current={screenNum} total={totalScreens} />

      <Label color={labelColor}>{label}</Label>
      <h1 style={{ ...H, fontSize: 26, fontWeight: 800, color: COLORS.text, margin: "12px 0 8px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
        {problem.title}
      </h1>

      <p style={{ ...B, fontSize: 15, color: "#334155", lineHeight: 1.7, marginBottom: 8 }}>
        {problem.why_buyers_care}
      </p>

      <Card style={{ marginBottom: 24, background: "#F8FAFC" }}>
        <Label color={COLORS.muted}>💡 Seller Insight</Label>
        <p style={{ ...B, fontSize: 14, color: "#334155", marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
          {problem.seller_insight}
        </p>
      </Card>

      {/* Before */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ ...B, fontSize: 11, fontWeight: 600, color: COLORS.problem, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Before
        </div>
        <div style={{
          background: "#FFF5F5",
          border: `1px solid #FECACA`,
          borderRadius: 12,
          padding: "16px",
          ...B, fontSize: 14, color: "#7F1D1D", lineHeight: 1.7,
        }}>
          {problem.before}
        </div>
      </div>

      {/* After */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ ...B, fontSize: 11, fontWeight: 600, color: COLORS.success, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          After
        </div>
        <div style={{
          background: "#F0FDF4",
          border: `1px solid #BBF7D0`,
          borderRadius: 12,
          padding: "16px",
          ...B, fontSize: 14, color: "#14532D", lineHeight: 1.7,
          marginBottom: 10,
        }}>
          {problem.after}
        </div>
        <button onClick={handleCopy} style={{
          ...B, width: "100%", padding: "11px",
          background: copied ? "#F0FDF4" : "white",
          color: copied ? COLORS.success : COLORS.muted,
          border: `1px solid ${copied ? "#BBF7D0" : COLORS.border}`,
          borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s",
        }}>
          {copied ? "✓ Copied to clipboard" : "Copy improved text"}
        </button>
      </div>

      <PrimaryBtn onClick={onNext}>{nextLabel}</PrimaryBtn>
    </div>
  );
}

// SCREEN 7 — OPPORTUNITIES
function Screen7({ result, onNext }: { result: AnalysisResult; onNext: () => void }) {
  const opIcons: Record<string, string> = {
    financing: "💰",
    inspection: "🔧",
    carfax: "📋",
  };

  return (
    <div style={{ maxWidth: 560, width: "100%", padding: "0 24px 48px" }}>
      <ProgressBar current={6} total={7} />

      <Label color={COLORS.opportunity}>💡 Missed Opportunities</Label>
      <h1 style={{ ...H, fontSize: 26, fontWeight: 800, color: COLORS.text, margin: "12px 0 8px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
        More buyers can reach this car than you think.
      </h1>

      {result.asking_price > 0 && (
        <Card style={{ marginBottom: 24, marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ ...B, fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Vehicle Price</div>
              <div style={{ ...H, fontSize: 28, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.03em" }}>
                ${result.asking_price.toLocaleString()}
              </div>
            </div>
            <div style={{ width: 1, height: 48, background: COLORS.border }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ ...B, fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Est. Monthly Payment</div>
              <div style={{ ...H, fontSize: 28, fontWeight: 800, color: COLORS.accent, letterSpacing: "-0.03em" }}>
                ${result.monthly_payment}/mo
              </div>
              <div style={{ ...B, fontSize: 11, color: COLORS.muted }}>60 months · 7% APR</div>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
        {result.opportunities.map((op) => (
          <Card key={op.type}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{opIcons[op.type]}</span>
              <div>
                <div style={{ ...H, fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>{op.title}</div>
                <p style={{ ...B, fontSize: 14, color: COLORS.muted, margin: 0, lineHeight: 1.6 }}>{op.insight}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PrimaryBtn onClick={onNext}>See Summary →</PrimaryBtn>
    </div>
  );
}

// SCREEN 8 — SUMMARY
function Screen8({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  return (
    <div style={{ maxWidth: 560, width: "100%", padding: "0 24px 48px" }}>
      <ProgressBar current={7} total={7} />

      <Label color={COLORS.success}>✅ Analysis Complete</Label>
      <h1 style={{ ...H, fontSize: 26, fontWeight: 800, color: COLORS.text, margin: "12px 0 24px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
        Your {result.vehicle} — Full Summary
      </h1>

      <Card style={{ marginBottom: 12, borderLeft: `4px solid ${COLORS.problem}` }}>
        <Label color={COLORS.problem}>🚨 Biggest Problem</Label>
        <p style={{ ...H, fontSize: 15, fontWeight: 700, color: COLORS.text, marginTop: 8, marginBottom: 0 }}>{result.biggest_problem.title}</p>
      </Card>

      {result.also_hurting.map((p, i) => (
        <Card key={i} style={{ marginBottom: 12, borderLeft: `4px solid ${COLORS.warning}` }}>
          <Label color={COLORS.warning}>⚠️ Also Hurting</Label>
          <p style={{ ...H, fontSize: 15, fontWeight: 700, color: COLORS.text, marginTop: 8, marginBottom: 0 }}>{p.title}</p>
        </Card>
      ))}

      <Card style={{ marginBottom: 32, borderLeft: `4px solid ${COLORS.opportunity}` }}>
        <Label color={COLORS.opportunity}>💡 Opportunities</Label>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {result.opportunities.map((o) => (
            <p key={o.type} style={{ ...B, fontSize: 14, color: COLORS.muted, margin: 0 }}>· {o.title}</p>
          ))}
        </div>
      </Card>

      {/* Premium */}
      <div style={{
        background: COLORS.text, borderRadius: 16, padding: "28px 24px", marginBottom: 16, textAlign: "center",
      }}>
        <div style={{ ...H, fontSize: 18, fontWeight: 800, color: "white", marginBottom: 8, letterSpacing: "-0.02em" }}>
          Want the complete fix?
        </div>
        <p style={{ ...B, fontSize: 14, color: "#94A3B8", marginBottom: 20, lineHeight: 1.6 }}>
          Get word-for-word rewrites, exact pricing recommendation, and a complete listing overhaul.
        </p>
        <button style={{
          ...H, width: "100%", padding: "14px",
          background: "white", color: COLORS.text,
          border: "none", borderRadius: 10,
          fontSize: 15, fontWeight: 800, cursor: "pointer",
          letterSpacing: "-0.01em",
        }}>
          Unlock Full Report — $29
        </button>
        <p style={{ ...B, fontSize: 11, color: "#475569", marginTop: 10 }}>One-time · Instant access</p>
      </div>

      <button onClick={onReset} style={{
        ...B, width: "100%", padding: "14px",
        background: "transparent", color: COLORS.muted,
        border: `1px solid ${COLORS.border}`, borderRadius: 10,
        fontSize: 14, fontWeight: 500, cursor: "pointer",
      }}>
        ← Analyze another listing
      </button>
    </div>
  );
}

// MAIN FLOW
export default function Flow({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [screen, setScreen] = useState(2);

  const screens: Record<number, React.ReactNode> = {
    2: <Screen2 result={result} onNext={() => setScreen(3)} />,
    3: <Screen3 result={result} onNext={() => setScreen(4)} />,
    4: (
      <ProblemScreen
        problem={result.biggest_problem}
        label="🚨 Biggest Problem"
        labelColor={COLORS.problem}
        screenNum={3}
        totalScreens={7}
        onNext={() => setScreen(5)}
        nextLabel="Next Issue →"
      />
    ),
    5: (
      <ProblemScreen
        problem={result.also_hurting[0]}
        label="⚠️ Also Hurting"
        labelColor={COLORS.warning}
        screenNum={4}
        totalScreens={7}
        onNext={() => setScreen(6)}
        nextLabel="Next Issue →"
      />
    ),
    6: (
      <ProblemScreen
        problem={result.also_hurting[1]}
        label="⚠️ Also Hurting"
        labelColor={COLORS.warning}
        screenNum={5}
        totalScreens={7}
        onNext={() => setScreen(7)}
        nextLabel="See Opportunities →"
      />
    ),
    7: <Screen7 result={result} onNext={() => setScreen(8)} />,
    8: <Screen8 result={result} onReset={onReset} />,
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }}>
      <Nav onReset={onReset} />
      <div style={{
        paddingTop: 96,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {screens[screen]}
      </div>
    </div>
  );
}
