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

function scoreColor(score: number): string {
  if (score >= 75) return "#1A9E6E";
  if (score >= 55) return "#D97706";
  return "#DC2626";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Sweet Spot";
  if (score >= 75) return "Almost There";
  if (score >= 55) return "Needs Work";
  return "Needs Attention";
}

const ACCENT = "#111";
const BG = "#F9F9F7";

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
  const wins = result.quick_wins ?? [];
  const totalBoost = wins.reduce((s, w) => s + parseBoost(w.boost), 0);
  const potentialScore = Math.min(100, score + totalBoost);
  const earnedPts = wins.filter((_, i) => completed.has(i)).reduce((s, w) => s + parseBoost(w.boost), 0);
  const carPct = potentialScore > score
    ? (earnedPts / (potentialScore - score)) * 100
    : 0;

  const accent = scoreColor(score);

  function copyText(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setCompleted((prev) => new Set([...prev, index]));
    setTimeout(() => setCopied(null), 2000);
  }

  const StepBar = ({ current }: { current: number }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {[1, 2, 3, 4].map(n => (
        <div key={n} style={{
          height: 3,
          flex: 1,
          borderRadius: 99,
          background: n <= current ? ACCENT : "#DDD",
          transition: "background 0.3s",
        }} />
      ))}
      <span style={{ fontSize: 11, color: "#AAA", marginLeft: 8, whiteSpace: "nowrap", fontFamily: "var(--font-inter)" }}>
        {current} / 4
      </span>
    </div>
  );

  // STEP 1 — REVEAL
  if (step === 1) {
    return (
      <div style={{
        minHeight: "calc(100vh - 60px)",
        background: "#111",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#555",
          marginBottom: 48,
          fontFamily: "var(--font-inter)",
        }}>
          {result.vehicle}
        </p>

        <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: 16, fontFamily: "var(--font-inter)" }}>
          Sweet Spot Score
        </p>

        <div style={{
          fontSize: 120,
          fontWeight: 800,
          color: "white",
          lineHeight: 1,
          marginBottom: 8,
          fontFamily: "var(--font-manrope)",
          letterSpacing: "-0.04em",
        }}>
          {score}
        </div>

        <div style={{ fontSize: 20, fontWeight: 600, color: accent, marginBottom: 8, fontFamily: "var(--font-manrope)" }}>
          {scoreLabel(score)}
        </div>

        {potentialScore > score && (
          <p style={{ fontSize: 15, color: "#555", marginBottom: 48, fontFamily: "var(--font-inter)" }}>
            Could reach <span style={{ color: "#E8E8E8", fontWeight: 600 }}>{potentialScore}</span> with {wins.length} fix{wins.length !== 1 ? "es" : ""}
          </p>
        )}

        <button
          onClick={() => setStep(wins.length > 0 ? 2 : 3)}
          style={{
            background: "white",
            color: "#111",
            border: "none",
            borderRadius: 10,
            padding: "16px 40px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "var(--font-manrope)",
            letterSpacing: "-0.01em",
          }}
        >
          See what to fix →
        </button>

        <button
          onClick={onReset}
          style={{ marginTop: 24, fontSize: 12, color: "#444", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}
        >
          ← Analyze another listing
        </button>
      </div>
    );
  }

  // STEP 2 — FIXES
  if (step === 2) {
    return (
      <div style={{ minHeight: "calc(100vh - 60px)", background: BG }}>

        {/* TOP BAR */}
        <div style={{ background: "white", borderBottom: "1px solid #E5E5E3", padding: "14px 24px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <StepBar current={2} />
          </div>
        </div>

        {/* CAR TRACKER */}
        <div style={{ background: "white", borderBottom: "1px solid #E5E5E3", padding: "16px 24px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#AAA", marginBottom: 10, fontFamily: "var(--font-inter)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <span>Now · {score}</span>
              <span style={{ color: completed.size === wins.length ? "#1A9E6E" : "#AAA", fontWeight: completed.size === wins.length ? 700 : 400 }}>
                {completed.size === wins.length ? "All done" : `${completed.size} of ${wins.length} done`}
              </span>
              <span style={{ color: "#111" }}>Goal · {potentialScore}</span>
            </div>
            <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "#E5E5E3", borderRadius: 99 }} />
              <div style={{
                position: "absolute", left: 0, height: 2, borderRadius: 99,
                background: ACCENT, width: `${carPct}%`,
                transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
              }} />
              <div style={{
                position: "absolute",
                left: `calc(${carPct}% - 10px)`,
                fontSize: 20,
                transition: "left 0.6s cubic-bezier(0.4,0,0.2,1)",
                lineHeight: 1,
              }}>
                🚗
              </div>
              <div style={{
                position: "absolute", right: 0,
                width: 12, height: 12, borderRadius: "50%",
                border: `2px solid ${ACCENT}`,
                background: completed.size === wins.length ? ACCENT : "white",
                transition: "background 0.4s",
              }} />
            </div>
          </div>
        </div>

        {/* FIXES */}
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 24px" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111", marginBottom: 6, fontFamily: "var(--font-manrope)", letterSpacing: "-0.03em" }}>
            {wins.length} fix{wins.length !== 1 ? "es" : ""} to improve your score
          </h2>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 24, fontFamily: "var(--font-inter)" }}>
            Copy each line and paste it into your listing description.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {wins.map((win, i) => {
              const done = completed.has(i);
              const isOpen = expanded === i;
              const boost = parseBoost(win.boost);
              const affiliate = SPOT_AFFILIATE[win.spot];

              return (
                <div key={i} style={{
                  background: done ? "#F0FAF5" : "white",
                  border: `1px solid ${done ? "#A7E8C7" : isOpen ? "#CCC" : "#E5E5E3"}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}>
                  <button
                    onClick={() => !done && setExpanded(isOpen ? null : i)}
                    style={{
                      width: "100%",
                      padding: "16px 18px",
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
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: `2px solid ${done ? "#1A9E6E" : "#DDD"}`,
                      background: done ? "#1A9E6E" : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 11,
                      color: "white",
                      fontWeight: 700,
                    }}>
                      {done ? "✓" : ""}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: done ? "#999" : "#111",
                        textDecoration: done ? "line-through" : "none",
                        margin: 0,
                        fontFamily: "var(--font-manrope)",
                        letterSpacing: "-0.01em",
                      }}>
                        {win.spot === "financing" ? "Add financing info" :
                         win.spot === "trust" ? "Add trust signals" :
                         win.spot === "listing" ? "Improve listing copy" :
                         "Improve pricing context"}
                      </p>
                    </div>

                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: done ? "#1A9E6E" : "#111",
                      fontFamily: "var(--font-manrope)",
                      whiteSpace: "nowrap",
                      background: done ? "transparent" : "#F3F3F1",
                      padding: "3px 8px",
                      borderRadius: 6,
                    }}>
                      {done ? `+${boost} ✓` : `+${boost} pts`}
                    </span>

                    {!done && (
                      <span style={{
                        fontSize: 18,
                        color: "#CCC",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        lineHeight: 1,
                      }}>
                        ›
                      </span>
                    )}
                  </button>

                  {isOpen && !done && (
                    <div style={{ padding: "0 18px 18px" }}>
                      <div style={{
                        background: "#F9F9F7",
                        border: "1px solid #E5E5E3",
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontFamily: "var(--font-inter)",
                        fontSize: 13,
                        color: "#333",
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
                            background: "#111",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
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
                              border: "1px solid #E5E5E3",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#666",
                              textDecoration: "none",
                              fontFamily: "var(--font-manrope)",
                            }}
                          >
                            {affiliate.cta}
                          </a>
                        )}
                      </div>

                      <div style={{ background: "#F3F3F1", borderRadius: 8, padding: "10px 12px" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, fontFamily: "var(--font-manrope)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          How to add this
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 2, fontFamily: "var(--font-manrope)" }}>Craigslist</p>
                            <p style={{ fontSize: 11, color: "#AAA", lineHeight: 1.5, fontFamily: "var(--font-inter)", margin: 0 }}>
                              My Account → Active listings → Edit → paste at end
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 2, fontFamily: "var(--font-manrope)" }}>Facebook</p>
                            <p style={{ fontSize: 11, color: "#AAA", lineHeight: 1.5, fontFamily: "var(--font-inter)", margin: 0 }}>
                              Open listing → Edit → Description → paste at end
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
              background: completed.size > 0 ? "#111" : "white",
              color: completed.size > 0 ? "white" : "#AAA",
              border: `1px solid ${completed.size > 0 ? "#111" : "#E5E5E3"}`,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-manrope)",
              transition: "all 0.3s",
            }}
          >
            {completed.size === wins.length ? "Done → See what's costing you buyers" : "Skip → See what's costing you buyers"}
          </button>
        </div>
      </div>
    );
  }

  // STEP 3 — WHY
  if (step === 3) {
    return (
      <div style={{ minHeight: "calc(100vh - 60px)", background: BG }}>
        <div style={{ background: "white", borderBottom: "1px solid #E5E5E3", padding: "14px 24px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <StepBar current={3} />
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px" }}>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#AAA", marginBottom: 12, fontFamily: "var(--font-manrope)", fontWeight: 700 }}>
            Why buyers are hesitating
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#111", marginBottom: 40, fontFamily: "var(--font-manrope)", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Here&apos;s what&apos;s costing you calls
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 48 }}>
            {result.free_insights.map((insight, i) => (
              <div key={i} style={{
                padding: "20px 0",
                borderBottom: "1px solid #E5E5E3",
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#CCC", fontFamily: "var(--font-manrope)", minWidth: 20, paddingTop: 2 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p style={{ fontSize: 15, color: "#333", lineHeight: 1.65, margin: 0, fontFamily: "var(--font-inter)" }}>
                  {insight}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(4)}
            style={{
              width: "100%",
              padding: "15px",
              background: "#111",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-manrope)",
              letterSpacing: "-0.01em",
            }}
          >
            See all {result.locked_count} improvements →
          </button>

          <button
            onClick={() => setStep(2)}
            style={{ display: "block", margin: "16px auto 0", fontSize: 12, color: "#AAA", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}
          >
            ← Back to fixes
          </button>
        </div>
      </div>
    );
  }

  // STEP 4 — UNLOCK
  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "#111", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px" }}>
      <div style={{ maxWidth: 480, width: "100%" }}>

        <div style={{ marginBottom: 40 }}>
          <StepBar current={4} />
        </div>

        <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", marginBottom: 16, fontFamily: "var(--font-manrope)", fontWeight: 700 }}>
          Full Report
        </p>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "white", marginBottom: 12, fontFamily: "var(--font-manrope)", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          {result.locked_count} more improvements found.
        </h2>
        <p style={{ fontSize: 15, color: "#555", marginBottom: 40, fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
          The free analysis gave you a head start.<br />The full report gets you to the Sweet Spot.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 40 }}>
          {[
            "Exact pricing recommendation",
            "Complete listing rewrite",
            "Buyer objection analysis",
            "Marketplace ranking insights",
            "Word-for-word title fix",
          ].map((item) => (
            <div key={item} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 0",
              borderBottom: "1px solid #222",
            }}>
              <span style={{ fontSize: 14, color: "#555", fontFamily: "var(--font-inter)" }}>{item}</span>
              <span style={{ fontSize: 12, color: "#333", fontFamily: "var(--font-manrope)" }}>Locked</span>
            </div>
          ))}
        </div>

        <button style={{
          width: "100%",
          padding: "16px",
          background: "white",
          color: "#111",
          border: "none",
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: "var(--font-manrope)",
          letterSpacing: "-0.02em",
          marginBottom: 12,
        }}>
          Unlock Full Report — $29
        </button>

        <p style={{ fontSize: 12, color: "#444", textAlign: "center", fontFamily: "var(--font-inter)" }}>
          One-time payment · Instant access
        </p>

        <button
          onClick={onReset}
          style={{ display: "block", margin: "24px auto 0", fontSize: 12, color: "#444", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}
        >
          ← Analyze another listing
        </button>
      </div>
    </div>
  );
}
