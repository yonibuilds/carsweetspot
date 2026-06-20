"use client";

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from "react";
import Flow, { AnalysisResult } from "./components/Flow";

const NAVY    = "#0F172A";
const NAVY_M  = "#64748B";
const BRAND   = "#2563EB";
const BRAND_DK = "#1D4ED8";
const STAGE   = "#F8FAFC";
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
  return (
    <div style={{ minHeight: "100vh", background: NAVY, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <p style={{ ...B, fontSize: 11, fontWeight: 700, color: NAVY_M, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 36 }}>Analyzing your listing</p>
      <div style={{ position: "relative", width: size, height: size, marginBottom: 28 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BRAND} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circ * (score/100)} ${circ}`} style={{ transition: "stroke-dasharray 0.1s linear" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ ...H, fontSize: 44, fontWeight: 800, color: WHITE, lineHeight: 1, letterSpacing: "-0.04em" }}>{score}</span>
          <span style={{ ...B, fontSize: 11, color: NAVY_M, marginTop: 6 }}>scoring…</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, ...B, fontSize: 13, color: NAVY_M }}>
        <svg style={{ animation: "spin 1s linear infinite", width: 14, height: 14 }} fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Reading your listing…
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Car SVG placeholder ───────────────────────────────────────────
function CarPlaceholder() {
  return (
    <div style={{ width: "100%", height: 130, background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="100" height="50" viewBox="0 0 100 50" fill="none">
        <rect x="10" y="26" width="80" height="16" rx="4" fill="#1E293B"/>
        <rect x="20" y="12" width="54" height="18" rx="4" fill="#334155"/>
        <circle cx="26" cy="42" r="7" fill="#0F172A" stroke="#475569" strokeWidth="2"/>
        <circle cx="74" cy="42" r="7" fill="#0F172A" stroke="#475569" strokeWidth="2"/>
        <rect x="22" y="14" width="22" height="12" rx="2" fill="#475569" opacity="0.6"/>
        <rect x="56" y="14" width="16" height="12" rx="2" fill="#475569" opacity="0.6"/>
      </svg>
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
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.history.replaceState({ home: true }, "");
    const onPop = () => { setResult(null); setLoading(false); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
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
    <div style={{ minHeight: "100vh", background: NAVY, overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, background: NAVY,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 60px", height: 58,
      }}>
        <span style={{ ...H, fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>
          <span style={{ color: WHITE }}>Car</span><span style={{ color: BRAND }}>SweetSpot</span>
        </span>
        <span style={{ ...B, fontSize: 13, color: NAVY_M }}>No signup. Free to try.</span>
      </nav>

      {/* ── HERO ── */}
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "72px 60px 0", display: "grid", gridTemplateColumns: "42% 58%", gap: 0, alignItems: "center", minHeight: "calc(100vh - 58px - 120px)" }}>

        {/* LEFT — 42% */}
        <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Pill */}
          <div style={{
            ...B, display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(37,99,235,0.15)", color: "#93C5FD",
            border: "1px solid rgba(37,99,235,0.3)", borderRadius: 99,
            padding: "5px 14px", fontSize: 12, fontWeight: 700,
            marginBottom: 28, alignSelf: "flex-start",
          }}>
            ✦ AI-Powered · Free · Instant
          </div>

          {/* Headline */}
          <h1 style={{ ...H, fontSize: 56, fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
            <span style={{ color: WHITE }}>Why isn&apos;t your car </span>
            <span style={{ color: BRAND }}>getting calls?</span>
          </h1>

          <p style={{ ...B, fontSize: 17, color: NAVY_M, lineHeight: 1.6, margin: "0 0 36px" }}>
            Paste your listing and get a score + 3 specific fixes that help you sell faster.
          </p>

          {/* Input card */}
          <div style={{ background: WHITE, borderRadius: 18, padding: "22px", boxShadow: "0 28px 72px rgba(0,0,0,0.45)", marginBottom: 24 }}>
            <input
              type="text" value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canSubmit && handleSubmit()}
              placeholder="Paste your Craigslist or Facebook listing URL"
              style={{
                ...B, width: "100%", boxSizing: "border-box",
                border: `1.5px solid ${BORDER}`, borderRadius: 10,
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
                transition: "background 0.2s",
                marginBottom: 14,
              }}
            >
              Analyze My Listing Free →
            </button>

            {/* Trust row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
              {["No signup", "Takes 60 seconds", "100% free"].map(t => (
                <span key={t} style={{ ...B, fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span> {t}
                </span>
              ))}
            </div>

            {/* Photo upload */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
              {!showPhotoUpload ? (
                <button onClick={() => setShowPhotoUpload(true)} style={{ ...B, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: NAVY_M, width: "100%", textAlign: "center" }}>
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
                    borderRadius: 10, padding: images.length > 0 ? "12px" : "18px",
                    textAlign: "center", cursor: "pointer",
                    background: dragging ? "#EFF6FF" : images.length > 0 ? "#F0FDF4" : STAGE,
                    transition: "all 0.2s",
                  }}
                >
                  {images.length === 0 ? (
                    <p style={{ ...B, fontSize: 13, color: NAVY_M, margin: 0 }}>
                      Drag & drop · <span style={{ color: BRAND, fontWeight: 600 }}>browse</span> · Ctrl+V
                    </p>
                  ) : (
                    <div>
                      <p style={{ ...B, fontSize: 12, fontWeight: 700, color: "#15803D", margin: "0 0 8px" }}>✓ {images.length} photo{images.length > 1 ? "s" : ""} added</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                        {images.map((src, i) => (
                          <div key={i} style={{ position: "relative", borderRadius: 6, overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${BORDER}` }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <button onClick={e => { e.stopPropagation(); setImages(p => p.filter((_, j) => j !== i)); }} style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, background: "rgba(0,0,0,0.6)", color: WHITE, border: "none", borderRadius: "50%", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: ["#475569","#334155","#1E293B"][i], border: "2px solid #0F172A", marginLeft: i > 0 ? -10 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                  {["👩","👨","🧑"][i]}
                </div>
              ))}
            </div>
            <div>
              <p style={{ ...H, fontSize: 13, fontWeight: 700, color: WHITE, margin: 0 }}>247+ listings analyzed this month</p>
              <p style={{ ...B, fontSize: 12, color: NAVY_M, margin: 0 }}>Join sellers getting more calls</p>
            </div>
          </div>
        </div>

        {/* RIGHT — 58% — BEFORE / AFTER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingLeft: 40, position: "relative" }}>
          {/* Glow */}
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(ellipse, ${BRAND}18 0%, transparent 70%)`, filter: "blur(80px)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ ...B, fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: "0.12em", textAlign: "center", margin: "0 0 16px" }}>↓ REAL EXAMPLE</p>

            <div style={{ display: "flex", alignItems: "stretch", gap: 12 }}>

              {/* BEFORE card — 300px */}
              <div style={{ width: 300, background: "#1E293B", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "16px 18px 10px" }}>
                  <span style={{ ...B, fontSize: 11, fontWeight: 800, color: WHITE, background: "#EF4444", borderRadius: 5, padding: "3px 10px" }}>BEFORE</span>
                  <p style={{ ...H, fontSize: 15, fontWeight: 700, color: WHITE, margin: "12px 0 0" }}>2018 Toyota Camry SE</p>
                </div>
                <CarPlaceholder />
                <div style={{ padding: "14px 18px 18px", flex: 1 }}>
                  <p style={{ ...B, fontSize: 13, color: "#94A3B8", lineHeight: 1.6, margin: "0 0 16px", fontStyle: "italic" }}>
                    &quot;Runs great. Clean title. Call for details.&quot;
                  </p>
                  <p style={{ ...B, fontSize: 12, color: NAVY_M, margin: "0 0 6px" }}>Trust Score</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 8 }}>
                    <span style={{ ...H, fontSize: 34, fontWeight: 800, color: "#EF4444", lineHeight: 1 }}>58</span>
                    <span style={{ ...B, fontSize: 14, color: NAVY_M }}>/100</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: "58%", background: "#EF4444", borderRadius: 3 }} />
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: WHITE, fontSize: 16 }}>→</span>
                </div>
              </div>

              {/* AFTER card — 300px */}
              <div style={{ width: 300, background: "#1E293B", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "16px 18px 10px" }}>
                  <span style={{ ...B, fontSize: 11, fontWeight: 800, color: WHITE, background: "#16A34A", borderRadius: 5, padding: "3px 10px" }}>AFTER</span>
                  <p style={{ ...H, fontSize: 15, fontWeight: 700, color: WHITE, margin: "12px 0 0" }}>2018 Toyota Camry SE</p>
                </div>
                <CarPlaceholder />
                <div style={{ padding: "14px 18px 18px", flex: 1 }}>
                  <p style={{ ...B, fontSize: 13, color: "#94A3B8", lineHeight: 1.6, margin: "0 0 16px", fontStyle: "italic" }}>
                    &quot;One-owner 2018 Toyota Camry SE. Dealer maintained since new. All service records available. Clean title in hand.&quot;
                  </p>
                  <p style={{ ...B, fontSize: 12, color: NAVY_M, margin: "0 0 6px" }}>Trust Score</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 8 }}>
                    <span style={{ ...H, fontSize: 34, fontWeight: 800, color: "#16A34A", lineHeight: 1 }}>84</span>
                    <span style={{ ...B, fontSize: 14, color: NAVY_M }}>/100</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: "84%", background: "#16A34A", borderRadius: 3 }} />
                  </div>
                </div>
              </div>

              {/* +26 badge */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DK} 100%)`, borderRadius: 14, padding: "20px 16px", textAlign: "center", width: 100 }}>
                  <p style={{ ...H, fontSize: 32, fontWeight: 800, color: WHITE, margin: 0, lineHeight: 1 }}>+26</p>
                  <p style={{ ...B, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: "6px 0 0" }}>points</p>
                  <p style={{ ...B, fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "8px 0 0", lineHeight: 1.4 }}>Estimated increase in buyer trust</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM FEATURE BAR ── */}
      <div style={{ maxWidth: 1440, margin: "60px auto 60px", padding: "0 60px" }}>
        <div style={{
          maxWidth: 1050, margin: "0 auto",
          background: WHITE, borderRadius: 18, padding: "28px 40px",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        }}>
          {[
            { icon: "📷", title: "Photos", desc: "We analyze your photos and find what's missing or hurting trust." },
            { icon: "📄", title: "Description", desc: "We find confusing, weak, or missing details buyers care about." },
            { icon: "💲", title: "Price & Positioning", desc: "We check if your price matches the market and your car's value." },
            { icon: "🛡️", title: "Buyer Trust", desc: "We look for signals that build (or break) buyer confidence." },
          ].map((f, i) => (
            <div key={f.title} style={{
              display: "flex", flexDirection: "column", gap: 10,
              paddingLeft: i > 0 ? 32 : 0,
              borderLeft: i > 0 ? `1px solid ${BORDER}` : "none",
            }}>
              <span style={{ fontSize: 24 }}>{f.icon}</span>
              <p style={{ ...H, fontSize: 15, fontWeight: 700, color: NAVY, margin: 0 }}>{f.title}</p>
              <p style={{ ...B, fontSize: 13, color: NAVY_M, margin: 0, lineHeight: 1.55 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
