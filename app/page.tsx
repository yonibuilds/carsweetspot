"use client";

import { useState } from "react";
import AnalyzeInput from "./components/AnalyzeInput";
import Results from "./components/Results";

type AnalysisResult = Parameters<typeof Results>[0]["result"];

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  if (result) {
    return (
      <main className="min-h-screen bg-gray-50">
        <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <span className="text-lg font-black text-slate-900">🍬 CarSweetSpot</span>
          <button
            onClick={() => setResult(null)}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← New analysis
          </button>
        </nav>
        <Results result={result} onReset={() => setResult(null)} />
        <footer className="text-center text-xs text-gray-400 py-5 border-t border-gray-100 bg-white mt-8">
          © 2026 CarSweetSpot · carsweetspot.com
        </footer>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-gray-50">

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <span className="text-lg font-black text-slate-900">🍬 CarSweetSpot</span>
        <a href="#analyze" className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-orange-600 transition-colors">
          Analyze My Listing
        </a>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center text-center px-4 pt-16 pb-12 bg-white">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full mb-8 border border-orange-100">
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
          Free analysis — no signup needed
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 max-w-2xl leading-[1.1] mb-6">
          Sell your car faster,{" "}
          <span className="text-orange-500">for more money</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-md mb-10 leading-relaxed">
          Paste your listing URL. Our AI tells you exactly what&apos;s holding buyers back — in 10 seconds.
        </p>
        <div id="analyze" className="w-full max-w-xl">
          <AnalyzeInput onResult={(r) => setResult(r as AnalysisResult)} />
        </div>
        <div className="flex items-center gap-6 mt-8 text-xs text-gray-400 flex-wrap justify-center">
          <span>✓ Free forever</span>
          <span>✓ No account needed</span>
          <span>✓ Works with Craigslist & Facebook</span>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-900 px-6 py-10">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">How it works</p>
          <h2 className="text-white text-2xl font-black">Your listing gets scored on 4 things</h2>
        </div>
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "💰", title: "Pricing", desc: "Is your price right for the market?" },
            { icon: "📝", title: "Listing", desc: "Do your photos & description sell it?" },
            { icon: "🤝", title: "Trust", desc: "Do buyers feel safe reaching out?" },
            { icon: "📅", title: "Financing", desc: "Does your buyer know what it costs/month?" },
          ].map((s) => (
            <div key={s.title} className="bg-slate-800 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-white text-sm font-bold mb-1">{s.title}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-14 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { num: "01", title: "Paste your URL", desc: "Craigslist, Facebook Marketplace, or any listing." },
            { num: "02", title: "AI analyzes it", desc: "We read every word, photo, and price signal." },
            { num: "03", title: "Fix what's hurting you", desc: "Get specific, actionable steps — not vague advice." },
          ].map((s) => (
            <div key={s.num} className="flex gap-4">
              <span className="text-3xl font-black text-orange-200 shrink-0">{s.num}</span>
              <div>
                <p className="font-bold text-slate-900 mb-1">{s.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-black text-slate-900 text-center mb-8">What sellers are saying</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Mike T.", loc: "Phoenix, AZ", quote: "Listed my truck for 3 weeks, zero calls. Changed my title and price after the score — sold in 4 days." },
              { name: "Sara K.", loc: "Austin, TX", quote: "I had no idea my photos were killing my listing. The AI was honest in a way no friend would be." },
              { name: "James R.", loc: "Denver, CO", quote: "Got 3 offers in one weekend after using the full report. Best $29 I've spent." },
            ].map((r) => (
              <div key={r.name} className="border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-gray-600 leading-relaxed mb-4">&quot;{r.quote}&quot;</p>
                <p className="text-sm font-bold text-slate-900">{r.name}</p>
                <p className="text-xs text-gray-400">{r.loc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-orange-500 px-6 py-14 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
          Find your Sweet Spot — free
        </h2>
        <p className="text-orange-100 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Stop guessing why your car isn&apos;t selling. Get your score in 10 seconds.
        </p>
        <a href="#analyze" className="inline-block bg-white text-orange-500 font-black px-8 py-3 rounded-full hover:bg-orange-50 transition-colors">
          Analyze My Listing →
        </a>
      </section>

      <footer className="text-center text-xs text-gray-400 py-5 border-t border-gray-100 bg-white">
        © 2026 CarSweetSpot · carsweetspot.com
      </footer>
    </main>
  );
}
