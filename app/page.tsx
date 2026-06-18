"use client";

import { useState, useRef, useCallback, DragEvent, ClipboardEvent, ChangeEvent } from "react";
import Flow, { AnalysisResult } from "./components/Flow";

const H = { fontFamily: "var(--font-jakarta)" };
const B = { fontFamily: "var(--font-inter)" };

const COLORS = {
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  accent: "#2563EB",
  bg: "#FAFAFA",
  white: "#FFFFFF",
};

type Mode = "url" | "screenshots";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).filter(f => f.type.startsWith("image/")).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setImages(prev => [...prev, e.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) { e.preventDefault(); setMode("screenshots"); addFiles(files); }
  }, [addFiles]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (mode === "url") body.url = url;
      if (mode === "screenshots") body.images = images;
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else setResult(data as AnalysisResult);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  if (result) {
    return <Flow result={result} onReset={() => { setResult(null); setUrl(""); setImages([]); }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }} onPaste={handlePaste}>

      {/* NAV */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 60,
        background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <span style={{ ...H, fontSize: 16, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>
          CarSweetSpot
        </span>
      </nav>

      {/* HERO */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{
          ...B, display: "inline-block", fontSize: 12, fontWeight: 600,
          color: COLORS.muted, letterSpacing: "0.08em", textTransform: "uppercase",
          marginBottom: 28,
        }}>
          Free · No signup needed
        </div>

        <h1 style={{
          ...H, fontSize: 48, fontWeight: 800, color: COLORS.text,
          lineHeight: 1.1, letterSpacing: "-0.04em", marginBottom: 16, maxWidth: 560,
        }}>
          Find out why your car isn&apos;t getting calls.
        </h1>

        <p style={{ ...B, fontSize: 17, color: COLORS.muted, lineHeight: 1.6, marginBottom: 48, maxWidth: 420 }}>
          Paste your listing URL. Get an instant Sweet Spot Score and a step-by-step fix plan in 10 seconds.
        </p>

        {/* INPUT CARD */}
        <div style={{
          width: "100%", maxWidth: 520,
          background: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 20,
          padding: "28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          {/* TABS */}
          <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 20 }}>
            {(["url", "screenshots"] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                ...B, flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                background: mode === m ? COLORS.white : "transparent",
                color: mode === m ? COLORS.text : COLORS.muted,
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
                {m === "url" ? "Listing URL" : "Screenshots"}
              </button>
            ))}
          </div>

          {mode === "url" && (
            <div>
              <input
                type="url" value={url} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && url && handleSubmit()}
                placeholder="https://craigslist.org/... or facebook.com/marketplace/..."
                style={{
                  ...B, width: "100%", boxSizing: "border-box",
                  border: `1px solid ${COLORS.border}`, borderRadius: 10,
                  padding: "13px 16px", fontSize: 14, color: COLORS.text,
                  background: COLORS.bg, outline: "none",
                  marginBottom: 14,
                }}
              />
            </div>
          )}

          {mode === "screenshots" && (
            <div style={{ marginBottom: 14 }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? COLORS.accent : COLORS.border}`,
                  borderRadius: 10, padding: "32px 16px", textAlign: "center",
                  cursor: "pointer", background: dragging ? "#EFF6FF" : COLORS.bg,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
                <p style={{ ...B, fontSize: 13, color: COLORS.muted, margin: 0 }}>
                  Drag & drop or <span style={{ color: COLORS.accent, fontWeight: 600 }}>click to browse</span>
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && addFiles(e.target.files)} style={{ display: "none" }} />
              {images.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 }}>
                  {images.map((src, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${COLORS.border}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button onClick={() => setImages(p => p.filter((_, j) => j !== i))} style={{
                        position: "absolute", top: 4, right: 4, width: 20, height: 20,
                        background: "rgba(0,0,0,0.6)", color: "white", border: "none",
                        borderRadius: "50%", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ ...B, fontSize: 13, color: "#DC2626", background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || (mode === "url" ? !url : images.length === 0)}
            style={{
              ...H, width: "100%", padding: "14px",
              background: loading || (mode === "url" ? !url : images.length === 0) ? "#CBD5E1" : COLORS.text,
              color: COLORS.white, border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer",
              letterSpacing: "-0.01em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.2s",
            }}
          >
            {loading ? (
              <>
                <svg style={{ animation: "spin 1s linear infinite", width: 16, height: 16 }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Analyzing your listing...
              </>
            ) : "Get My Sweet Spot Score →"}
          </button>

          <p style={{ ...B, fontSize: 12, color: COLORS.muted, textAlign: "center", marginTop: 12 }}>
            Works with Craigslist & Facebook Marketplace
          </p>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 60 }}>
          <p style={{ ...B, fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 40, textAlign: "center" }}>
            How it works
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
            {[
              { n: "01", title: "Paste your URL", desc: "Craigslist, Facebook Marketplace, or any listing." },
              { n: "02", title: "AI analyzes it", desc: "We score your listing on pricing, copy, trust, and financing." },
              { n: "03", title: "Fix step by step", desc: "Get specific before/after fixes you can copy and paste directly." },
            ].map(s => (
              <div key={s.n}>
                <div style={{ ...H, fontSize: 12, fontWeight: 700, color: "#CBD5E1", marginBottom: 10 }}>{s.n}</div>
                <div style={{ ...H, fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>{s.title}</div>
                <p style={{ ...B, fontSize: 14, color: COLORS.muted, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
