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

type Affiliate = {
  icon: string;
  title: string;
  description: string;
  boost: string;
  cta: string;
  url: string;
  condition: (spots: AnalysisResult["spots"]) => boolean;
};

const AFFILIATES: Affiliate[] = [
  {
    icon: "🛡️",
    title: "Help Your Buyer Get Insured",
    description: "Send your buyer a pre-filled quote with your car's details. Removes the last barrier before they say yes.",
    boost: "Speeds up your sale",
    cta: "Get Insurance Quote →",
    url: "#",
    condition: () => true,
  },
  {
    icon: "📋",
    title: "Add a CARFAX Report",
    description: "Buyers trust listings with vehicle history. Removes the #1 reason buyers walk away.",
    boost: "+15 to Trust Score",
    cta: "Get CARFAX →",
    url: "https://www.carfax.com",
    condition: (spots) => spots.trust.score < 85,
  },
  {
    icon: "💵",
    title: "Help Your Buyer Get Financing",
    description: "Make it easy for buyers to afford your car. They already know it fits their budget.",
    boost: "+20 to Financing Score",
    cta: "Add Financing →",
    url: "https://www.lendingtree.com/auto",
    condition: (spots) => spots.financing.score < 70,
  },
  {
    icon: "🔧",
    title: "Pre-Sale Inspection",
    description: "A clean inspection report stops price negotiations cold.",
    boost: "+10 to Trust Score",
    cta: "Book Inspection →",
    url: "https://www.lemonsquad.com",
    condition: (spots) => spots.trust.score < 80,
  },
];

const SPOT_AFFILIATE: Partial<Record<QuickWin["spot"], { cta: string; url: string }>> = {
  trust: { cta: "Get CARFAX →", url: "https://www.carfax.com" },
  financing: { cta: "See rates →", url: "https://www.lendingtree.com/auto" },
};

