import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STRENGTHEN_PROMPT = `You are CarSweetSpot AI. A seller has answered 3 questions about their car. Write a stronger listing draft.

Sources:
- structured_facts and explicit_listing_facts: verified — assert directly
- seller_claims: from original listing — attribute as "Seller states X"
- seller_answers: new info from the seller — treat as unverified claims, attribute as "Seller states X" or "According to the seller, X"

Rules:
- Never assert seller answers as proven facts
- Plain text only — no markdown, no headers, no bullet points
- 100–180 words
- Compelling and specific — this is paste-ready listing copy
- Start with the vehicle and key facts, then weave in seller-provided context

Return ONLY valid JSON: { "stronger_draft": "<the draft text>" }`;

export async function POST(req: NextRequest) {
  try {
    const { structured_facts, explicit_listing_facts, seller_claims, seller_answers } = await req.json();

    if (!seller_answers || !Array.isArray(seller_answers) || seller_answers.length === 0) {
      return NextResponse.json({ error: "seller_answers required" }, { status: 400 });
    }

    const verifiedFacts = [
      ...(structured_facts ?? []),
      ...(explicit_listing_facts ?? []),
    ].map((f: string) => `- ${f}`).join("\n") || "- (none)";

    const claimFacts = (seller_claims ?? []).map((f: string) => `- ${f}`).join("\n") || "- (none)";

    const answers = (seller_answers as string[]).filter(Boolean).map(a => `- ${a}`).join("\n");

    const input = `Verified facts (assert directly):\n${verifiedFacts}\n\nSeller claims from listing (attribute as "Seller states X"):\n${claimFacts}\n\nSeller's new answers (treat as unverified claims — attribute as "Seller states X"):\n${answers}`;

    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      temperature: 0,
      system: STRENGTHEN_PROMPT,
      messages: [{ role: "user", content: input }],
    });

    const raw = resp.content[0].type === "text" ? resp.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "Could not generate stronger draft." }, { status: 500 });
    }

    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ stronger_draft: parsed.stronger_draft ?? "" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
