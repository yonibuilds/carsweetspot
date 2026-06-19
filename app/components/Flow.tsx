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
  borderSoft: "#F1F5F9",
  text: "#0F172A",
  body: "#475569",
  muted: "#94A3B8",
  red: "#D85A30",
  redBg: "#FAECE7",
  redBorder: "#F5C4B3",
  redText: "#4A1B0C",
  redLabel: "#993C1D",
  amber: "#B45309",
  amberBg: "#FFFBEB",
  amberBorder: "#FDE68A",
  amberText: "#78350F",
  purple: "#534AB7",
  purpleBg: "#EEEDFE",
  purpleBorder: "#AFA9EC",
  purpleText: "#26215C",
  green: "#15803D",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  greenText: "#14532D",
};

const H: React.CSSProperties = { fontFamily: "var(--font-jakarta)" };
const B: React.CSSProperties = { fontFamily: "var(--font-inter)" };

// ── Fade-in wrapper ───────────────────────────────────────────────
function Fade({ children, id }: { children: React.ReactNode; id: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 20); return () => clearTimeout(t); }, [id]);
  return (
    <div style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.3s ease, transform 0.3s ease" }}>
      {children}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 3, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 2, borderRadius: 99,
          background: i < current ? T.text : T.border,
          transition: "background 0.4s ease",
        }} />
      ))}
    </div>
  );
}

// ── Label pill ────────────────────────────────────────────────────
function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ ...B, fontSize: 11, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.07em" }}>
      {children}
    </span>
  );
}

// ── Primary button ────────────────────────────────────────────────
function Btn({ onClick, children, secondary }: { onClick?: () => void; children: React.ReactNode; secondary?: boolean }) {
  const [p, setP] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)}
      style={{
        ...H, width: "100%", padding: "14px",
        background: secondary ? "transparent" : T.text,
        color: secondary ? T.muted : "#fff",
        border: secondary ? `1px solid ${T.border}` : "none",
        borderRadius: 12, fontSize: 14, fontWeight: 700,
        cursor: "pointer", letterSpacing: "-0.01em",
        transform: p ? "scale(0.98)" : "scale(1)", transition: "transform 0.12s",
      }}>
      {children}
    </button>
  );
}

