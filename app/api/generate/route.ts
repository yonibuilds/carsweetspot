import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GENERATE_PROMPT = `You are CarSweetSpot AI. A seller has answered 3 confirmation questions about their car. Write one final listing draft.

Sources:
- structured_facts and explicit_listing_facts: verified — assert directly
- seller_claims: from original listing — attribute as "Seller states X"
- confirmation_answers: seller's just-provided answers — treat as seller claims, attribute as "Seller states X"

Rules:
- Never assert confirmation_answers as proven facts — always "Seller states X"
- Plain text only — no markdown, no headers, no bullet points
- 100–180 words
- Write in first person or neutral listing style — the seller will paste this directly into their listing
- Start with the vehicle and key verified facts, then weave in seller-provided context
- GOOD: "2021 Traverse RS, 53,000 miles, rebuilt title — seller states front left fender repaired, no airbags deployed. Seller states documentation available. $18,500, Gilbert AZ."
- BAD: "This Traverse has been owned for 1–2 years and is being sold because the owner no longer needs it. The seller's relatively short ownership period suggests the vehicle has been well-maintained..."
- NEVER use: "This [vehicle] has been...", "The seller has owned...", "The vehicle demonstrates...", editorial phrases that interpret or draw conclusions
- NEVER use bare trust claims as assertions: "well-maintained", "reliable", "no issues" — if seller stated it: "Seller states X"

Return ONLY valid JSON: { "final_draft": "<the draft text>" }`;

const TRUST_CLAIM_PATTERNS = [
  /no\s+mechanical\s+issues?/i, /no\s+issues?\b/i, /no\s+problems?\b/i,
  /well[\s-]maintained/i,
  /runs\s+and\s+drives\s+(great|well|perfect|fine|smooth)/i,
  /runs\s+great/i, /drives\s+great/i,
  /no\s+accidents?\b/i,
];

const sanitizeDraft = (text: string): string => {
  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  return sentences
    .map(s => {
      // Strip bare trust claims — if no "Seller states" prefix, remove
      for (const pat of TRUST_CLAIM_PATTERNS) {
        if (pat.test(s) && !/seller\s+states/i.test(s)) return "";
      }
      return s;
    })
    .filter(Boolean)
    .join(" ")
    .trim();
};

export async function POST(req: NextRequest) {
  try {
    const { structured_facts, explicit_listing_facts, seller_claims, confirmation_answers } = await req.json();

    if (!confirmation_answers || !Array.isArray(confirmation_answers) || confirmation_answers.length === 0) {
      return NextResponse.json({ error: "confirmation_answers required" }, { status: 400 });
    }

    const verifiedFacts = [
      ...(structured_facts ?? []),
      ...(explicit_listing_facts ?? []),
    ].map((f: string) => `- ${f}`).join("\n") || "- (none)";

    const claimFacts = (seller_claims ?? []).map((f: string) => `- ${f}`).join("\n") || "- (none)";

    const answers = (confirmation_answers as string[]).filter(Boolean).map(a => `- ${a}`).join("\n");

    const input = `Verified facts (assert directly):\n${verifiedFacts}\n\nSeller claims from listing (attribute as "Seller states X"):\n${claimFacts}\n\nSeller's confirmation answers (attribute as "Seller states X"):\n${answers}`;

    const resp = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      temperature: 0,
      system: GENERATE_PROMPT,
      messages: [{ role: "user", content: input }],
    });

    const raw = resp.content[0].type === "text" ? resp.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "Could not generate listing draft." }, { status: 500 });
    }

    const parsed = JSON.parse(match[0]);
    const draft = sanitizeDraft(parsed.final_draft ?? "");
    return NextResponse.json({ final_draft: draft });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
