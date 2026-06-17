"use client";

type SpotScore = {
  score: number;
  label: string;
  summary: string;
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
  locked_count: number;
};

const SPOT_META = {
  pricing: { icon: "💰", title: "Pricing Sweet Spot" },
  listing: { icon: "📝", title: "Listing Sweet Spot" },
  trust: { icon: "🤝", title: "Trust Sweet Spot" },
  financing: { icon: "📅", title: "Financing Sweet Spot" },
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
    title: "Help Your Buyer Get Insured Instantly",
    description: "Send your buyer a pre-filled insurance quote with your car's details. Removes the last barrier before they say yes.",
    boost: "Speeds up your sale",
    cta: "Get Insurance Quote for This Car →",
    url: "#",
    condition: () => true,
  },
  {
    icon: "📋",
    title: "Add a CARFAX Report",
    description: "Buyers trust listings with vehicle history. A CARFAX report removes the #1 reason buyers walk away.",
    boost: "+15 to your Trust Score",
    cta: "Get CARFAX Report →",
    url: "https://www.carfax.com",
    condition: (spots) => spots.trust.score < 85,
  },
  {
    icon: "💵",
    title: "Show Monthly Payments",
    description: "",
    boost: "+20 to your Financing Score",
    cta: "Help Your Buyer Get Financing →",
    url: "https://www.lendingtree.com/auto",
    condition: (spots) => spots.financing.score < 70,
  },
  {
    icon: "🔧",
    title: "Get a Pre-Sale Inspection",
    description: "A clean inspection report signals confidence. Buyers who see it stop negotiating on price.",
    boost: "+10 to your Trust Score",
    cta: "Book Lemon Squad Inspection →",
    url: "https://www.lemonsquad.com",
    condition: (spots) => spots.trust.score < 80,
  },
  {
    icon: "📸",
    title: "Professional Photos",
    description: "Listings with pro photos sell 2x faster. Better photos are the single highest-ROI upgrade for your listing.",
    boost: "+15 to your Listing Score",
    cta: "Find a Car Photographer →",
    url: "https://www.snappr.com",
    condition: (spots) => spots.listing.score < 75,
  },
];

function monthlyPayment(price: number, annualRate = 0.07, months = 60): number {
  if (!price) return 0;
  const r = annualRate / 12;
  return Math.round((price * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

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
  const relevantAffiliates = AFFILIATES.filter((a) => a.condition(result.spots)).slice(0, 3);
  const monthly = result.asking_price ? monthlyPayment(result.asking_price) : 0;
  const score = result.overall_score;
  const circumference = 2 * Math.PI * 54;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* OVERALL SCORE */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center mb-4">
        <p className="text-sm text-gray-500 mb-4">{result.vehicle}</p>
        <div className="relative inline-flex items-center justify-center mb-4">
          <svg width="128" height="128" className="-rotate-90">
            <circle cx="64" cy="64" r="54" fill="none" stroke="#f3f4f6" strokeWidth="10" />
            <circle
              cx="64" cy="64" r="54" fill="none"
              stroke={score >= 80 ? "#16a34a" : score >= 60 ? "#f97316" : "#ef4444"}
              strokeWidth="10"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-4xl font-extrabold ${scoreColor(score)}`}>{score}</span>
          </div>
        </div>
        <div className="text-xl font-bold text-gray-800 mb-1">Sweet Spot Score</div>
        <div className={`text-base font-semibold ${label.color}`}>{label.text}</div>
      </div>

      {/* 4 SPOTS */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {(Object.entries(result.spots) as [keyof typeof SPOT_META, SpotScore][]).map(
          ([key, spot]) => (
            <div key={key} className={`rounded-2xl border p-4 ${scoreBg(spot.score)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  {SPOT_META[key].icon} {SPOT_META[key].title}
                </span>
                <span className={`text-xl font-extrabold ${scoreColor(spot.score)}`}>
                  {spot.score}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{spot.summary}</p>
              {key === "financing" && monthly > 0 && (
                <div className="mt-3 bg-white/70 rounded-xl p-2 flex gap-3 text-center">
                  <div className="flex-1">
                    <div className="text-base font-extrabold text-gray-900">${monthly}/mo</div>
                    <div className="text-xs text-gray-400">60 months @ 7%</div>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div className="flex-1">
                    <div className="text-base font-extrabold text-gray-900">${Math.round(monthlyPayment(result.asking_price, 0.07, 48))}/mo</div>
                    <div className="text-xs text-gray-400">48 months @ 7%</div>
                  </div>
                </div>
              )}
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

      {/* AFFILIATES */}
      {relevantAffiliates.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
            Boost your Sweet Spot Score
          </p>
          <div className="space-y-3">
            {relevantAffiliates.map((a) => (
              <div
                key={a.title}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-4 items-start"
              >
                <div className="text-2xl shrink-0">{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{a.title}</span>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      {a.boost}
                    </span>
                  </div>
                  {a.title === "Show Monthly Payments" && monthly > 0 ? (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-2">
                        At ${result.asking_price.toLocaleString()}, your buyer is looking at:
                      </p>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-lg font-extrabold text-gray-900">${monthly}/mo</div>
                          <div className="text-xs text-gray-400">60 months @ 7%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-extrabold text-gray-900">${Math.round(monthlyPayment(result.asking_price, 0.07, 48))}/mo</div>
                          <div className="text-xs text-gray-400">48 months @ 7%</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Add this to your listing — buyers who see monthly payments are 2x more likely to reach out.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{a.description}</p>
                  )}
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    {a.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOCKED */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-4 relative overflow-hidden">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 text-sm text-gray-300 blur-[3px] select-none">
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
