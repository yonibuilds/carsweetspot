import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Bump on any prompt or post-processing change to invalidate in-memory cache
const CACHE_VERSION = "v20";
const cache = new Map<string, unknown>();

// ────────────────────────────────────────────────────────────────────────────
// Stage 2 Prompt — Fact Extraction + Classification (Sonnet, no copy writing)
// ────────────────────────────────────────────────────────────────────────────
// Deliberately separated from copy writing so the AI cannot confuse
// "what the seller said" with "what can safely go in buyer-facing copy."
const EXTRACTION_PROMPT = `You are a structured fact extractor for private car sale listings. Your only job is to read the listing text and classify every claim into the correct bucket. Do not write any copy. Do not summarize the listing. Only classify.

Return ONLY valid JSON. No markdown, no explanation, no extra text.

{
  "structured_facts": [
    "Facts from structured fields and metadata: year, make, model, trim, price, mileage, photo count, location",
    "Example: '2018 Ford F-150 XLT', '$24,500', '87,000 miles', 'Dallas TX', '14 photos'"
  ],
  "explicit_listing_facts": [
    "Specific, concrete facts explicitly stated in the description text — not condition claims",
    "Example: 'backup camera', 'new tires installed March 2024', 'clean title in hand', 'tow package', 'lien-free', 'two previous owners', 'timing belt replaced at 90k miles', 'passed emissions test', 'CARFAX available'",
    "Title type (clean/rebuilt/salvage) stated by seller → include here",
    "Specific maintenance events with dates or details → include here",
    "Features and equipment → include here"
  ],
  "seller_claims": [
    "Claims the seller makes that cannot be independently verified — prefix each with 'Seller states:'",
    "Example: 'Seller states: no accidents', 'Seller states: well maintained', 'Seller states: garage kept', 'Seller states: highway miles only', 'Seller states: runs great', 'Seller states: one owner'",
    "Condition claims without documentation → seller_claims",
    "'No accidents' with no CARFAX → seller_claims",
    "'One owner' with no title/CARFAX evidence → seller_claims"
  ],
  "missing_signals": [
    "Important signals absent from the listing that buyers typically want to know",
    "Example: 'No ownership duration stated', 'Reason for sale not mentioned', 'CARFAX not mentioned', 'Service history not mentioned', 'Title status not mentioned'"
  ],
  "forbidden_or_unverified_claims": [
    "Phrases from the listing that must NEVER be copied verbatim into buyer-facing copy — bare assertions without evidence",
    "Example: 'no accidents', 'highway miles', 'garage kept', 'runs great', 'well maintained', 'like new', 'clean interior', 'no issues', 'perfect condition', 'one owner' (if unverified)"
  ]
}

Classification rules — apply strictly:

CONDITION CLAIMS (always seller_claims + forbidden_or_unverified_claims):
- "no accidents" → both buckets (seller asserts, cannot verify without CARFAX/documentation)
- "highway miles" → both buckets
- "garage kept" → both buckets
- "well maintained", "meticulously maintained", "babied" → both buckets
- "runs great", "drives well", "runs and drives great" → both buckets
- "no mechanical issues", "no problems", "no issues" → both buckets
- "like new", "perfect condition", "spotless", "immaculate" → both buckets
- "clean interior", "clean inside" → both buckets

TITLE TYPE:
- Craigslist metadata "title status: clean" → explicit_listing_facts as "Clean title stated in listing metadata" — do NOT upgrade to "clean title in hand"
- Seller writes "clean title" in description → explicit_listing_facts as "Clean title stated by seller"
- Seller writes "title in hand" → explicit_listing_facts as "Title in hand — stated by seller"
- Seller writes "lien-free" → explicit_listing_facts as "Lien-free — stated by seller"
- "rebuilt title" / "salvage title" from metadata or description → explicit_listing_facts
- NEVER write "title in hand" in explicit_listing_facts unless the seller explicitly used those words

OWNERSHIP:
- "one owner" with no CARFAX/title evidence → seller_claims + forbidden_or_unverified_claims
- "two owners per title" → explicit_listing_facts (title is documentation)
- "I bought it new in 2019" → explicit_listing_facts (specific and verifiable)

SERVICE / MAINTENANCE:
- "service records available" (no documentation shown) → seller_claims
- "timing belt replaced at 90k miles" (specific) → explicit_listing_facts
- "new tires in March 2024" (specific with date) → explicit_listing_facts
- "new tires" (no date/receipt) → seller_claims

CARFAX:
- "CARFAX available" / "CARFAX report provided" → explicit_listing_facts
- No mention of CARFAX → missing_signals

When in doubt, use seller_claims, not explicit_listing_facts. Conservative classification protects buyers. The copy writer who receives this inventory will ONLY assert items from structured_facts and explicit_listing_facts. Items in seller_claims will be attributed as "Seller states X." Items in forbidden_or_unverified_claims will not appear at all. This is the safety boundary — be conservative.`;

