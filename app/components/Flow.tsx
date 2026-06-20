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
const NAVY      = "#0F172A";
const NAVY_MUT  = "#64748B";
const BRAND     = "#2563EB";
const BRAND_DK  = "#1D4ED8";
const STAGE     = "#F4F4F5";
const SUCCESS   = "#16A34A";
const SUCC_SOFT = "#F0FDF4";
const SUCC_FG   = "#14532D";
const DANGER    = "#EF4444";
const DANG_SOFT = "#FEF2F2";
const DANG_FG   = "#991B1B";
const BORDER    = "#E4E4E7";
const WHITE     = "#FFFFFF";

const H: React.CSSProperties = { fontFamily: "var(--font-jakarta)" };
const B: React.CSSProperties = { fontFamily: "var(--font-inter)" };

const CAT: Record<string, { label: string; hint: string; icon: string }> = {
  trust:  { label: "Trust",  hint: "Ownership history & credibility", icon: "🤝" },
  text:   { label: "Text",   hint: "Description quality & formatting", icon: "✍️" },
  photos: { label: "Photos", hint: "Visual proof & image coverage",    icon: "📸" },
};

function opIcon(type: string): string {
  const m: Record<string, string> = {
    financing:"💰", inspection:"🔧", carfax:"📋", title:"📄", photos:"📸",
    description:"✏️", garage:"🏠", warranty:"🛡️", price:"💲", payment:"💳", formatting:"📝",
  };
  return m[type] ?? "💡";
}

function stripMd(t: string): string {
  return t.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
}

function catScore(cat: string, biggest: Problem, also: Problem[]): number {
  if (biggest?.category === cat) return 38;
  if (also?.some(p => p?.category === cat)) return 62;
  return 91;
}

// ── Fade ──────────────────────────────────────────────────────────
function Fade({ children, id }: { children: React.ReactNode; id: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 20); return () => clearTimeout(t); }, [id]);
  return (
    <div style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.28s ease, transform 0.28s ease" }}>
      {children}
    </div>
  );
}

// ── ScoreRing ─────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const size = 180, stroke = 14, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(score / 100, 1);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BRAND} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease-out" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ ...H, fontSize: 50, fontWeight: 800, color: WHITE, lineHeight: 1, letterSpacing: "-0.04em" }}>{score}</span>
        <span style={{ ...B, fontSize: 12, color: NAVY_MUT, marginTop: 4 }}>out of 100</span>
      </div>
    </div>
  );
}

// ── MetricBar ─────────────────────────────────────────────────────
function MetricBar({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ ...B, fontSize: 13, fontWeight: 600, color: WHITE }}>{label}</span>
        <span style={{ ...B, fontSize: 12, color: NAVY_MUT }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: BRAND, borderRadius: 3, transition: "width 1s ease-out" }} />
      </div>
      <span style={{ ...B, fontSize: 11, color: NAVY_MUT, lineHeight: 1.4 }}>{hint}</span>
    </div>
  );
}

