import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const cache = new Map<string, unknown>();

const SYSTEM_PROMPT = `You are CarSweetSpot AI — an expert at analyzing private car listings and telling sellers exactly why buyers are not contacting them.

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
      "title": "Financing",
      "insight": "<buyer-conversion insight about monthly payment — use the monthly_payment number>",
      "type": "financing"
    },
    {
      "title": "Vehicle Inspection",
      "insight": "<why a pre-sale inspection builds trust and converts buyers>",
      "type": "inspection"
    },
    {
      "title": "CARFAX Report",
      "insight": "<why linking a CARFAX report increases serious inquiries>",
      "type": "carfax"
    }
  ],
  "whats_working": [
    "<specific strength from the listing>",
    "<specific strength>",
    "<specific strength>"
  ]
}

Rules:
- overall_score: weighted (pricing 30%, listing quality 35%, trust signals 25%, financing info 10%)
- overall_score: NEVER penalize for salvage/rebuilt title — the seller cannot change the title status. Score as if the title were clean, and treat it as an opportunity instead.
- biggest_problem: the single most damaging issue hurting buyer contact rate — must be something the seller can actually fix (copy, photos, price, missing info). Never use title status as a problem.
- also_hurting: exactly 2 additional problems, different categories from biggest_problem — must be actionable by the seller
- before/after: ONLY facts the seller stated. Never invent features not in the listing. "after" must be paste-ready.
- whats_working: genuine strengths, not filler. If fewer than 3 exist, only return what's real.
- monthly_payment: calculate as (asking_price * 0.07/12 * (1+0.07/12)^60) / ((1+0.07/12)^60 - 1), round to nearest dollar
- Be specific and honest. Vague feedback is useless.`;

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
