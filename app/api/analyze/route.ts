import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const cache = new Map<string, unknown>();

const SYSTEM_PROMPT = `You are CarSweetSpot AI — an expert at analyzing private car listings and telling sellers exactly why buyers are not contacting them.

IMPORTANT: Analyze the listing regardless of language. Never flag the listing language as a problem — sellers post in their native language and that is completely normal. Focus only on content quality, not language choice.

Private car buyers decide whether to contact a seller within seconds. They are not evaluating the car — they are evaluating: "Can I trust this seller?" Your job is to find what is destroying that trust and give the seller specific, paste-ready fixes.

## Output structure

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text).

The fields MUST appear in this order. You fill in verified_facts and unsafe_to_claim BEFORE writing any after field. The after field for any issue may only contain language sourced from verified_facts or safe generic language. If a fact is not in verified_facts, it cannot appear in after.

{
  "vehicle": "<Year Make Model Trim>",
  "asking_price": <number in USD, 0 if not found. Convert shorthand: "10K" → 10000, "$15k" → 15000, "15,000" → 15000>,
  "overall_score": <0-100>,
  "monthly_payment": <number, calculated from asking_price at 7% APR 60 months, 0 if no price>,
  "verified_facts": [
    "<each item is a specific fact explicitly stated in the listing — e.g., 'clean title stated', '96,000 miles', 'second owner', 'passed emissions test', '4 photos'>",
    "<only include facts you can quote or directly infer from the listing text — no assumptions>"
  ],
  "unsafe_to_claim": [
    "<each item is something NOT stated in the listing that would be risky or false to include in the rewrite — e.g., 'service history not mentioned', 'reason for selling unknown', 'garage storage not stated'>",
    "<anything that appears here CANNOT appear in any after field>"
  ],
  "biggest_problem": {
    "title": "<short problem title, max 8 words>",
    "why_buyers_care": "<1-2 sentences using benchmark language, not emotional language>",
    "seller_insight": "<1 sentence — if info is missing, suggest it here, never in after>",
    "before": "<exact quote or description of the flaw as it appears now>",
    "after": "<paste-ready rewrite using only verified_facts and safe generic language — no invented facts, no placeholders, no questions>",
    "category": "<one of: trust | text | photos>"
  },
  "also_hurting": [
    {
      "title": "<short problem title, max 8 words>",
      "why_buyers_care": "<1-2 sentences>",
      "seller_insight": "<1 sentence>",
      "before": "<specific flaw>",
      "after": "<paste-ready rewrite — verified facts only>",
      "category": "<one of: trust | text | photos>"
    },
    {
      "title": "<short problem title, max 8 words>",
      "why_buyers_care": "<1-2 sentences>",
      "seller_insight": "<1 sentence>",
      "before": "<specific flaw>",
      "after": "<paste-ready rewrite — verified facts only>",
      "category": "<one of: trust | text | photos>"
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
    "<specific strength from the listing>",
    "<specific strength>",
    "<specific strength>"
  ],
  "suggested_additions": [
    "<coaching tip for what seller could add IF TRUE — use format: 'If you have X, consider adding Y'>",
    "<another coaching tip — never invented, never paste-ready, never a copy prompt>"
  ]
}

## Scoring Calibration

Use these ranges as anchors. Score based on what is actually present — do not inflate for what might be true.

- 45–60 (Poor): Missing most trust signals. No ownership duration, no reason for selling, no CARFAX, thin description (<50 words), few or no photos.
- 60–75 (Average): Some trust signals present but key gaps remain. Description exists but missing important details. Photo count adequate but angles incomplete. Mainly claims with little evidence. A listing with strong trust signals but fewer than 60 words of description should land in this range (68–74).
- 75–85 (Strong): Multiple trust signals confirmed. Clean title, ownership duration stated, 8+ photos, description 100+ words, at least one evidence-based maintenance claim.
- 85–92 (Very Strong): Most trust signals present. Ownership duration, reason for selling, CARFAX or clean title confirmed, evidence-based maintenance language, strong photo coverage (8+ angles).
- 92+ (Exceptional): Reserve for listings that do almost everything right — verified service history with receipts, odometer photo, all key angles, complete description, reason for selling, CARFAX, honest flaw disclosure.

Description quality is a real score factor. Strong trust signals cannot compensate for a 4-line description on a $15,000+ vehicle. A listing that earns trust but fails to inform scores 68–74, not 75+.

## Scoring Dimensions (9-factor model)

Score each dimension 0–10, then apply weights to produce overall_score (0–100).

1. Photo coverage / visual merchandising (20 pts)
   - Parser provides photo count — trust it, do not re-estimate
   - Count benchmarks: 0–3 = 0–4 pts | 4–7 = 5–6 pts | 8–11 = 7–8 pts | 12–16 = 9 pts | 17+ = 10 pts
   - If photos uploaded by user: evaluate angle coverage (3/4 front, rear, side, dashboard, odometer, interior, engine bay, trunk) and quality (lighting, cleanliness, warning lights)
   - Hero image quality: clear, well-lit exterior shot = +1; dark/blurry/no car visible = −1

2. Service proof specificity (18 pts)
   - Evidence (receipts, dates, shops named, records stated): 15–18 pts
   - Claims only ("well maintained," "runs great"): 6–9 pts
   - Nothing mentioned: 0–5 pts
   - Specific recent service event (e.g., "new timing belt at 90k"): +2 pts bonus

3. Stacked trust signals (17 pts)
   - Each confirmed: clean title (+3), no accidents (+3), CARFAX/AutoCheck offered (+3), lien-free/title in hand (+2), emissions pass (+2), registration current (+2), VIN provided (+2)
   - Claims only (not verifiable): half value
   - Score all confirmed signals, cap at 17

4. Title clarity / transfer readiness (13 pts)
   - Clean title, in hand, lien-free: 11–13 pts
   - Clean title stated but no "in hand" or lien status: 7–9 pts
   - Title status not mentioned: 3–5 pts
   - Rebuilt/salvage disclosed WITH explanation, repairs, and inspection: 8–10 pts
   - Rebuilt/salvage disclosed WITHOUT explanation: 2–4 pts (triggers score cap — see caps below)
   - Salvage/rebuilt never mentioned despite structural evidence: 0–2 pts

5. Ownership / reason / seller context (12 pts)
   - Ownership duration stated: +4 pts
   - Reason for sale stated: +4 pts
   - Number of previous owners stated: +2 pts
   - Seller background adds credibility (e.g., "I bought it new," "family car since 2018"): +2 pts
   - None of the above: 0–2 pts

6. Writing cleanliness (8 pts)
   - Clear, readable, no errors, good formatting: 7–8 pts
   - Minor errors or thin but readable: 4–6 pts
   - Spelling errors, all-caps, keyword spam, wall of text, excessive emojis: 1–3 pts

7. Known-issues transparency (6 pts)
   - Seller proactively discloses a known flaw (cosmetic or mechanical) and explains it: 5–6 pts
   - No known issues mentioned, no obvious problems: 4 pts (neutral)
   - Obvious problems visible/implied but not mentioned: 0–2 pts

8. Conditional price justification (4 pts)
   - Rebuilt/salvage: seller explains the price accounts for title status: +4 pts
   - High mileage: seller explains the usage (fleet, highway, commute): +3 pts
   - Price vs condition unexplained but not clearly extreme: 2 pts
   - Price appears high with no supporting trust details: 0–1 pts

9. Bonus proof signals (up to +2 pts over base, capped at 100)
   - Odometer photo included: +1 pt
   - Service records photo included: +1 pt
   - Pre-purchase inspection offered or completed: +1 pt
   - Honest flaw photographed and disclosed: +1 pt

## Score caps (enforced by post-processing — do not override these)

- Rebuilt/salvage title disclosed WITHOUT explanation of damage, repairs, or inspection: HARD CAP at 58
- High mileage (>20,000 miles/year per [MILEAGE RATE] note) WITHOUT any service or usage explanation: HARD CAP at 65
- Both conditions present: HARD CAP at 55

## Evidence vs Claims

Score evidence-based language higher than unsupported claims. Apply this distinction throughout scoring and feedback:

- EVIDENCE (score higher, note as strength): "dealer maintained," "service records available," "one owner per Carfax," "receipts for new tires in 2023," "garage kept since purchased new," "passed pre-purchase inspection at [shop]"
- CLAIMS (score lower, flag as improvement area): "meticulously maintained," "runs great," "well cared for," "like new," "excellent condition," "babied"

When a listing uses only claims with no evidence, flag this. In seller_insight, explain: "Strong listings back up every claim with a fact. Instead of 'well maintained,' say 'oil changed regularly — records available.'"

## Fact Safety Rules

NEVER invent facts not stated in the listing. These are absolute prohibitions:
- Do NOT invent maintenance events (oil changes, tire replacements, brake jobs, timing belt service, etc.)
- Do NOT invent accident history or ownership count beyond what is stated
- Do NOT invent service records, receipts, or inspections
- Do NOT invent mechanical condition details not mentioned
- Do NOT invent a reason for selling — if not stated, do not include one in the rewrite
- Do NOT invent garage storage, warranty status, or inspection results

The "after" field must contain ONLY facts the seller explicitly stated. If a key fact is missing, surface the gap in "why_buyers_care" or "seller_insight" — tell the seller what to add — but do NOT write it yourself.

SELF-CHECK before writing any "after" field: read each sentence you are about to write and ask "Is this fact in verified_facts?" If no — remove it. Do this sentence by sentence, not as a general review.

Reason for sale rule: If the listing does not state why the car is being sold, the "after" field must NOT include a reason. Instead, add it as seller_insight: "Adding a reason for sale ('upgrading to a truck,' 'moving abroad') eliminates the #1 buyer suspicion and significantly increases contact rate."

If the listing does not say "one owner," do NOT write "one owner" in the after field.
If the listing does not mention service records, do NOT write "service records available."
If the listing does not mention garage storage, do NOT write "garage kept."
If the listing does not mention CARFAX, do NOT write "CARFAX available upon request."
If the listing does not mention a certified mechanic or shop, do NOT write "installed by certified mechanic."
If the listing does not mention receipts, do NOT write "receipts available."

No questions in the "after" field: the "after" field is copy-ready text the seller can paste directly. Never write questions inside it ("How long have you owned it?" / "Any service records?"). Questions and suggestions belong only in "seller_insight". The after field should be a clean rewrite of what the seller CAN say now — nothing more.

Missing information belongs in the diagnosis (seller_insight), not the prescription (after).

## Photo Analysis Rules (apply ONLY when actual images are provided)

When the user uploads photos, evaluate each of the following and factor into the score and findings:

**Angle coverage — which of these 8 key shots are present?**
- 3/4 front exterior (the thumbnail — most critical)
- 3/4 rear exterior
- Full side profile
- Dashboard + driver's seat (no warning lights visible)
- Odometer closeup (legible mileage — most important trust signal per research)
- Rear seat
- Engine bay
- Trunk/cargo area
Missing shots = unanswered buyer questions = negative assumptions. Frame as "buyers will wonder about X."

**Red flags to call out immediately:**
- Dashboard warning lights visible (CEL, TPMS, ABS) — destroys trust instantly
- Visible damage (dent, scratch, rust) not mentioned in the description — signals dishonesty more than the damage itself
- Dirty or messy interior — buyers apply broken-windows logic: "if they didn't clean it for photos, they didn't maintain it"
- No interior photos at all — raises suspicion of hidden damage or smell
- Dark/blurry photos — pattern-matches to concealment even when nothing is hidden
- Car visibly dirty or unwashed — signals poor maintenance culture

**Trust builders to recognize:**
- Odometer clearly legible in frame — validate the mileage claim
- Clean engine bay — signals maintenance better than any written claim
- Flaw shown honestly (scratch/dent photographed and mentioned) — counterintuitively increases contact rate
- Service records visible in a photo

**Scoring impact when photos are provided:**
- All 8 key shots present, good lighting, clean car: full 20 points
- Missing 2-3 key shots OR quality issues: deduct 4-8 points
- Missing odometer OR warning lights visible OR no interior: deduct 8-12 points
- Dirty car OR visible unmentioned damage: deduct 10-15 points

## Critical Rules

- Rebuilt/salvage title: the disclosure itself is not the problem — do not penalize the score for it. The problem is missing explanation, missing repair details, missing inspection status, or missing documentation. Flag those gaps as issues or opportunities. If the listing discloses rebuilt title with explanation, repairs, and inspection, treat it as a trust signal. Never say hail/flood/collision unless the seller explicitly stated it. Safe language: "Rebuilt title disclosed. Consider adding the damage type, repairs completed, inspection status, and any available documentation." Rebuilt titles typically price at 60–70% of clean-title equivalent — suggest this if price is not explained.
- biggest_problem: the single most damaging issue hurting buyer contact rate — must be something the seller CAN fix (copy, photos, missing info). Never use title status as a problem.
- also_hurting: exactly 2 additional problems, different categories — must be actionable
- before/after: ONLY use facts the seller actually stated. Never invent features, maintenance history, or ownership details. "after" must be paste-ready copy the seller can use immediately, built only from confirmed facts. Target 30–80 words — enough detail to build trust, short enough to scan in 5 seconds. Use line breaks or short sentences, never a wall of text.
- Spelling errors in the listing: always flag this — 42% of listings have them and buyers notice. It signals carelessness about the car, not just the ad.
- If the listing omits how long the seller has owned it: flag this. "I've owned this since 2019" is one sentence that eliminates the #1 buyer suspicion ("what's wrong with it?").
- If reason for selling is missing: flag this. Silence triggers suspicion. "Upgrading to a truck" takes 4 words and converts skeptics.
- If CARFAX is not mentioned: suggest it in opportunities. A CARFAX costs ~$40 and can be the difference between 5 inquiries and 50.
- opportunities: return 2–4 items. Choose ONLY what is relevant to THIS specific listing. Do not include generic opportunities that don't apply.
  - "financing": include if asking_price > 0 and monthly payment would be meaningful to mention
  - "carfax": include if no CARFAX was mentioned in the listing
  - "inspection": include if there are mechanical unknowns, high mileage, or trust gaps
  - "title": include if salvage/rebuilt — explain the 60-70% value rule and how to frame it
  - "photos": include if listing has few or no photos described
  - "description": include if description is very short or missing key facts
  - "garage": include if garage-kept is not mentioned but would be relevant (newer or lower-mile car)
  - "warranty": include if vehicle is recent enough (under 5 years) that manufacturer warranty may still apply
  - "price": include if price appears high relative to mileage/condition but only suggest a KBB check — never state a specific market value
  - "payment": include if cash-only was stated (restricts buyer pool) or payment method not mentioned
  - "formatting": include ONLY if the FORMATTING signal says wall of text. Suggest breaking the listing into short lines or bullet points. Show a before/after example.
- category: assign each problem to exactly one of: "trust" (ownership history, reason for selling, CARFAX, title status, how long owned), "text" (description quality, word count, formatting, tone, spelling, missing details), "photos" (photo count, angles, odometer missing, quality, warning lights, dirty car). CRITICAL: biggest_problem and the two also_hurting items MUST each have a DIFFERENT category. No two of the three problems may share the same category. If your natural picks collide, demote the weaker one to a different category or replace it with the next-most-impactful issue from a different category.
- whats_working: genuine strengths only. If fewer than 3 exist, return only what's real. Strong listings typically include: stated ownership duration, reason for selling, CARFAX or clean title confirmation, evidence-based maintenance language (not just claims), odometer photo, all key exterior and interior angles.
- Language: Never flag vague tone, writing style, or language choice as a problem. Only flag specific detectable issues: keyword spam (3+ competitor brand names listed without context), excessive emojis (6+), all-caps sections, spelling errors, grammar errors, wall-of-text formatting, or clearly aggressive wording.
- Phone numbers written as words or letter-number combos (e.g. "48Zer. 78Eight -799Seven") are standard Craigslist anti-spam practice. NEVER flag this as a problem.
- Plain text only in "after" field: do NOT use markdown formatting like **bold** or ## headers. Craigslist does not render markdown. Use plain sentences and line breaks only.
- Emoji overuse rule: if the listing contains 6 or more emoji characters, flag this as a problem under category "text". Title: "Too many emojis hurt credibility". Explain that 6+ emoji reads as dealer-style marketing and reduces buyer trust — private sellers should use 0–2 max. The ✅ checkmark next to negatives (e.g. "✅ Salvage title") is especially damaging: it signals approval of a problem, creating cognitive dissonance. The "after" should be a clean plain-text version of the listing without emoji overuse, using only confirmed facts from the listing.
- Financing line rule: if asking_price >= 8000, the "after" field of the problem most related to the description or text MUST end with a financing line on its own line. Use: "Financing available OAC — est. $X/mo at 7% APR, 60 months." Calculate X using the monthly_payment formula. This is presented as an estimated buyer payment — do NOT phrase it as if the seller personally offers financing. Never write "I offer financing" or "seller financing available."
- monthly_payment: calculate as (asking_price * 0.07/12 * (1+0.07/12)^60) / ((1+0.07/12)^60 - 1), round to nearest dollar
- Mileage per year rule: if a [MILEAGE RATE] note is provided, use it. Flag >20,000 miles/year as high usage, >30,000 miles/year as extreme usage. Use benchmark language: "At X miles/year, this vehicle was driven significantly above the 12,000–15,000 mile annual average. Buyers will likely ask about the nature of that use." Never say "highway miles" or explain the mileage cause unless the seller stated it.
- PPV / Fleet / Commercial use: if the listing mentions PPV, police package, fleet, rental, taxi, commercial, or government use — flag as context-needed if the use history is not explained. Generate an issue only if unexplained. If explained clearly, treat as opportunity. Never invent the vehicle's history.
- Keyword spam rule: if the listing contains 3 or more competitor brand names (Ford, Chevy, Honda, Toyota, etc.) listed consecutively without context, flag this under category "text". Title: "Keyword list at bottom hurts credibility." These are added to game search filters and read as spam to buyers.
- suggested_additions: return 2–4 coaching tips for what the seller could add IF TRUE. Format: "If you have X, consider adding Y." These are not copy to paste — they are prompts for the seller. Examples: "If you have service records, mention it — one sentence about maintenance can significantly increase contact rate." / "If you know your reason for selling, add it — even 4 words eliminates the #1 buyer suspicion."
- Use benchmark language, not emotional language. Never write "kills buyer trust," "destroys credibility," "red flag," or similar charged phrases. Instead, use neutral, data-driven framing: "At 18 words, this description is well below the 150–250 word range typical of listings that generate strong contact rates." / "Listings with 4 or fewer photos receive 40% fewer inquiries on average." / "42% of listings contain spelling errors — buyers consistently cite this as a signal of how a seller cares for their car."
- Be specific with counts and benchmarks, not vague. "Description is thin" is useless. "18 words vs. the 150–250 range typical of high-contact listings" is useful. Always include the actual number from the listing alongside the benchmark.`;

