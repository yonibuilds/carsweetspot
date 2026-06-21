import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a car listing analyst. Your only job is to evaluate a private car listing and return a structured JSON report.

CORE PRINCIPLE: Only use facts that are explicitly stated in the listing. Never invent, assume, or imply facts that are not present. If information is missing, say so in seller_insight — never in the after field.

## Output format

Return ONLY valid JSON with these fields in this exact order:

{
  "vehicle": "<Year Make Model Trim, extracted from listing>",
  "asking_price": <integer USD, 0 if not found>,
  "overall_score": <integer 0-100>,
  "monthly_payment": <integer, 7% APR 60 months from asking_price, 0 if no price>,
  "verified_facts": [
    "<fact explicitly stated in listing — quote or close paraphrase only>",
    "<another verified fact>"
  ],
  "unsafe_to_claim": [
    "<something NOT stated that would be false or risky to include in rewrite>",
    "<another unsafe claim>"
  ],
  "biggest_problem": {
    "title": "<max 8 words>",
    "why_buyers_care": "<1-2 sentences, benchmark language only — no emotional words>",
    "seller_insight": "<1 sentence: what the seller should add or change — suggestions go here, not in after>",
    "before": "<direct quote or close description of the flaw>",
    "after": "<paste-ready rewrite using ONLY verified_facts and safe generic language — no invented facts, no questions, no placeholders>",
    "category": "<trust | text | photos>"
  },
  "also_hurting": [
    {
      "title": "<max 8 words>",
      "why_buyers_care": "<1-2 sentences>",
      "seller_insight": "<1 sentence>",
      "before": "<specific flaw>",
      "after": "<paste-ready rewrite — verified facts only>",
      "category": "<trust | text | photos>"
    },
    {
      "title": "<max 8 words>",
      "why_buyers_care": "<1-2 sentences>",
      "seller_insight": "<1 sentence>",
      "before": "<specific flaw>",
      "after": "<paste-ready rewrite — verified facts only>",
      "category": "<trust | text | photos>"
    }
  ],
  "opportunities": [
    {
      "title": "<max 6 words>",
      "insight": "<1-2 sentences>",
      "type": "<financing | carfax | inspection | title | photos | description | garage | warranty | price | payment>"
    }
  ],
  "whats_working": [
    "<specific verified strength>",
    "<another strength>"
  ]
}

## Scoring
- 45-60: Missing most trust signals
- 60-75: Some signals present, key gaps remain
- 75-85: Multiple confirmed trust signals
- 85-92: Strong across most dimensions
- 92+: Reserve for near-perfect listings

Score weights: History signals 35%, Photos 20%, Description 15%, Trust/Title 15%, Pricing 10%, Payment flexibility 5%

## Hard rules

1. verified_facts: only include what is explicitly in the listing text. Do not infer.
2. unsafe_to_claim: list everything missing that a seller might want to add but isn't confirmed.
3. after field: cross-check every sentence against verified_facts. If a fact is not in verified_facts, remove it from after.
4. Never include in after: reason for sale (unless stated), service history (unless stated), ownership count (unless stated), accident history (unless stated), garage storage (unless stated), warranty (unless stated).
5. No questions in after field — questions go in seller_insight only.
6. No markdown in after field — plain text only.
7. biggest_problem and also_hurting must each have a different category (trust / text / photos must each appear once across the three).
8. Rebuilt/salvage title: never penalize in score. Treat as opportunity — suggest pricing at 60-70% of clean-title equivalent.
9. Language: never flag listing language as a problem.
10. Phone numbers written as words or letter-number combos are Craigslist anti-spam — never flag.
11. If asking_price >= 8000, the text-related after field must end with: "Financing available OAC — est. $X/mo at 7% APR, 60 months." Calculate X from monthly_payment formula.
12. Use benchmark counts, not emotional language. Example: "18 words vs. 150-250 typical of high-contact listings" not "extremely sparse."
13. whats_working: only genuine strengths sourced from verified_facts.
14. Contradiction rule: if a fact appears in verified_facts, do NOT also flag it as missing in issues or opportunities.`;

async function fetchListing(url: string): Promise<{ cleaned: string; photoCount: number; detectedPrice: number | null; isWallOfText: boolean }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(8000),
  });
  const html = await res.text();

  if (/this posting has been deleted|this posting has expired|no longer available/i.test(html) || res.status === 404) {
    throw new Error("This listing has been deleted or expired.");
  }

  const imgSrcs: string[] = [];
  const isListingImage = (s: string) =>
    /^https?:\/\//i.test(s) && /\.(jpg|jpeg|png|webp)/i.test(s) &&
    !/logo|icon|avatar|sprite|pixel|tracking|blank/i.test(s) && !/1x1|spacer/i.test(s);

  const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
  if (ogImg && isListingImage(ogImg)) imgSrcs.push(ogImg);

  if (imgSrcs.length === 0) {
    const blobs = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const b of blobs) {
      for (const m of b.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi) || []) {
        const s = m.replace(/^"|"$/g, "");
        if (isListingImage(s) && !imgSrcs.includes(s)) imgSrcs.push(s);
      }
    }
  }

  const withBreaks = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ");
  const paragraphs = withBreaks.split("\n").map(s => s.trim()).filter(s => s.length > 30);
  const longestPara = paragraphs.length > 0 ? Math.max(...paragraphs.map(p => p.length)) : 0;
  const isWallOfText = longestPara > 500 && paragraphs.length < 3;

  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);

  const allPrices = [...cleaned.matchAll(/\$\s*([\d,]+)/g)]
    .map(m => parseInt(m[1].replace(/,/g, ""), 10))
    .filter(n => !isNaN(n) && n >= 1000 && n <= 300000);
  const detectedPrice = allPrices.length > 0 ? allPrices[0] : null;

  return { cleaned, photoCount: imgSrcs.length, detectedPrice, isWallOfText };
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured." }, { status: 500 });
    }

    const { url, text } = await req.json();

    let userContent = "";
    let detectedPrice: number | null = null;

    if (url) {
      try {
        const { cleaned, photoCount, detectedPrice: dp, isWallOfText } = await fetchListing(url);
        detectedPrice = dp;
        const photoNote = photoCount > 0
          ? `\n[PHOTO COUNT: ${photoCount} photos detected — do not flag photos as missing]`
          : `\n[PHOTO COUNT: could not detect from HTML]`;
        const formatNote = isWallOfText
          ? `\n[FORMATTING: wall of text detected — flag under opportunities]`
          : `\n[FORMATTING: paragraph breaks present — do not flag formatting]`;
        const priceNote = dp ? `\n[PRICE DETECTED: $${dp.toLocaleString()} — use as asking_price]` : "";
        userContent = `Listing URL: ${url}\n\n${cleaned}${photoNote}${formatNote}${priceNote}`;
      } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Could not fetch listing." }, { status: 400 });
      }
    } else if (text) {
      userContent = `Listing text:\n${text}`;
    } else {
      return NextResponse.json({ error: "Provide a URL or listing text." }, { status: 400 });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent + "\n\nAnalyze this listing and return the JSON report." },
      ],
    });

    const rawText = response.choices[0]?.message?.content ?? "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Analysis failed — no JSON returned." }, { status: 500 });

    const result = JSON.parse(jsonMatch[0]);

    if (!result.asking_price && detectedPrice) result.asking_price = detectedPrice;
    if (result.asking_price) {
      const p = result.asking_price, r = 0.07 / 12, n = 60;
      result.monthly_payment = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
