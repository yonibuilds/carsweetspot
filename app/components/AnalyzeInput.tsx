"use client";

import { useState, useRef, useCallback, DragEvent, ClipboardEvent, ChangeEvent } from "react";

type Mode = "url" | "screenshots";

type AnalysisResult = Record<string, unknown>;

export default function AnalyzeInput({
  onResult,
  onResultChange,
}: {
  onResult?: (result: AnalysisResult) => void;
  onResultChange?: (hasResult: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLDivElement>) => {
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        e.preventDefault();
        setMode("screenshots");
        addFiles(files);
      }
    },
    [addFiles]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (mode === "url") body.url = url;
      if (mode === "screenshots") body.images = images;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        onResult?.(data);
        onResultChange?.(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-xl bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      onPaste={handlePaste}
    >
      {/* TABS */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
        <button
          onClick={() => setMode("url")}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${
            mode === "url" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🔗 Listing URL
        </button>
        <button
          onClick={() => setMode("screenshots")}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${
            mode === "screenshots" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📸 Screenshots
        </button>
      </div>

      {/* URL MODE */}
      {mode === "url" && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Paste your listing URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://craigslist.org/... or facebook.com/marketplace/..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      )}

      {/* SCREENSHOTS MODE */}
      {mode === "screenshots" && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Upload or paste your listing screenshots
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl px-4 py-8 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-slate-400 bg-slate-50"
                : "border-gray-300 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            <div className="text-3xl mb-2">📸</div>
            <p className="text-sm font-semibold text-gray-700">Drag & drop screenshots here</p>
            <p className="text-xs text-gray-400 mt-1">
              or <span className="text-slate-700 font-semibold">click to browse</span> · or press{" "}
              <kbd className="bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs font-mono">
                Ctrl+V
              </kbd>{" "}
              to paste
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`screenshot ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl aspect-video flex items-center justify-center text-gray-400 hover:border-slate-400 hover:text-slate-600 transition-colors text-xl"
              >
                +
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || (mode === "url" ? !url : images.length === 0)}
        className="mt-5 w-full bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Analyzing your listing...
          </>
        ) : (
          "Get My Sweet Spot Score →"
        )}
      </button>
      <p className="mt-3 text-xs text-gray-400 text-center">
        Free analysis · No account required · Takes ~10 seconds
      </p>
    </div>
  );
}
