"use client";

import { useState } from "react";

const NAVY = "#0F172A";
const WHITE = "#FFFFFF";
const BORDER = "#E2E8F0";
const BRAND = "#2563EB";
const SUCCESS = "#16A34A";
const DANGER = "#EF4444";
const AMBER = "#B45309";
const PAGE_BG = "#F8FAFC";
const B: React.CSSProperties = { fontFamily: "var(--font-inter)" };
const H: React.CSSProperties = { fontFamily: "var(--font-jakarta)" };

const TEST_URLS = [
  { label: "Honda Pilot", url: "" },
  { label: "Subaru Crosstrek", url: "" },
  { label: "Cadillac XT6 (rebuilt)", url: "" },
  { label: "Toyota Tacoma", url: "" },
];

type EngineResult = {
  vehicle?: string;
  asking_price?: number;
  overall_score?: number;
  monthly_payment?: number;
  verified_facts?: string[];
  unsafe_to_claim?: string[];
  biggest_problem?: { title: string; before: string; after: string; category: string; why_buyers_care: string; seller_insight: string };
  also_hurting?: { title: string; before: string; after: string; category: string }[];
  whats_working?: string[];
  opportunities?: { title: string; insight: string; type: string }[];
  error?: string;
};

type CompareResult = {
  claude: EngineResult | null;
  openai: EngineResult | null;
  durationClaude: number;
  durationOpenai: number;
};

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ ...B, fontSize: 10, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 12, padding: "2px 8px" }}>
      {text}
    </span>
  );
}

function FactList({ items, color, label }: { items: string[]; color: string; label: string }) {
  if (!items?.length) return <p style={{ ...B, fontSize: 12, color: "#94A3B8", margin: 0 }}>None</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((f, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          <span style={{ color, fontSize: 11, marginTop: 1, flexShrink: 0 }}>•</span>
          <span style={{ ...B, fontSize: 12, color: NAVY, lineHeight: 1.5 }}>{f}</span>
        </div>
      ))}
    </div>
  );
}

function IssueCard({ problem, idx }: { problem: { title: string; before: string; after: string; category: string; why_buyers_care?: string; seller_insight?: string }; idx: number }) {
  const [open, setOpen] = useState(false);
  const catColor = problem.category === "trust" ? AMBER : problem.category === "photos" ? BRAND : DANGER;
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: WHITE }}>
        <span style={{ ...B, fontSize: 11, fontWeight: 600, color: catColor, background: `${catColor}14`, borderRadius: 8, padding: "2px 7px" }}>{problem.category}</span>
        <span style={{ ...B, fontSize: 13, color: NAVY, flex: 1 }}>{problem.title}</span>
        <span style={{ fontSize: 10, color: "#94A3B8" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "12px 14px", background: PAGE_BG, borderTop: `1px solid ${BORDER}` }}>
          {problem.why_buyers_care && <p style={{ ...B, fontSize: 12, color: "#64748B", margin: "0 0 10px", lineHeight: 1.5 }}>{problem.why_buyers_care}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ ...B, fontSize: 10, fontWeight: 700, color: DANGER, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Before</p>
              <p style={{ ...B, fontSize: 12, color: "#991B1B", margin: 0, lineHeight: 1.5 }}>{problem.before}</p>
            </div>
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ ...B, fontSize: 10, fontWeight: 700, color: SUCCESS, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>After</p>
              <p style={{ ...B, fontSize: 12, color: "#14532D", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{problem.after}</p>
            </div>
          </div>
          {problem.seller_insight && (
            <p style={{ ...B, fontSize: 11, color: "#64748B", margin: "8px 0 0", fontStyle: "italic", lineHeight: 1.5 }}>💡 {problem.seller_insight}</p>
          )}
        </div>
      )}
    </div>
  );
}

