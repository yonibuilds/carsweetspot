"use client";

import { useState } from "react";

type SpotScore = {
  score: number;
  label: string;
  summary: string;
};

type QuickWin = {
  text: string;
  boost: string;
  spot: "pricing" | "listing" | "trust" | "financing";
};

type AnalysisResult = {
  vehicle: string;
  asking_price: number;
  overall_score: number;
  spots: {
    pricing: SpotScore;
    listing: SpotScore;
    trust: SpotScore;
    financing: SpotScore;
  };
  free_insights: string[];
  quick_wins?: QuickWin[];
  locked_count: number;
};

const SPOT_AFFILIATE: Partial<Record<QuickWin["spot"], { cta: string; url: string }>> = {
  trust: { cta: "Get CARFAX →", url: "https://www.carfax.com" },
  financing: { cta: "See rates →", url: "https://www.lendingtree.com/auto" },
};

function parseBoost(boost: string): number {
  const n = parseInt(boost.replace(/[^0-9]/g, ""));
  return isNaN(n) ? 0 : n;
}

type CandyTheme = { primary: string; light: string; label: string; emoji: string };

function candyTheme(score: number): CandyTheme {
  if (score >= 90) return { primary: "#2FBF71", light: "#DCFCE7", label: "Sweet Deal", emoji: "🍬" };
  if (score >= 75) return { primary: "#10B981", light: "#D1FAE5", label: "Almost Sweet", emoji: "🍭" };
  if (score >= 55) return { primary: "#FF7A45", light: "#FFF0EB", label: "Needs Sugar", emoji: "🫤" };
  return { primary: "#EF4444", light: "#FEE2E2", label: "Sour Deal", emoji: "🍋" };
}

