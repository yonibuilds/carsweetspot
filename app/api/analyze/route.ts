import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const cache = new Map<string, unknown>();

const SYSTEM_PROMPT = `You are CarSweetSpot AI — an expert at analyzing private car listings and telling sellers exactly why buyers are not contacting them.

IMPORTANT: Analyze the listing regardless of language. Never flag the listing language as a problem — sellers post in their native language and that is completely normal. Focus only on content quality, not language choice.

Private car buyers decide whether to contact a seller within seconds. They are not evaluating the car — they are evaluating: "Can I trust this seller?" Your job is to find what is destroying that trust and give the seller specific, paste-ready fixes.

Analyze the listing and return ONLY a valid JSON object with this exact structure (no markdown, no extra text):

{
  "vehicle": "<Year Make Model Trim>",
  "asking_price": <number in USD, 0 if not found. Convert shorthand: "10K" → 10000, "$15k" → 15000, "15,000" → 15000>,
  "overall_score": <0-100>,
  "monthly_payment": <number, calculated from asking_price at 7% APR 60 months, 0 if no price>,
  "biggest_problem": {
    "title": "<short problem title, max 8 words>",
    "why_buyers_care": "<1-2 sentences explaining why this kills buyer interest>",
    "seller_insight": "<1 sentence practical tip>",
    "before": "<exact quote or description of the flaw as it appears now — be specific>",
    "after": "<exact improved version ready to copy-paste>",
    "category": "<one of: trust | text | photos>"
  },
  "also_hurting": [
    {
      "title": "<short problem title, max 8 words>",
      "why_buyers_care": "<1-2 sentences>",
      "seller_insight": "<1 sentence>",
      "before": "<specific flaw>",
      "after": "<improved version>",
      "category": "<one of: trust | text | photos>"
    },
    {
      "title": "<short problem title, max 8 words>",
      "why_buyers_care": "<1-2 sentences>",
      "seller_insight": "<1 sentence>",
      "before": "<specific flaw>",
      "after": "<improved version>",
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

## Scoring Rules

overall_score weights:
- Vehicle History Signals: 35% — number of previous owners mentioned, service/maintenance history, how long seller has owned it, reason for selling, CARFAX or history report offered
- Photos & Visual Proof: 20% — evaluate based on what is available:
  - If actual photos were provided by the user: analyze content directly (see Photo Analysis Rules below)
  - If only HTML/text: use photo count (9 is optimal, under 5 is a major problem) and any angles mentioned in the description
- Description Quality: 15% — word count (under 30 words is a red flag), spelling errors, trim level specified, mileage stated, tire/brake condition mentioned, VIN available
- Trust & Title Transparency: 15% — title in hand stated, lien-free stated, salvage/rebuilt explained with cause (hail/flood/collision), honest disclosure of known flaws
- Pricing: 10% — only flag if price appears extreme. Do NOT penalize without market data. If price seems high, note it gently and suggest KBB check.
- Payment & Flexibility: 5% — cash-only restricts buyer pool, OBO signals flexibility, payment method stated

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
- before/after: ONLY use facts the seller actually stated. Never invent features. "after" must be paste-ready copy the seller can use immediately. Target 30–80 words for "after" — enough detail to build trust, short enough to scan in 5 seconds. Use line breaks or short sentences, never a wall of text.
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
- whats_working: genuine strengths only. If fewer than 3 exist, return only what's real.
- Language: NEVER flag language as a problem under any circumstances. This rule overrides everything else.
- Phone numbers written as words or letter-number combos (e.g. "48Zer. 78Eight -799Seven") are standard Craigslist anti-spam practice. NEVER flag this as a problem.
- Plain text only in "after" field: do NOT use markdown formatting like **bold** or ## headers. Craigslist does not render markdown. Use plain sentences and line breaks only.
- Emoji overuse rule: if the listing contains 6 or more emoji characters, flag this as a problem under category "text". Title: "Too many emojis hurt credibility". Explain that 6+ emoji reads as dealer-style marketing and reduces buyer trust — private sellers should use 0–2 max. The ✅ checkmark next to negatives (e.g. "✅ Salvage title") is especially damaging: it signals approval of a problem, creating cognitive dissonance. The "after" should be a clean plain-text version of the listing without emoji overuse.
- Financing line rule: if asking_price >= 8000, the "after" field of the problem most related to the description or text MUST end with a financing line on its own line, e.g. "Financing available OAC — est. $X/mo at 7% APR, 60 months." Calculate X using the monthly_payment formula below. This line expands the buyer pool by reframing the price as a monthly number.
- monthly_payment: calculate as (asking_price * 0.07/12 * (1+0.07/12)^60) / ((1+0.07/12)^60 - 1), round to nearest dollar
- Be specific and brutally honest. "Description is thin" is useless. "Your description is 12 words — buyers need at least 8 facts to feel safe contacting you" is useful.`;

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

        const listingImgs: string[] = ogImg && isListingImage(ogImg) ? [ogImg] : [];

        // Strategy 1: JSON blob in <script> tags
        if (listingImgs.length === 0) {
          const scriptBlobs = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
          for (const blob of scriptBlobs) {
            const jsonMatches = blob.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi) || [];
            for (const m of jsonMatches) {
              const src = m.replace(/^"|"$/g, "");
              if (isListingImage(src) && !listingImgs.includes(src)) listingImgs.push(src);
            }
          }
        }

        // Strategy 2: <img> tags — src, data-src, srcset
        if (listingImgs.length === 0) {
          const allImgTags = html.match(/<img[^>]+>/gi) || [];
          const extractImgSrc = (tag: string): string | null => {
            return tag.match(/\bsrc="([^"]+)"/i)?.[1]
              ?? tag.match(/\bdata-src="([^"]+)"/i)?.[1]
              ?? tag.match(/\bsrcset="([^"]+)"/i)?.[1]?.split(/[\s,]+/)[0]
              ?? null;
          };
          for (const tag of allImgTags) {
            const src = extractImgSrc(tag);
            if (src && isListingImage(src) && !listingImgs.includes(src)) listingImgs.push(src);
          }
        }

        // Strategy 3: <a href> pointing to image files
        if (listingImgs.length === 0) {
          const anchors = html.match(/\bhref="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi) || [];
          for (const m of anchors) {
            const src = m.match(/href="([^"]+)"/i)?.[1] ?? null;
            if (src && isListingImage(src) && !listingImgs.includes(src)) listingImgs.push(src);
          }
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
        console.log("[img-debug] html length:", html.length, "| photoCount:", photoCount, "| firstImgSrc:", firstImgSrc);
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