// ────────────────────────────────────────────────────────────────────────────
// V4 — Question Catalog (fixed, AI selects 3 IDs)
// ────────────────────────────────────────────────────────────────────────────
const QUESTION_CATALOG = [
  { id: "records_receipts",   question: "Do you have service records or receipts?",         options: ["Yes, all available", "Some receipts", "No records"] },
  { id: "title_in_hand",      question: "Is the title physically in hand?",                  options: ["Yes, title in hand", "Not yet", "Not sure"] },
  { id: "known_issues",       question: "Any known mechanical issues?",                      options: ["None", "Minor issues", "Yes — willing to describe"] },
  { id: "reason_for_sale",    question: "Why are you selling?",                              options: ["No longer need it", "Upgrading to newer vehicle", "Moving or lifestyle change"] },
  { id: "accident_history",   question: "Has this vehicle been in an accident?",             options: ["No accidents", "Minor — fully repaired", "Not sure — can provide CARFAX"] },
  { id: "ownership_duration", question: "How long have you owned it?",                       options: ["Less than a year", "1–3 years", "3+ years"] },
  { id: "recent_maintenance", question: "Any major maintenance in the last 12 months?",     options: ["Regular upkeep only", "Major work done", "Nothing recent"] },
  { id: "drivetrain_confirm", question: "Is this vehicle FWD or AWD?",                       options: ["Front-wheel drive (FWD)", "All-wheel drive (AWD)", "Need to check"] },
  { id: "title_type_confirm", question: "Is the title clean, rebuilt, or salvage?",         options: ["Clean title", "Rebuilt title", "Salvage title"] },
  { id: "mileage_context",    question: "How were most of these miles accumulated?",        options: ["Mostly highway", "Mix of highway and city", "Mostly city driving"] },
] as const;
type QuestionId = typeof QUESTION_CATALOG[number]["id"];

