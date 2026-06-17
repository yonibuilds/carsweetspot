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

const SPOT_META = {
  pricing: { icon: "💰", title: "Pricing" },
  listing: { icon: "📝", title: "Listing" },
  trust: { icon: "🤝", title: "Trust" },
  financing: { icon: "📅", title: "Financing" },
};

const SPOT_FIX: Partial<Record<keyof typeof SPOT_META, { cta: string; url: string; boost: string }>> = {
  trust: { cta: "Get CARFAX →", url: "https://www.carfax.com", boost: "+15" },
  financing: { cta: "See financing →", url: "https://www.lendingtree.com/auto", boost: "+20" },
};

const SPOT_AFFILIATE: Partial<Record<QuickWin["spot"], { cta: string; url: string }>> = {
  trust: { cta: "Get CARFAX →", url: "https://www.carfax.com" },
  financing: { cta: "See rates →", url: "https://www.lendingtree.com/auto" },
};

function monthlyPayment(price: number, annualRate = 0.07, months = 60): number {
  if (!price) return 0;
  const r = annualRate / 12;
  return Math.round((price * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

function spotScoreColor(score: number) {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

type CandyTheme = {
  primary: string;
  light: string;
  label: string;
  emoji: string;
};

function candyTheme(score: number): CandyTheme {
  if (score >= 90) return { primary: "#10B981", light: "#D1FAE5", label: "Sweet Deal", emoji: "🍬" };
  if (score >= 75) return { primary: "#A855F7", light: "#F3E8FF", label: "Almost Sweet", emoji: "🍭" };
  if (score >= 55) return { primary: "#F59E0B", light: "#FEF3C7", label: "Needs Sugar", emoji: "🫤" };
  return { primary: "#84CC16", light: "#ECFCCB", label: "Sour Deal", emoji: "🍋" };
}

export default function Results({
  result,
  onReset,
}: {
  result: AnalysisResult;
  onReset: () => void;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  function copyText(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  const score = result.overall_score;
  const theme = candyTheme(score);
  const monthly = result.asking_price ? monthlyPayment(result.asking_price) : 0;

  const potentialBoost = result.quick_wins?.reduce((sum, win) => {
    const n = parseInt(win.boost.replace("+", ""));
    return sum + (isNaN(n) ? 0 : n);
  }, 0) ?? 0;
  const potentialScore = Math.min(100, score + potentialBoost);

  const r = 58;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">

        {/* LEFT COLUMN */}
        <div className="space-y-3 lg:sticky lg:top-6">

          {/* SCORE CARD */}
          <div className="bg-[#0F172A] rounded-2xl p-8 shadow-xl">
            <p className="text-zinc-500 text-xs font-medium mb-6 tracking-widest uppercase text-center">
              {result.vehicle}
            </p>

            <div className="flex items-center gap-6 mb-5">
              <div className="relative shrink-0">
                <svg width="140" height="140" className="-rotate-90">
                  <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
                  <circle
                    cx="70" cy="70" r={r} fill="none"
                    stroke={theme.primary}
                    strokeWidth="8"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-black text-white leading-none">{score}</span>
                  <span className="text-xs text-zinc-500 mt-1">/ 100</span>
                </div>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Sweet Spot Score</p>
                <p className="text-2xl font-black leading-tight" style={{ color: theme.primary }}>
                  {theme.label}
                </p>
                <p className="text-3xl leading-none mt-1">{theme.emoji}</p>
              </div>
            </div>

            {potentialBoost > 0 && (
              <div
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: theme.primary + "18", border: `1px solid ${theme.primary}35` }}
              >
                <p className="text-sm leading-relaxed">
                  <span className="text-zinc-400">Your listing is at </span>
                  <span className="text-white font-bold">{score}</span>
                  <span className="text-zinc-400">. You could reach </span>
                  <span className="font-black" style={{ color: theme.primary }}>{potentialScore}</span>
                  <span className="text-zinc-400"> with these fixes.</span>
                </p>
              </div>
            )}
          </div>

          {/* SPOT CARDS */}
          <div className="space-y-2">
            {(Object.entries(result.spots) as [keyof typeof SPOT_META, SpotScore][]).map(([key, spot]) => {
              const fix = spot.score < 75 ? SPOT_FIX[key] : undefined;
              const color = spotScoreColor(spot.score);
              return (
                <div key={key} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex">
                  <div className="w-1 shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                        {SPOT_META[key].icon} {SPOT_META[key].title}
                      </span>
                      <span className="text-3xl font-black leading-none shrink-0" style={{ color }}>
                        {spot.score}
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full mb-3">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${spot.score}%`, backgroundColor: color }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{spot.summary}</p>

                    {key === "financing" && monthly > 0 && (
                      <div className="mt-3 flex gap-3 bg-zinc-50 rounded-xl p-3 text-center border border-zinc-100">
                        <div className="flex-1">
                          <div className="text-sm font-black text-zinc-900">${monthly}/mo</div>
                          <div className="text-xs text-zinc-400 mt-0.5">60 mo @ 7%</div>
                        </div>
                        <div className="w-px bg-zinc-200" />
                        <div className="flex-1">
                          <div className="text-sm font-black text-zinc-900">
                            ${Math.round(monthlyPayment(result.asking_price, 0.07, 48))}/mo
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">48 mo @ 7%</div>
                        </div>
                      </div>
                    )}

                    {fix && (
                      <a
                        href={fix.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-between w-full text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-all"
                      >
                        <span className="text-zinc-700">{fix.cta}</span>
                        <span className="font-bold text-emerald-600">{fix.boost} ↑</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* INSIGHTS */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-1">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Here&apos;s what&apos;s costing you buyers
              </h3>
            </div>
            {result.free_insights.map((insight, i) => (
              <div key={i} className="flex gap-5 px-6 py-5 border-t border-zinc-50">
                <span className="text-2xl font-black text-zinc-100 shrink-0 leading-tight select-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-zinc-600 leading-relaxed pt-1">{insight}</p>
              </div>
            ))}
          </div>

          {/* QUICK WINS */}
          {result.quick_wins && result.quick_wins.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-6 pb-1">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
                  {potentialBoost > 0
                    ? `Earn ${potentialBoost} more points — free`
                    : "Add these to your listing — free"}
                </h3>
                <p className="text-xs text-zinc-400">Copy → paste directly into Craigslist or Facebook</p>
              </div>

              {result.quick_wins.map((win, i) => {
                const affiliate = SPOT_AFFILIATE[win.spot];
                return (
                  <div key={i} className="border-t border-zinc-50 px-6 py-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="text-xs font-black px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: theme.light, color: theme.primary }}
                      >
                        {win.boost} pts
                      </span>
                      <span className="text-xs text-zinc-400">
                        {SPOT_META[win.spot].icon} {SPOT_META[win.spot].title}
                      </span>
                    </div>
                    <div className="font-mono text-sm bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-700 leading-relaxed mb-3">
                      {win.text}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyText(win.text, i)}
                        className="flex-1 text-xs font-semibold py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-all"
                      >
                        {copiedIndex === i ? "✓ Copied!" : "Copy text"}
                      </button>
                      {affiliate && (
                        <a
                          href={affiliate.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-xs font-semibold py-2.5 rounded-xl text-white text-center transition-opacity hover:opacity-90"
                          style={{ backgroundColor: theme.primary }}
                        >
                          {affiliate.cta}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-zinc-50 px-6 py-4">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1.5 transition-colors"
                >
                  <span className="text-[10px]">{showInstructions ? "▲" : "▼"}</span>
                  How to edit my listing
                </button>
                {showInstructions && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-zinc-700 mb-2">Craigslist</p>
                      <ol className="space-y-1 text-zinc-400 list-decimal list-inside">
                        <li>My Account → Active listings</li>
                        <li>Click Edit on your listing</li>
                        <li>Paste at end of description</li>
                        <li>Click Update</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-700 mb-2">Facebook Marketplace</p>
                      <ol className="space-y-1 text-zinc-400 list-decimal list-inside">
                        <li>Open listing → Edit listing</li>
                        <li>Scroll to Description</li>
                        <li>Paste at the end</li>
                        <li>Click Save</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LOCKED */}
          <div className="bg-[#0F172A] rounded-2xl overflow-hidden">
            <div className="p-6 space-y-3 opacity-[0.15] blur-[3px] select-none pointer-events-none">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-2xl font-black text-zinc-400 shrink-0 leading-tight">0{i + 4}</span>
                  <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                    Your listing title is missing the exact keywords buyers search for — here is the complete rewrite ready to paste.
                  </p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-7 text-center -mt-2">
              <span className="text-3xl mb-3 block">🔒</span>
              <p className="text-white font-bold text-base mb-1">
                {result.locked_count} more insights + full rewrite
              </p>
              <p className="text-zinc-400 text-sm mb-5">
                Rewritten title, description & pricing recommendation
              </p>
              <button
                className="w-full font-bold py-3.5 rounded-xl transition-opacity hover:opacity-90 text-sm text-white"
                style={{ backgroundColor: theme.primary }}
              >
                Unlock Full Report — $29
              </button>
            </div>
          </div>

          <button
            onClick={onReset}
            className="w-full text-xs text-zinc-400 hover:text-zinc-600 py-4 transition-colors"
          >
            ← Analyze another listing
          </button>
        </div>

      </div>
    </div>
  );
}
