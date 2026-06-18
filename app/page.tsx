"use client";

import { useState } from "react";
import AnalyzeInput from "./components/AnalyzeInput";
import Results from "./components/Results";

type AnalysisResult = Parameters<typeof Results>[0]["result"];

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  if (result) {
    return (
      <main style={{ minHeight: "100vh", background: "#F9F9F7" }}>
        <nav style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          height: 60,
          background: "white",
          borderBottom: "1px solid #E5E5E3",
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#111", letterSpacing: "-0.02em", fontFamily: "var(--font-manrope)" }}>
            CarSweetSpot
          </span>
          <button
            onClick={() => setResult(null)}
            style={{ fontSize: 13, color: "#999", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}
          >
            ← New analysis
          </button>
        </nav>
        <Results result={result} onReset={() => setResult(null)} />
        <footer style={{ textAlign: "center", fontSize: 12, color: "#BBB", padding: "24px 0", borderTop: "1px solid #E5E5E3", background: "white", marginTop: 80 }}>
          © 2026 CarSweetSpot
        </footer>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "white", fontFamily: "var(--font-inter)" }}>

      {/* NAV */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: 64,
        borderBottom: "1px solid #F0F0EE",
        position: "sticky",
        top: 0,
        background: "white",
        zIndex: 50,
      }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: "#111", letterSpacing: "-0.03em", fontFamily: "var(--font-manrope)" }}>
          CarSweetSpot
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#how" style={{ fontSize: 14, color: "#666", textDecoration: "none", fontWeight: 500 }}>How it works</a>
          <a href="#analyze" style={{
            fontSize: 14,
            fontWeight: 700,
            color: "white",
            background: "#111",
            padding: "9px 20px",
            borderRadius: 8,
            textDecoration: "none",
            fontFamily: "var(--font-manrope)",
          }}>
            Get my score
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 40px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <div style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#888",
            marginBottom: 24,
          }}>
            Free · No signup needed
          </div>
          <h1 style={{
            fontSize: 52,
            fontWeight: 800,
            color: "#111",
            lineHeight: 1.08,
            letterSpacing: "-0.04em",
            marginBottom: 24,
            fontFamily: "var(--font-manrope)",
          }}>
            Find out why<br />your car isn&apos;t<br />selling.
          </h1>
          <p style={{ fontSize: 18, color: "#666", lineHeight: 1.6, marginBottom: 40, maxWidth: 400 }}>
            Paste your listing URL. Get an instant Sweet Spot Score with specific fixes — in 10 seconds.
          </p>
          <a href="#analyze" style={{
            display: "inline-block",
            background: "#111",
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            padding: "14px 28px",
            borderRadius: 10,
            textDecoration: "none",
            fontFamily: "var(--font-manrope)",
            letterSpacing: "-0.01em",
          }}>
            Analyze my listing →
          </a>
          <div style={{ display: "flex", gap: 24, marginTop: 32, fontSize: 13, color: "#AAA" }}>
            <span>Works with Craigslist</span>
            <span>Works with Facebook</span>
          </div>
        </div>

        {/* SCORE CARD MOCKUP */}
        <div style={{
          background: "#111",
          borderRadius: 20,
          padding: "40px",
          color: "white",
        }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 8, fontFamily: "var(--font-inter)" }}>
            2019 Honda Accord Sport
          </p>
          <p style={{ fontSize: 12, color: "#555", marginBottom: 16, fontFamily: "var(--font-inter)" }}>Sweet Spot Score</p>
          <div style={{ fontSize: 88, fontWeight: 800, color: "white", lineHeight: 1, marginBottom: 4, fontFamily: "var(--font-manrope)", letterSpacing: "-0.04em" }}>
            62
          </div>
          <p style={{ fontSize: 15, color: "#888", marginBottom: 32, fontFamily: "var(--font-inter)" }}>
            Could reach <span style={{ color: "#E8E8E8", fontWeight: 600 }}>84</span> with 3 fixes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Add monthly payment estimate", pts: "+12" },
              { label: "Include maintenance history", pts: "+8" },
              { label: "Rewrite title with keywords", pts: "+2" },
            ].map((fix) => (
              <div key={fix.label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#1A1A1A",
                borderRadius: 10,
                padding: "12px 16px",
              }}>
                <span style={{ fontSize: 13, color: "#CCC", fontFamily: "var(--font-inter)" }}>{fix.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5DBBFF", fontFamily: "var(--font-manrope)" }}>{fix.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{ borderTop: "1px solid #F0F0EE", maxWidth: 1100, margin: "0 auto" }} />

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#AAA", marginBottom: 16 }}>How it works</p>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: "#111", letterSpacing: "-0.03em", marginBottom: 60, fontFamily: "var(--font-manrope)" }}>
          Your listing, scored on 4 things.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {[
            { num: "01", title: "Pricing", desc: "Is your price right for today's market?" },
            { num: "02", title: "Listing", desc: "Do your photos and description sell it?" },
            { num: "03", title: "Trust", desc: "Do buyers feel confident reaching out?" },
            { num: "04", title: "Financing", desc: "Does your buyer know what it costs per month?" },
          ].map((s) => (
            <div key={s.num}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#CCC", marginBottom: 12, fontFamily: "var(--font-manrope)" }}>{s.num}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 8, fontFamily: "var(--font-manrope)" }}>{s.title}</p>
              <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{ borderTop: "1px solid #F0F0EE", maxWidth: 1100, margin: "0 auto" }} />

      {/* INPUT */}
      <section id="analyze" style={{ maxWidth: 680, margin: "0 auto", padding: "80px 40px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#111", letterSpacing: "-0.03em", marginBottom: 8, fontFamily: "var(--font-manrope)" }}>
          Analyze your listing
        </h2>
        <p style={{ fontSize: 15, color: "#888", marginBottom: 32 }}>
          Paste a Craigslist or Facebook Marketplace URL below.
        </p>
        <AnalyzeInput onResult={(r) => setResult(r as AnalysisResult)} />
      </section>

      {/* DIVIDER */}
      <div style={{ borderTop: "1px solid #F0F0EE", maxWidth: 1100, margin: "0 auto" }} />

      {/* TESTIMONIALS */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#AAA", marginBottom: 40 }}>What sellers say</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            { name: "Mike T.", loc: "Phoenix, AZ", quote: "Listed my truck for 3 weeks, zero calls. Changed the title and price after my score — sold in 4 days." },
            { name: "Sara K.", loc: "Austin, TX", quote: "I had no idea my photos were killing my listing. The AI was honest in a way no friend would be." },
            { name: "James R.", loc: "Denver, CO", quote: "Got 3 offers in one weekend after using the full report. Best $29 I've spent." },
          ].map((r) => (
            <div key={r.name} style={{ borderTop: "2px solid #111", paddingTop: 24 }}>
              <p style={{ fontSize: 15, color: "#333", lineHeight: 1.7, marginBottom: 20 }}>&ldquo;{r.quote}&rdquo;</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111", fontFamily: "var(--font-manrope)" }}>{r.name}</p>
              <p style={{ fontSize: 12, color: "#AAA" }}>{r.loc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#111", padding: "80px 40px", textAlign: "center" }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: "white", letterSpacing: "-0.04em", marginBottom: 16, fontFamily: "var(--font-manrope)" }}>
          Find your Sweet Spot.
        </h2>
        <p style={{ fontSize: 16, color: "#666", marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
          Free analysis. No account. Takes 10 seconds.
        </p>
        <a href="#analyze" style={{
          display: "inline-block",
          background: "white",
          color: "#111",
          fontSize: 15,
          fontWeight: 700,
          padding: "14px 32px",
          borderRadius: 10,
          textDecoration: "none",
          fontFamily: "var(--font-manrope)",
          letterSpacing: "-0.01em",
        }}>
          Analyze my listing →
        </a>
      </section>

      <footer style={{ textAlign: "center", fontSize: 12, color: "#BBB", padding: "24px 0", borderTop: "1px solid #222", background: "#111" }}>
        © 2026 CarSweetSpot
      </footer>
    </main>
  );
}
