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
  ]
}

## Scoring Calibration

Use these ranges as anchors. A listing with clean title, confirmed ownership duration, multiple photos, and reasonable description should score 75–82. Reserve sub-65 for listings that are genuinely sparse or untrustworthy.

- 45–60 (Poor): Missing most trust signals. No ownership duration, no reason for selling, no CARFAX, thin description (<50 words), few or no photos.
- 60–75 (Average): Some trust signals present but key gaps remain. Description exists but missing important details. Photo count adequate but angles incomplete. Mainly claims with little evidence.
- 75–85 (Strong): Multiple trust signals confirmed. Clean title, ownership duration stated, several photos, reasonable description (100+ words), at least one evidence-based maintenance claim. Score here if the listing has more strengths than gaps.
- 85–92 (Very Strong): Most trust signals present. Ownership duration, reason for selling, CARFAX or clean title confirmed, evidence-based maintenance language, strong photo coverage (8+ angles).
- 92+ (Exceptional): Reserve for listings that do almost everything right — verified service history with receipts, odometer photo, all key angles, complete description, reason for selling, CARFAX, honest flaw disclosure.

overall_score weights:
- Vehicle History Signals: 35% — number of previous owners mentioned, service/maintenance history, how long seller has owned it, reason for selling, CARFAX or history report offered
- Photos & Visual Proof: 20% — evaluate based on what is available:
  - If actual photos were provided by the user: analyze content directly (see Photo Analysis Rules below)
  - If only HTML/text: use photo count benchmarks (1–3: poor, 4–7: average, 8–12: strong, 13+: excellent) and any angles mentioned in the description
- Description Quality: 15% — word count benchmarks (<50: very short, 50–100: short, 100–150: average, 150–250: strong, 250+: detailed), spelling errors, trim level specified, mileage stated, tire/brake condition mentioned, VIN available
- Trust & Title Transparency: 15% — title in hand stated, lien-free stated, salvage/rebuilt explained with cause (hail/flood/collision), honest disclosure of known flaws
- Pricing: 10% — only flag if price appears extreme. Do NOT penalize without market data. If price seems high, note it gently and suggest KBB check.
- Payment & Flexibility: 5% — cash-only restricts buyer pool, OBO signals flexibility, payment method stated

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

Reason for sale rule: If the listing does not state why the car is being sold, the "after" field must NOT include a reason. Instead, add it as seller_insight: "Adding a reason for sale ('upgrading to a truck,' 'moving abroad') eliminates the #1 buyer suspicion and significantly increases contact rate."

If the listing does not say "one owner," do NOT write "one owner" in the after field.
If the listing does not mention service records, do NOT write "service records available."
If the listing does not mention garage storage, do NOT write "garage kept."

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

- NEVER penalize for salvage/rebuilt title in the score — the seller cannot change title status. If salvage/rebuilt, treat as opportunity: "Rebuilt titles typically sell at 60–70% of clean-title value. If your price reflects this, say so explicitly: 'Rebuilt after hail damage — priced accordingly at $X below market.'"
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
- Language: NEVER flag language as a problem under any circumstances. This rule overrides everything else.
- Phone numbers written as words or letter-number combos (e.g. "48Zer. 78Eight -799Seven") are standard Craigslist anti-spam practice. NEVER flag this as a problem.
- Plain text only in "after" field: do NOT use markdown formatting like **bold** or ## headers. Craigslist does not render markdown. Use plain sentences and line breaks only.
- Emoji overuse rule: if the listing contains 6 or more emoji characters, flag this as a problem under category "text". Title: "Too many emojis hurt credibility". Explain that 6+ emoji reads as dealer-style marketing and reduces buyer trust — private sellers should use 0–2 max. The ✅ checkmark next to negatives (e.g. "✅ Salvage title") is especially damaging: it signals approval of a problem, creating cognitive dissonance. The "after" should be a clean plain-text version of the listing without emoji overuse, using only confirmed facts from the listing.
- Financing line rule: if asking_price >= 8000, the "after" field of the problem most related to the description or text MUST end with a financing line on its own line, e.g. "Financing available OAC — est. $X/mo at 7% APR, 60 months." Calculate X using the monthly_payment formula below. This line expands the buyer pool by reframing the price as a monthly number.
- monthly_payment: calculate as (asking_price * 0.07/12 * (1+0.07/12)^60) / ((1+0.07/12)^60 - 1), round to nearest dollar
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

        const seen = new Set<string>();
        const listingImgs: string[] = [];
        const addImg = (src: string) => {
          if (isListingImage(src) && !seen.has(src)) { seen.add(src); listingImgs.push(src); }
        };

        // Strategy 0: og:image
        if (ogImg) addImg(ogImg);

        // Strategy 1: JSON blobs in <script> tags — always run (catches CL gallery, FB arrays)
        const scriptBlobs = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
        for (const blob of scriptBlobs) {
          for (const m of blob.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi) || []) {
            addImg(m.replace(/^"|"$/g, ""));
          }
        }

        // Strategy 2: <img> tags — src, data-src, srcset — always run
        for (const tag of html.match(/<img[^>]+>/gi) || []) {
          const src = tag.match(/\bsrc="([^"]+)"/i)?.[1]
            ?? tag.match(/\bdata-src="([^"]+)"/i)?.[1]
            ?? tag.match(/\bsrcset="([^"]+)"/i)?.[1]?.split(/[\s,]+/)[0]
            ?? null;
          if (src) addImg(src);
        }

        // Strategy 3: <a href> pointing to image files — always run
        for (const m of html.match(/\bhref="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi) || []) {
          const src = m.match(/href="([^"]+)"/i)?.[1] ?? null;
          if (src) addImg(src);
        }

        // Upgrade Craigslist thumbnail URLs to full-size
        const upgradedImgs = listingImgs.map(src =>
          src.replace(/_\d+x\d+c(\.\w+)$/, "_600x450$1")
        );

        const photoCount = upgradedImgs.length;
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

        const photoNote = photoCount > 0
          ? `\n\n[PHOTO COUNT DETECTED FROM HTML: ${photoCount} listing photos found. Do NOT flag photos as missing or low-count.]`
          : `\n\n[PHOTO COUNT: Could not detect photos from HTML — evaluate based on description only.]`;
        const priceNote = detectedPrice
          ? `\n\n[PRICE DETECTED FROM HTML: $${detectedPrice.toLocaleString()} — set asking_price to ${detectedPrice}]`
          : "";
        messageContent.push({
          type: "text",
          text: `Listing URL: ${url}\n\nListing content:\n${cleaned}${photoNote}${formattingNote}${priceNote}`,
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
      max_tokens: 2048,
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