function EngineColumn({ result, engine, duration }: { result: EngineResult | null; engine: "Claude V2.3" | "OpenAI GPT-4o-mini"; duration: number }) {
  const isOpenAI = engine.startsWith("OpenAI");
  const accentColor = isOpenAI ? "#10B981" : BRAND;

  if (!result) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>
      Waiting…
    </div>
  );

  if (result.error) return (
    <div style={{ flex: 1, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 20 }}>
      <p style={{ ...B, fontSize: 13, color: DANGER, margin: 0 }}>Error: {result.error}</p>
    </div>
  );

  const allIssues = [result.biggest_problem, ...(result.also_hurting ?? [])].filter(Boolean);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor }} />
            <span style={{ ...H, fontSize: 14, fontWeight: 700, color: NAVY }}>{engine}</span>
          </div>
          <span style={{ ...B, fontSize: 11, color: "#94A3B8" }}>{(duration / 1000).toFixed(1)}s</span>
        </div>
        <p style={{ ...H, fontSize: 13, fontWeight: 600, color: NAVY, margin: "0 0 6px" }}>{result.vehicle}</p>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {result.asking_price ? <span style={{ ...B, fontSize: 13, fontWeight: 700, color: BRAND }}>${result.asking_price.toLocaleString()}</span> : null}
          {result.monthly_payment ? <span style={{ ...B, fontSize: 12, color: "#64748B" }}>${result.monthly_payment}/mo</span> : null}
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: "center" }}>
            <span style={{ ...H, fontSize: 28, fontWeight: 700, color: result.overall_score! >= 75 ? SUCCESS : result.overall_score! >= 60 ? AMBER : DANGER }}>{result.overall_score}</span>
            <span style={{ ...B, fontSize: 11, color: "#94A3B8" }}>/100</span>
          </div>
        </div>
      </div>

      {/* Verified facts */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
        <p style={{ ...B, fontSize: 10, fontWeight: 700, color: SUCCESS, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>✓ Verified Facts ({result.verified_facts?.length ?? 0})</p>
        <FactList items={result.verified_facts ?? []} color={SUCCESS} label="fact" />
      </div>

      {/* Unsafe to claim */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
        <p style={{ ...B, fontSize: 10, fontWeight: 700, color: DANGER, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>⚠ Unsafe to Claim ({result.unsafe_to_claim?.length ?? 0})</p>
        <FactList items={result.unsafe_to_claim ?? []} color={DANGER} label="unsafe" />
      </div>

      {/* Issues */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
        <p style={{ ...B, fontSize: 10, fontWeight: 700, color: NAVY, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Issues ({allIssues.length})</p>
        {allIssues.map((p, i) => p && <IssueCard key={i} problem={p} idx={i} />)}
      </div>

      {/* What's working */}
      {result.whats_working?.length ? (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ ...B, fontSize: 10, fontWeight: 700, color: SUCCESS, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>What's Working</p>
          <FactList items={result.whats_working} color={SUCCESS} label="strength" />
        </div>
      ) : null}
    </div>
  );
}

export default function ComparePage() {
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<CompareResult | null>(null);
  const [error, setError] = useState("");

  const run = async (targetUrl: string = url) => {
    if (!targetUrl.trim()) return;
    setError("");
    setRunning(true);
    setResults(null);

    const t0 = Date.now();
    const [claudeRes, openaiRes] = await Promise.allSettled([
      fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: targetUrl }) }),
      fetch("/api/analyze-openai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: targetUrl }) }),
    ]);
    const t1 = Date.now();

    const parse = async (r: PromiseSettledResult<Response>): Promise<EngineResult> => {
      if (r.status === "rejected") return { error: r.reason?.message ?? "Network error" };
      const j = await r.value.json();
      return j;
    };

    const [claude, openai] = await Promise.all([parse(claudeRes), parse(openaiRes)]);
    setResults({ claude, openai, durationClaude: t1 - t0, durationOpenai: t1 - t0 });
    setRunning(false);
  };

  return (
    <div style={{ background: PAGE_BG, minHeight: "100vh", padding: "32px 32px 64px" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ ...H, fontSize: 20, fontWeight: 700, color: NAVY }}>Engine Comparison</span>
            <Badge text="Internal testing only" color={AMBER} />
          </div>
          <p style={{ ...B, fontSize: 13, color: "#64748B", margin: 0 }}>
            Claude V2.3 vs OpenAI GPT-4o-mini — same listing, both engines in parallel.
          </p>
        </div>

        {/* Input */}
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input
              value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && run()}
              placeholder="Paste listing URL (Craigslist, Facebook…)"
              style={{ ...B, flex: 1, border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: "11px 14px", fontSize: 14, color: NAVY, outline: "none", background: PAGE_BG }}
            />
            <button
              onClick={() => run()}
              disabled={running || !url.trim()}
              style={{ ...H, padding: "11px 22px", background: BRAND, color: WHITE, border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: running || !url.trim() ? 0.5 : 1 }}
            >
              {running ? "Running…" : "Compare →"}
            </button>
          </div>

          {/* Preset test URLs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ ...B, fontSize: 11, color: "#94A3B8", alignSelf: "center" }}>Quick tests:</span>
            {TEST_URLS.map(t => (
              <button
                key={t.label}
                onClick={() => { if (t.url) { setUrl(t.url); run(t.url); } }}
                disabled={!t.url}
                style={{ ...B, fontSize: 11, color: t.url ? BRAND : "#CBD5E1", background: t.url ? "#EFF6FF" : "#F8FAFC", border: `1px solid ${t.url ? "#BFDBFE" : BORDER}`, borderRadius: 20, padding: "4px 12px", cursor: t.url ? "pointer" : "default" }}
              >
                {t.label}{!t.url ? " (add URL)" : ""}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ ...B, fontSize: 13, color: DANGER, marginBottom: 16 }}>{error}</p>}

        {/* Results */}
        {running && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "#94A3B8", fontSize: 14 }}>
            Running both engines in parallel…
          </div>
        )}

        {results && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
            <EngineColumn result={results.claude} engine="Claude V2.3" duration={results.durationClaude} />
            <EngineColumn result={results.openai} engine="OpenAI GPT-4o-mini" duration={results.durationOpenai} />
          </div>
        )}
      </div>
    </div>
  );
}
