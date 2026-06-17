import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const cache = new Map<string, unknown>();

const SYSTEM_PROMPT = `You are CarSweetSpot AI — an expert at analyzing private car listings and telling sellers exactly why their car isn't selling and how to fix it.

Analyze the listing provided and return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "vehicle": "<Year Make Model Trim>",
  "asking_price": <number in USD, 0 if not found>,
  "overall_score": <0-100>,
  "spots": {
    "pricing": { "score": <0-100>, "label": "<Sweet|Good|OK|Needs Work|Missing>", "summary": "<one sentence honest assessment>" },
    "listing": { "score": <0-100>, "label": "<Sweet|Good|OK|Needs Work|Missing>", "summary": "<one sentence honest assessment>" },
    "trust": { "score": <0-100>, "label": "<Sweet|Good|OK|Needs Work|Missing>", "summary": "<one sentence honest assessment>" },
    "financing": { "score": <0-100>, "label": "<Sweet|Good|OK|Needs Work|Missing>", "summary": "<one sentence honest assessment>" }
  },
  "free_insights": [
    "<specific, actionable insight — what exactly is wrong and what to do>",
    "<specific, actionable insight>",
    "<specific, actionable insight>"
  ],
  "quick_wins": [
    {
      "text": "<exact sentence or two ready to copy-paste into the listing, specific to this car>",
      "boost": "<e.g. '+15 Trust'>",
      "spot": "<trust|financing|listing|pricing>"
    }
  ],
  "locked_count": <number between 5 and 12 representing additional premium insights>
}

Scoring rules:
- pricing: Is the asking price competitive for the market? Consider mileage, year, condition.
- listing: Title quality, description detail, photo count/quality, keywords used.
- trust: Maintenance history, CARFAX mention, response time hints, seller info.
- financing: Does the listing mention monthly payments or make it easy for a buyer to understand affordability?
- overall_score: weighted average (pricing 30%, listing 35%, trust 25%, financing 10%)

quick_wins rules:
- Generate 2-3 items, only for spots scoring below 75
- Each text must mention specifics from this car (year/make/model/mileage/price — whatever is known)
- trust spot: a sentence about vehicle history or inspection (e.g. "Maintenance records available — oil changes every 5,000 miles.")
- financing spot: include the actual monthly payment number (e.g. "Financing-friendly price — roughly $285/month for 60 months.")
- listing spot: one specific keyword-rich sentence missing from the description
- pricing spot: one sentence that frames the price as fair vs. comparable listings
- No brackets, no placeholders — text must be paste-ready
- Max 2 sentences per item

Be honest and specific. Vague feedback is useless. If something is missing, say what's missing.`;

export async function POST(req: NextRequest) {
  try {
    const { url, images, text } = await req.json();

    if (url && cache.has(url)) {
      return NextResponse.json(cache.get(url));
    }

    const messageContent: Anthropic.MessageParam["content"] = [];

    // Add images if provided
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

    // Fetch URL content if provided
    if (url) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
          {
            error:
              "Could not fetch this URL. Facebook listings require login — try the Screenshots tab instead.",
          },
          { status: 400 }
        );
      }
    }

    // Free text fallback
    if (text) {
      messageContent.push({
        type: "text",
        text: `Listing text:\n${text}`,
      });
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
      max_tokens: 1024,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: messageContent }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Analysis failed. Please try again." },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);
    if (url) cache.set(url, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
