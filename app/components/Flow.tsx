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
type Opportunity = { title: string; insight: string; type: string };
export type AnalysisResult = {
  vehicle: string;
  asking_price: number;
  overall_score: number;
  monthly_payment: number;
  biggest_problem: Problem;
  also_hurting: Problem[];
  opportunities: Opportunity[];
  whats_working: string[];
  listing_image?: string;
};

// ── Tokens ────────────────────────────────────────────────────────
const PAGE_BG     = "#F8FAFC";
const WHITE       = "#FFFFFF";
const NAVY        = "#0F172A";
const NAVY_MUT    = "#64748B";
const BORDER      = "#E2E8F0";
const BRAND       = "#2563EB";
const SUCCESS     = "#16A34A";
const SUCC_SOFT   = "#F0FDF4";
const SUCC_FG     = "#14532D";
const SUCC_BOR    = "#BBF7D0";
const DANGER      = "#EF4444";
const DANG_SOFT   = "#FEF2F2";
const DANG_FG     = "#991B1B";
const DANG_BOR    = "#FECACA";

const H: React.CSSProperties = { fontFamily: "var(--font-jakarta)" };
const B: React.CSSProperties = { fontFamily: "var(--font-inter)" };

const CAT: Record<string, { label: string }> = {
  trust:  { label: "Trust" },
  text:   { label: "Text" },
  photos: { label: "Photos" },
};

const IMPACTS = [
  { label: "High",   color: "#B91C1C", bg: "#FEF2F2" },
  { label: "Medium", color: "#B45309", bg: "#FFFBEB" },
  { label: "Low",    color: "#374151", bg: "#F3F4F6" },
];

function scoreBadge(score: number) {
  if (score >= 90) return { label: "Exceptional",    color: "#1D4ED8", bg: "#EFF6FF" };
  if (score >= 75) return { label: "Strong Listing", color: "#15803D", bg: "#F0FDF4" };
  if (score >= 60) return { label: "Average Listing",color: "#B45309", bg: "#FFFBEB" };
  return               { label: "Needs Work",        color: "#B91C1C", bg: "#FEF2F2" };
}

function stripMd(t: string): string {
  return t.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
}

function calcMonthly(askingPrice: number, monthlyPayment: number): number {
  if (monthlyPayment > 0) return monthlyPayment;
  if (askingPrice >= 8000) {
    const r = 0.07 / 12, n = 60;
    return Math.round((askingPrice * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  }
  return 0;
}

// ── Card ──────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, ...style }}>
      {children}
    </div>
  );
}

// ── Fade ──────────────────────────────────────────────────────────
function Fade({ children }: { children: React.ReactNode }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 20); return () => clearTimeout(t); }, []);
  return (
    <div style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.28s ease, transform 0.28s ease" }}>
      {children}
    </div>
  );
}

// ── ScoreRing (light bg) ──────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const size = 120, stroke = 10, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(score / 100, 1);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BRAND} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease-out" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ ...H, fontSize: 32, fontWeight: 700, color: NAVY, lineHeight: 1 }}>{score}</span>
        <span style={{ ...B, fontSize: 11, color: NAVY_MUT, marginTop: 2 }}>out of 100</span>
      </div>
    </div>
  );
}

// ── ScoreRing (dark bg) ───────────────────────────────────────────
function ScoreRingDark({ score }: { score: number }) {
  const size = 110, stroke = 10, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(score / 100, 1);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BRAND} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease-out" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ ...H, fontSize: 30, fontWeight: 700, color: WHITE, lineHeight: 1 }}>{score}</span>
        <span style={{ ...B, fontSize: 10, color: "#64748B", marginTop: 2 }}>out of 100</span>
      </div>
    </div>
  );
}

