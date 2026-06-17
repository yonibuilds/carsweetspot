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

const SPOT_AFFILIATE: Partial<Record<QuickWin["spot"], { cta: string; url: string }>> = {
  trust: { cta: "Get CARFAX →", url: "https://www.carfax.com" },
  financing: { cta: "See rates →", url: "https://www.lendingtree.com/auto" },
};

function monthlyPayment(price: number, annualRate = 0.07, months = 60): number {
  if (!price) return 0;
  const r = annualRate / 12;
  return Math.round((price * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

type CandyTheme = { primary: string; light: string; label: string; emoji: string };

function candyTheme(score: number): CandyTheme {
  if (score >= 90) return { primary: "#10B981", light: "#D1FAE5", label: "Sweet Deal", emoji: "🍬" };
  if (score >= 75) return { primary: "#A855F7", light: "#F3E8FF", label: "Almost Sweet", emoji: "🍭" };
  if (score >= 55) return { primary: "#F59E0B", light: "#FEF3C7", label: "Needs Sugar", emoji: "🫤" };
  return { primary: "#84CC16", light: "#ECFCCB", label: "Sour Deal", emoji: "🍋" };
}

function spotStyle(score: number) {
  if (score >= 80) return { bg: "#F0FDF4", border: "#BBF7D0", color: "#16A34A" };
  if (score >= 60) return { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706" };
  return { bg: "#FFF1F2", border: "#FECDD3", color: "#E11D48" };
}

export default function Results({
  result,
  onReset,
}: {
  result: AnalysisResult;
  onReset: () => void;
}) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [showInstructions, setShowInstructions] = useState(false);

  function markComplete(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCompleted((prev) => new Set([...prev, index]));
  }

  const score = result.overall_score;
  const theme = candyTheme(score);
  const monthly = result.asking_price ? monthlyPayment(result.asking_price) : 0;
  const wins = result.quick_wins ?? [];

  const potentialBoost = wins.reduce((sum, win) => {
    const n = parseInt(win.boost.replace("+", ""));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const potentialScore = Math.min(100, score + potentialBoost);
  const earnedPts = wins
    .filter((_, i) => completed.has(i))
    .reduce((sum, win) => {
      const n = parseInt(win.boost.replace("+", ""));
      return sum + (isNaN(n) ? 0 : n);
    }, 0);

  const r = 70;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (score / 100) * circumference;

  return (
    <div>

      {/* FULL-WIDTH HERO */}
      <div className="bg-[#0F172A] w-full py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase mb-8">
            {result.vehicle}
          </p>

          <div className="flex justify-center mb-6">
            <div className="relative">
              <svg width="180" height="180" className="-rotate-90">
                <circle cx="90" cy="90" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
                <circle
                  cx="90" cy="90" r={r} fill="none"
                  stroke={theme.primary}
                  strokeWidth="12"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-7xl font-black text-white leading-none">{score}</span>
                <span className="text-sm text-zinc-500 mt-1">/ 100</span>
              </div>
            </div>
          </div>

          <p className="text-4xl font-black mb-2" style={{ color: theme.primary }}>
            {theme.label} {theme.emoji}
          </p>
          <p className="text-zinc-500 text-sm mb-8">Sweet Spot Score</p>

          {wins.length > 0 && (
            <div className="space-y-4">
              <p className="text-zinc-300 text-lg">
                {completed.size === wins.length ? (
                  <span>
                    🎉 All fixes applied!{" "}
                    <span className="font-black" style={{ color: theme.primary }}>
                      You&apos;re at {potentialScore}
                    </span>
                  </span>
                ) : (
                  <span>
                    Complete{" "}
                    <span className="text-white font-black">{wins.length - completed.size} fix{wins.length - completed.size !== 1 ? "es" : ""}</span>
                    {" "}to reach{" "}
                    <span className="font-black" style={{ color: theme.primary }}>{potentialScore}</span>
                  </span>
                )}
              </p>

              <div className="max-w-sm mx-auto">
                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                  <span>{completed.size} of {wins.length} completed</span>
                  {earnedPts > 0 && (
                    <span className="font-bold" style={{ color: theme.primary }}>+{earnedPts} pts earned</span>
                  )}
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${wins.length ? (completed.size / wins.length) * 100 : 0}%`,
                      backgroundColor: theme.primary,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SPOT SCORES ROW */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.entries(result.spots) as [keyof typeof SPOT_META, SpotScore][]).map(([key, spot]) => {
              const style = spotStyle(spot.score);
              return (
                <div
                  key={key}
                  className="rounded-2xl p-4 border"
                  style={{ backgroundColor: style.bg, borderColor: style.border }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      {SPOT_META[key].icon}
                    </span>
                    <span className="text-xl font-black" style={{ color: style.color }}>
                      {spot.score}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-500 mb-2">{SPOT_META[key].title}</p>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: style.color + "25" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${spot.score}%`, backgroundColor: style.color }}
                    />
                  </div>

                  {key === "financing" && monthly > 0 && (
                    <p className="text-xs font-bold mt-2" style={{ color: style.color }}>
                      ${monthly}/mo
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">

        {/* QUICK WINS */}
        {wins.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                Your fixes
              </h2>
              {potentialBoost > 0 && (
                <span className="text-xs font-bold text-zinc-400">+{potentialBoost} pts available</span>
              )}
            </div>

            {wins.map((win, i) => {
              const done = completed.has(i);
              const affiliate = SPOT_AFFILIATE[win.spot];
              const boost = parseInt(win.boost.replace("+", ""));
              return (
                <div
                  key={i}
                  className="rounded-3xl overflow-hidden border transition-all duration-300"
                  style={done
                    ? { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }
                    : { backgroundColor: "#FFFFFF", borderColor: "#E4E4E7" }
                  }
                >
                  <div
                    className="px-5 py-3 flex items-center justify-between"
                    style={done
                      ? { backgroundColor: "#DCFCE7" }
                      : { backgroundColor: theme.light }
                    }
                  >
                    <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                      {SPOT_META[win.spot].icon} {SPOT_META[win.spot].title}
                    </span>
                    <span
                      className="text-xs font-black px-2.5 py-0.5 rounded-full"
                      style={done
                        ? { backgroundColor: "#BBF7D0", color: "#16A34A" }
                        : { backgroundColor: theme.primary + "22", color: theme.primary }
                      }
                    >
                      {done ? `✓ +${boost} pts` : `+${boost} pts`}
                    </span>
                  </div>

                  <div className="px-5 py-4">
                    <p className="font-mono text-sm text-zinc-700 leading-relaxed mb-4 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
                      {win.text}
                    </p>

                    {done ? (
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                        <span className="text-lg">✓</span>
                        Added to listing
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => markComplete(win.text, i)}
                          className="flex-1 text-sm font-black py-3 rounded-2xl text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: theme.primary }}
                        >
                          Copy & Add to Listing →
                        </button>
                        {affiliate && (
                          <a
                            href={affiliate.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 text-sm font-bold py-3 rounded-2xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors whitespace-nowrap"
                          >
                            {affiliate.cta}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1.5 transition-colors"
              >
                <span className="text-[10px]">{showInstructions ? "▲" : "▼"}</span>
                How to edit my listing
              </button>
              {showInstructions && (
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs bg-white rounded-2xl border border-zinc-100 p-4">
                  <div>
                    <p className="font-bold text-zinc-700 mb-2">Craigslist</p>
                    <ol className="space-y-1 text-zinc-400 list-decimal list-inside">
                      <li>My Account → Active listings</li>
                      <li>Click Edit on your listing</li>
                      <li>Paste at end of description</li>
                      <li>Click Update</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-700 mb-2">Facebook Marketplace</p>
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

        {/* INSIGHTS */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-1">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
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

        {/* LOCKED */}
        <div className="bg-[#0F172A] rounded-3xl overflow-hidden">
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
            <p className="text-white font-black text-lg mb-1">
              {result.locked_count} more insights + full rewrite
            </p>
            <p className="text-zinc-400 text-sm mb-5">
              Rewritten title, description & pricing recommendation
            </p>
            <button
              className="w-full font-black py-4 rounded-2xl text-white text-base transition-opacity hover:opacity-90"
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
  );
}
