"use client";

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from "react";
import Flow, { AnalysisResult } from "./components/Flow";

// ── Tokens (same as Flow.tsx) ─────────────────────────────────────
const NAVY   = "#0F172A";
const NAVY_M = "#64748B";
const BRAND  = "#2563EB";
const BRAND_DK = "#1D4ED8";
const STAGE  = "#F4F4F5";
const BORDER = "#E2E8F0";
const WHITE  = "#FFFFFF";
const H: React.CSSProperties = { fontFamily: "var(--font-jakarta)" };
const B: React.CSSProperties = { fontFamily: "var(--font-inter)" };

// ── Analyzing screen ──────────────────────────────────────────────
function AnalyzingScreen() {
  const [score, setScore] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const iv = setInterval(() => {
      ref.current += 0.6;
      if (ref.current >= 78) { ref.current = 78; clearInterval(iv); }
      setScore(Math.round(ref.current));
    }, 40);
    return () => clearInterval(iv);
  }, []);

  const size = 160, stroke = 12, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);

  return (
    <div style={{ minHeight: "100vh", background: NAVY, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <p style={{ ...B, fontSize: 11, fontWeight: 700, color: NAVY_M, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 36 }}>
        Analyzing your listing
      </p>
      <div style={{ position: "relative", width: size, height: size, marginBottom: 28 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BRAND} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.1s linear" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ ...H, fontSize: 44, fontWeight: 800, color: WHITE, lineHeight: 1, letterSpacing: "-0.04em" }}>{score}</span>
          <span style={{ ...B, fontSize: 11, color: NAVY_M, marginTop: 6 }}>scoring…</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, ...B, fontSize: 13, color: NAVY_M }}>
        <svg style={{ animation: "spin 1s linear infinite", width: 14, height: 14, flexShrink: 0 }} fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Reading your listing…
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Dashboard mockup visual ───────────────────────────────────────
function DashboardMockup() {
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <div style={{
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 32px 80px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.12)",
      border: "1px solid rgba(255,255,255,0.08)",
      userSelect: "none",
    }}>
      {/* Browser chrome */}
      <div style={{ background: "#1E293B", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57", flexShrink: 0 }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E", flexShrink: 0 }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840", flexShrink: 0 }} />
        <div style={{ flex: 1, background: "#0F172A", borderRadius: 4, padding: "4px 10px", marginLeft: 8 }}>
          <span style={{ ...B, fontSize: 10, color: NAVY_M }}>carsweetspot.com/report</span>
        </div>
      </div>

      {/* App UI */}
      <div style={{ display: "flex", height: 290 }}>
        {/* Dark sidebar */}
        <div style={{ width: "30%", background: NAVY, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ ...H, fontSize: 10, fontWeight: 800, color: WHITE }}>CarSweetSpot</span>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ position: "relative", width: 70, height: 70 }}>
              <svg width={70} height={70} viewBox="0 0 70 70" style={{ transform: "rotate(-90deg)" }}>
                <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={6} />
                <circle cx={35} cy={35} r={r} fill="none" stroke={BRAND} strokeWidth={6}
                  strokeLinecap="round" strokeDasharray={`${circ * 0.72} ${circ}`} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ ...H, fontSize: 18, fontWeight: 800, color: WHITE, lineHeight: 1 }}>72</span>
              </div>
            </div>
            <span style={{ ...B, fontSize: 8, color: NAVY_M, textAlign: "center" }}>Sweet Spot Score</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={{ ...B, fontSize: 7, fontWeight: 700, color: NAVY_M, textTransform: "uppercase", letterSpacing: "0.1em" }}>Diagnostics</span>
            {[{ l: "Trust", v: 38 }, { l: "Text", v: 62 }, { l: "Photos", v: 91 }].map(m => (
              <div key={m.l} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ ...B, fontSize: 8, fontWeight: 600, color: WHITE }}>{m.l}</span>
                  <span style={{ ...B, fontSize: 8, color: NAVY_M }}>{m.v}%</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${m.v}%`, background: BRAND, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "auto", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: "8px 10px" }}>
            <p style={{ ...H, fontSize: 8, fontWeight: 600, color: WHITE, margin: "0 0 2px" }}>3 issues left</p>
            <p style={{ ...B, fontSize: 7, color: NAVY_M, margin: 0, lineHeight: 1.4 }}>Could lift score to 96</p>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: STAGE }}>
          {/* Blue hero */}
          <div style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DK} 100%)`, padding: "14px 16px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.15)", borderRadius: 99, padding: "2px 8px", marginBottom: 8 }}>
              <span style={{ ...B, fontSize: 7, fontWeight: 700, color: WHITE }}>⚠ Top priority fix</span>
            </div>
            <div style={{ ...H, fontSize: 11, fontWeight: 800, color: WHITE, lineHeight: 1.2, marginBottom: 4 }}>
              Missing ownership timeline
            </div>
            <div style={{ ...B, fontSize: 8, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
              Listings that explain ownership convert 2.3× faster.
            </div>
          </div>

          {/* Before / After */}
          <div style={{ padding: "12px 14px", flex: 1 }}>
            <div style={{ ...H, fontSize: 8, fontWeight: 700, color: NAVY, marginBottom: 7 }}>Rewrite the description</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div style={{ background: "#FEF2F2", border: "1px solid #EF444425", borderRadius: 6, padding: "6px 8px" }}>
                <div style={{ ...B, fontSize: 7, fontWeight: 700, color: "#EF4444", marginBottom: 4 }}>✕ BEFORE</div>
                <div style={{ ...B, fontSize: 7, color: "#991B1B", lineHeight: 1.5, textDecoration: "line-through", textDecorationColor: "#EF444435" }}>
                  Well maintained, clean interior. Serious buyers only.
                </div>
              </div>
              <div style={{ background: "#F0FDF4", border: "1px solid #16A34A25", borderRadius: 6, padding: "6px 8px" }}>
                <div style={{ ...B, fontSize: 7, fontWeight: 700, color: "#16A34A", marginBottom: 4 }}>✓ AFTER</div>
                <div style={{ ...B, fontSize: 7, color: "#14532D", lineHeight: 1.5 }}>
                  Single owner since 2019, dealer-serviced. Selling due to relocation. Clean title, non-smoker.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [url, setUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.history.replaceState({ home: true }, "");
    const onPop = () => { setResult(null); setLoading(false); };
    window.addEventListener("popstate", onPop);
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => { window.removeEventListener("popstate", onPop); window.removeEventListener("resize", check); };
  }, []);

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX = 800;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.src = e.target!.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const MAX_IMAGES = 5;
  const addFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).filter(f => f.type.startsWith("image/")).forEach(async (file) => {
      const compressed = await compressImage(file);
      setImages(prev => prev.length < MAX_IMAGES ? [...prev, compressed] : prev);
    });
  }, [compressImage]);

  const handlePaste = useCallback((e: globalThis.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) { const f = items[i].getAsFile(); if (f) imageFiles.push(f); }
    }
    if (imageFiles.length > 0) { e.preventDefault(); addFiles(imageFiles); }
  }, [addFiles]);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (url) body.url = url;
      if (images.length > 0) body.images = images;
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); }
      else { window.history.pushState({ results: true }, ""); setResult(data as AnalysisResult); setLoading(false); }
    } catch (err) { setError(`Network error: ${err instanceof Error ? err.message : String(err)}`); setLoading(false); }
  };

  if (result) return <Flow result={result} onReset={() => { setResult(null); setUrl(""); setImages([]); }} />;
  if (loading) return <AnalyzingScreen />;

  const canSubmit = !loading && (!!url || images.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: STAGE }}>

      {/* NAV */}
      <nav style={{
        background: NAVY, position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 56,
      }}>
        <span style={{ ...H, fontSize: 15, fontWeight: 800, color: WHITE, letterSpacing: "-0.02em" }}>
          CarSweetSpot
        </span>
        <span style={{ ...B, fontSize: 12, color: NAVY_M }}>Free · No signup</span>
      </nav>

      {/* HERO */}
      <div style={{
        display: "flex",
        flexDirection: isDesktop ? "row" : "column",
        alignItems: isDesktop ? "center" : "stretch",
        gap: isDesktop ? 60 : 0,
        maxWidth: 1200,
        margin: "0 auto",
        padding: isDesktop ? "72px 60px" : "48px 24px 40px",
      }}>

        {/* LEFT: copy + input */}
        <div style={{ flex: isDesktop ? "0 0 480px" : undefined, display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Eyebrow pill */}
          <div style={{
            ...B, display: "inline-flex", alignItems: "center", gap: 6,
            background: `${BRAND}15`, color: BRAND, border: `1px solid ${BRAND}30`,
            borderRadius: 99, padding: "5px 14px",
            fontSize: 12, fontWeight: 700,
            marginBottom: 24, alignSelf: "flex-start",
          }}>
            ✦ AI-Powered · Free · Instant
          </div>

          <h1 style={{
            ...H, fontSize: isDesktop ? 50 : 38, fontWeight: 800, color: NAVY,
            lineHeight: 1.05, letterSpacing: "-0.04em", margin: "0 0 16px",
          }}>
            Your listing is costing you buyers.
          </h1>

          <p style={{ ...B, fontSize: 16, color: NAVY_M, lineHeight: 1.65, margin: "0 0 36px", maxWidth: 420 }}>
            Paste your Craigslist or Facebook URL. Get a score, find the 3 things killing your contact rate, and copy-paste fixes in 60 seconds.
          </p>

          {/* INPUT CARD */}
          <div style={{
            background: WHITE, border: `1px solid ${BORDER}`,
            borderRadius: 18, padding: "24px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}>
            <input
              type="text" value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canSubmit && handleSubmit()}
              placeholder="Paste a listing URL — Craigslist, Facebook..."
              style={{
                ...B, width: "100%", boxSizing: "border-box",
                border: `1px solid ${BORDER}`, borderRadius: 10,
                padding: "12px 16px", fontSize: 14, color: NAVY,
                background: STAGE, outline: "none", marginBottom: 10,
              }}
            />

            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? BRAND : images.length > 0 ? "#86EFAC" : BORDER}`,
                borderRadius: 10, padding: images.length > 0 ? "12px 14px" : "20px 14px",
                textAlign: "center", cursor: "pointer",
                background: dragging ? "#EFF6FF" : images.length > 0 ? "#F0FDF4" : STAGE,
                transition: "all 0.2s", marginBottom: 12,
              }}
            >
              {images.length === 0 ? (
                <div>
                  <p style={{ ...B, fontSize: 14, fontWeight: 600, color: NAVY, margin: "0 0 3px" }}>📸 Add listing photos</p>
                  <p style={{ ...B, fontSize: 12, color: NAVY_M, margin: 0 }}>
                    Drag & drop · <span style={{ color: BRAND, fontWeight: 600 }}>browse</span> · Ctrl+V — photos get a deeper analysis
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ ...B, fontSize: 12, fontWeight: 700, color: "#15803D", margin: "0 0 8px" }}>
                    ✓ Photo analysis included — {images.length} photo{images.length > 1 ? "s" : ""}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {images.map((src, i) => (
                      <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${BORDER}` }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button onClick={e => { e.stopPropagation(); setImages(p => p.filter((_, j) => j !== i)); }} style={{
                          position: "absolute", top: 4, right: 4, width: 20, height: 20,
                          background: "rgba(0,0,0,0.6)", color: WHITE, border: "none",
                          borderRadius: "50%", fontSize: 11, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>×</button>
                      </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: `2px dashed ${BORDER}`, aspectRatio: "16/9", color: NAVY_M, fontSize: 20 }}>+</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && addFiles(e.target.files)} style={{ display: "none" }} />

            {error && (
              <div style={{ ...B, fontSize: 13, color: "#DC2626", background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit} disabled={!canSubmit}
              style={{
                ...H, width: "100%", padding: "14px",
                background: canSubmit ? `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DK} 100%)` : "#CBD5E1",
                color: WHITE, border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: canSubmit ? "pointer" : "default",
                letterSpacing: "-0.01em",
                boxShadow: canSubmit ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
                transition: "all 0.2s",
              }}
            >
              Get My Sweet Spot Score →
            </button>

            <p style={{ ...B, fontSize: 12, color: NAVY_M, textAlign: "center", marginTop: 10, marginBottom: 0 }}>
              Works with Craigslist & Facebook Marketplace · No signup needed
            </p>
          </div>
        </div>

        {/* RIGHT: dashboard mockup */}
        {isDesktop && (
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Glow blob */}
            <div style={{
              position: "absolute", width: 400, height: 300, borderRadius: "50%",
              background: `radial-gradient(ellipse, ${BRAND}20 0%, transparent 70%)`,
              filter: "blur(40px)",
              zIndex: 0,
            }} />
            <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 520,
              transform: "perspective(1200px) rotateY(-4deg) rotateX(2deg)",
              transition: "transform 0.3s ease",
            }}>
              <DashboardMockup />
            </div>
          </div>
        )}
      </div>

      {/* HOW IT WORKS */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "60px 40px 80px", background: WHITE }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <p style={{ ...B, fontSize: 11, fontWeight: 700, color: NAVY_M, textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "center", margin: "0 0 44px" }}>
            How it works
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr", gap: isDesktop ? 48 : 32 }}>
            {[
              { n: "01", icon: "🔗", title: "Paste your URL", desc: "Craigslist, Facebook Marketplace, or any listing. Or upload your listing photos directly." },
              { n: "02", icon: "🤖", title: "AI analyzes it", desc: "We score trust signals, description quality, photos, and pricing against real buyer behavior." },
              { n: "03", icon: "✏️", title: "Fix step by step", desc: "Get specific before/after rewrites you can copy and paste directly into your listing." },
            ].map(s => (
              <div key={s.n} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <span style={{ ...H, fontSize: 11, fontWeight: 700, color: "#CBD5E1", letterSpacing: "0.05em" }}>{s.n}</span>
                </div>
                <div style={{ ...H, fontSize: 17, fontWeight: 700, color: NAVY }}>{s.title}</div>
                <p style={{ ...B, fontSize: 14, color: NAVY_M, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