// ── Dark sidebar ──────────────────────────────────────────────────
function DarkSidebar({ result, biggest, also, issuesLeft, onReset }: {
  result: AnalysisResult; biggest: Problem; also: Problem[];
  issuesLeft: number; onReset: () => void;
}) {
  const metrics = (["trust", "text", "photos"] as const).map(c => ({
    label: CAT[c].label, value: catScore(c, biggest, also), hint: CAT[c].hint,
  }));
  const projected = Math.min(100, result.overall_score + issuesLeft * 8);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "30%", height: "100vh",
      background: NAVY, display: "flex", flexDirection: "column",
      padding: "32px 28px", overflowY: "auto", zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
        <span style={{ ...H, fontSize: 15, fontWeight: 800, color: WHITE, letterSpacing: "-0.02em" }}>CarSweetSpot</span>
        <button onClick={onReset} style={{
          ...B, display: "flex", alignItems: "center", gap: 5,
          fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)",
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "5px 10px", cursor: "pointer",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = WHITE; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
        >
          ← Back
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 36 }}>
        <ScoreRing score={result.overall_score} />
        <div style={{ textAlign: "center" }}>
          <p style={{ ...H, fontSize: 15, fontWeight: 700, color: WHITE, margin: 0 }}>Sweet Spot Score</p>
          <p style={{ ...B, fontSize: 12, color: NAVY_MUT, marginTop: 4, lineHeight: 1.5 }}>
            {result.vehicle}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: "auto" }}>
        <h3 style={{ ...B, fontSize: 10, fontWeight: 700, color: NAVY_MUT, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
          Diagnostics
        </h3>
        {metrics.map(m => <MetricBar key={m.label} {...m} />)}
        {!result.listing_image?.startsWith("data:") && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 7,
            background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 8, padding: "9px 11px",
          }}>
            <span style={{ fontSize: 13, flexShrink: 0 }}>⚠️</span>
            <p style={{ ...B, fontSize: 11, color: "#FCD34D", margin: 0, lineHeight: 1.5 }}>
              Photo score is estimated — upload photos directly for accurate analysis.
            </p>
          </div>
        )}
      </div>

      {issuesLeft > 0 && (
        <div style={{
          marginTop: 32, borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)", padding: "16px",
        }}>
          <p style={{ ...H, fontSize: 14, fontWeight: 600, color: WHITE, margin: "0 0 4px" }}>
            {issuesLeft} issue{issuesLeft !== 1 ? "s" : ""} left to fix
          </p>
          <p style={{ ...B, fontSize: 12, color: NAVY_MUT, margin: 0, lineHeight: 1.5 }}>
            Fixing these could lift your score to {projected}.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Listing mockup ────────────────────────────────────────────────
function ListingMockup({ result }: { result: AnalysisResult }) {
  if (!result.listing_image) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ ...B, fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Your current listing
        </span>
        <span style={{ ...B, fontSize: 11, color: "#6B7280" }}>Live</span>
      </div>
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
        {/* Browser chrome */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#F9F9F9", borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57", flexShrink: 0 }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E", flexShrink: 0 }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840", flexShrink: 0 }} />
          <span style={{ ...B, fontSize: 11, color: "#9CA3AF", marginLeft: 8, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {result.vehicle}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ aspectRatio: "4/3", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.listing_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...B, fontSize: 11, fontWeight: 600, color: SUCCESS, background: SUCC_SOFT, padding: "2px 8px", borderRadius: 99 }}>For sale</span>
              {result.asking_price > 0 && (
                <span style={{ ...H, fontSize: 16, fontWeight: 700, color: NAVY }}>${result.asking_price.toLocaleString()}</span>
              )}
            </div>
            <p style={{ ...H, fontSize: 15, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.2 }}>{result.vehicle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Before / After grid ───────────────────────────────────────────
function BeforeAfterGrid({ problem }: { problem: Problem }) {
  const [copied, setCopied] = useState(false);
  const afterText = stripMd(problem.after);
  const copy = () => {
    navigator.clipboard.writeText(afterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 4 }}>
      {/* Before */}
      <div style={{ background: DANG_SOFT, border: `1px solid ${DANGER}28`, borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
          <span style={{ color: DANGER, fontSize: 13, fontWeight: 700 }}>✕</span>
          <span style={{ ...B, fontSize: 10, fontWeight: 700, color: DANGER, textTransform: "uppercase", letterSpacing: "0.09em" }}>Before</span>
        </div>
        <p style={{ ...B, fontSize: 13, color: DANG_FG, lineHeight: 1.6, margin: 0, textDecoration: "line-through", textDecorationColor: `${DANGER}40` }}>
          {problem.before || "No text currently in the listing."}
        </p>
      </div>

      {/* After */}
      <div style={{ background: SUCC_SOFT, border: `1px solid ${SUCCESS}28`, borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ color: SUCCESS, fontSize: 13, fontWeight: 700 }}>✓</span>
            <span style={{ ...B, fontSize: 10, fontWeight: 700, color: SUCCESS, textTransform: "uppercase", letterSpacing: "0.09em" }}>After</span>
          </div>
          <button onClick={copy} style={{
            ...B, fontSize: 11, fontWeight: 700, cursor: "pointer",
            background: copied ? SUCCESS : WHITE,
            color: copied ? WHITE : SUCCESS,
            border: `1px solid ${SUCCESS}`,
            borderRadius: 6, padding: "4px 10px",
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

// ── Up next ───────────────────────────────────────────────────────
function UpNext({ remaining, onNext }: { remaining: Problem[]; onNext: () => void }) {
  if (remaining.length === 0) return null;
  const next = remaining[0];
  const after = remaining[1];
  return (
    <div style={{ marginTop: 32 }}>
      {/* Primary next fix CTA */}
      <button onClick={onNext} style={{
        width: "100%", background: NAVY, border: "none", borderRadius: 14,
        padding: "18px 20px", textAlign: "left", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 14, marginBottom: after ? 10 : 0,
      }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>{CAT[next.category ?? ""]?.icon ?? "💡"}</span>
        <span style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          <span style={{ ...B, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Next fix</span>
          <span style={{ ...H, fontSize: 15, fontWeight: 700, color: WHITE, lineHeight: 1.3 }}>{next.title}</span>
        </span>
        <span style={{ fontSize: 20, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>→</span>
      </button>

      {/* Preview of what comes after */}
      {after && (
        <div style={{
          background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, opacity: 0.5 }}>{CAT[after.category ?? ""]?.icon ?? "💡"}</span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ ...B, fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>Then</span>
            <span style={{ ...H, fontSize: 13, fontWeight: 600, color: "#6B7280" }}>{after.title}</span>
          </span>
        </div>
      )}
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
        background: NAVY, color: WHITE, border: "none",
        borderRadius: 12, fontSize: 15, fontWeight: 700,
        cursor: "pointer", letterSpacing: "-0.01em",
        transform: p ? "scale(0.98)" : "scale(1)", transition: "transform 0.12s",
      }}>
      {children}
    </button>
  );
}

// ── Score overview screen ─────────────────────────────────────────
function ScoreScreen({ result, fixProblems, onNext }: {
  result: AnalysisResult; fixProblems: Problem[]; onNext: () => void;
}) {
  const catMap: Record<string, Problem | null> = { trust: null, text: null, photos: null };
  fixProblems.forEach(p => { if (p.category && !catMap[p.category]) catMap[p.category] = p; });

  return (
    <Fade id={0}>
      <div style={{ padding: "56px 48px", maxWidth: 640, margin: "0 auto" }}>
        <p style={{ ...B, fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
          Analysis complete
        </p>
        <h1 style={{ ...H, fontSize: 30, fontWeight: 800, color: NAVY, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 10px" }}>
          {result.vehicle}
        </h1>
        <p style={{ ...B, fontSize: 15, color: "#6B7280", margin: "0 0 36px", lineHeight: 1.6 }}>
          We found {fixProblems.length} issue{fixProblems.length !== 1 ? "s" : ""} hurting your contact rate. Fix them one by one below.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
          {(["trust", "text", "photos"] as const).map(cat => {
            const prob = catMap[cat];
            const pass = !prob;
            return (
              <div key={cat} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 18px",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: pass ? SUCC_SOFT : DANG_SOFT,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${pass ? SUCCESS : DANGER}30`,
                }}>
                  <span style={{ fontSize: 12, color: pass ? SUCCESS : DANGER, fontWeight: 700 }}>{pass ? "✓" : "✕"}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ ...B, fontSize: 13, fontWeight: 700, color: NAVY, margin: 0 }}>
                    {CAT[cat].label}
                    {pass && <span style={{ fontWeight: 400, color: "#6B7280" }}> — looks good</span>}
                  </p>
                  {!pass && <p style={{ ...B, fontSize: 12, color: "#6B7280", margin: "2px 0 0" }}>{prob!.title}</p>}
                </div>
              </div>
            );
          })}
        </div>

        <Btn onClick={onNext}>Start fixing →</Btn>
      </div>
    </Fade>
  );
}

// ── Fix screen ────────────────────────────────────────────────────
function FixScreen({ problem, index, total, remaining, result, onNext, onBack, isLast }: {
  problem: Problem; index: number; total: number;
  remaining: Problem[]; result: AnalysisResult;
  onNext: () => void; onBack: () => void; isLast: boolean;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const sectionLabel = problem.category === "text" ? "the description"
    : problem.category === "trust" ? "the trust section"
    : "the photos section";

  return (
    <Fade id={10 + index}>
      {/* Blue gradient hero */}
      <div style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DK} 100%)`, padding: "44px 48px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <button onClick={onBack} style={{
              ...B, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)",
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8, padding: "5px 12px", cursor: "pointer",
            }}>← Back</button>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.15)", borderRadius: 99,
              padding: "5px 14px",
            }}>
              <span style={{ fontSize: 11 }}>⚠</span>
              <span style={{ ...B, fontSize: 12, fontWeight: 600, color: WHITE }}>
                {index === 0 ? "Top priority fix" : `Fix ${index + 1} of ${total}`}
              </span>
            </div>
          </div>
          <h1 style={{ ...H, fontSize: 34, fontWeight: 800, color: WHITE, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px" }}>
            {problem.title}
          </h1>
          <p style={{ ...B, fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.6, maxWidth: 500 }}>
            {problem.why_buyers_care}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "36px 48px 60px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          {index === 0 && <ListingMockup result={result} />}

          <h2 style={{ ...H, fontSize: 19, fontWeight: 700, color: NAVY, margin: "0 0 14px", letterSpacing: "-0.02em" }}>
            Rewrite {sectionLabel}
          </h2>

          <BeforeAfterGrid problem={problem} />

          {/* Why toggle */}
          <button onClick={() => setShowWhy(w => !w)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "12px 0",
            display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
          }}>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>ⓘ</span>
            <span style={{ ...B, fontSize: 12, color: "#6B7280", borderBottom: "1px dashed #D1D5DB" }}>Why does this matter?</span>
            <span style={{ fontSize: 10, color: "#9CA3AF", transform: showWhy ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
          </button>
          {showWhy && (
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
              <p style={{ ...B, fontSize: 13, color: "#4B5563", margin: 0, lineHeight: 1.6 }}>{problem.seller_insight}</p>
            </div>
          )}

          {isLast ? (
            <div style={{ marginTop: 28 }}>
              <Btn onClick={onNext}>Done → See your results</Btn>
            </div>
          ) : (
            <UpNext remaining={remaining} onNext={onNext} />
          )}
        </div>
      </div>
    </Fade>
  );
}

// ── Summary screen ────────────────────────────────────────────────
function SummaryScreen({ result, onReset, onBack }: { result: AnalysisResult; onReset: () => void; onBack: () => void }) {
  const [p, setP] = useState(false);
  return (
    <Fade id={99}>
      <div style={{ padding: "56px 48px", maxWidth: 640, margin: "0 auto" }}>
        <button onClick={onBack} style={{
          ...B, fontSize: 13, fontWeight: 600, color: "#6B7280",
          background: "none", border: "none", cursor: "pointer", padding: "0 0 28px",
          display: "flex", alignItems: "center", gap: 6,
        }}>← Back to fixes</button>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
          <h2 style={{ ...H, fontSize: 26, fontWeight: 800, color: NAVY, letterSpacing: "-0.03em", margin: "0 0 8px" }}>
            You&apos;re done with the fixes
          </h2>
          <p style={{ ...B, fontSize: 14, color: "#6B7280" }}>{result.vehicle}</p>
        </div>

        {result.asking_price >= 10000 && result.monthly_payment > 0 && (
          <div style={{
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DK} 100%)`,
            borderRadius: 16, padding: "24px", marginBottom: 24,
          }}>
            <p style={{ ...B, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
              💡 Increase your buyers&apos; purchasing power
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "16px", textAlign: "center" }}>
                <p style={{ ...B, fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Asking Price</p>
                <p style={{ ...H, fontSize: 22, fontWeight: 800, color: WHITE, margin: 0, letterSpacing: "-0.03em" }}>${result.asking_price.toLocaleString()}</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 10, padding: "16px", textAlign: "center" }}>
                <p style={{ ...B, fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Est. Monthly</p>
                <p style={{ ...H, fontSize: 24, fontWeight: 800, color: WHITE, margin: 0, letterSpacing: "-0.03em" }}>${result.monthly_payment}<span style={{ fontSize: 13, fontWeight: 600 }}>/mo</span></p>
                <p style={{ ...B, fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>7% APR · 60 months</p>
              </div>
            </div>
            <p style={{ ...B, fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5 }}>
              Add <strong style={{ color: WHITE }}>"Financing available OAC — est. ${result.monthly_payment}/mo"</strong> to your listing. Buyers who can&apos;t write a ${result.asking_price.toLocaleString()} check can afford ${result.monthly_payment}/month — and they&apos;re the majority.
            </p>
          </div>
        )}

        {result.asking_price > 0 && result.asking_price < 10000 && result.monthly_payment > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px", textAlign: "center" }}>
              <p style={{ ...B, fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Asking Price</p>
              <p style={{ ...H, fontSize: 22, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: "-0.03em" }}>${result.asking_price.toLocaleString()}</p>
            </div>
            <div style={{ background: NAVY, borderRadius: 12, padding: "20px", textAlign: "center" }}>
              <p style={{ ...B, fontSize: 10, color: NAVY_MUT, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Est. Monthly</p>
              <p style={{ ...H, fontSize: 22, fontWeight: 800, color: WHITE, margin: 0, letterSpacing: "-0.03em" }}>${result.monthly_payment}/mo</p>
              <p style={{ ...B, fontSize: 10, color: NAVY_MUT, margin: "4px 0 0" }}>7% APR · 60 mo</p>
            </div>
          </div>
        )}

        {result.opportunities.length > 0 && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ background: "#F9FAFB", padding: "11px 18px", borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ ...B, fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.09em", margin: 0 }}>More opportunities</p>
            </div>
            {result.opportunities.map((o, i) => (
              <div key={o.type} style={{
                display: "flex", gap: 12, alignItems: "flex-start", padding: "13px 18px",
                background: WHITE, borderBottom: i < result.opportunities.length - 1 ? `1px solid ${BORDER}` : "none",
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{opIcon(o.type)}</span>
                <div>
                  <p style={{ ...H, fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 2px" }}>{o.title}</p>
                  <p style={{ ...B, fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
                    {o.insight.length > 110 ? o.insight.slice(0, 110) + "…" : o.insight}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: NAVY, borderRadius: 16, padding: "24px", marginBottom: 12, textAlign: "center" }}>
          <p style={{ ...H, fontSize: 16, fontWeight: 800, color: WHITE, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Want the full rewrite?</p>
          <p style={{ ...B, fontSize: 13, color: NAVY_MUT, margin: "0 0 16px", lineHeight: 1.5 }}>Word-for-word rewrites, pricing analysis, full listing overhaul.</p>
          <button onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)}
            style={{
              ...H, width: "100%", padding: "13px", background: WHITE, color: NAVY,
              border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer",
              transform: p ? "scale(0.98)" : "scale(1)", transition: "transform 0.12s",
            }}>
            Unlock Full Report — $29
          </button>
          <p style={{ ...B, fontSize: 11, color: "#64748B", margin: "8px 0 0" }}>One-time · Instant access</p>
        </div>

        <button onClick={onReset} style={{
          ...B, width: "100%", padding: "13px", background: "transparent",
          color: "#9CA3AF", border: `1px solid ${BORDER}`, borderRadius: 12,
          fontSize: 14, cursor: "pointer",
        }}>
          ← Analyze another listing
        </button>
      </div>
    </Fade>
  );
}

// ── Root ──────────────────────────────────────────────────────────
export default function Flow({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [screen, setScreen] = useState(0);
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
  const fixIndex = Math.max(0, screen - 1);
  const issuesLeft = screen === 0 ? fixProblems.length : Math.max(0, fixProblems.length - fixIndex);

  const renderRight = () => {
    if (screen === 0) return <ScoreScreen result={result} fixProblems={fixProblems} onNext={() => setScreen(1)} />;
    if (fixIndex < fixProblems.length) {
      return (
        <FixScreen
          problem={fixProblems[fixIndex]}
          index={fixIndex}
          total={fixProblems.length}
          remaining={fixProblems.slice(fixIndex + 1)}
          result={result}
          onNext={() => setScreen(s => s + 1)}
          onBack={() => setScreen(s => s - 1)}
          isLast={fixIndex === fixProblems.length - 1}
        />
      );
    }
    return <SummaryScreen result={result} onReset={onReset} onBack={() => setScreen(s => s - 1)} />;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: STAGE }}>
      {/* Mobile nav */}
      {!isDesktop && (
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: NAVY, height: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
        }}>
          <button onClick={onReset} style={{ ...H, fontSize: 14, fontWeight: 800, color: WHITE, background: "none", border: "none", cursor: "pointer" }}>
            CarSweetSpot
          </button>
          <span style={{ ...B, fontSize: 12, color: NAVY_MUT }}>{result.overall_score}/100</span>
        </nav>
      )}

      {/* Desktop sidebar */}
      {isDesktop && (
        <DarkSidebar
          result={result}
          biggest={result.biggest_problem}
          also={result.also_hurting ?? []}
          issuesLeft={issuesLeft}
          onReset={onReset}
        />
      )}

      {/* Right panel */}
      <div style={{ marginLeft: isDesktop ? "30%" : 0, flex: 1, minHeight: "100vh", paddingTop: !isDesktop ? 50 : 0 }}>
        {renderRight()}
      </div>
    </div>
  );
}
