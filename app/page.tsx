"use client";

import { useState } from "react";
import AnalyzeInput from "./components/AnalyzeInput";

export default function Home() {
  const [hasResults, setHasResults] = useState(false);

  return (
    <main className="flex flex-col min-h-screen">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="text-xl font-bold text-orange-500">🍬 CarSweetSpot</span>
        {hasResults ? (
          <button
            onClick={() => setHasResults(false)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← New analysis
          </button>
        ) : (
          <a
            href="#analyze"
            className="bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-orange-600 transition-colors"
          >
            Analyze My Listing
          </a>
        )}
      </nav>

      {/* HERO */}
      <section className={`flex flex-col items-center text-center px-6 bg-gradient-to-b from-orange-50 to-white ${hasResults ? "pt-8 pb-8" : "pt-20 pb-16"}`}>
        {!hasResults && (
          <>
            <div className="inline-block bg-orange-100 text-orange-600 text-sm font-semibold px-4 py-1 rounded-full mb-6">
              Free Sweet Spot Score — No signup needed
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 max-w-2xl leading-tight">
              Sell Your Car Faster,{" "}
              <span className="text-orange-500">For More Money</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-xl">
              Paste your Craigslist or Facebook Marketplace listing — our AI
              analyzes it in seconds and tells you exactly what's holding buyers back.
            </p>
          </>
        )}

        <div id="analyze" className={`w-full flex justify-center ${hasResults ? "" : "mt-10"}`}>
          <AnalyzeInput onResultChange={setHasResults} />
        </div>
      </section>

      {/* LANDING SECTIONS — hidden when results are showing */}
      {!hasResults && (
        <>
          {/* HOW IT WORKS */}
          <section className="px-6 py-16 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
              How it works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { icon: "🔗", title: "Paste your listing", desc: "Drop in your Craigslist, Facebook, or any car listing URL." },
                { icon: "🤖", title: "AI analyzes it", desc: "We score your photos, title, price, description, and trust signals." },
                { icon: "🍬", title: "Get your Sweet Spot", desc: "See your score, what's hurting you, and how to fix it fast." },
              ].map((item) => (
                <div key={item.title} className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SCORE PREVIEW */}
          <section className="bg-gray-50 px-6 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
                Your listing, scored across 4 Sweet Spots
              </h2>
              <p className="text-center text-gray-500 mb-10 text-sm">
                Most sellers lose money on just one of these. Find out which one.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "💰", title: "Pricing Sweet Spot", desc: "Is your price too high, too low, or just right for your market?", color: "border-green-200 bg-green-50" },
                  { icon: "📝", title: "Listing Sweet Spot", desc: "Are your photos, title, and description actually selling the car?", color: "border-blue-200 bg-blue-50" },
                  { icon: "🤝", title: "Trust Sweet Spot", desc: "Do buyers feel safe enough to reach out and show up?", color: "border-purple-200 bg-purple-50" },
                  { icon: "📅", title: "Financing Sweet Spot", desc: "Does your buyer know what this costs per month? Most don't.", color: "border-orange-200 bg-orange-50" },
                ].map((spot) => (
                  <div key={spot.title} className={`rounded-2xl border p-6 ${spot.color}`}>
                    <div className="text-2xl mb-3">{spot.icon}</div>
                    <h3 className="font-bold text-gray-900 mb-1">{spot.title}</h3>
                    <p className="text-sm text-gray-600">{spot.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SOCIAL PROOF */}
          <section className="px-6 py-16 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
              What sellers are saying
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { name: "Mike T.", location: "Phoenix, AZ", quote: "Listed my truck for 3 weeks with no calls. Got the score, changed my title and price — sold in 4 days." },
                { name: "Sara K.", location: "Austin, TX", quote: "I had no idea my photos were the problem. The AI was brutally honest and it was exactly what I needed." },
                { name: "James R.", location: "Denver, CO", quote: "Worth every penny. The optimized listing they wrote for me got 3 offers in one weekend." },
              ].map((review) => (
                <div key={review.name} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">"{review.quote}"</p>
                  <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                  <p className="text-xs text-gray-400">{review.location}</p>
                </div>
              ))}
            </div>
          </section>

          {/* BOTTOM CTA */}
          <section className="bg-orange-500 px-6 py-16 text-white text-center">
            <h2 className="text-3xl font-extrabold mb-4">Find your car's Sweet Spot — free</h2>
            <p className="text-orange-100 mb-8 text-base max-w-md mx-auto">
              Stop guessing why buyers aren't calling. Get your score in 10 seconds.
            </p>
            <a href="#analyze" className="inline-block bg-white text-orange-500 font-bold px-8 py-3 rounded-full hover:bg-orange-50 transition-colors text-base">
              Analyze My Listing →
            </a>
          </section>
        </>
      )}

      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100">
        © 2026 CarSweetSpot · carsweetspot.com
      </footer>
    </main>
  );
}