export default function Results({
  result,
  onReset,
}: {
  result: AnalysisResult;
  onReset: () => void;
}) {
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const score = result.overall_score;
  const theme = candyTheme(score);
  const wins = result.quick_wins ?? [];
  const totalBoost = wins.reduce((s, w) => s + parseBoost(w.boost), 0);
  const potentialScore = Math.min(100, score + totalBoost);
  const earnedPts = wins.filter((_, i) => completed.has(i)).reduce((s, w) => s + parseBoost(w.boost), 0);
  const currentScore = Math.min(100, score + earnedPts);
  // Car position: starts at current score, moves toward potentialScore as fixes are completed
  const carPct = potentialScore > score
    ? ((score + earnedPts - score) / (potentialScore - score)) * 100
    : 0;

  function copyText(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setCompleted((prev) => new Set([...prev, index]));
    setTimeout(() => setCopied(null), 2000);
  }

  // STEP 1 — REVEAL
  if (step === 1) {
    return (
      <div style={{
        minHeight: "calc(100vh - 57px)",
        background: "#0F172A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#475569", marginBottom: 32, fontFamily: "var(--font-inter)" }}>
          {result.vehicle}
        </p>

        <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B", marginBottom: 12, fontFamily: "var(--font-inter)" }}>
          Your Listing Score
        </p>

        <div style={{ fontSize: 112, fontWeight: 800, color: "white", lineHeight: 1, marginBottom: 12, fontFamily: "var(--font-manrope)" }}>
          {score}
        </div>

        <div style={{ fontSize: 28, fontWeight: 700, color: theme.primary, marginBottom: 6, fontFamily: "var(--font-manrope)" }}>
          {theme.label} {theme.emoji}
        </div>

        {potentialScore > score && (
          <p style={{ fontSize: 16, color: "#94A3B8", marginBottom: 40, fontFamily: "var(--font-inter)" }}>
            You could reach <strong style={{ color: "#2FBF71", fontWeight: 700 }}>{potentialScore}</strong> 🍬
          </p>
        )}

        {wins.length > 0 ? (
          <button
            onClick={() => setStep(2)}
            style={{
              background: theme.primary,
              color: "white",
              border: "none",
              borderRadius: 14,
              padding: "16px 40px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-manrope)",
              letterSpacing: "-0.01em",
            }}
          >
            Improve My Score →
          </button>
        ) : (
          <button
            onClick={() => setStep(3)}
            style={{
              background: theme.primary,
              color: "white",
              border: "none",
              borderRadius: 14,
              padding: "16px 40px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-manrope)",
            }}
          >
            See What's Hurting You →
          </button>
        )}

        <button
          onClick={onReset}
          style={{ marginTop: 24, fontSize: 12, color: "#475569", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}
        >
          ← Analyze another listing
        </button>
      </div>
    );
  }

  // STEP 2 — FIXES
  if (step === 2) {
    return (
      <div style={{ minHeight: "calc(100vh - 57px)", background: "#FFFDF8" }}>

        {/* STEP INDICATOR */}
        <div style={{ background: "white", borderBottom: "1px solid #F1F5F9", padding: "12px 24px" }}>
          <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{
                  width: s === 2 ? 24 : 8,
                  height: 8,
                  borderRadius: 99,
                  background: s === 2 ? theme.primary : s < 2 ? "#CBD5E1" : "#E2E8F0",
                  transition: "all 0.3s",
                }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "var(--font-inter)" }}>
              Step 2 of 4 — Your fixes
            </span>
          </div>
        </div>

        {/* CAR TRACKER */}
        <div style={{ background: "white", borderBottom: "1px solid #F1F5F9", padding: "16px 24px" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94A3B8", marginBottom: 10, fontFamily: "var(--font-inter)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <span>Listed · {score}</span>
              <span style={{ color: completed.size === wins.length ? "#2FBF71" : "#94A3B8", fontWeight: completed.size === wins.length ? 700 : 400 }}>
                {completed.size === wins.length ? "All fixes done 🎉" : `${completed.size} of ${wins.length} fixed`}
              </span>
              <span style={{ color: theme.primary }}>Deal · {potentialScore}</span>
            </div>

            <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: "#E2E8F0", borderRadius: 99 }} />
              <div style={{
                position: "absolute",
                left: 0,
                height: 3,
                borderRadius: 99,
                background: theme.primary,
                width: `${carPct}%`,
                transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
              }} />
              <div style={{
                position: "absolute",
                left: `calc(${carPct}% - 12px)`,
                fontSize: 22,
                transition: "left 0.6s cubic-bezier(0.4,0,0.2,1)",
                lineHeight: 1,
              }}>
                🚗
              </div>
              <div style={{
                position: "absolute",
                right: 0,
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: `2px solid ${theme.primary}`,
                background: completed.size === wins.length ? theme.primary : "white",
                transition: "background 0.4s",
              }} />
            </div>
          </div>
        </div>

        {/* FIXES */}
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1F2937", marginBottom: 6, fontFamily: "var(--font-manrope)" }}>
            {wins.length} quick fix{wins.length !== 1 ? "es" : ""} — copy & paste
          </h2>
          <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 20, fontFamily: "var(--font-inter)" }}>
            Add each line to your listing description. Each one moves your score up.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {wins.map((win, i) => {
              const done = completed.has(i);
              const isOpen = expanded === i;
              const boost = parseBoost(win.boost);
              const affiliate = SPOT_AFFILIATE[win.spot];

              return (
                <div key={i} style={{
                  background: done ? "#F0FDF4" : "white",
                  border: `1px solid ${done ? "#BBF7D0" : isOpen ? theme.primary + "60" : "#F1F5F9"}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}>
                  <button
                    onClick={() => !done && setExpanded(isOpen ? null : i)}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: "none",
                      border: "none",
                      cursor: done ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      textAlign: "left",
                    }}
                  >
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: `2px solid ${done ? "#2FBF71" : "#E2E8F0"}`,
                      background: done ? "#2FBF71" : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 12,
                      color: "white",
                      fontWeight: 700,
                    }}>
                      {done ? "✓" : ""}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: done ? "#6B7280" : "#1F2937",
                        textDecoration: done ? "line-through" : "none",
                        margin: 0,
                        fontFamily: "var(--font-manrope)",
                      }}>
                        {win.spot === "financing" ? "Add financing info" :
                         win.spot === "trust" ? "Add trust signals" :
                         win.spot === "listing" ? "Improve listing copy" :
                         "Improve pricing context"}
                      </p>
                    </div>

                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: done ? "#2FBF71" : theme.primary,
                      fontFamily: "var(--font-manrope)",
                      whiteSpace: "nowrap",
                    }}>
                      {done ? `+${boost} ✓` : `+${boost} pts`}
                    </span>

                    {!done && (
                      <span style={{ fontSize: 16, color: "#CBD5E1", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                        ›
                      </span>
                    )}
                  </button>

                  {isOpen && !done && (
                    <div style={{ padding: "0 16px 16px" }}>
                      <div style={{
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: 10,
                        padding: "12px 14px",
                        fontFamily: "var(--font-inter)",
                        fontSize: 13,
                        color: "#374151",
                        lineHeight: 1.7,
                        marginBottom: 12,
                      }}>
                        {win.text}
                      </div>

                      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <button
                          onClick={() => { copyText(win.text, i); setExpanded(null); }}
                          style={{
                            flex: 1,
                            padding: "11px",
                            background: theme.primary,
                            color: "white",
                            border: "none",
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "var(--font-manrope)",
                          }}
                        >
                          {copied === i ? "✓ Copied!" : "Copy & mark done →"}
                        </button>
                        {affiliate && (
                          <a
                            href={affiliate.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "11px 14px",
                              background: "white",
                              border: "1px solid #E2E8F0",
                              borderRadius: 10,
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#6B7280",
                              textDecoration: "none",
                              fontFamily: "var(--font-manrope)",
                            }}
                          >
                            {affiliate.cta}
                          </a>
                        )}
                      </div>

                      {/* HOW TO ADD */}
                      <div style={{ background: "#F1F5F9", borderRadius: 8, padding: "10px 12px" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, fontFamily: "var(--font-manrope)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          How to add this
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 2, fontFamily: "var(--font-manrope)" }}>Craigslist</p>
                            <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5, fontFamily: "var(--font-inter)", margin: 0 }}>
                              My Account → Active listings → Edit → paste at end of description
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 2, fontFamily: "var(--font-manrope)" }}>Facebook</p>
                            <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5, fontFamily: "var(--font-inter)", margin: 0 }}>
                              Open listing → Edit → scroll to Description → paste at end
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setStep(3)}
            style={{
              width: "100%",
              marginTop: 24,
              padding: "14px",
              background: completed.size > 0 ? theme.primary : "white",
              color: completed.size > 0 ? "white" : "#94A3B8",
              border: `1px solid ${completed.size > 0 ? theme.primary : "#E2E8F0"}`,
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-manrope)",
              transition: "all 0.3s",
            }}
          >
            {completed.size === wins.length ? "All done → See why buyers hesitate" : "Skip → See why buyers hesitate"}
          </button>
        </div>
      </div>
    );
  }

  // STEP 3 — WHY
  if (step === 3) {
    return (
      <div style={{ minHeight: "calc(100vh - 57px)", background: "#FFFDF8" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 16px" }}>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
            {[1,2,3,4].map(n => (
              <div key={n} style={{ height: 4, flex: 1, borderRadius: 99, background: n <= 3 ? theme.primary : "#E2E8F0" }} />
            ))}
            <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: 6, fontFamily: "var(--font-manrope)", fontWeight: 700, whiteSpace: "nowrap" }}>Step 3 of 4</span>
          </div>

          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", marginBottom: 12, fontFamily: "var(--font-manrope)", fontWeight: 700 }}>
            Why buyers are hesitating
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1F2937", marginBottom: 32, fontFamily: "var(--font-manrope)", lineHeight: 1.2 }}>
            Here&apos;s what&apos;s costing you calls
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
            {result.free_insights.map((insight, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 14,
                padding: "16px",
                background: "white",
                borderRadius: 12,
                border: "1px solid #F1F5F9",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0, fontFamily: "var(--font-inter)" }}>
                  {insight}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(4)}
            style={{
              width: "100%",
              padding: "14px",
              background: theme.primary,
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-manrope)",
            }}
          >
            See all {result.locked_count} improvements →
          </button>

          <button
            onClick={() => setStep(2)}
            style={{ display: "block", margin: "16px auto 0", fontSize: 12, color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}
          >
            ← Back to fixes
          </button>
        </div>
      </div>
    );
  }

  // STEP 4 — UNLOCK
  return (
    <div style={{ minHeight: "calc(100vh - 57px)", background: "#0F172A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
          {[1,2,3,4].map(n => (
            <div key={n} style={{ height: 4, flex: 1, borderRadius: 99, background: theme.primary }} />
          ))}
          <span style={{ fontSize: 11, color: "#64748B", marginLeft: 6, fontFamily: "var(--font-manrope)", fontWeight: 700, whiteSpace: "nowrap" }}>Step 4 of 4</span>
        </div>

        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>

        <h2 style={{ fontSize: 26, fontWeight: 800, color: "white", marginBottom: 8, fontFamily: "var(--font-manrope)" }}>
          We found {result.locked_count} more improvements
        </h2>
        <p style={{ fontSize: 15, color: "#64748B", marginBottom: 32, fontFamily: "var(--font-inter)" }}>
          The free analysis gave you a head start.<br />The full report seals the deal.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32, textAlign: "left" }}>
          {["Exact pricing recommendation", "Complete listing rewrite", "Buyer objection analysis", "Marketplace ranking insights", "Word-for-word title fix"].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#1E293B", borderRadius: 10 }}>
              <span style={{ color: "#475569", fontSize: 14 }}>🔒</span>
              <span style={{ fontSize: 14, color: "#94A3B8", fontFamily: "var(--font-inter)" }}>{item}</span>
            </div>
          ))}
        </div>

        <button style={{
          width: "100%",
          padding: "16px",
          background: theme.primary,
          color: "white",
          border: "none",
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: "var(--font-manrope)",
          marginBottom: 12,
        }}>
          Unlock Full Report — $29
        </button>

        <p style={{ fontSize: 12, color: "#475569", marginBottom: 24, fontFamily: "var(--font-inter)" }}>
          One-time payment · Instant access
        </p>

        <button
          onClick={onReset}
          style={{ fontSize: 12, color: "#475569", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}
        >
          ← Analyze another listing
        </button>
      </div>
    </div>
  );
}
