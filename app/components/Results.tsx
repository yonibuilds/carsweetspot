"use client";

type SpotScore = {
  score: number;
  label: string;
  summary: string;
};

type AnalysisResult = {
  vehicle: string;
  overall_score: number;
  spots: {
    pricing: SpotScore;
    listing: SpotScore;
    trust: SpotScore;
    financing: SpotScore;
  };
  free_insights: string[];
  locked_count: number;
};

const SPOT_META = {
  pricing: { icon: "💰", title: "Pricing Sweet Spot" },
  listing: { icon: "📝", title: "Listing Sweet Spot" },
  trust: { icon: "🤝", title: "Trust Sweet Spot" },
  financing: { icon: "📅", title: "Financing Sweet Spot" },
};

function scoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-orange-500";
  return "text-red-500";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-green-100 border-green-200";
  if (score >= 60) return "bg-orange-50 border-orange-200";
  return "bg-red-50 border-red-200";
}

function scoreLabel(score: number) {
  if (score >= 90) return { text: "Sweet Deal! 🍬", color: "text-green-600" };
  if (score >= 75) return { text: "Almost Sweet 🍭", color: "text-orange-500" };
  if (score >= 55) return { text: "Needs Sugar 🫤", color: "text-orange-600" };
  return { text: "Sour Deal 🍋", color: "text-red-500" };
}

export default function Results({
  result,
  onReset,
}: {
  result: AnalysisResult;
  onReset: () => void;
}) {
  const label = scoreLabel(result.overall_score);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* OVERALL SCORE */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center mb-4">
        <p className="text-sm text-gray-500 mb-1">{result.vehicle}</p>
        <div className={`text-7xl font-extrabold mb-2 ${scoreColor(result.overall_score)}`}>
          {result.overall_score}
        </div>
        <div className="text-2xl font-bold text-gray-800 mb-1">Sweet Spot Score</div>
        <div className={`text-lg font-semibold ${label.color}`}>{label.text}</div>
      </div>

      {/* 4 SPOTS */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {(Object.entries(result.spots) as [keyof typeof SPOT_META, SpotScore][]).map(
          ([key, spot]) => (
            <div
              key={key}
              className={`rounded-2xl border p-4 ${scoreBg(spot.score)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  {SPOT_META[key].icon} {SPOT_META[key].title}
                </span>
                <span className={`text-xl font-extrabold ${scoreColor(spot.score)}`}>
                  {spot.score}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{spot.summary}</p>
              <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 text-gray-600">
                {spot.label}
              </span>
            </div>
          )
        )}
      </div>

      {/* FREE INSIGHTS */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-4">
        <h3 className="font-bold text-gray-900 mb-4">
          Top issues holding your listing back:
        </h3>
        <ul className="space-y-3">
          {result.free_insights.map((insight, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <span className="text-orange-500 font-bold shrink-0">→</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* LOCKED */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-4 relative overflow-hidden">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-3 text-sm text-gray-300 blur-[3px] select-none"
            >
              <span className="font-bold shrink-0">→</span>
              {"Your listing is missing a key trust signal that buyers look for before they pick up the phone to call you."}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white flex flex-col items-center justify-end pb-6">
          <p className="text-sm font-semibold text-gray-700 mb-1">
            🔒 {result.locked_count} more insights hidden
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Including a rewritten title, description, and pricing recommendation
          </p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors text-base">
            Unlock Full Report — $29
          </button>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full text-sm text-gray-400 hover:text-gray-600 py-3 transition-colors"
      >
        ← Analyze another listing
      </button>
    </div>
  );
}
