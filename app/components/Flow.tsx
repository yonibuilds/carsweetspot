"use client";

import { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────
type IssueType = "copy_improvement" | "needs_seller_input";
type Problem = {
  title: string;
  why_buyers_care: string;
  seller_insight: string;
  before: string;
  after: string;
  category?: "trust" | "text" | "photos";
  issue_type?: IssueType;
  can_generate_after_copy?: boolean;
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
  suggested_additions?: string[];
  // V3 fact inventory fields (not rendered in UI — used for debugging/QA)
  structured_facts?: string[];
  explicit_listing_facts?: string[];
  seller_claims?: string[];
  missing_signals?: string[];
  forbidden_or_unverified_claims?: string[];
  listing_image?: string;
  photo_count?: number;
  description_word_count?: number;
};

// ── Tokens ────────────────────────────────────────────────────────
const PAGE_BG     = "#F6F8FB";
const WHITE       = "#FFFFFF";
const NAVY        = "#0F172A";
const NAVY_MUT    = "#64748B";
const NAVY_MUTED2 = "#94A3B8";
const BORDER      = "rgba(15,23,42,0.08)";
const BRAND       = "#2563EB";
const SUCCESS     = "#16A34A";
const SUCC_SOFT   = "#F0FDF4";
const SUCC_FG     = "#166534";
const SUCC_BOR    = "#BBF7D0";
const DANGER      = "#DC2626";
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
  { label: "High",   color: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
  { label: "Medium", color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB" },
  { label: "Low",    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
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
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, boxShadow: "0 4px 20px rgba(15,23,42,0.06), 0 1px 4px rgba(15,23,42,0.04)", ...style }}>
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

// ── Buyer Reach card ──────────────────────────────────────────────
function BuyerReachCard({ askingPrice, calcMo, isMobile }: { askingPrice: number; calcMo: number; isMobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCoop, setCopiedCoop] = useState(false);
  const line = `Estimated buyer payment around $${calcMo}/mo for qualified buyers. OAC.`;
  const coopLine = `Third-party buyer financing is OK. I can cooperate with the buyer's lender on standard paperwork.`;
  const copy = () => { navigator.clipboard.writeText(line); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copyCoop = () => { navigator.clipboard.writeText(coopLine); setCopiedCoop(true); setTimeout(() => setCopiedCoop(false), 2000); };
  return (
    <Card style={{ overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer", background: WHITE, borderBottom: open ? `1px solid ${BORDER}` : "none" }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ ...B, fontSize: 11, fontWeight: 700, color: BRAND }}>$</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ ...B, fontSize: 13, fontWeight: 700, color: NAVY, margin: 0 }}>Buyer Reach</p>
          <p style={{ ...B, fontSize: 12, color: NAVY_MUT, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Buyer affordability / market potential</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ ...B, fontSize: 10, fontWeight: 600, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 20, padding: "3px 10px" }}>Opportunity</span>
          <span style={{ fontSize: 11, color: NAVY_MUT, transform: open ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▼</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "20px 20px 16px", background: PAGE_BG }}>
          <p style={{ ...B, fontSize: 13, color: "#4B5563", margin: "0 0 16px", lineHeight: 1.6 }}>
            Many buyers compare cars by monthly payment, not total price. Showing an estimated payment helps more buyers see this listing as affordable.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 120, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px" }}>
              <p style={{ ...B, fontSize: 10, fontWeight: 700, color: NAVY_MUT, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 5px" }}>Asking Price</p>
              <p style={{ ...H, fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>${askingPrice.toLocaleString()}</p>
            </div>
            <div style={{ flex: 1, minWidth: 120, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 16px" }}>
              <p style={{ ...B, fontSize: 10, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 5px" }}>Est. Buyer Payment</p>
              <p style={{ ...H, fontSize: 20, fontWeight: 700, color: BRAND, margin: "0 0 2px" }}>${calcMo}<span style={{ ...B, fontSize: 12, fontWeight: 400, color: NAVY_MUT }}>/mo</span></p>
              <p style={{ ...B, fontSize: 10, color: NAVY_MUT, margin: 0 }}>OAC · estimate only</p>
            </div>
          </div>
          <p style={{ ...B, fontSize: 11, color: NAVY_MUT, margin: "0 0 8px" }}>Copy-safe line to add to your listing:</p>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 12 }}>
            <p style={{ ...B, fontSize: 13, color: NAVY, margin: 0, lineHeight: 1.5, flex: 1 }}>
              &quot;{line}&quot;
            </p>
            <button onClick={copy} style={{ ...B, fontSize: 11, fontWeight: 600, cursor: "pointer", background: copied ? SUCCESS : WHITE, color: copied ? WHITE : BRAND, border: `1px solid ${copied ? SUCCESS : BRAND}`, borderRadius: 6, padding: "5px 12px", whiteSpace: "nowrap", transition: "all 0.2s", flexShrink: 0 }}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          {/* Optional seller cooperation line */}
          <div style={{ marginTop: 16, padding: "14px 16px", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
            <p style={{ ...B, fontSize: 11, fontWeight: 600, color: NAVY_MUT, margin: "0 0 8px" }}>Optional — only if you&apos;re open to buyer financing:</p>
            <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
              <p style={{ ...B, fontSize: 13, color: NAVY, margin: 0, lineHeight: 1.5, flex: 1 }}>&quot;{coopLine}&quot;</p>
              <button onClick={copyCoop} style={{ ...B, fontSize: 11, fontWeight: 600, cursor: "pointer", background: copiedCoop ? SUCCESS : WHITE, color: copiedCoop ? WHITE : BRAND, border: `1px solid ${copiedCoop ? SUCCESS : BRAND}`, borderRadius: 6, padding: "5px 12px", whiteSpace: "nowrap", transition: "all 0.2s", flexShrink: 0 }}>
                {copiedCoop ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          <p style={{ ...B, fontSize: 11, color: NAVY_MUTED2, margin: "12px 0 0", lineHeight: 1.5 }}>
            Based on 7% APR, 60-month term. Estimate only — the seller is not offering financing. This refers to third-party buyer financing only.
          </p>
        </div>
      )}
    </Card>
  );
}

// ── Before / After ────────────────────────────────────────────────
function BeforeAfterGrid({ problem, isMobile }: { problem: Problem; isMobile?: boolean }) {
  const [copied, setCopied] = useState(false);
  const afterText = stripMd(problem.after ?? "");
  const canGenerate = problem.can_generate_after_copy !== false && afterText.trim().length > 0;
  const needsInput = problem.can_generate_after_copy === false || problem.issue_type === "needs_seller_input";
  const copy = () => {
    navigator.clipboard.writeText(afterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (needsInput) {
    return (
      <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: BRAND, fontWeight: 700 }}>i</span>
          </div>
          <span style={{ ...B, fontSize: 11, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: "0.08em" }}>Seller detail needed</span>
        </div>
        <p style={{ ...B, fontSize: 13, color: NAVY, lineHeight: 1.6, margin: 0 }}>
          This issue needs information only the seller can provide. Add the missing detail first, then CarSweetSpot can help turn it into safe listing copy.
        </p>
        {problem.seller_insight && (
          <p style={{ ...B, fontSize: 12, color: NAVY_MUT, lineHeight: 1.55, margin: 0, borderLeft: `3px solid ${BORDER}`, paddingLeft: 10 }}>
            {problem.seller_insight}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
      <div style={{ background: DANG_SOFT, border: `1px solid ${DANG_BOR}`, borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ color: DANGER, fontSize: 12, fontWeight: 700 }}>✕</span>
          <span style={{ ...B, fontSize: 10, fontWeight: 700, color: DANGER, textTransform: "uppercase", letterSpacing: "0.09em" }}>Before</span>
        </div>
        <p style={{ ...B, fontSize: 13, color: DANG_FG, lineHeight: 1.6, margin: 0 }}>
          {problem.before || "No text currently in the listing."}
        </p>
      </div>
      {canGenerate ? (
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
      ) : (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12 }}>⚠</span>
            <span style={{ ...B, fontSize: 10, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.09em" }}>Copy not available</span>
          </div>
          <p style={{ ...B, fontSize: 13, color: "#78350F", lineHeight: 1.6, margin: 0 }}>
            Not enough verified information to create safe copy for this issue.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Left sidebar (dark) ───────────────────────────────────────────
function LeftSidebar({ result, fixProblems, onReset }: {
  result: AnalysisResult; fixProblems: Problem[]; onReset: () => void;
}) {
  const badge = scoreBadge(result.overall_score);
  const quickFixScore = Math.min(100, result.overall_score + fixProblems.length * 4);
  const calcMo = calcMonthly(result.asking_price, result.monthly_payment);

  const muted  = "#64748B";
  const dimBor = "rgba(255,255,255,0.08)";
  const lbl: React.CSSProperties = { ...B, fontSize: 10, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" };
  const divider = <div style={{ height: 1, background: dimBor, margin: "18px 0" }} />;

  const catColors: Record<string, { fill: string }> = {
    ok:     { fill: "#22C55E" },
    medium: { fill: "#F59E0B" },
    bad:    { fill: "#EF4444" },
  };
  function catLevel(cat: string) {
    if (result.biggest_problem?.category === cat) return "bad";
    if (result.also_hurting?.some(p => p?.category === cat)) return "medium";
    return "ok";
  }
  const photoBarScore = (() => {
    const level = catLevel("photos");
    if (level === "bad") return 38;
    if (level === "medium") return 62;
    const n = result.photo_count ?? 0;
    if (n >= 12) return 91;
    if (n >= 8) return 75;
    if (n >= 4) return 62;
    return 38;
  })();
  const breakdown = (["trust", "text", "photos"] as const).map(c => ({
    label: c === "trust" ? "Trust" : c === "text" ? "Text" : "Photos",
    level: catLevel(c),
    score: c === "photos" ? photoBarScore : catLevel(c) === "bad" ? 38 : catLevel(c) === "medium" ? 62 : 91,
  }));

  return (
    <div style={{ background: NAVY, borderRadius: 18, padding: "20px 18px", display: "flex", flexDirection: "column" }}>

      {/* Logo + back */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ ...H, fontSize: 14, fontWeight: 700, color: WHITE }}>CarSweetSpot</span>
        <button onClick={onReset} style={{
          ...B, fontSize: 11, color: muted, background: "rgba(255,255,255,0.06)", border: `1px solid ${dimBor}`,
          borderRadius: 7, padding: "4px 9px", cursor: "pointer",
        }}>← Back</button>
      </div>

      {/* Vehicle photo */}
      <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 10, overflow: "hidden", border: `1px solid ${dimBor}`, marginBottom: 20, background: "rgba(255,255,255,0.04)", position: "relative", flexShrink: 0 }}>
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

      {/* Sweet Spot Score */}
      <p style={lbl}>Sweet Spot Score</p>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <ScoreRingDark score={result.overall_score} />
        <div>
          <div style={{ display: "inline-block", background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "3px 10px", marginBottom: 6 }}>
            {badge.label}
          </div>
          <p style={{ ...B, fontSize: 11, color: muted, margin: 0, lineHeight: 1.5 }}>Strong listings<br />typically score 75+.</p>
        </div>
      </div>

      {/* Potential Score — 3-step */}
      <p style={lbl}>Potential Score</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#60A5FA", flexShrink: 0 }} />
          <span style={{ ...H, fontSize: 20, fontWeight: 700, color: WHITE, lineHeight: 1 }}>{result.overall_score}</span>
          <span style={{ ...B, fontSize: 11, color: muted }}>now</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FBBF24", flexShrink: 0 }} />
          <span style={{ ...H, fontSize: 20, fontWeight: 700, color: WHITE, lineHeight: 1 }}>{quickFixScore}</span>
          <span style={{ ...B, fontSize: 11, color: muted }}>quick fixes</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ADE80", flexShrink: 0 }} />
          <span style={{ ...H, fontSize: 20, fontWeight: 700, color: WHITE, lineHeight: 1 }}>90+</span>
          <span style={{ ...B, fontSize: 11, color: muted }}>with added details</span>
        </div>
      </div>

      {divider}

      {/* Category breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
        {breakdown.map(({ label, level, score }) => {
          const c = catColors[level];
          return (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ ...B, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{label}</span>
                <span style={{ ...B, fontSize: 11, color: c.fill }}>{score}%</span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${score}%`, background: c.fill, borderRadius: 2, transition: "width 1s ease-out" }} />
              </div>
            </div>
          );
        })}
      </div>

      {divider}

      {/* Buyer Affordability */}
      {calcMo > 0 && (
        <>
          <p style={lbl}>Buyer Affordability</p>
          <p style={{ ...H, fontSize: 26, fontWeight: 700, color: "#60A5FA", margin: "0 0 6px", lineHeight: 1 }}>
            ${calcMo}<span style={{ ...B, fontSize: 12, fontWeight: 400, color: muted }}>/mo</span>
          </p>
          <p style={{ ...B, fontSize: 11, color: muted, margin: 0, lineHeight: 1.55 }}>
            Shows how the asking price may feel month to month.<br />
            Estimated for qualified buyers. OAC. 7% APR, 60 months.
          </p>
          {divider}
        </>
      )}

      {/* Data points */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,0.06)", border: `1px solid ${dimBor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <p style={{ ...B, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", margin: "0 0 2px" }}>Score based on 30+ data points</p>
          <p style={{ ...B, fontSize: 10, color: muted, margin: 0, lineHeight: 1.5 }}>
            Benchmarked against thousands of strong private-party listings.
          </p>
        </div>
      </div>

    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────
function MainContent({ result, fixProblems, onReset, isMobile }: {
  result: AnalysisResult; fixProblems: Problem[]; onReset: () => void; isMobile?: boolean;
}) {
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set());
  const [showWhy, setShowWhy] = useState<Record<number, boolean>>({});
  const [showWorking, setShowWorking] = useState(true);
  const [showSuggested, setShowSuggested] = useState(false);
  const calcMo = calcMonthly(result.asking_price, result.monthly_payment);

  const toggle = (idx: number) => setExpandedSet(prev => {
    const next = new Set(prev);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    return next;
  });

  const quickFixScore = Math.min(100, result.overall_score + fixProblems.length * 4);
  const topIssue = fixProblems[0];
  const totalImprovements = fixProblems.length + (calcMo > 0 ? 1 : 0);
  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Analysis summary card */}
      <Card style={{ padding: "20px 24px", background: "#F8FAFC", borderRadius: 16, boxShadow: "none" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <span style={{ color: SUCCESS, fontSize: 13, fontWeight: 700 }}>✓</span>
              <span style={{ ...B, fontSize: 12, fontWeight: 600, color: SUCCESS, textTransform: "uppercase", letterSpacing: "0.06em" }}>Analysis complete</span>
            </div>
            <p style={{ ...H, fontSize: 16, fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>
              {fixProblems.length} fix{fixProblems.length !== 1 ? "es" : ""} found for this listing
            </p>
            {topIssue && (
              <p style={{ ...B, fontSize: 13, color: NAVY_MUT, margin: 0 }}>
                Start with: <span style={{ color: NAVY, fontWeight: 600 }}>{topIssue.title}</span>
              </p>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <div>
              <span style={{ ...H, fontSize: 22, fontWeight: 700, color: NAVY_MUT }}>{result.overall_score}</span>
              <span style={{ ...B, fontSize: 11, color: "#94A3B8", marginLeft: 4 }}>now</span>
            </div>
            <div>
              <span style={{ ...H, fontSize: 18, fontWeight: 700, color: SUCCESS }}>{quickFixScore}</span>
              <span style={{ ...B, fontSize: 11, color: SUCCESS, marginLeft: 4 }}>quick fixes</span>
            </div>
            <div>
              <span style={{ ...H, fontSize: 16, fontWeight: 700, color: BRAND }}>90+</span>
              <span style={{ ...B, fontSize: 11, color: BRAND, marginLeft: 4 }}>with added details</span>
            </div>
          </div>
        </div>
      </Card>

      {/* What's Working */}
      {result.whats_working?.length > 0 && (
        <Card style={{ overflow: "hidden", borderLeft: `4px solid ${SUCCESS}`, marginTop: 12 }}>
          <div
            onClick={() => setShowWorking(w => !w)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 22px", cursor: "pointer",
              background: WHITE,
              borderBottom: showWorking ? `1px solid ${BORDER}` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: SUCC_SOFT, border: `1px solid ${SUCC_BOR}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: SUCCESS, fontSize: 13, fontWeight: 700 }}>✓</span>
              </div>
              <span style={{ ...H, fontSize: 15, fontWeight: 700, color: NAVY }}>What&apos;s Working</span>
            </div>
            <span style={{ fontSize: 11, color: NAVY_MUTED2, transform: showWorking ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▲</span>
          </div>
          {showWorking && (
            <div style={{ padding: "18px 22px 22px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px 32px" }}>
              {result.whats_working.map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 12, color: SUCCESS, flexShrink: 0, marginTop: 2, fontWeight: 700 }}>✓</span>
                  <p style={{ ...B, fontSize: 13, color: NAVY, margin: 0, lineHeight: 1.6 }}>{w}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Issues header */}
      <div style={{ paddingTop: 16, paddingBottom: 8 }}>
        <p style={{ ...B, fontSize: 10, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>Next Steps</p>
        <p style={{ ...H, fontSize: 20, fontWeight: 800, color: NAVY, letterSpacing: "-0.02em", margin: "0 0 5px" }}>{totalImprovements} Ways to Improve This Listing</p>
        <p style={{ ...B, fontSize: 13, color: NAVY_MUTED2, margin: 0 }}>Start with the first fix — it has the biggest buyer impact.</p>
      </div>

      {/* Issue cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {fixProblems.map((prob, idx) => {
          const cat = prob?.category ?? "trust";
          const isOpen = expandedSet.has(idx);
          const impact = IMPACTS[Math.min(idx, IMPACTS.length - 1)];

          return (
            <Card key={`${cat}-${idx}`} style={{ overflow: "hidden" }}>
              <div
                onClick={() => toggle(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "18px 22px", cursor: "pointer", background: WHITE,
                  borderBottom: isOpen ? `1px solid ${BORDER}` : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLDivElement).style.background = "#FAFBFC"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = WHITE; }}
              >
                <div style={{ width: 26, height: 26, borderRadius: 8, background: "#FEF6EE", border: "1px solid #FDCFAA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: "#C2410C", fontWeight: 700 }}>!</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...H, fontSize: 14, fontWeight: 700, color: NAVY, margin: 0, letterSpacing: "-0.01em" }}>{prob?.title ?? (CAT[cat]?.label ?? cat)}</p>
                  <p style={{ ...B, fontSize: 12, color: NAVY_MUT, margin: "3px 0 0" }}>{CAT[cat]?.label ?? cat} issue</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ ...B, fontSize: 10, fontWeight: 600, color: impact.color, background: impact.bg, border: `1px solid ${impact.border}`, borderRadius: 20, padding: "3px 10px" }}>
                    {impact.label}
                  </span>
                  <span style={{ fontSize: 12, color: NAVY_MUTED2, transform: isOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▾</span>
                </div>
              </div>

              {isOpen && prob && (
                <div style={{ padding: "22px 24px 20px", background: PAGE_BG }}>
                  {/* why_buyers_care: always visible for first issue, toggleable for rest */}
                  {idx === 0 ? (
                    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
                      <p style={{ ...B, fontSize: 13, color: "#4B5563", margin: 0, lineHeight: 1.6 }}>{prob.why_buyers_care}</p>
                      {prob.seller_insight && (
                        <p style={{ ...B, fontSize: 12, color: NAVY_MUT, margin: "8px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>{prob.seller_insight}</p>
                      )}
                    </div>
                  ) : null}

                  {/* Word count badge for text issues */}
                  {prob.category === "text" && (result.description_word_count ?? wordCount(prob.before)) > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ ...B, fontSize: 11, color: NAVY_MUT }}>Current description:</span>
                      <span style={{ ...B, fontSize: 11, fontWeight: 700, color: DANGER, background: DANG_SOFT, borderRadius: 6, padding: "2px 8px" }}>~{result.description_word_count ?? wordCount(prob.before)} words</span>
                      <span style={{ ...B, fontSize: 11, color: NAVY_MUT }}>Strong listings: 150–250 words</span>
                    </div>
                  )}

                  <BeforeAfterGrid problem={prob} isMobile={isMobile} />

                  {idx > 0 && (
                    <>
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
                    </>
                  )}

                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Buyer Reach card */}
      {calcMo > 0 && <BuyerReachCard askingPrice={result.asking_price} calcMo={calcMo} isMobile={isMobile} />}

      {/* Add details to reach 90+ */}
      {result.suggested_additions && result.suggested_additions.length > 0 && (
        <Card style={{ overflow: "hidden" }}>
          <div
            onClick={() => setShowSuggested(s => !s)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", cursor: "pointer", background: WHITE, borderBottom: showSuggested ? `1px solid ${BORDER}` : "none" }}
          >
            <div>
              <p style={{ ...H, fontSize: 15, fontWeight: 700, color: BRAND, margin: "0 0 3px" }}>Add a few details to reach 90+</p>
              <p style={{ ...B, fontSize: 12, color: NAVY_MUT, margin: 0 }}>{result.suggested_additions.length} high-impact details buyers want to see</p>
            </div>
            <span style={{ fontSize: 11, color: NAVY_MUTED2, transform: showSuggested ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▼</span>
          </div>
          {showSuggested && (
            <div style={{ padding: "18px 24px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
              {result.suggested_additions.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ ...B, fontSize: 12, fontWeight: 700, color: BRAND, flexShrink: 0, marginTop: 2, width: 18, textAlign: "right" }}>{i + 1}.</span>
                  <span style={{ ...B, fontSize: 13, color: NAVY_MUT, lineHeight: 1.65 }}>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <button onClick={onReset} style={{
        ...B, width: "100%", padding: "14px", background: WHITE,
        color: NAVY_MUT, border: `1px solid ${BORDER}`, borderRadius: 14,
        fontSize: 13, cursor: "pointer", marginTop: 4,
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
        <div style={{ paddingTop: 66, padding: "66px 16px 40px", boxSizing: "border-box", maxWidth: "100vw", overflowX: "hidden" }}>
          <Fade>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <LeftSidebar result={result} fixProblems={fixProblems} onReset={onReset} />
              <MainContent result={result} fixProblems={fixProblems} onReset={onReset} isMobile={true} />
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