export async function POST(req: NextRequest) {
  try {
    const { url, images, text } = await req.json();

    if (url && cache.has(url)) {
      return NextResponse.json(cache.get(url));
    }

    const messageContent: Anthropic.MessageParam["content"] = [];
    let firstImgSrc: string | null = null;
    let detectedPrice: number | null = null;
    let mileageRateNote = "";
    let parserPhotoCount = 0;

    if (images && images.length > 0) {
      for (const img of images as string[]) {
        const mediaTypeMatch = img.match(/^data:(image\/\w+);base64,/);
        const mediaType = (mediaTypeMatch?.[1] || "image/jpeg") as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp";
        const base64Data = img.replace(/^data:image\/\w+;base64,/, "");
        messageContent.push({
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64Data },
        });
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

        // Detect expired/deleted listings before analysis
        if (
          /this posting has been deleted|this posting has expired|no longer available|posting has been flagged/i.test(html) ||
          res.status === 404
        ) {
          return NextResponse.json(
            { error: "This listing has been deleted or expired. Please try a different listing URL." },
            { status: 400 }
          );
        }

        // Strategy 0: Open Graph meta tag — most reliable, works on CL and FB
        const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
          ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
          ?? null;

        const isListingImage = (src: string) =>
          /^https?:\/\//i.test(src) &&
          /\.(jpg|jpeg|png|webp)/i.test(src) &&
          !/logo|icon|avatar|sprite|pixel|tracking|blank/i.test(src) &&
          !/1x1|spacer/i.test(src);

        const rawImgs: string[] = [];
        const rawSeen = new Set<string>();
        const collectImg = (src: string) => {
          if (isListingImage(src) && !rawSeen.has(src)) { rawSeen.add(src); rawImgs.push(src); }
        };

        // Strategy 0: og:image
        if (ogImg) collectImg(ogImg);

        // Strategy 1: JSON blobs in <script> tags — always run (catches CL gallery, FB arrays)
        const scriptBlobs = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
        for (const blob of scriptBlobs) {
          for (const m of blob.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi) || []) {
            collectImg(m.replace(/^"|"$/g, ""));
          }
        }

        // Strategy 2: <img> tags — src, data-src, srcset — always run
        for (const tag of html.match(/<img[^>]+>/gi) || []) {
          const src = tag.match(/\bsrc="([^"]+)"/i)?.[1]
            ?? tag.match(/\bdata-src="([^"]+)"/i)?.[1]
            ?? tag.match(/\bsrcset="([^"]+)"/i)?.[1]?.split(/[\s,]+/)[0]
            ?? null;
          if (src) collectImg(src);
        }

        // Strategy 3: <a href> pointing to image files — always run
        for (const m of html.match(/\bhref="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi) || []) {
          const src = m.match(/href="([^"]+)"/i)?.[1] ?? null;
          if (src) collectImg(src);
        }

        // Upgrade Craigslist thumbnail URLs to full-size, then deduplicate again after upgrade
        const upgradedSeen = new Set<string>();
        const upgradedImgs: string[] = [];
        for (const src of rawImgs) {
          const upgraded = src.replace(/_\d+x\d+c(\.\w+)$/, "_600x450$1");
          if (!upgradedSeen.has(upgraded)) { upgradedSeen.add(upgraded); upgradedImgs.push(upgraded); }
        }

        parserPhotoCount = upgradedImgs.length;
        firstImgSrc = upgradedImgs[0] ?? null;


        // Detect wall-of-text: convert br/p to newlines, count meaningful paragraphs
        const withBreaks = html
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n")
          .replace(/<[^>]+>/g, " ");
        const paragraphs = withBreaks.split("\n").map(s => s.trim()).filter(s => s.length > 30);
        const longestPara = paragraphs.length > 0 ? Math.max(...paragraphs.map(p => p.length)) : 0;
        // Wall-of-text = single block over 500 chars AND fewer than 3 paragraph breaks
        const isWallOfText = longestPara > 500 && paragraphs.length < 3;
        const formattingNote = !isWallOfText
          ? `\n\n[FORMATTING: listing uses paragraph breaks — do NOT flag formatting as a problem.]`
          : `\n\n[FORMATTING: wall of text detected — ${longestPara} characters in one block with no paragraph breaks. Flag this under opportunities with type "formatting". Also deduct up to 5 points from Description Quality score.]`;

        const cleaned = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 12000);
        // Extract price from cleaned plain text — the AI can read it so we can too
        const allPrices = [...cleaned.matchAll(/\$\s*([\d,]+)/g)]
          .map(m => parseInt(m[1].replace(/,/g, ""), 10))
          .filter(n => !isNaN(n) && n >= 1000 && n <= 300000);
        if (allPrices.length > 0) detectedPrice = allPrices[0];

        const photoNote = parserPhotoCount > 0
          ? `\n\n[PHOTO COUNT DETECTED FROM HTML: ${parserPhotoCount} listing photos found. Do NOT flag photos as missing or low-count.]`
          : `\n\n[PHOTO COUNT: Could not detect photos from HTML — evaluate based on description only.]`;
        const priceNote = detectedPrice
          ? `\n\n[PRICE DETECTED FROM HTML: $${detectedPrice.toLocaleString()} — set asking_price to ${detectedPrice}]`
          : "";

        // Mileage per year calculation
        const detectedMileage = [...cleaned.matchAll(/(\d[\d,]+)\s*(?:miles?|mi\b)/gi)]
          .map(m => parseInt(m[1].replace(/,/g, ""), 10))
          .filter(n => !isNaN(n) && n >= 1000 && n <= 500000)[0] ?? null;
        const detectedYear = cleaned.match(/\b(19[89]\d|20[012]\d)\b/)?.[1]
          ? parseInt(cleaned.match(/\b(19[89]\d|20[012]\d)\b/)![1], 10) : null;
        mileageRateNote = "";
        if (detectedMileage && detectedYear) {
          const yearsOld = new Date().getFullYear() - detectedYear;
          if (yearsOld > 0) {
            const milesPerYear = Math.round(detectedMileage / yearsOld);
            const rateLabel = milesPerYear > 30000 ? "EXTREME usage (>30k/yr)" : milesPerYear > 20000 ? "HIGH usage (>20k/yr)" : milesPerYear > 15000 ? "above average" : "normal";
            mileageRateNote = `\n\n[MILEAGE RATE: ${milesPerYear.toLocaleString()} miles/year (${detectedMileage.toLocaleString()} miles ÷ ${yearsOld} years = ${rateLabel}). Apply mileage per year rule if above 20k.]`;
          }
        }

        messageContent.push({
          type: "text",
          text: `Listing URL: ${url}\n\nListing content:\n${cleaned}${photoNote}${formattingNote}${priceNote}${mileageRateNote}`,
        });
      } catch {
        return NextResponse.json(
          { error: "Could not fetch this URL. Facebook listings require login — try the Screenshots tab instead." },
          { status: 400 }
        );
      }
    }

    if (text) {
      messageContent.push({ type: "text", text: `Listing text:\n${text}` });
    }

    if (messageContent.length === 0) {
      return NextResponse.json(
        { error: "Please provide a URL, screenshots, or listing text." },
        { status: 400 }
      );
    }

    messageContent.push({
      type: "text",
      text: "Analyze this car listing and return the JSON assessment.",
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2800,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: messageContent }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);

    // Post-processing: contradiction validator
    // Anything confirmed in verified_facts cannot be flagged as missing in issues
    const vf: string[] = (result.verified_facts ?? []).map((f: string) => f.toLowerCase());
    const hasOwnershipDuration = vf.some(f => /owned.*\d|\d.*year.*own|\d.*month.*own|ownership.*duration/.test(f));
    const hasReasonForSale = vf.some(f => /reason.*sell|selling.*because|downsize|upgrad|relocat|moving|retire/.test(f));
    const isValidIssue = (issue: { title?: string; category?: string } | null | undefined): boolean => {
      if (!issue) return false;
      const t = (issue.title ?? "").toLowerCase();
      if (hasOwnershipDuration && /ownership|how long|duration/.test(t)) return false;
      if (hasReasonForSale && /reason.*sell|why.*sell/.test(t)) return false;
      if (parserPhotoCount >= 8 && issue.category === "photos") return false;
      return true;
    };
    // If biggest_problem is contradicted, promote first valid also_hurting item
    if (!isValidIssue(result.biggest_problem)) {
      const next = (result.also_hurting ?? []).find(isValidIssue);
      result.biggest_problem = next ?? null;
      result.also_hurting = (result.also_hurting ?? []).filter((i: unknown) => i !== next);
    }
    result.also_hurting = (result.also_hurting ?? []).filter(isValidIssue);

    // Post-processing: score caps
    // Rebuilt/salvage without explanation: cap at 58
    // High mileage without service explanation: cap at 65
    const allText = [...(result.verified_facts ?? []), ...(result.unsafe_to_claim ?? []), result.biggest_problem?.why_buyers_care ?? ""].join(" ").toLowerCase();
    const hasRebuiltTitle = vf.some(f => /rebuilt|salvage/.test(f));
    const hasRebuiltExplanation = vf.some(f => /repair|inspection|damage.*was|rebuilt.*after|rebuilt.*follow/.test(f));
    const isMileageHigh = mileageRateNote.includes("HIGH usage") || mileageRateNote.includes("EXTREME usage");
    const hasServiceExplanation = vf.some(f => /service|maintenance|oil|timing|record|inspect|highway|commute|fleet/.test(f)) || allText.includes("highway") || allText.includes("service record");

    let scoreCap = 100;
    if (hasRebuiltTitle && !hasRebuiltExplanation) scoreCap = Math.min(scoreCap, 58);
    if (isMileageHigh && !hasServiceExplanation) scoreCap = Math.min(scoreCap, 65);
    if (hasRebuiltTitle && !hasRebuiltExplanation && isMileageHigh && !hasServiceExplanation) scoreCap = Math.min(scoreCap, 55);
    if (result.overall_score > scoreCap) result.overall_score = scoreCap;

    // If AI failed to extract price but we detected it from HTML, use it
    if (!result.asking_price && detectedPrice) {
      result.asking_price = detectedPrice;
    }
    if (result.asking_price) {
      const p = result.asking_price;
      const r = 0.07 / 12;
      const n = 60;
      result.monthly_payment = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    }

    // Attach listing image if available
    if (firstImgSrc) result.listing_image = firstImgSrc;
    if (!result.listing_image && images && images.length > 0) result.listing_image = images[0];

    if (url) cache.set(url, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Error: ${msg}` }, { status: 500 });
  }
}