// ── Shell ─────────────────────────────────────────────────────────
function Shell({ children, onReset, maxW = 680 }: { children: React.ReactNode; onReset: () => void; maxW?: number }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(248,250,252,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 52,
      }}>
        <span style={{ ...H, fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>CarSweetSpot</span>
        <button onClick={onReset} style={{ ...B, fontSize: 13, color: T.muted, background: "none", border: "none", cursor: "pointer" }}>
          ← New analysis
        </button>
      </nav>
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px 80px" }}>
        <div style={{ width: "100%", maxWidth: maxW, background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Score badge ───────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? T.green : score >= 55 ? T.amber : T.red;
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ ...H, fontSize: 40, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.04em" }}>{score}</div>
      <div style={{ ...B, fontSize: 11, color: T.muted, marginTop: 2 }}>Sweet Spot Score</div>
    </div>
  );
}

// ── Speedometer ───────────────────────────────────────────────────
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
  const scoreColor = score >= 75 ? T.green : score >= 55 ? T.amber : T.red;
  const tickers = Array.from({ length: 9 }, (_, i) => {
    const angle = -180 + i * (180 / 8);
    return {
      x1: cx + (R - 10) * Math.cos(toRad(angle)), y1: cy + (R - 10) * Math.sin(toRad(angle)),
      x2: cx + (R - 2) * Math.cos(toRad(angle)), y2: cy + (R - 2) * Math.sin(toRad(angle)),
    };
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={260} height={130} viewBox="0 0 260 130" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={T.red} />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor={T.green} />
          </linearGradient>
        </defs>
        <path d={trackD} fill="none" stroke="#F1F5F9" strokeWidth={18} strokeLinecap="round" />
        <path d={trackD} fill="none" stroke="url(#arcGrad)" strokeWidth={18} strokeLinecap="round"
          strokeDasharray={`${pct * Math.PI * R} ${Math.PI * R}`}
          style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {tickers.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#CBD5E1" strokeWidth={1.5} strokeLinecap="round" />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={T.text} strokeWidth={2.5} strokeLinecap="round"
          style={{ transition: "all 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <circle cx={cx} cy={cy} r={6} fill={T.text} />
        <circle cx={cx} cy={cy} r={3} fill="#fff" />
      </svg>
      <div style={{ marginTop: -8, textAlign: "center" }}>
        <div style={{ ...H, fontSize: 88, fontWeight: 800, color: scoreColor, lineHeight: 1, letterSpacing: "-0.05em" }}>{score}</div>
        <div style={{ ...B, fontSize: 12, color: T.muted, marginTop: 2 }}>Sweet Spot Score</div>
      </div>
    </div>
  );
}

// ── Before / After ────────────────────────────────────────────────
function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(after); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ ...B, fontSize: 10, fontWeight: 700, color: T.red, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Before</div>
        <div style={{ background: T.redBg, borderLeft: `3px solid ${T.red}`, borderRadius: "0 8px 8px 0", padding: "12px 14px", ...B, fontSize: 13, color: T.redText, lineHeight: 1.6 }}>
          {before}
        </div>
      </div>
      <div>
        <div style={{ ...B, fontSize: 10, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>After</div>
        <div style={{ position: "relative", background: T.greenBg, borderLeft: `3px solid ${T.green}`, borderRadius: "0 8px 8px 0", padding: "12px 48px 12px 14px", ...B, fontSize: 13, color: T.greenText, lineHeight: 1.6 }}>
          {after}
          <button onClick={copy} style={{
            position: "absolute", top: 8, right: 8,
            ...B, fontSize: 10, fontWeight: 700,
            color: copied ? T.green : T.muted,
            background: copied ? T.greenBg : "#fff",
            border: `1px solid ${copied ? T.greenBorder : T.border}`,
            borderRadius: 6, padding: "4px 8px",
            cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
          }}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Screen 2 — Score reveal ───────────────────────────────────────
function Screen2({ result, onNext, onReset }: { result: AnalysisResult; onNext: () => void; onReset: () => void }) {
  return (
    <Shell onReset={onReset} maxW={480}>
      <Fade id={2}>
        <p style={{ ...B, fontSize: 11, color: T.muted, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          {result.vehicle}
        </p>
        <Speedometer score={result.overall_score} />
        <div style={{ margin: "24px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 10, padding: "12px 16px" }}>
            <Label color={T.redLabel}>🚨 Biggest Problem</Label>
            <p style={{ ...H, fontSize: 14, fontWeight: 700, color: T.redText, margin: "5px 0 0", lineHeight: 1.3 }}>{result.biggest_problem.title}</p>
          </div>
          <div style={{ background: T.amberBg, border: `1px solid ${T.amberBorder}`, borderRadius: 10, padding: "12px 16px" }}>
            <p style={{ ...B, fontSize: 13, color: T.amberText, margin: 0 }}>
              <strong>{(result.also_hurting ?? []).length} more issues</strong> we&apos;ll walk you through
            </p>
          </div>
          <div style={{ background: T.purpleBg, border: `1px solid ${T.purpleBorder}`, borderRadius: 10, padding: "12px 16px" }}>
            <p style={{ ...B, fontSize: 13, color: T.purpleText, margin: 0 }}>
              <strong>{(result.opportunities ?? []).length} opportunities</strong> to attract more buyers
            </p>
          </div>
        </div>
        <Btn onClick={onNext}>See Your Diagnosis →</Btn>
      </Fade>
    </Shell>
  );
}

// ── Screen 3 — Diagnosis overview ────────────────────────────────
function Screen3({ result, onNext, onReset }: { result: AnalysisResult; onNext: () => void; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Shell onReset={onReset} maxW={600}>
      <Fade id={3}>
        <ProgressBar current={2} total={7} />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{ ...B, fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>{result.vehicle}</p>
            <h2 style={{ ...H, fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.03em" }}>Here&apos;s what&apos;s happening.</h2>
          </div>
          <ScoreBadge score={result.overall_score} />
        </div>

        {/* Biggest problem */}
        <div style={{ background: T.redBg, borderLeft: `3px solid ${T.red}`, borderRadius: "0 12px 12px 0", padding: "14px 18px", marginBottom: 10 }}>
          <Label color={T.redLabel}>Biggest problem</Label>
          <p style={{ ...H, fontSize: 15, fontWeight: 700, color: T.redText, margin: "5px 0 6px" }}>{result.biggest_problem.title}</p>
          <p style={{ ...B, fontSize: 13, color: T.redLabel, margin: 0, lineHeight: 1.5 }}>{result.biggest_problem.why_buyers_care}</p>
        </div>

        {/* Also hurting — 2 columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          {result.also_hurting.map((p, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px" }}>
              <Label color={T.amber}>Also hurting</Label>
              <p style={{ ...H, fontSize: 13, fontWeight: 700, color: T.text, margin: "5px 0 4px" }}>{p.title}</p>
              <p style={{ ...B, fontSize: 12, color: T.body, margin: 0, lineHeight: 1.5 }}>{p.why_buyers_care}</p>
            </div>
          ))}
        </div>

        {/* Opportunities */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
          <Label color={T.purple}>Missed opportunities</Label>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {result.opportunities.map(o => (
              <div key={o.type} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{opIcon(o.type)}</span>
                <span style={{ ...B, fontSize: 13, color: T.body }}>{o.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What's working — accordion */}
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
          <button onClick={() => setOpen(o => !o)} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer",
          }}>
            <Label color={T.green}>✓ What&apos;s working</Label>
            <span style={{ fontSize: 14, color: T.muted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
          </button>
          {open && (
            <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${T.border}` }}>
              {result.whats_working.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 8, paddingTop: 8 }}>
                  <span style={{ color: T.green, fontSize: 13, flexShrink: 0 }}>✓</span>
                  <span style={{ ...B, fontSize: 13, color: T.body, lineHeight: 1.5 }}>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Btn onClick={onNext}>Show Me How To Improve →</Btn>
      </Fade>
    </Shell>
  );
}

// ── Problem detail screens (4-6) ──────────────────────────────────
function ProblemScreen({ problem, label, labelColor, labelBg, current, total, onNext, nextLabel, onReset }: {
  problem: Problem; label: string; labelColor: string; labelBg: string;
  current: number; total: number; onNext: () => void; nextLabel: string; onReset: () => void;
}) {
  return (
    <Shell onReset={onReset} maxW={560}>
      <Fade id={current}>
        <ProgressBar current={current} total={total} />
        <div style={{ display: "inline-block", background: labelBg, borderRadius: 6, padding: "3px 8px", marginBottom: 12 }}>
          <Label color={labelColor}>{label}</Label>
        </div>
        <h2 style={{ ...H, fontSize: 20, fontWeight: 800, color: T.text, margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          {problem.title}
        </h2>
        <p style={{ ...B, fontSize: 14, color: T.body, lineHeight: 1.7, marginBottom: 16 }}>
          {problem.why_buyers_care}
        </p>

        <div style={{ background: T.surface, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <Label color={T.muted}>💡 Seller insight</Label>
          <p style={{ ...B, fontSize: 13, color: T.body, marginTop: 6, marginBottom: 0, lineHeight: 1.6 }}>{problem.seller_insight}</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <BeforeAfter before={problem.before} after={problem.after} />
        </div>

        <Btn onClick={onNext}>{nextLabel}</Btn>
      </Fade>
    </Shell>
  );
}

// ── Screen 7 — Opportunities ──────────────────────────────────────
function Screen7({ result, onNext, onReset }: { result: AnalysisResult; onNext: () => void; onReset: () => void }) {
  return (
    <Shell onReset={onReset} maxW={560}>
      <Fade id={7}>
        <ProgressBar current={6} total={7} />
        <div style={{ display: "inline-block", background: T.purpleBg, borderRadius: 6, padding: "3px 8px", marginBottom: 12 }}>
          <Label color={T.purple}>Missed opportunities</Label>
        </div>
        <h2 style={{ ...H, fontSize: 20, fontWeight: 800, color: T.text, margin: "0 0 20px", letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          More buyers can reach this car than you think.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {result.opportunities.map(op => (
            <div key={op.type} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{opIcon(op.type)}</span>
                <div>
                  <p style={{ ...H, fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>{op.title}</p>
                  <p style={{ ...B, fontSize: 13, color: T.body, margin: 0, lineHeight: 1.6 }}>{op.insight}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Btn onClick={onNext}>See Summary →</Btn>
      </Fade>
    </Shell>
  );
}

// ── Screen 8 — Summary ────────────────────────────────────────────
function Screen8({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [p, setP] = useState(false);
  return (
    <Shell onReset={onReset} maxW={560}>
      <Fade id={8}>
        <ProgressBar current={7} total={7} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <Label color={T.green}>✓ Analysis complete</Label>
            <h2 style={{ ...H, fontSize: 20, fontWeight: 800, color: T.text, margin: "6px 0 0", letterSpacing: "-0.03em" }}>{result.vehicle}</h2>
          </div>
          <ScoreBadge score={result.overall_score} />
        </div>

        <div style={{ background: T.redBg, borderLeft: `3px solid ${T.red}`, borderRadius: "0 12px 12px 0", padding: "12px 16px", marginBottom: 8 }}>
          <Label color={T.redLabel}>Biggest problem</Label>
          <p style={{ ...H, fontSize: 14, fontWeight: 700, color: T.redText, margin: "4px 0 0" }}>{result.biggest_problem.title}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          {result.also_hurting.map((p, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px" }}>
              <Label color={T.amber}>Also hurting</Label>
              <p style={{ ...H, fontSize: 13, fontWeight: 700, color: T.text, margin: "4px 0 0" }}>{p.title}</p>
            </div>
          ))}
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
          <Label color={T.purple}>Opportunities</Label>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {result.opportunities.map(o => (
              <div key={o.type} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 14 }}>{opIcon(o.type)}</span>
                <span style={{ ...B, fontSize: 13, color: T.body }}>{o.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upsell */}
        <div style={{ background: T.text, borderRadius: 16, padding: "22px 20px", marginBottom: 10, textAlign: "center" }}>
          <p style={{ ...H, fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Want the complete fix?</p>
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

        <Btn onClick={onReset} secondary>← Analyze another listing</Btn>
      </Fade>
    </Shell>
  );
}

// ── Icon map ──────────────────────────────────────────────────────
function opIcon(type: string): string {
  const icons: Record<string, string> = {
    financing: "💰", inspection: "🔧", carfax: "📋",
    title: "📄", photos: "📸", description: "✏️",
    garage: "🏠", warranty: "🛡️", price: "💲", payment: "💳",
  };
  return icons[type] ?? "💡";
}

// ── Root ──────────────────────────────────────────────────────────
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
    4: <ProblemScreen problem={result.biggest_problem} label="🚨 Biggest Problem" labelColor={T.red} labelBg={T.redBg} current={3} total={7} onNext={() => setScreen(5)} nextLabel="Next Issue →" onReset={onReset} />,
    5: <ProblemScreen problem={also[0]} label="⚠️ Also Hurting" labelColor={T.amber} labelBg={T.amberBg} current={4} total={7} onNext={() => setScreen(also[1] ? 6 : 7)} nextLabel={also[1] ? "Next Issue →" : "See Opportunities →"} onReset={onReset} />,
    6: <ProblemScreen problem={also[1]} label="⚠️ Also Hurting" labelColor={T.amber} labelBg={T.amberBg} current={5} total={7} onNext={() => setScreen(7)} nextLabel="See Opportunities →" onReset={onReset} />,
    7: <Screen7 result={result} onNext={() => setScreen(8)} onReset={onReset} />,
    8: <Screen8 result={result} onReset={onReset} />,
  };

  return <>{screens[screen]}</>;
}