// ────────────────────────────────────────────────────────────────────────────
// Stage 3 Prompt — Analysis only, V4 (no copy writing)
// ────────────────────────────────────────────────────────────────────────────
const WRITER_PROMPT = `You are CarSweetSpot AI — an expert analyzer of private car sale listings.

Your job is ANALYSIS ONLY. Do NOT write listing copy. Do NOT rewrite the listing. Do NOT suggest paste-ready sentences.

IMPORTANT: Analyze regardless of language. Never flag listing language as a problem.

## Fact Inventory

You receive a classified fact inventory from Stage 2. Use it for analysis only.

- structured_facts: verified metadata (year, make, model, price, mileage, photos, location)
- explicit_listing_facts: specific facts seller stated (service dates, clean title, CARFAX, features)
- seller_claims: unverified claims ("runs great", "well maintained", "no accidents")
- missing_signals: information absent that buyers typically want
- forbidden_or_unverified_claims: phrases that undermine trust

## Question Selection

Select exactly 3 question IDs from this catalog based on this listing's biggest trust gaps.

Available IDs and their triggers:
- "records_receipts" → service work mentioned but no dates, receipts, or shop names
- "title_in_hand" → title status unclear, or seller has not confirmed title is in hand
- "known_issues" → mechanical condition not addressed, high mileage, or trust gap
- "reason_for_sale" → reason for selling not mentioned
- "accident_history" → no accident history and no CARFAX mentioned
- "ownership_duration" → ownership duration not stated
- "recent_maintenance" → maintenance claimed but no specifics
- "drivetrain_confirm" → ONLY if metadata and description disagree on drivetrain
- "title_type_confirm" → ONLY if title type is unclear or rebuilt/salvage is mentioned
- "mileage_context" → high mileage (>120k miles or >15k miles/year)

Rules:
- Never select a question about something already confirmed in explicit_listing_facts
- If drivetrain contradiction exists → drivetrain_confirm must be one of the 3
- Prioritize questions whose answers would most change buyer trust

## Output structure

Return ONLY valid JSON. No markdown. No extra text.

{
  "vehicle": "<Year Make Model Trim>",
  "asking_price": <number in USD, 0 if not found. Convert: "10K"→10000, "$15k"→15000, "15,000"→15000>,
  "overall_score": <0-100>,
  "monthly_payment": <asking_price at 7% APR 60 months, round to nearest dollar, 0 if no price>,
  "biggest_problem": {
    "title": "<seller-friendly, max 8 words>",
    "why_buyers_care": "<1-2 sentences, benchmark language not emotional>",
    "seller_insight": "<1 sentence, specific and actionable>",
    "category": "<trust | text | photos>"
  },
  "also_hurting": [
    { "title": "...", "why_buyers_care": "...", "seller_insight": "...", "category": "..." },
    { "title": "...", "why_buyers_care": "...", "seller_insight": "...", "category": "..." }
  ],
  "whats_working": ["<specific strength from fact inventory only>"],
  "contradictions": ["<metadata vs description mismatch — empty array if none>"],
  "confirmation_question_ids": ["<id1>", "<id2>", "<id3>"]
}

## Scoring Calibration

Score based on what is actually present — do not inflate for what might be true.

- 45–60 (Poor): Missing most trust signals. No ownership, no reason for selling, no CARFAX, thin description (<50 words), few photos.
- 60–75 (Average): Some trust signals present but key gaps remain. Mainly claims with little evidence. Strong signals but <60 words scores 68–74.
- 75–85 (Strong): Multiple confirmed trust signals. Clean title, ownership stated, 8+ photos, 100+ words, evidence-based maintenance.
- 85–92 (Very Strong): Most trust signals present. Ownership, reason for selling, CARFAX or confirmed title, evidence-based maintenance, strong photos.
- 92+ (Exceptional): Near-perfect — verified service history, odometer photo, all key angles, complete description, CARFAX, honest flaws.

Score differentiation required. Scores 60–75 should span the range — 62, 65, 68, 71, 74 are all valid.

## Scoring Dimensions (9-factor model)

1. Photo coverage (20 pts): 0–3=0–4 | 4–7=5–6 | 8–11=7–8 | 12–16=9 | 17+=10 pts. Trust parser count.
2. Service proof specificity (18 pts): receipts/dates/shops=15–18 | claims only=6–9 | nothing=0–5
3. Stacked trust signals (17 pts): clean title+3, no accidents+3, CARFAX+3, lien-free+2, emissions+2, registration+2, VIN+2. Claims only=half value. Cap 17.
4. Title clarity (13 pts): clean+in hand+lien-free=11–13 | clean stated=7–9 | not mentioned=3–5 | rebuilt with explanation=8–10 | rebuilt without=2–4
5. Ownership/reason/seller context (12 pts): ownership duration+4, reason for sale+4, owner count+2, seller credibility+2
6. Writing cleanliness (8 pts): clear/readable=7–8 | minor errors=4–6 | all-caps/spam/errors=1–3
7. Known-issues transparency (6 pts): proactive disclosure=5–6 | no issues mentioned=4 | implied problems=0–2
8. Price justification (4 pts): rebuilt/high-mileage with explanation=3–4 | unexplained=2 | high with no support=0–1
9. Bonus signals (up to +2): odometer photo, records photo, PPI offered, honest flaw photographed

## Score caps (enforced by post-processing)

- Rebuilt/salvage WITHOUT receipts/shop/inspection: HARD CAP 58
- High mileage (>20k/year) WITHOUT service or usage explanation: HARD CAP 65
- Both: HARD CAP 55

## Rules

- biggest_problem: most damaging fixable issue. NEVER use title status as a problem.
- also_hurting: exactly 2, each a DIFFERENT category from biggest_problem and from each other
- category: trust | text | photos — all three must be different across the three issue cards
- whats_working: genuine strengths from fact inventory only. If fewer than 3 exist, return only what's real. For location: "Specific location provided — helps buyers decide if it's worth the trip." Do not list legally required items (emissions tests, smog checks) as strengths.
- contradictions: detect metadata vs description mismatches on drivetrain, title type, mileage
- monthly_payment formula: (p * r * (1+r)^n) / ((1+r)^n - 1) where r=0.07/12, n=60
- Issue titles: seller-friendly and action-oriented. Use "Fix X before buyers hesitate" style. No dramatic language like "destroys buyer trust", "kills credibility", "red flag".
- Short description: if under 50 words and flagged as text issue, title must include word count ("Description is 24 words — buyers need more")
- Keyword spam: 3+ competitor brand names consecutively → flag under "text"
- Phone numbers as words (e.g. "48Zer. 78Eight") are Craigslist anti-spam — NEVER flag
- Rebuilt/salvage: never penalize for disclosure. Problem is missing explanation, repairs, inspection.
- Mileage per year: if [MILEAGE RATE] note provided, flag >20k/year with benchmark language
- Emoji overuse: 6+ emoji → flag under "text"
- seller_insight: specific and actionable. Use benchmark language, not emotional language.`;

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
type FactInventory = {
  structured_facts: string[];
  explicit_listing_facts: string[];
  seller_claims: string[];
  missing_signals: string[];
  forbidden_or_unverified_claims: string[];
};