function monthlyPayment(price: number, annualRate = 0.07, months = 60): number {
  if (!price) return 0;
  const r = annualRate / 12;
  return Math.round((price * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

function scoreColor(score: number) {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#f97316";
  return "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 90) return { text: "Sweet Deal! 🍬", color: "text-green-400" };
  if (score >= 75) return { text: "Almost Sweet 🍭", color: "text-orange-400" };
  if (score >= 55) return { text: "Needs Sugar 🫤", color: "text-orange-400" };
  return { text: "Sour Deal 🍋", color: "text-red-400" };
}

function scoreBgLight(score: number) {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 60) return "bg-orange-50 border-orange-200";
  return "bg-red-50 border-red-200";
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

  const label = scoreLabel(result.overall_score);
  const relevantAffiliates = AFFILIATES.filter((a) => a.condition(result.spots)).slice(0, 3);
  const monthly = result.asking_price ? monthlyPayment(result.asking_price) : 0;
  const score = result.overall_score;
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">

      {/* SCORE CARD — dark */}
      <div className="bg-slate-900 rounded-3xl p-8 text-center shadow-xl">
        <p className="text-slate-400 text-sm mb-5 tracking-wide">{result.vehicle}</p>
        <div className="relative inline-flex items-center justify-center mb-5">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
            <circle
              cx="70" cy="70" r={r} fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-black text-white">{score}</span>
            <span className="text-xs text-slate-400 mt-0.5">/ 100</span>
          </div>
        </div>
        <p className="text-white text-lg font-bold mb-1">Sweet Spot Score</p>
        <p className={`text-base font-semibold ${label.color}`}>{label.text}</p>
      </div>

      {/* 4 SPOTS */}
      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(result.spots) as [keyof typeof SPOT_META, SpotScore][]).map(([key, spot]) => (
          <div key={key} className={`rounded-2xl border p-4 ${scoreBgLight(spot.score)}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                {SPOT_META[key].icon} {SPOT_META[key].title}
              </span>
              <span className="text-lg font-black" style={{ color: scoreColor(spot.score) }}>
                {spot.score}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/60 rounded-full mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${spot.score}%`, backgroundColor: scoreColor(spot.score) }}
              />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{spot.summary}</p>
            {key === "financing" && monthly > 0 && (
              <div className="mt-2 flex gap-3 bg-white/70 rounded-xl p-2 text-center">
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-gray-900">${monthly}/mo</div>
                  <div className="text-xs text-gray-400">60 mo @ 7%</div>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-gray-900">${Math.round(monthlyPayment(result.asking_price, 0.07, 48))}/mo</div>
                  <div className="text-xs text-gray-400">48 mo @ 7%</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* INSIGHTS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 pt-5 pb-2">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
            What&apos;s holding your listing back
          </h3>
        </div>
        {result.free_insights.map((insight, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-t border-gray-50">
            <span className="text-xs font-black text-orange-400 mt-0.5 shrink-0 w-5">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>

      {/* QUICK WINS */}
      {result.quick_wins && result.quick_wins.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
              Add these to your listing — free boost
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Copy each line and paste it into your Craigslist or Facebook listing
            </p>
          </div>
          {result.quick_wins.map((win, i) => {
            const affiliate = SPOT_AFFILIATE[win.spot];
            return (
              <div key={i} className="border-t border-gray-50 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                    {win.boost}
                  </span>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">
                    {SPOT_META[win.spot].icon} {SPOT_META[win.spot].title}
                  </span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 mb-3">
                  {win.text}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyText(win.text, i)}
                    className="flex-1 text-xs font-bold py-2 rounded-lg border border-gray-200 hover:border-orange-300 hover:text-orange-500 transition-colors"
                  >
                    {copiedIndex === i ? "✓ Copied!" : "Copy"}
                  </button>
                  {affiliate && (
                    <a
                      href={affiliate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs font-bold py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-center transition-colors"
                    >
                      {affiliate.cta}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          <div className="border-t border-gray-50 px-5 py-3">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <span>{showInstructions ? "▲" : "▼"}</span>
              How to edit my listing
            </button>
            {showInstructions && (
              <div className="mt-3 space-y-3 text-xs text-gray-600">
                <div>
                  <p className="font-bold mb-1">Craigslist</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-gray-500">
                    <li>Go to craigslist.org → My Account → Active listings</li>
                    <li>Click Edit on your listing</li>
                    <li>Paste the lines at the end of your description</li>
                    <li>Click Update</li>
                  </ol>
                </div>
                <div>
                  <p className="font-bold mb-1">Facebook Marketplace</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-gray-500">
                    <li>Open your listing → Edit listing</li>
                    <li>Scroll to Description</li>
                    <li>Paste the lines at the end</li>
                    <li>Click Save</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AFFILIATES */}
      {relevantAffiliates.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Boost your score
          </p>
          <div className="space-y-2">
            {relevantAffiliates.map((a) => (
              <a
                key={a.title}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 hover:border-orange-200 hover:shadow-sm transition-all group"
              >
                <div className="text-2xl shrink-0">{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-gray-900">{a.title}</span>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {a.boost}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{a.description}</p>
                </div>
                <span className="text-gray-300 group-hover:text-orange-400 transition-colors text-lg shrink-0">→</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* LOCKED */}
      <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="space-y-3 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 blur-[4px] select-none">
              <span className="text-xs font-black text-orange-200 shrink-0 w-5">0{i + 4}</span>
              <p className="text-sm text-gray-300">Your listing title is missing keywords that buyers actually search for — here is the exact rewrite.</p>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/70 to-white flex flex-col items-center justify-end pb-7 px-6 text-center">
          <span className="text-2xl mb-2">🔒</span>
          <p className="text-sm font-bold text-gray-900 mb-1">{result.locked_count} more insights + full rewrite</p>
          <p className="text-xs text-gray-400 mb-4">Rewritten title, description & pricing recommendation</p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors w-full max-w-xs">
            Unlock Full Report — $29
          </button>
        </div>
      </div>

      <button onClick={onReset} className="w-full text-sm text-gray-400 hover:text-gray-600 py-4 transition-colors">
        ← Analyze another listing
      </button>
    </div>
  );
}
