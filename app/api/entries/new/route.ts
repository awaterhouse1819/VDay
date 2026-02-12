import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/apiAuth";
import { getEntriesForPartnerYear, insertEntrySlot } from "@/lib/db";
import { currentYear } from "@/lib/valentine";

const MAX_SLOTS = 5;

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { year?: number; question?: string; answer?: string }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const year = body.year ? Number.parseInt(String(body.year), 10) : currentYear();
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const question = body.question?.trim();
  const answer = body.answer?.trim();

  if (!question || !answer) {
    return NextResponse.json(
      { error: "Question and answer are required." },
      { status: 400 }
    );
  }

  const existing = await getEntriesForPartnerYear(session.partner, year);
  const usedSlots = new Set(existing.map((entry) => entry.slot));
  const nextSlot = Array.from({ length: MAX_SLOTS }, (_, index) => index + 1).find(
    (slot) => !usedSlots.has(slot)
  );

  if (!nextSlot) {
    return NextResponse.json(
      { error: "All 5 envelopes are sealed for this year." },
      { status: 409 }
    );
  }

  try {
    const entry = await insertEntrySlot(
      session.partner,
      year,
      nextSlot,
      question,
      answer
    );
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json(
      { error: "Unable to seal this envelope." },
      { status: 500 }
    );
  }
}