// ────────────────────────────────────────────────────────────────────────────
// POST handler
// ────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { url, images, text } = await req.json();

    const cacheKey = url ? `${CACHE_VERSION}:${url}` : null;
    if (cacheKey && cache.has(cacheKey)) {
      return NextResponse.json(cache.get(cacheKey));
    }

    // ── Stage 1: Deterministic parser ────────────────────────────────────────
    let firstImgSrc: string | null = null;
    let detectedPrice: number | null = null;
    let mileageRateNote = "";
    let parserPhotoCount = 0;
    let descriptionWordCount = 0;
    let rawDescription = "";     // postingbody text for Stage 2 extraction
    let cleanedHtml = "";        // full cleaned listing text for Stage 3 writer
    let formattingNote = "";
    let photoNote = "";
    let priceNote = "";

    const imageContent: Anthropic.MessageParam["content"] = [];
    if (images && images.length > 0) {
      for (const img of images as string[]) {
        const mediaTypeMatch = img.match(/^data:(image\/\w+);base64,/);
        const mediaType = (mediaTypeMatch?.[1] || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        const base64Data = img.replace(/^data:image\/\w+;base64,/, "");
        imageContent.push({ type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } });
      }
    }

    if (url) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
          },
          signal: AbortSignal.timeout(8000),
        });
        const html = await res.text();

        if (
          /this posting has been deleted|this posting has expired|no longer available|posting has been flagged/i.test(html) ||
          res.status === 404
        ) {
          return NextResponse.json(
            { error: "This listing has been deleted or expired. Please try a different listing URL." },
            { status: 400 }
          );
        }

        // Image collection
        const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
          ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
          ?? null;

        const isListingImage = (src: string) =>
          /^https?:\/\//i.test(src) && /\.(jpg|jpeg|png|webp)/i.test(src) &&
          !/logo|icon|avatar|sprite|pixel|tracking|blank/i.test(src) && !/1x1|spacer/i.test(src);

        const rawImgs: string[] = [];
        const rawSeen = new Set<string>();
        const collectImg = (src: string) => {
          if (isListingImage(src) && !rawSeen.has(src)) { rawSeen.add(src); rawImgs.push(src); }
        };

        if (ogImg) collectImg(ogImg);
        for (const blob of html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || []) {
          for (const m of blob.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi) || []) {
            collectImg(m.replace(/^"|"$/g, ""));
          }
        }
        for (const tag of html.match(/<img[^>]+>/gi) || []) {
          const src = tag.match(/\bsrc="([^"]+)"/i)?.[1]
            ?? tag.match(/\bdata-src="([^"]+)"/i)?.[1]
            ?? tag.match(/\bsrcset="([^"]+)"/i)?.[1]?.split(/[\s,]+/)[0]
            ?? null;
          if (src) collectImg(src);
        }
        for (const m of html.match(/\bhref="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi) || []) {
          const src = m.match(/href="([^"]+)"/i)?.[1] ?? null;
          if (src) collectImg(src);
        }

        const upgradedSeen = new Set<string>();
        const upgradedImgs: string[] = [];
        for (const src of rawImgs) {
          const upgraded = src.replace(/_\d+x\d+c(\.\w+)$/, "_600x450$1");
          if (!upgradedSeen.has(upgraded)) { upgradedSeen.add(upgraded); upgradedImgs.push(upgraded); }
        }

        parserPhotoCount = upgradedImgs.length;
        firstImgSrc = upgradedImgs[0] ?? null;

        // Formatting detection
        const withBreaks = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ");
        const paragraphs = withBreaks.split("\n").map(s => s.trim()).filter(s => s.length > 30);
        const longestPara = paragraphs.length > 0 ? Math.max(...paragraphs.map(p => p.length)) : 0;
        const isWallOfText = longestPara > 500 && paragraphs.length < 3;
        formattingNote = !isWallOfText
          ? `\n\n[FORMATTING: listing uses paragraph breaks — do NOT flag formatting as a problem.]`
          : `\n\n[FORMATTING: wall of text detected — ${longestPara} characters in one block with no paragraph breaks. Flag this under opportunities with type "formatting".]`;

        cleanedHtml = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 12000);

        // Extract description body for Stage 2 (more focused than full HTML)
        const bodyMatch = html.match(/<section[^>]+id=["']postingbody["'][^>]*>([\s\S]*?)<\/section>/i)
          ?? html.match(/<div[^>]+id=["']postingbody["'][^>]*>([\s\S]*?)<\/div>/i);
        if (bodyMatch) {
          const bodyText = bodyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          descriptionWordCount = bodyText.split(/\s+/).filter(Boolean).length;
          rawDescription = bodyText.slice(0, 4000);
        }

        // Price detection
        const allPrices = [...cleanedHtml.matchAll(/\$\s*([\d,]+)/g)]
          .map(m => parseInt(m[1].replace(/,/g, ""), 10))
          .filter(n => !isNaN(n) && n >= 1000 && n <= 300000);
        if (allPrices.length > 0) detectedPrice = allPrices[0];

        photoNote = parserPhotoCount > 0
          ? `\n\n[PHOTO COUNT DETECTED FROM HTML: ${parserPhotoCount} listing photos found. Trust this count — do NOT flag photos as missing or low-count.]`
          : `\n\n[PHOTO COUNT: Could not detect photos from HTML — evaluate based on description only.]`;
        priceNote = detectedPrice
          ? `\n\n[PRICE DETECTED FROM HTML: $${detectedPrice.toLocaleString()} — set asking_price to ${detectedPrice}]`
          : "";

        // Mileage rate
        const detectedMileage = [...cleanedHtml.matchAll(/(\d[\d,]+)\s*(?:miles?|mi\b)/gi)]
          .map(m => parseInt(m[1].replace(/,/g, ""), 10))
          .filter(n => !isNaN(n) && n >= 1000 && n <= 500000)[0] ?? null;
        const detectedYearMatch = cleanedHtml.match(/\b(19[89]\d|20[012]\d)\b/);
        const detectedYear = detectedYearMatch ? parseInt(detectedYearMatch[1], 10) : null;
        if (detectedMileage && detectedYear) {
          const yearsOld = new Date().getFullYear() - detectedYear;
          if (yearsOld > 0) {
            const milesPerYear = Math.round(detectedMileage / yearsOld);
            const rateLabel = milesPerYear > 30000 ? "EXTREME usage (>30k/yr)" : milesPerYear > 20000 ? "HIGH usage (>20k/yr)" : milesPerYear > 15000 ? "above average" : "normal";
            mileageRateNote = `\n\n[MILEAGE RATE: ${milesPerYear.toLocaleString()} miles/year (${detectedMileage.toLocaleString()} miles ÷ ${yearsOld} years = ${rateLabel}). Apply mileage per year rule if above 20k.]`;
          }
        }
      } catch {
        return NextResponse.json(
          { error: "Could not fetch this URL. Facebook listings require login — try the Screenshots tab instead." },
          { status: 400 }
        );
      }
    }

    if (text) {
      rawDescription = text.slice(0, 4000);
      cleanedHtml = text;
    }

    if (!cleanedHtml && imageContent.length === 0) {
      return NextResponse.json({ error: "Please provide a URL, screenshots, or listing text." }, { status: 400 });
    }

    // ── Stage 2: Fact extraction + classification (Sonnet) ───────────────────
    // Fail closed — no fallback to unsafe single-call behavior.
    let factInventory: FactInventory;
    try {
      const extractionInput = rawDescription
        ? `Listing description (primary source):\n${rawDescription}\n\nFull listing text (for context only — description above takes priority):\n${cleanedHtml.slice(0, 5000)}`
        : `Full listing text:\n${cleanedHtml.slice(0, 6000)}`;

      const extractionResp = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        temperature: 0,
        system: [{ type: "text", text: EXTRACTION_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: extractionInput }],
      });

      const extractionText = extractionResp.content[0].type === "text" ? extractionResp.content[0].text : "";
      const extractionJson = extractionText.match(/\{[\s\S]*\}/);
      if (!extractionJson) {
        return NextResponse.json(
          { error: "Could not safely analyze this listing. Please try again or paste the listing text." },
          { status: 500 }
        );
      }

      const parsed = JSON.parse(extractionJson[0]) as Partial<FactInventory>;
      // Validate required buckets exist
      if (!Array.isArray(parsed.structured_facts) || !Array.isArray(parsed.explicit_listing_facts) || !Array.isArray(parsed.seller_claims)) {
        return NextResponse.json(
          { error: "Could not safely analyze this listing. Please try again or paste the listing text." },
          { status: 500 }
        );
      }
      factInventory = {
        structured_facts: parsed.structured_facts ?? [],
        explicit_listing_facts: parsed.explicit_listing_facts ?? [],
        seller_claims: parsed.seller_claims ?? [],
        missing_signals: parsed.missing_signals ?? [],
        forbidden_or_unverified_claims: parsed.forbidden_or_unverified_claims ?? [],
      };
    } catch {
      return NextResponse.json(
        { error: "Could not safely analyze this listing. Please try again or paste the listing text." },
        { status: 500 }
      );
    }

    // ── Stage 3: Analysis only (Haiku) ───────────────────────────────────────
    const factBlock = `## Classified Fact Inventory

structured_facts:
${factInventory.structured_facts.map(f => `- ${f}`).join("\n") || "- (none detected)"}

explicit_listing_facts:
${factInventory.explicit_listing_facts.map(f => `- ${f}`).join("\n") || "- (none detected)"}

seller_claims (unverified):
${factInventory.seller_claims.map(f => `- ${f}`).join("\n") || "- (none)"}

missing_signals:
${factInventory.missing_signals.map(f => `- ${f}`).join("\n") || "- (none)"}`;

    const writerContent: Anthropic.MessageParam["content"] = [...imageContent];
    const wordCountNote = descriptionWordCount > 0
      ? `\n\n[DESCRIPTION WORD COUNT: ${descriptionWordCount} words — use this exact number in any word count reference. Do not re-count words yourself.]`
      : "";

    const listingText = url
      ? `Listing URL: ${url}\n\n${factBlock}\n\nFull listing content (for context — fact inventory above is authoritative):\n${cleanedHtml}${photoNote}${formattingNote}${priceNote}${mileageRateNote}${wordCountNote}`
      : `${factBlock}\n\nListing text (for context):\n${cleanedHtml}${wordCountNote}`;

    writerContent.push({ type: "text", text: listingText });
    writerContent.push({ type: "text", text: "Analyze this listing and return the JSON assessment with confirmation_question_ids." });

    const writerResp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3400,
      temperature: 0,
      system: [{ type: "text", text: WRITER_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: writerContent }],
    });

    const rawText = writerResp.content[0].type === "text" ? writerResp.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not safely analyze this listing. Please try again or paste the listing text." },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = JSON.parse(jsonMatch[0]);

    // ── Post-processing (V4) ─────────────────────────────────────────────────
    const allFacts = [
      ...factInventory.structured_facts,
      ...factInventory.explicit_listing_facts,
    ].map(f => f.toLowerCase());

    // Contradiction validator: suppress issues that contradict known facts
    const hasOwnershipDuration = allFacts.some(f => /owned.*\d|\d.*year.*own|\d.*month.*own|ownership.*duration|bought.*\d{4}|since.*\d{4}/.test(f));
    const hasReasonForSale = allFacts.some(f => /reason.*sell|selling.*because|downsize|upgrad|relocat|moving|retire/.test(f));
    const isValidIssue = (issue: { title?: string; category?: string } | null | undefined): boolean => {
      if (!issue) return false;
      const t = (issue.title ?? "").toLowerCase();
      if (hasOwnershipDuration && /ownership|how long|duration/.test(t)) return false;
      if (hasReasonForSale && /reason.*sell|why.*sell/.test(t)) return false;
      if (parserPhotoCount >= 8 && issue.category === "photos") return false;
      return true;
    };
    if (!isValidIssue(result.biggest_problem)) {
      const next = (result.also_hurting ?? []).find(isValidIssue);
      result.biggest_problem = next ?? null;
      result.also_hurting = (result.also_hurting ?? []).filter((i: unknown) => i !== next);
    }
    result.also_hurting = (result.also_hurting ?? []).filter(isValidIssue);

    // Category uniqueness across the top 3 issue slots
    {
      const usedCats = new Set<string>();
      if (result.biggest_problem?.category) usedCats.add(result.biggest_problem.category);
      const keptAlso: typeof result.also_hurting = [];
      for (const issue of result.also_hurting ?? []) {
        if (!usedCats.has(issue.category)) { usedCats.add(issue.category); keptAlso.push(issue); }
      }
      result.also_hurting = keptAlso;
    }

    // Score caps
    const hasRebuiltTitle = allFacts.some(f => /rebuilt|salvage/.test(f));
    const hasRebuiltExplanation = allFacts.some(f =>
      /receipt|shop\s+name|inspection\s+report|certified\s+repair|bodyshop|body\s+shop|damage\s+report|insurance\s+claim|carfax\s+shows\s+repair/.test(f)
    );
    const isMileageHigh = mileageRateNote.includes("HIGH usage") || mileageRateNote.includes("EXTREME usage");
    const hasServiceExplanation = allFacts.some(f => /service|maintenance|oil|timing|record|inspect|commute|fleet/.test(f));
    let scoreCap = 100;
    if (hasRebuiltTitle && !hasRebuiltExplanation) scoreCap = Math.min(scoreCap, 58);
    if (isMileageHigh && !hasServiceExplanation) scoreCap = Math.min(scoreCap, 65);
    if (hasRebuiltTitle && !hasRebuiltExplanation && isMileageHigh && !hasServiceExplanation) scoreCap = Math.min(scoreCap, 55);
    if (result.overall_score > scoreCap) result.overall_score = scoreCap;

    // Price + monthly payment
    if (!result.asking_price && detectedPrice) result.asking_price = detectedPrice;
    if (result.asking_price) {
      const p = result.asking_price;
      const r = 0.07 / 12, n = 60;
      result.monthly_payment = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    }

    // Expand confirmation_question_ids → full question objects
    {
      const ids: QuestionId[] = (result.confirmation_question_ids ?? []).slice(0, 3);
      result.confirmation_questions = ids
        .map(id => QUESTION_CATALOG.find(q => q.id === id))
        .filter(Boolean);
      delete result.confirmation_question_ids;
    }

    // Listing length fallback
    if (descriptionWordCount > 0 && descriptionWordCount < 60) {
      const hasTextIssue = [result.biggest_problem, ...(result.also_hurting ?? [])].some(
        (i: { category?: string } | null) => i?.category === "text"
      );
      if (!hasTextIssue) {
        result.description_length_warning = `Your listing is only ${descriptionWordCount} words — buyers want more context. Strong listings include 100–200 words covering condition, history, and reason for selling.`;
      }
    }

    // Attach fact inventory + parser data to result
    result.structured_facts = factInventory.structured_facts;
    result.explicit_listing_facts = factInventory.explicit_listing_facts;
    result.seller_claims = factInventory.seller_claims;
    result.photo_count = parserPhotoCount;
    if (descriptionWordCount > 0) result.description_word_count = descriptionWordCount;
    if (firstImgSrc) result.listing_image = firstImgSrc;
    if (!result.listing_image && images && images.length > 0) result.listing_image = images[0];

    if (cacheKey) cache.set(cacheKey, result);
    return NextResponse.json(result);

  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Error: ${msg}` }, { status: 500 });
  }
}
