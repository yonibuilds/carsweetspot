"use client";

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from "react";
import Flow, { AnalysisResult } from "./components/Flow";

const NAVY    = "#0F172A";
const NAVY_M  = "#64748B";
const BRAND   = "#2563EB";
const BRAND_DK = "#1D4ED8";
const STAGE   = "#F4F4F5";
const BORDER  = "#E2E8F0";
const WHITE   = "#FFFFFF";
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

// ── Before/After hero mockup ──────────────────────────────────────
function BeforeAfterMockup({ isDesktop }: { isDesktop: boolean }) {
  if (!isDesktop) return null;

  const Card = ({ badge, badgeColor, score, scoreColor, barColor, desc }: {
    badge: string; badgeColor: string; score: number; scoreColor: string; barColor: string; desc: string;
  }) => (
    <div style={{ background: "#1E293B", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", flex: 1 }}>
      <div style={{ padding: "14px 16px 10px" }}>
        <span style={{ ...B, fontSize: 11, fontWeight: 800, color: WHITE, background: badgeColor, borderRadius: 5, padding: "3px 10px" }}>{badge}</span>
        <p style={{ ...H, fontSize: 14, fontWeight: 700, color: WHITE, margin: "10px 0 0" }}>2018 Toyota Camry SE</p>
      </div>
      {/* Car image placeholder */}
      <div style={{ height: 110, background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", display: "flex", alignItems: "center", justifyContent: "center", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <svg width="80" height="40" viewBox="0 0 80 40" fill="none">
          <rect x="8" y="20" width="64" height="14" rx="3" fill="#334155"/>
          <rect x="16" y="10" width="42" height="14" rx="3" fill="#475569"/>
          <circle cx="20" cy="34" r="6" fill="#1E293B" stroke="#64748B" strokeWidth="2"/>
          <circle cx="60" cy="34" r="6" fill="#1E293B" stroke="#64748B" strokeWidth="2"/>
        </svg>
      </div>
      <div style={{ padding: "12px 16px 16px" }}>
        <p style={{ ...B, fontSize: 12, color: "#94A3B8", lineHeight: 1.6, margin: "0 0 14px", fontStyle: "italic" }}>"{desc}"</p>
        <p style={{ ...B, fontSize: 11, color: NAVY_M, margin: "0 0 6px" }}>Trust Score</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
          <span style={{ ...H, fontSize: 30, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</span>
          <span style={{ ...B, fontSize: 13, color: NAVY_M }}>/100</span>
        </div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
          <div style={{ height: "100%", width: `${score}%`, background: barColor, borderRadius: 3 }} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {/* Glow */}
      <div style={{
        position: "absolute", width: 500, height: 400, borderRadius: "50%",
        background: `radial-gradient(ellipse, ${BRAND}22 0%, transparent 70%)`,
        filter: "blur(60px)", zIndex: 0, pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
        {/* REAL EXAMPLE label */}
        <p style={{ ...B, fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: "0.12em", textAlign: "center", margin: "0 0 14px" }}>
          ↓ REAL EXAMPLE
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* BEFORE */}
          <Card
            badge="BEFORE" badgeColor="#EF4444"
            score={58} scoreColor="#EF4444" barColor="#EF4444"
            desc="Runs great. Clean title. Call for details."
          />

          {/* Arrow */}
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: WHITE, fontSize: 16 }}>→</span>
          </div>

          {/* AFTER */}
          <Card
            badge="AFTER" badgeColor="#16A34A"
            score={84} scoreColor="#16A34A" barColor="#16A34A"
            desc="One-owner 2018 Toyota Camry SE. Dealer maintained since new. All service records available. Clean title in hand."
          />

          {/* +26 badge */}
          <div style={{
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DK} 100%)`,
            borderRadius: 12, padding: "16px 14px", textAlign: "center", flexShrink: 0, width: 90,
          }}>
            <p style={{ ...H, fontSize: 26, fontWeight: 800, color: WHITE, margin: 0, lineHeight: 1 }}>+26</p>
            <p style={{ ...B, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: "4px 0 0" }}>points</p>
            <p style={{ ...B, fontSize: 9, color: "rgba(255,255,255,0.5)", margin: "6px 0 0", lineHeight: 1.4 }}>Estimated increase in buyer trust</p>
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
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
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
    <div style={{ minHeight: "100vh", background: NAVY }}>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 56,
        background: NAVY, borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{ ...H, fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>
          <span style={{ color: WHITE }}>Car</span><span style={{ color: BRAND }}>SweetSpot</span>
        </span>
        <span style={{ ...B, fontSize: 13, color: NAVY_M }}>No signup. Free to try.</span>
      </nav>

      {/* HERO */}
      <div style={{
        display: "flex",
        flexDirection: isDesktop ? "row" : "column",
        alignItems: isDesktop ? "center" : "stretch",
        gap: isDesktop ? 60 : 0,
        maxWidth: 1200,
        margin: "0 auto",
        padding: isDesktop ? "80px 60px 60px" : "48px 24px 40px",
        minHeight: isDesktop ? "calc(100vh - 56px - 100px)" : undefined,
      }}>

        {/* LEFT */}
        <div style={{ flex: isDesktop ? "0 0 480px" : undefined, display: "flex", flexDirection: "column" }}>

          {/* Pill */}
          <div style={{
            ...B, display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(37,99,235,0.18)", color: "#93C5FD",
            border: "1px solid rgba(37,99,235,0.35)",
            borderRadius: 99, padding: "5px 14px",
            fontSize: 12, fontWeight: 700,
            marginBottom: 24, alignSelf: "flex-start",
          }}>
            ✦ AI-Powered · Free · Instant
          </div>

          {/* Headline */}
          <h1 style={{
            ...H, fontSize: isDesktop ? 52 : 38, fontWeight: 800,
            lineHeight: 1.05, letterSpacing: "-0.04em", margin: "0 0 18px",
          }}>
            <span style={{ color: WHITE }}>Why isn&apos;t your car{" "}</span>
            <span style={{ color: BRAND }}>getting calls?</span>
          </h1>

          <p style={{ ...B, fontSize: 16, color: NAVY_M, lineHeight: 1.6, margin: "0 0 32px" }}>
            Paste your listing and get a score + 3 specific fixes that help you sell faster.
          </p>

          {/* INPUT CARD */}
          <div style={{
            background: WHITE, borderRadius: 16, padding: "20px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            marginBottom: 20,
          }}>
            <input
              type="text" value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canSubmit && handleSubmit()}
              placeholder="Paste your Craigslist or Facebook listing URL"
              style={{
                ...B, width: "100%", boxSizing: "border-box",
                border: `1px solid ${BORDER}`, borderRadius: 10,
                padding: "13px 16px", fontSize: 14, color: NAVY,
                background: STAGE, outline: "none", marginBottom: 10,
              }}
            />

            {error && (
              <div style={{ ...B, fontSize: 13, color: "#DC2626", background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit} disabled={!canSubmit}
              style={{
                ...H, width: "100%", padding: "15px",
                background: canSubmit ? BRAND : "#CBD5E1",
                color: WHITE, border: "none", borderRadius: 10,
                fontSize: 16, fontWeight: 700, cursor: canSubmit ? "pointer" : "default",
                letterSpacing: "-0.01em",
                boxShadow: canSubmit ? "0 4px 20px rgba(37,99,235,0.4)" : "none",
                transition: "all 0.2s", marginBottom: 14,
              }}
            >
              Analyze My Listing Free →
            </button>

            {/* Trust row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              {["No signup", "Takes 60 seconds", "100% free"].map(t => (
                <span key={t} style={{ ...B, fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span> {t}
                </span>
              ))}
            </div>

            {/* Photo upload toggle */}
            <div style={{ marginTop: 12, borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
              {!showPhotoUpload ? (
                <button onClick={() => setShowPhotoUpload(true)} style={{
                  ...B, background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: NAVY_M, width: "100%", textAlign: "center",
                }}>
                  📸 Have photos? <span style={{ color: BRAND, fontWeight: 600 }}>Add them for a deeper analysis →</span>
                </button>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? BRAND : images.length > 0 ? "#86EFAC" : BORDER}`,
                    borderRadius: 10, padding: images.length > 0 ? "12px 14px" : "18px 14px",
                    textAlign: "center", cursor: "pointer",
                    background: dragging ? "#EFF6FF" : images.length > 0 ? "#F0FDF4" : STAGE,
                    transition: "all 0.2s",
                  }}
                >
                  {images.length === 0 ? (
                    <div>
                      <p style={{ ...B, fontSize: 13, fontWeight: 600, color: NAVY, margin: "0 0 3px" }}>📸 Add listing photos</p>
                      <p style={{ ...B, fontSize: 11, color: NAVY_M, margin: 0 }}>
                        Drag & drop · <span style={{ color: BRAND, fontWeight: 600 }}>browse</span> · Ctrl+V
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ ...B, fontSize: 12, fontWeight: 700, color: "#15803D", margin: "0 0 8px" }}>
                        ✓ {images.length} photo{images.length > 1 ? "s" : ""} added
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                        {images.map((src, i) => (
                          <div key={i} style={{ position: "relative", borderRadius: 6, overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${BORDER}` }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <button onClick={e => { e.stopPropagation(); setImages(p => p.filter((_, j) => j !== i)); }} style={{
                              position: "absolute", top: 3, right: 3, width: 18, height: 18,
                              background: "rgba(0,0,0,0.6)", color: WHITE, border: "none",
                              borderRadius: "50%", fontSize: 10, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>×</button>
                          </div>
                        ))}
                        {images.length < MAX_IMAGES && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `2px dashed ${BORDER}`, aspectRatio: "16/9", color: NAVY_M, fontSize: 18 }}>+</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && addFiles(e.target.files)} style={{ display: "none" }} />
            </div>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex" }}>
              {["#94A3B8", "#64748B", "#475569"].map((c, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: "50%", background: c,
                  border: "2px solid #1E293B", marginLeft: i > 0 ? -8 : 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11,
                }}>👤</div>
              ))}
            </div>
            <div>
              <p style={{ ...H, fontSize: 13, fontWeight: 700, color: WHITE, margin: 0 }}>247+ listings analyzed this month</p>
              <p style={{ ...B, fontSize: 12, color: NAVY_M, margin: 0 }}>Join sellers getting more calls</p>
            </div>
          </div>
        </div>

        {/* RIGHT: Before/After mockup */}
        <BeforeAfterMockup isDesktop={isDesktop} />
      </div>

      {/* BOTTOM FEATURE BAR */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isDesktop ? "0 60px 60px" : "0 24px 40px" }}>
        <div style={{
          background: WHITE, borderRadius: 16,
          padding: "24px 32px",
          display: "grid",
          gridTemplateColumns: isDesktop ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
          gap: isDesktop ? 0 : 20,
        }}>
          {[
            { icon: "📷", title: "Photos", desc: "We analyze your photos and find what's missing or hurting trust." },
            { icon: "📄", title: "Description", desc: "We find confusing, weak, or missing details buyers care about." },
            { icon: "💲", title: "Price & Positioning", desc: "We check if your price matches the market and your car's value." },
            { icon: "🛡️", title: "Buyer Trust", desc: "We look for signals that build (or break) buyer confidence." },
          ].map((f, i) => (
            <div key={f.title} style={{
              display: "flex", flexDirection: "column", gap: 8,
              paddingLeft: isDesktop && i > 0 ? 28 : 0,
              borderLeft: isDesktop && i > 0 ? `1px solid ${BORDER}` : "none",
            }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <p style={{ ...H, fontSize: 14, fontWeight: 700, color: NAVY, margin: 0 }}>{f.title}</p>
              <p style={{ ...B, fontSize: 13, color: NAVY_M, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