// ── Before / After ────────────────────────────────────────────────
function BeforeAfterGrid({ problem }: { problem: Problem }) {
  const [copied, setCopied] = useState(false);
  const afterText = stripMd(problem.after);
  const copy = () => {
    navigator.clipboard.writeText(afterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div style={{ background: DANG_SOFT, border: `1px solid ${DANG_BOR}`, borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ color: DANGER, fontSize: 12, fontWeight: 700 }}>✕</span>
          <span style={{ ...B, fontSize: 10, fontWeight: 700, color: DANGER, textTransform: "uppercase", letterSpacing: "0.09em" }}>Before</span>
        </div>
        <p style={{ ...B, fontSize: 13, color: DANG_FG, lineHeight: 1.6, margin: 0 }}>
          {problem.before || "No text currently in the listing."}
        </p>
      </div>
      <div style={{ background: SUCC_SOFT, border: `1px solid ${SUCC_BOR}`, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: SUCCESS, fontSize: 12, fontWeight: 700 }}>✓</span>
            <span style={{ ...B, fontSize: 10, fontWeight: 700, color: SUCCESS, textTransform: "uppercase", letterSpacing: "0.09em" }}>After</span>
          </div>
          <button onClick={copy} style={{
            ...B, fontSize: 11, fontWeight: 600, cursor: "pointer",
            background: copied ? SUCCESS : WHITE,
            color: copied ? WHITE : SUCCESS,
            border: `1px solid ${SUCCESS}`,
            borderRadius: 6, padding: "3px 10px",
            transition: "all 0.2s", whiteSpace: "nowrap",
          }}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <p style={{ ...B, fontSize: 13, color: SUCC_FG, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", flex: 1 }}>
          {afterText}
        </p>
      </div>
    </div>
  );
}

// ── Left sidebar (dark) ───────────────────────────────────────────
function LeftSidebar({ result, fixProblems, onReset }: {
  result: AnalysisResult; fixProblems: Problem[]; onReset: () => void;
}) {
  const badge = scoreBadge(result.overall_score);
  const potentialScore = Math.min(100, result.overall_score + fixProblems.length * 4);
  const pointsGain = potentialScore - result.overall_score;
  const calcMo = calcMonthly(result.asking_price, result.monthly_payment);
  const [copied, setCopied] = useState(false);

  const muted   = "#64748B";
  const dimBor  = "rgba(255,255,255,0.09)";
  const lbl: React.CSSProperties = { ...B, fontSize: 10, fontWeight: 600, color: muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" };

  // Score breakdown per category
  const catColors: Record<string, { fill: string; bg: string }> = {
    ok:     { fill: "#22C55E", bg: "rgba(34,197,94,0.15)" },
    medium: { fill: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
    bad:    { fill: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  };
  function catLevel(cat: string) {
    if (result.biggest_problem?.category === cat) return "bad";
    if (result.also_hurting?.some(p => p?.category === cat)) return "medium";
    return "ok";
  }
  const breakdown = (["trust", "text", "photos"] as const).map(c => ({
    label: c === "trust" ? "Trust" : c === "text" ? "Text" : "Photos",
    level: catLevel(c),
    score: catLevel(c) === "bad" ? 38 : catLevel(c) === "medium" ? 62 : 91,
  }));

  const copyFinancing = () => {
    const t = calcMo > 0
      ? `Financing available OAC — est. $${calcMo}/mo at 7% APR, 60 months.`
      : `Financing available OAC — ask me about monthly options.`;
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: NAVY, borderRadius: 18, padding: "20px 18px", display: "flex", flexDirection: "column" }}>
      {/* Logo + back */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ ...H, fontSize: 14, fontWeight: 700, color: WHITE }}>CarSweetSpot</span>
        <button onClick={onReset} style={{
          ...B, fontSize: 11, color: muted, background: "rgba(255,255,255,0.07)", border: `1px solid ${dimBor}`,
          borderRadius: 7, padding: "4px 9px", cursor: "pointer",
        }}>← Back</button>
      </div>

      {/* Vehicle photo */}
      <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 10, overflow: "hidden", border: `1px solid ${dimBor}`, marginBottom: 18, background: "rgba(255,255,255,0.04)", position: "relative", flexShrink: 0 }}>
        {result.listing_image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.listing_image} alt={result.vehicle} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 12px 9px", background: "linear-gradient(to top, rgba(15,23,42,0.92), transparent)" }}>
              <p style={{ ...H, fontSize: 11, fontWeight: 600, color: WHITE, margin: 0, lineHeight: 1.3 }}>{result.vehicle}</p>
              {result.asking_price > 0 && <p style={{ ...B, fontSize: 10, color: muted, margin: "2px 0 0" }}>${result.asking_price.toLocaleString()}</p>}
            </div>
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <p style={{ ...H, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: 0, textAlign: "center", padding: "0 8px" }}>{result.vehicle}</p>
            {result.asking_price > 0 && <p style={{ ...B, fontSize: 10, color: muted, margin: 0 }}>${result.asking_price.toLocaleString()}</p>}
          </div>
        )}
      </div>

      {/* Score */}
      <p style={lbl}>Sweet Spot Score</p>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <ScoreRingDark score={result.overall_score} />
        <div>
          <div style={{ display: "inline-block", background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "3px 10px", marginBottom: 6 }}>
            {badge.label}
          </div>
          <p style={{ ...B, fontSize: 11, color: muted, margin: 0, lineHeight: 1.5 }}>Strong listings<br />typically score 75+.</p>
        </div>
      </div>

      {/* Score breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
        {breakdown.map(({ label, level, score }) => {
          const c = catColors[level];
          return (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ ...B, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{label}</span>
                <span style={{ ...B, fontSize: 11, color: c.fill }}>{score}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${score}%`, background: c.fill, borderRadius: 2, transition: "width 1s ease-out" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 1, background: dimBor, margin: "0 0 14px" }} />

      {/* Potential score */}
      <p style={lbl}>Potential Score</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 3 }}>
        <span style={{ ...H, fontSize: 26, fontWeight: 700, color: WHITE }}>{potentialScore}</span>
        <span style={{ fontSize: 14, color: "#4ADE80" }}>↑</span>
      </div>
      <p style={{ ...B, fontSize: 11, fontWeight: 600, color: "#4ADE80", margin: "0 0 3px" }}>+{pointsGain} points available</p>
      <p style={{ ...B, fontSize: 11, color: muted, margin: "0 0 14px", lineHeight: 1.5 }}>Fix the issues below to increase your score.</p>

      <div style={{ height: 1, background: dimBor, margin: "0 0 14px" }} />

      {/* Monthly payment */}
      {calcMo > 0 && (
        <>
          <p style={lbl}>Estimated Monthly Payment</p>
          <p style={{ ...H, fontSize: 24, fontWeight: 700, color: "#60A5FA", margin: "0 0 5px" }}>
            ${calcMo}<span style={{ fontSize: 12, fontWeight: 400, color: muted }}>/mo est.</span>
          </p>
          <p style={{ ...B, fontSize: 11, color: muted, margin: "0 0 10px", lineHeight: 1.5 }}>
            Most Americans buy with financing. Don&apos;t lose them — add this to your listing.
          </p>
          <button onClick={copyFinancing} style={{
            width: "100%", background: "rgba(37,99,235,0.15)", border: `1px solid rgba(37,99,235,0.28)`,
            borderRadius: 9, padding: "8px 11px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
          }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#93C5FD", lineHeight: 1.5, textAlign: "left" }}>
              Financing available OAC — est. ${calcMo}/mo
            </span>
            <span style={{ ...B, fontSize: 10, color: "#60A5FA", marginLeft: 8, whiteSpace: "nowrap", fontWeight: 600 }}>
              {copied ? "✓" : "Copy"}
            </span>
          </button>
          <div style={{ height: 1, background: dimBor, margin: "0 0 14px" }} />
        </>
      )}

      {/* Data points */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(37,99,235,0.15)", border: `1px solid rgba(37,99,235,0.22)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <p style={{ ...H, fontSize: 11, fontWeight: 600, color: "#60A5FA", margin: "0 0 2px" }}>Score based on 30+ data points</p>
          <p style={{ ...B, fontSize: 10, color: muted, margin: 0, lineHeight: 1.5 }}>
            Benchmarked against thousands of strong private-party listings.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────
function MainContent({ result, fixProblems, onReset }: {
  result: AnalysisResult; fixProblems: Problem[]; onReset: () => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [showWhy, setShowWhy] = useState<Record<number, boolean>>({});
  const [showWorking, setShowWorking] = useState(true);
  const calcMo = calcMonthly(result.asking_price, result.monthly_payment);

  const toggle = (idx: number) => setExpandedIdx(prev => prev === idx ? null : idx);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Success banner */}
      <Card style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: SUCC_SOFT, border: `1px solid ${SUCC_BOR}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: SUCCESS, fontSize: 16, fontWeight: 700 }}>✓</span>
            </div>
            <div>
              <p style={{ ...H, fontSize: 15, fontWeight: 700, color: SUCCESS, margin: 0 }}>
                We found {fixProblems.length} issue{fixProblems.length !== 1 ? "s" : ""} hurting your contact rate.
              </p>
              <p style={{ ...B, fontSize: 13, color: NAVY_MUT, margin: 0 }}>Fix them to stand out and sell faster.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* What's Working */}
      {result.whats_working?.length > 0 && (
        <Card style={{ overflow: "hidden" }}>
          <div
            onClick={() => setShowWorking(w => !w)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", cursor: "pointer",
              background: SUCC_SOFT,
              borderBottom: showWorking ? `1px solid ${SUCC_BOR}` : "none",
              borderRadius: showWorking ? "16px 16px 0 0" : 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: SUCCESS, fontSize: 15 }}>✓</span>
              <span style={{ ...H, fontSize: 14, fontWeight: 700, color: SUCCESS }}>What&apos;s Working</span>
            </div>
            <span style={{ fontSize: 11, color: SUCCESS, transform: showWorking ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▲</span>
          </div>
          {showWorking && (
            <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
              {result.whats_working.map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: SUCCESS, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <p style={{ ...B, fontSize: 13, color: SUCC_FG, margin: 0, lineHeight: 1.5 }}>{w}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Issues header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: DANG_SOFT, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: DANGER, fontSize: 12, fontWeight: 700 }}>!</span>
          </div>
          <span style={{ ...H, fontSize: 16, fontWeight: 700, color: NAVY }}>{fixProblems.length} Issues to Fix</span>
        </div>
        <span style={{ ...B, fontSize: 12, color: NAVY_MUT }}>
          Fix all {fixProblems.length} to reach a <strong style={{ color: SUCCESS }}>Strong</strong> score
        </span>
      </div>

      {/* Issue cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {fixProblems.map((prob, idx) => {
          const cat = prob?.category ?? "trust";
          const isOpen = expandedIdx === idx;
          const impact = IMPACTS[Math.min(idx, IMPACTS.length - 1)];

          return (
            <Card key={`${cat}-${idx}`} style={{ overflow: "hidden" }}>
              <div
                onClick={() => toggle(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 18px", cursor: "pointer", background: WHITE,
                  borderBottom: isOpen ? `1px solid ${BORDER}` : "none",
                }}
              >
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: DANG_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: DANGER, fontWeight: 700 }}>✕</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...B, fontSize: 13, fontWeight: 700, color: NAVY, margin: 0 }}>{CAT[cat]?.label ?? cat}</p>
                  {prob && <p style={{ ...B, fontSize: 12, color: NAVY_MUT, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prob.title}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ ...B, fontSize: 11, fontWeight: 600, color: impact.color, background: impact.bg, borderRadius: 20, padding: "3px 10px" }}>
                    Impact: {impact.label}
                  </span>
                  <span style={{ fontSize: 11, color: NAVY_MUT, transform: isOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▼</span>
                </div>
              </div>

              {isOpen && prob && (
                <div style={{ padding: "20px 20px 16px", background: PAGE_BG }}>
                  <BeforeAfterGrid problem={prob} />

                  <button
                    onClick={() => setShowWhy(w => ({ ...w, [idx]: !w[idx] }))}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 0", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>ⓘ</span>
                    <span style={{ ...B, fontSize: 12, color: NAVY_MUT, borderBottom: "1px dashed #D1D5DB" }}>Why does this matter?</span>
                    <span style={{ fontSize: 10, color: "#9CA3AF", transform: showWhy[idx] ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
                  </button>

                  {showWhy[idx] && (
                    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
                      <p style={{ ...B, fontSize: 13, color: "#4B5563", margin: 0, lineHeight: 1.6 }}>{prob.why_buyers_care}</p>
                      {prob.seller_insight && (
                        <p style={{ ...B, fontSize: 12, color: NAVY_MUT, margin: "8px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>{prob.seller_insight}</p>
                      )}
                    </div>
                  )}

                  {calcMo > 0 && idx === 0 && (
                    <div style={{ marginTop: 16, background: "#1D4ED8", borderRadius: 12, padding: "14px 18px" }}>
                      <p style={{ ...H, fontSize: 13, fontWeight: 700, color: WHITE, margin: "0 0 3px" }}>
                        💳 ${calcMo}/mo est.
                      </p>
                      <p style={{ ...B, fontSize: 12, color: "#BFDBFE", margin: "0 0 10px", lineHeight: 1.5 }}>
                        Most Americans buy with financing. Don&apos;t lose them — add this to your listing.
                      </p>
                      <div style={{ background: "#1e3a8a", borderRadius: 8, padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "#E0F2FE", lineHeight: 1.6 }}>
                        &quot;Financing available OAC — est. ${calcMo}/mo at 7% APR, 60 months.&quot;
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <button onClick={onReset} style={{
        ...B, width: "100%", padding: "13px", background: WHITE,
        color: NAVY_MUT, border: `1px solid ${BORDER}`, borderRadius: 12,
        fontSize: 14, cursor: "pointer",
      }}>
        ← Analyze another listing
      </button>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────
export default function Flow({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onPop = () => onReset();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onReset]);

  const fixProblems = [result.biggest_problem, ...(result.also_hurting ?? [])].filter(p => p?.title && p?.after);

  if (!isDesktop) {
    return (
      <div style={{ background: PAGE_BG, minHeight: "100vh" }}>
        <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: WHITE, borderBottom: `1px solid ${BORDER}`, height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
          <span style={{ ...H, fontSize: 14, fontWeight: 700, color: NAVY }}>CarSweetSpot</span>
          <span style={{ ...B, fontSize: 12, color: NAVY_MUT }}>{result.overall_score}/100</span>
        </nav>
        <div style={{ paddingTop: 66, padding: "66px 16px 32px" }}>
          <Fade>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <LeftSidebar result={result} fixProblems={fixProblems} onReset={onReset} />
              <MainContent result={result} fixProblems={fixProblems} onReset={onReset} />
            </div>
          </Fade>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: PAGE_BG, minHeight: "100vh" }}>
      <Fade>
        <div style={{
          maxWidth: 1300, margin: "0 auto", padding: "32px 36px",
          display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start",
        }}>
          <div style={{ position: "sticky", top: 32 }}>
            <LeftSidebar result={result} fixProblems={fixProblems} onReset={onReset} />
          </div>
          <MainContent result={result} fixProblems={fixProblems} onReset={onReset} />
        </div>
      </Fade>
    </div>
  );
}
