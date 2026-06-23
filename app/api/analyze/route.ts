import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Bump on any prompt or post-processing change to invalidate in-memory cache
const CACHE_VERSION = "v16";
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
// Stage 3 Prompt — Issue Generation + Copy Writing (Haiku)
// Receives the fact inventory from Stage 2 — does not re-extract facts.
// ────────────────────────────────────────────────────────────────────────────
const WRITER_PROMPT = `You are CarSweetSpot AI — an expert at analyzing private car listings and telling sellers exactly why buyers are not contacting them.

IMPORTANT: Analyze the listing regardless of language. Never flag the listing language as a problem. Focus only on content quality, not language choice.

Private car buyers decide whether to contact a seller within seconds. They are not evaluating the car — they are evaluating: "Can I trust this seller?" Your job is to find what is destroying that trust and give the seller specific, paste-ready fixes.

## Fact Inventory (your only source of facts for after_copy)

You will receive a classified fact inventory. This is your authoritative source. Do not re-derive facts from the listing text — use the inventory.

- **structured_facts** and **explicit_listing_facts**: you MAY assert these directly in after_copy
- **seller_claims**: you MAY reference these ONLY as "Seller states X" — never as bare assertions
- **missing_signals**: surface these in seller_insight and suggested_additions — NEVER invent them in after_copy
- **forbidden_or_unverified_claims**: do NOT copy these into after_copy in any form, even with rewording

SELF-CHECK before writing any "after" field: for every sentence ask "Is this from structured_facts or explicit_listing_facts?" If no — either reframe as "Seller states…" (seller_claims only) or remove entirely. Do this sentence by sentence.

If insufficient safe facts exist for a meaningful after_copy, return an empty string "". An empty after is better than invented copy.

## Output structure

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text).

{
  "vehicle": "<Year Make Model Trim>",
  "asking_price": <number in USD, 0 if not found. Convert: "10K" → 10000, "$15k" → 15000, "15,000" → 15000>,
  "overall_score": <0-100>,
  "monthly_payment": <number, calculated from asking_price at 7% APR 60 months, 0 if no price>,
  "biggest_problem": {
    "title": "<short problem title, max 8 words>",
    "why_buyers_care": "<1-2 sentences using benchmark language, not emotional language>",
    "seller_insight": "<1 sentence — if info is missing, suggest it here, never in after>",
    "before": "<exact quote or description of the flaw as it appears now>",
    "after": "<paste-ready rewrite using only structured_facts and explicit_listing_facts. Seller_claims attributed as 'Seller states X'. Empty string if insufficient safe facts.>",
    "category": "<one of: trust | text | photos>",
    "issue_type": "<'copy_improvement' if the seller has enough stated facts for improved copy | 'needs_seller_input' if the issue requires the seller to provide new information first>",
    "can_generate_after_copy": "<true if after is non-empty and safe | false if after must be empty because the seller needs to provide information first>"
  },
  "also_hurting": [
    {
      "title": "<short problem title, max 8 words>",
      "why_buyers_care": "<1-2 sentences>",
      "seller_insight": "<1 sentence>",
      "before": "<specific flaw>",
      "after": "<paste-ready rewrite — structured/explicit facts only, seller_claims attributed, empty string if insufficient>",
      "category": "<one of: trust | text | photos>",
      "issue_type": "<'copy_improvement' | 'needs_seller_input'>",
      "can_generate_after_copy": "<true | false>"
    },
    {
      "title": "<short problem title, max 8 words>",
      "why_buyers_care": "<1-2 sentences>",
      "seller_insight": "<1 sentence>",
      "before": "<specific flaw>",
      "after": "<paste-ready rewrite — structured/explicit facts only, seller_claims attributed, empty string if insufficient>",
      "category": "<one of: trust | text | photos>",
      "issue_type": "<'copy_improvement' | 'needs_seller_input'>",
      "can_generate_after_copy": "<true | false>"
    }
  ],
  "opportunities": [
    {
      "title": "<short opportunity title, max 6 words>",
      "insight": "<1-2 sentences: specific, actionable insight for this listing>",
      "type": "<one of: financing | carfax | inspection | title | photos | description | garage | warranty | price | payment>"
    }
  ],
  "whats_working": [
    "<specific strength from the listing — use structured_facts and explicit_listing_facts only>",
    "<specific strength>",
    "<specific strength>"
  ],
  "suggested_additions": [
    "<coaching tip — format: 'If you have X, consider adding Y'>",
    "<another coaching tip>"
  ],
  "improved_draft": "<A unified rewrite of the full listing using ONLY structured_facts and explicit_listing_facts. seller_claims attributed as 'Seller states X'. Aim for 80–150 words. Plain text only — no markdown, no headers, no bullets. Make it compelling and specific. Even if facts are sparse, write the best possible version from what you have. This is the main copyable output for the seller.>",
  "seller_questions": [
    {
      "question": "<First question — specific to this vehicle's biggest trust gap>",
      "options": ["<short ready answer 1, 3-7 words>", "<short ready answer 2>", "<short ready answer 3>"]
    },
    {
      "question": "<Second question — different topic from first>",
      "options": ["<short ready answer 1>", "<short ready answer 2>", "<short ready answer 3>"]
    },
    {
      "question": "<Third question — ownership, reason for sale, or vehicle-specific angle>",
      "options": ["<short ready answer 1>", "<short ready answer 2>", "<short ready answer 3>"]
    }
  ]
}

## Scoring Calibration

Score based on what is actually present — do not inflate for what might be true.

- 45–60 (Poor): Missing most trust signals. No ownership duration, no reason for selling, no CARFAX, thin description (<50 words), few or no photos.
- 60–75 (Average): Some trust signals present but key gaps remain. Description exists but missing important details. Photo count adequate but angles incomplete. Mainly claims with little evidence. A listing with strong trust signals but fewer than 60 words of description should land in this range (68–74).
- 75–85 (Strong): Multiple trust signals confirmed. Clean title, ownership duration stated, 8+ photos, description 100+ words, at least one evidence-based maintenance claim.
- 85–92 (Very Strong): Most trust signals present. Ownership duration, reason for selling, CARFAX or clean title confirmed, evidence-based maintenance language, strong photo coverage (8+ angles).
- 92+ (Exceptional): Reserve for listings that do almost everything right — verified service history with receipts, odometer photo, all key angles, complete description, reason for selling, CARFAX, honest flaw disclosure.

Description quality is a real score factor. Strong trust signals cannot compensate for a 4-line description on a $15,000+ vehicle. A listing that earns trust but fails to inform scores 68–74, not 75+.

Score differentiation is required. Do not default to 72 for all average listings. Scores in the 60–75 range should span that full range — 62, 65, 68, 71, 74 are all valid. Reserve 72–74 for listings genuinely close to "above average" but falling short in one clear area.

## Scoring Dimensions (9-factor model)

1. Photo coverage / visual merchandising (20 pts)
   - Parser provides photo count — trust it, do not re-estimate
   - Count benchmarks: 0–3 = 0–4 pts | 4–7 = 5–6 pts | 8–11 = 7–8 pts | 12–16 = 9 pts | 17+ = 10 pts

2. Service proof specificity (18 pts)
   - Evidence (receipts, dates, shops named, records stated): 15–18 pts
   - Claims only ("well maintained," "runs great"): 6–9 pts
   - Nothing mentioned: 0–5 pts

3. Stacked trust signals (17 pts)
   - Each confirmed: clean title (+3), no accidents (+3), CARFAX/AutoCheck offered (+3), lien-free/title in hand (+2), emissions pass (+2), registration current (+2), VIN provided (+2)
   - Claims only (not verifiable): half value
   - Cap at 17

4. Title clarity / transfer readiness (13 pts)
   - Clean title, in hand, lien-free: 11–13 pts
   - Clean title stated but no "in hand" or lien status: 7–9 pts
   - Title status not mentioned: 3–5 pts
   - Rebuilt/salvage disclosed WITH explanation, repairs, and inspection: 8–10 pts
   - Rebuilt/salvage disclosed WITHOUT explanation: 2–4 pts

5. Ownership / reason / seller context (12 pts)
   - Ownership duration stated: +4 pts
   - Reason for sale stated: +4 pts
   - Number of previous owners stated: +2 pts
   - Seller background adds credibility: +2 pts
   - None of the above: 0–2 pts

6. Writing cleanliness (8 pts)
   - Clear, readable, no errors, good formatting: 7–8 pts
   - Minor errors or thin but readable: 4–6 pts
   - Spelling errors, all-caps, keyword spam, wall of text, excessive emojis: 1–3 pts

7. Known-issues transparency (6 pts)
   - Seller proactively discloses a known flaw and explains it: 5–6 pts
   - No known issues mentioned, no obvious problems: 4 pts
   - Obvious problems implied but not mentioned: 0–2 pts

8. Conditional price justification (4 pts)
   - Rebuilt/salvage with price explanation: +4 pts
   - High mileage with usage explanation: +3 pts
   - Price vs condition unexplained but not clearly extreme: 2 pts
   - Price appears high with no supporting trust details: 0–1 pts

9. Bonus proof signals (up to +2 pts, capped at 100)
   - Odometer photo, service records photo, pre-purchase inspection offered, honest flaw photographed: +1 pt each

## Score caps (enforced by post-processing — do not override)

- Rebuilt/salvage title WITHOUT explanation of damage, repairs, or inspection: HARD CAP at 58
- High mileage (>20,000 miles/year per [MILEAGE RATE] note) WITHOUT any service or usage explanation: HARD CAP at 65
- Both: HARD CAP at 55

## Evidence vs Claims

- EVIDENCE: "dealer maintained," "service records available," "receipts for new tires in 2023," "passed pre-purchase inspection at [shop]"
- CLAIMS: "meticulously maintained," "runs great," "well cared for," "like new"

When a listing uses only claims with no evidence, flag this. In seller_insight: "Strong listings back up every claim with a fact."

## Seller-claim attribution

Never write seller_claims as bare assertions in after_copy or whats_working. Always attribute: "Seller states X."

NEVER write in after_copy without explicit documentation:
"No accidents" / "Runs great" / "Well maintained" / "Highway miles" / "Garage kept" / "One owner" / "Clean interior" / "No issues" / "Runs and drives great"

## Critical Rules

- Rebuilt/salvage title: the disclosure itself is not the problem — do not penalize the score for it. Problem is missing explanation, missing repair details, missing inspection status. Safe language: "Rebuilt title disclosed. Consider adding the damage type, repairs completed, inspection status, and any available documentation." Rebuilt titles typically price at 60–70% of clean-title equivalent.
- biggest_problem: the single most damaging issue — must be something the seller CAN fix. Never use title status as a problem.
- also_hurting: exactly 2 additional problems, different categories — actionable
- before/after: use only structured_facts and explicit_listing_facts. Empty string is better than invented copy. Target 30–80 words. Plain text, no markdown, no wall of text.
- Cliché replacement: if listing uses "beautiful", "must see", "fully loaded", "spotless", "very clean", "perfect condition", "like new", "immaculate" — do NOT copy into after. Replace with specific facts. If no facts available, omit the sentence.
- Spelling errors: always flag this — buyers notice.
- If ownership duration missing: flag it.
- If reason for selling missing: flag it.
- If CARFAX not mentioned: suggest it in opportunities.
- opportunities: return 2–4 relevant items only.
  - "financing": if asking_price > 0
  - "carfax": if no CARFAX mentioned — use this exact framing: "If you already have a CARFAX, AutoCheck, or service records, mention that they are available." Do not pitch the cost or make it sound like a sales recommendation.
  - "inspection": if mechanical unknowns, high mileage, or trust gaps
  - "title": if salvage/rebuilt
  - "photos": if few photos
  - "description": if very short description
  - "garage": if not mentioned but relevant (newer/lower-mile car)
  - "warranty": if under 5 years old
  - "price": if price appears high — suggest KBB check only, never state a specific value
  - "payment": if cash-only or payment method not mentioned
  - "formatting": ONLY if [FORMATTING] signal says wall of text
- category: each of biggest_problem and the two also_hurting items MUST have a DIFFERENT category. No two may share the same.
- whats_working: genuine strengths only from the fact inventory. If fewer than 3 exist, return only what's real.
- Language: Never flag language choice. Only flag: keyword spam (3+ brand names consecutively), excessive emojis (6+), all-caps, spelling errors, grammar errors, wall-of-text.
- Phone numbers written as words or letter-number combos (e.g. "48Zer. 78Eight") are standard Craigslist anti-spam. NEVER flag this.
- Plain text only in "after": no **bold**, no ## headers. Craigslist does not render markdown.
- No questions in "after". Questions belong in seller_insight.
- Emoji overuse: 6+ emoji → flag under category "text". Title: "Too many emojis hurt credibility."
- Financing: never mention financing, monthly payments, or buyer affordability in any "after" field.
- monthly_payment: (asking_price * 0.07/12 * (1+0.07/12)^60) / ((1+0.07/12)^60 - 1), round to nearest dollar
- Mileage per year: if [MILEAGE RATE] note provided, flag >20,000 miles/year as high usage with benchmark language. Never say "highway miles" unless seller explicitly stated it.
- PPV / Fleet / Commercial use: flag as context-needed if unexplained.
- Keyword spam: 3+ competitor brand names consecutively → flag under "text".
- suggested_additions: return 2–3 coaching tips maximum. Format: "If you have X, consider adding Y." Never use bracket placeholders like [X years] or [reason] — write plain guidance instead. Bad: "Add 'Owned for [X years].'" Good: "Add how long you've owned it — even one sentence builds credibility."
- suggested_additions must be vehicle-specific: look at the actual car — its type, features, mileage, and known buyer concerns — and tailor the tips. Examples: for a manual transmission car → clutch condition; for a performance car with Brembo brakes → brake service history or track use; for a high-mileage car → recent service events; for a truck → towing/payload use; for a hybrid → battery health. Generic tips (ownership duration, reason for sale) should only appear if they are NOT already covered in the issue cards AND if no more specific tip applies.
- suggested_additions deduplication: do NOT repeat topics already covered in biggest_problem or also_hurting. Do not mention ownership duration or reason for sale more than once across the entire report. If either is already an issue card, drop it from suggested_additions entirely.
- Do not pad the report. A thin listing with real content for only 2 suggestions should return 2, not 3. Quality over quantity.
- improved_draft: always generate this — even for sparse listings. Use every fact from structured_facts and explicit_listing_facts. seller_claims go in as "Seller states X." This is the seller's main takeaway — make it worth copying. Plain text only.
- seller_questions: generate exactly 3 objects, each with "question" and "options". Be specific to this vehicle. Do not ask about something already stated in the listing. For each question, generate 3 short ready-to-click answer options (3-7 words each) that cover the most common true answers a seller might give. Good question: "How is the clutch feel and shift quality?" with options ["Feels tight and responsive", "Normal wear for the mileage", "Recently adjusted or replaced"]. Bad: "Any additional details?" Fallback only if no vehicle-specific angle: question "How long have you owned it?" options ["Less than a year", "1–3 years", "3+ years"].
- "title in hand" rule: never write "title in hand" or "clean title in hand" in after_copy or whats_working unless the seller explicitly used the phrase "in hand" in their listing. Craigslist metadata showing title status: clean only justifies "clean title stated in listing" — nothing more.
- issue_type and can_generate_after_copy rules:
  - Set issue_type to "needs_seller_input" when the fix requires the seller to provide NEW information they have not stated anywhere in the listing (e.g., ownership duration, reason for selling, service history they have not mentioned, condition details they have not described). These issues cannot produce safe after_copy.
  - Set issue_type to "copy_improvement" when the seller has stated enough facts in structured_facts or explicit_listing_facts to write an improved version of their existing copy.
  - Set can_generate_after_copy to false whenever issue_type is "needs_seller_input" OR whenever after would be an empty string. Set it to true only when after contains real, safe, non-empty copy.
  - Do not set can_generate_after_copy to true and then return an empty after string — these must be consistent.
- Use benchmark language, not emotional language. Be specific with counts and benchmarks.
- Short description title rule: if the description is under 50 words and you flag it as a text issue, the problem title MUST reflect the word count — not the writing style. Use titles like "Description is 24 words — buyers need more" or "24-word description leaves buyers guessing." Never use "reads like a spec sheet," "lacks a story," or similar style critiques when the real problem is length. Style critiques apply only when the description is 80+ words but poorly written or vague.
- Seller-claim vs verified proof: "Seller states…" for anything from seller_claims. Only use "verified," "confirmed," "documented" if records/receipts/CARFAX are explicitly in explicit_listing_facts.
- CARFAX in after_copy: if CARFAX is in explicit_listing_facts, you may write "CARFAX report available" or "CARFAX on file." Do NOT write specific CARFAX findings ("CARFAX shows X service records", "CARFAX shows no accidents", "CARFAX confirms one owner") unless those exact numbers and findings appear verbatim in explicit_listing_facts. A seller saying "CARFAX available" does not authorize you to describe what the CARFAX contains.`;

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
        system: EXTRACTION_PROMPT,
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

    // ── Stage 3: Issue generation + copy writing (Haiku) ─────────────────────
    const factBlock = `## Classified Fact Inventory (your only source of facts for after_copy)

structured_facts (may assert directly in after_copy):
${factInventory.structured_facts.map(f => `- ${f}`).join("\n") || "- (none detected)"}

explicit_listing_facts (may assert directly in after_copy):
${factInventory.explicit_listing_facts.map(f => `- ${f}`).join("\n") || "- (none detected)"}

seller_claims (attribute as "Seller states X" — never bare assertions):
${factInventory.seller_claims.map(f => `- ${f}`).join("\n") || "- (none)"}

missing_signals (surface in seller_insight and suggested_additions only):
${factInventory.missing_signals.map(f => `- ${f}`).join("\n") || "- (none)"}

forbidden_or_unverified_claims (NEVER copy these into after_copy):
${factInventory.forbidden_or_unverified_claims.map(f => `- ${f}`).join("\n") || "- (none)"}`;

    const writerContent: Anthropic.MessageParam["content"] = [...imageContent];
    const wordCountNote = descriptionWordCount > 0
      ? `\n\n[DESCRIPTION WORD COUNT: ${descriptionWordCount} words — use this exact number in any word count reference. Do not re-count words yourself.]`
      : "";

    const listingText = url
      ? `Listing URL: ${url}\n\n${factBlock}\n\nFull listing content (for context — fact inventory above is authoritative):\n${cleanedHtml}${photoNote}${formattingNote}${priceNote}${mileageRateNote}${wordCountNote}`
      : `${factBlock}\n\nListing text (for context):\n${cleanedHtml}${wordCountNote}`;

    writerContent.push({ type: "text", text: listingText });
    writerContent.push({ type: "text", text: "Analyze this car listing using the fact inventory above and return the JSON assessment." });

    const writerResp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3400,
      temperature: 0,
      system: WRITER_PROMPT,
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

    // ── Post-processing ───────────────────────────────────────────────────────
    // Uses Stage 2 fact inventory — not AI-generated fields — as the truth source.

    // Hard validator: enforce can_generate_after_copy consistency before anything else.
    // Prompt instructions can be ignored by the model — this layer cannot.
    const enforceIssueFields = (issue: { after?: string; issue_type?: string; can_generate_after_copy?: boolean } | null) => {
      if (!issue) return;
      const hasContent = (issue.after ?? "").trim().length > 0;
      // If model said can_generate but after is empty — fix the flag
      if (issue.can_generate_after_copy === true && !hasContent) {
        issue.can_generate_after_copy = false;
        issue.issue_type = "needs_seller_input";
      }
      // If issue_type is needs_seller_input — enforce empty after regardless of what model wrote
      if (issue.issue_type === "needs_seller_input") {
        issue.after = "";
        issue.can_generate_after_copy = false;
      }
      // If after is empty and no explicit flag set — default to needs_seller_input
      if (!hasContent && issue.can_generate_after_copy == null) {
        issue.can_generate_after_copy = false;
        issue.issue_type = "needs_seller_input";
      }
    };
    enforceIssueFields(result.biggest_problem);
    for (const issue of result.also_hurting ?? []) enforceIssueFields(issue);

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
      const demoted: typeof result.also_hurting = [];
      for (const issue of result.also_hurting ?? []) {
        if (!usedCats.has(issue.category)) { usedCats.add(issue.category); keptAlso.push(issue); }
        else demoted.push(issue);
      }
      result.also_hurting = keptAlso;
      for (const issue of demoted) {
        const raw = `${issue.title}. ${issue.seller_insight ?? ""}`.trim();
        const tip = raw.length > 180 ? raw.slice(0, raw.lastIndexOf(" ", 180)) + "…" : raw;
        result.suggested_additions = [...(result.suggested_additions ?? []), tip];
      }
    }

    // CARFAX / service records / placeholder stripper
    // Use Stage 2 inventory — not AI-generated verified_facts — for authorization checks.
    {
      const hasVerifiedCarfax = allFacts.some(f => /carfax|autocheck|vehicle history report/.test(f));
      const hasVerifiedServiceRecords = allFacts.some(f => /service records? (available|on hand|provided)|maintenance records? available/.test(f));
      // "CARFAX shows/indicates/confirms [specific claim]" — strip even when CARFAX is verified,
      // because the specific finding was derived by the AI, not stated verbatim by the seller.
      // Only "CARFAX available" / "CARFAX on file" / "CARFAX report available" are safe.
      const carfaxDerivedPattern = /carfax\s+(shows|indicates|confirms|reports|reveals|found|has|lists)/i;

      const carfaxPatterns = [/carfax/i, /autocheck/i];
      const servicePatterns = [
        /service\s+records?\s+available/i, /maintenance\s+records?\s+available/i,
        /records?\s+available\s+upon\s+request/i,
      ];
      const placeholderPattern = /\[[^\]]{1,60}\]/;

      let addCarfaxSuggestion = false;
      const cleanIssueAfter = (issue: { after?: string } | null) => {
        if (!issue?.after) return;
        const lines = issue.after.split('\n');
        const cleanedLines = lines.map(line => {
          const parts: string[] = [];
          let remaining = line;
          while (remaining.length > 0) {
            const match = remaining.match(/^(.*?[.!?])\s*/);
            if (match) { parts.push(match[1]); remaining = remaining.slice(match[0].length); }
            else { parts.push(remaining); break; }
          }
          return parts.filter(s => {
            if (!hasVerifiedCarfax && carfaxPatterns.some(p => p.test(s))) { addCarfaxSuggestion = true; return false; }
            if (!hasVerifiedServiceRecords && servicePatterns.some(p => p.test(s))) { addCarfaxSuggestion = true; return false; }
            // Strip specific CARFAX-derived claims even when CARFAX is verified — AI cannot know report contents
            if (carfaxDerivedPattern.test(s)) { return false; }
            if (placeholderPattern.test(s)) return false;
            return true;
          }).join(' ').trim();
        });
        issue.after = cleanedLines.filter(Boolean).join('\n').trim();
      };

      cleanIssueAfter(result.biggest_problem);
      for (const issue of result.also_hurting ?? []) cleanIssueAfter(issue);

      if (addCarfaxSuggestion) {
        const tip = "If you have a CARFAX, AutoCheck, or service records, mention it — one sentence about vehicle history can significantly increase buyer confidence.";
        if (!(result.suggested_additions ?? []).includes(tip)) {
          result.suggested_additions = [...(result.suggested_additions ?? []), tip];
        }
      }
    }

    // Score caps
    const hasRebuiltTitle = allFacts.some(f => /rebuilt|salvage/.test(f));
    const hasRebuiltExplanation = allFacts.some(f => /repair|inspection|damage.*was|rebuilt.*after|rebuilt.*follow/.test(f));
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

    // Sentence-level safety sanitizer (defense-in-depth — should rarely trigger with V3)
    {
      const CLICHE_PHRASES = [
        /\bbeautiful\b/gi, /\bmust[\s-]see\b/gi, /\bfully[\s-]loaded\b/gi,
        /\bspotless\b/gi, /\bvery\s+clean\b/gi, /\bperfect\s+condition\b/gi,
        /\blike[\s-]new\b/gi, /\bimmaculate\b/gi,
      ];
      const TRUST_CLAIM_PATTERNS = [
        /no\s+mechanical\s+issues?/i, /no\s+issues?\b/i, /no\s+problems?\b/i,
        /well[\s-]maintained/i,
        /runs\s+and\s+drives\s+(great|well|perfect|fine|smooth)/i,
        /runs\s+great/i, /drives\s+great/i, /drives\s+like\s+new/i,
        /no\s+accidents?\b/i, /highway\s+miles/i, /local\s+(miles|driving)/i,
      ];
      const REFRAMEABLE = [
        { pattern: /runs\s+and\s+drives\s+(great|well|perfect|fine|smooth)/i, claim: "runs and drives well" },
        { pattern: /no\s+mechanical\s+issues?/i, claim: "no mechanical issues" },
        { pattern: /no\s+accidents?\b/i, claim: "no accidents" },
      ];

      const splitSentences = (t: string) => t.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);

      const cleanSentence = (s: string): string => {
        if (/financing|\/mo\b|APR|OAC|monthly\s+payment|estimated\s+payment|buyer\s+payment|bring\s+your\s+own|cash\s+or\s+fin/i.test(s)) return "";
        if (/^\s*[\*\-]?\s*example:/i.test(s)) return "";
        if (/^\s*[\*\-]?\s*(do you|did you|have you|are you|when did|how long|why are you)/i.test(s)) return "";
        for (const { pattern, claim } of REFRAMEABLE) {
          if (pattern.test(s)) {
            const stripped = s.replace(pattern, "").replace(/\s{2,}/g, " ").replace(/^[,\s]+|[,\s]+$/g, "").trim();
            // Dangling conjunction or too short → use just the reframed claim
            if (stripped.length < 10 || /\b(and|or|but)\s*$/.test(stripped)) return `Seller states ${claim}.`;
            return stripped + ".";
          }
        }
        for (const pat of TRUST_CLAIM_PATTERNS) { if (pat.test(s)) return ""; }
        let cleaned = s;
        for (const pat of CLICHE_PHRASES) { cleaned = cleaned.replace(pat, "").replace(/\s{2,}/g, " ").trim(); }
        if (cleaned.split(/\s+/).filter(Boolean).length < 3) return "";
        // Final fragment guard: dangling conjunction at end of any sentence
        if (/\b(and|or|but)\s*[.,]?\s*$/.test(cleaned)) return "";
        return cleaned;
      };

      const cleanAfterCopy = (t: string) =>
        splitSentences(t).map(cleanSentence).filter(Boolean).join(" ").trim();

      const processIssue = (issue: { after?: string } | null) => {
        if (!issue) return;
        issue.after = issue.after ? cleanAfterCopy(issue.after) : "";
      };
      processIssue(result.biggest_problem);
      for (const issue of result.also_hurting ?? []) processIssue(issue);
    }

    // Re-run hard validator after sanitizer — sanitizer may have emptied an after that was non-empty
    enforceIssueFields(result.biggest_problem);
    for (const issue of result.also_hurting ?? []) enforceIssueFields(issue);

    // Deduplicate suggested_additions against seller_questions topics
    // If Make it Stronger already asks about ownership/reason/service, remove those from the tips list
    {
      const questionTopics: RegExp[] = [];
      for (const q of result.seller_questions ?? []) {
        const text = (typeof q === "string" ? q : q.question ?? "").toLowerCase();
        if (/how long|own|purchas/.test(text)) questionTopics.push(/how long.*own|owned.*how|when.*purchas|length.*own/i);
        if (/why.*sell|reason.*sell/.test(text)) questionTopics.push(/why.*sell|reason.*sell/i);
        if (/service|maintenan|record|receipt/.test(text)) questionTopics.push(/service\s+record|maintenan.*record|receipt/i);
      }
      if (questionTopics.length > 0) {
        result.suggested_additions = (result.suggested_additions ?? []).filter(
          (tip: string) => !questionTopics.some(pat => pat.test(tip))
        );
      }
    }

    // Attach parser data
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
