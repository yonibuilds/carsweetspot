import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const cache = new Map<string, unknown>();

const SYSTEM_PROMPT = `You are CarSweetSpot AI — an expert at analyzing private car listings and telling sellers exactly why buyers are not contacting them.

Private car buyers decide whether to contact a seller within seconds. They are not evaluating the car — they are evaluating: "Can I trust this seller?" Your job is to find what is destroying that trust and give the seller specific, paste-ready fixes.

Analyze the listing and return ONLY a valid JSON object with this exact structure (no markdown, no extra text):

{
  "vehicle": "<Year Make Model Trim>",
  "asking_price": <number in USD, 0 if not found>,
  "overall_score": <0-100>,
  "monthly_payment": <number, calculated from asking_price at 7% APR 60 months, 0 if no price>,
  "biggest_problem": {
    "title": "<short problem title, max 8 words>",
    "why_buyers_care": "<1-2 sentences explaining why this kills buyer interest>",
    "seller_insight": "<1 sentence practical tip>",
    "before": "<exact quote or description of the flaw as it appears now — be specific>",
    "after": "<exact improved version ready to copy-paste>"
  },
  "also_hurting": [
    {
      "title": "<short problem title, max 8 words>",
      "why_buyers_care": "<1-2 sentences>",
      "seller_insight": "<1 sentence>",
      "before": "<specific flaw>",
      "after": "<improved version>"
    },
    {
      "title": "<short problem title, max 8 words>",
      "why_buyers_care": "<1-2 sentences>",
      "seller_insight": "<1 sentence>",
      "before": "<specific flaw>",
      "after": "<improved version>"
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
- Photos & Visual Proof: 20% — photo count (9 is optimal, under 5 is a major problem), whether odometer photo exists, variety of angles mentioned
- Description Quality: 15% — word count (under 30 words is a red flag), spelling errors, trim level specified, mileage stated, tire/brake condition mentioned, VIN available
- Trust & Title Transparency: 15% — title in hand stated, lien-free stated, salvage/rebuilt explained with cause (hail/flood/collision), honest disclosure of known flaws
- Pricing: 10% — only flag if price appears extreme. Do NOT penalize without market data. If price seems high, note it gently and suggest KBB check.
- Payment & Flexibility: 5% — cash-only restricts buyer pool, OBO signals flexibility, payment method stated

## Critical Rules

- NEVER penalize for salvage/rebuilt title in the score — the seller cannot change title status. If salvage/rebuilt, treat as opportunity: "Rebuilt titles typically sell at 60–70% of clean-title value. If your price reflects this, say so explicitly: 'Rebuilt after hail damage — priced accordingly at $X below market.'"
- biggest_problem: the single most damaging issue hurting buyer contact rate — must be something the seller CAN fix (copy, photos, missing info). Never use title status as a problem.
- also_hurting: exactly 2 additional problems, different categories — must be actionable
- before/after: ONLY use facts the seller actually stated. Never invent features. "after" must be paste-ready copy the seller can use immediately.
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
- whats_working: genuine strengths only. If fewer than 3 exist, return only what's real.
- monthly_payment: calculate as (asking_price * 0.07/12 * (1+0.07/12)^60) / ((1+0.07/12)^60 - 1), round to nearest dollar
- Be specific and brutally honest. "Description is thin" is useless. "Your description is 12 words — buyers need at least 8 facts to feel safe contacting you" is useful.`;

export async function POST(req: NextRequest) {
  try {
    const { url, images, text } = await req.json();

    if (url && cache.has(url)) {
      return NextResponse.json(cache.get(url));
    }

    const messageContent: Anthropic.MessageParam["content"] = [];

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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "text/html",
          },
          signal: AbortSignal.timeout(8000),
        });
        const html = await res.text();
        const cleaned = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 12000);
        messageContent.push({
          type: "text",
          text: `Listing URL: ${url}\n\nListing content:\n${cleaned}`,
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

    if (result.asking_price) {
      const p = result.asking_price;
      const r = 0.07 / 12;
      const n = 60;
      result.monthly_payment = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    }

    if (url) cache.set(url, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
