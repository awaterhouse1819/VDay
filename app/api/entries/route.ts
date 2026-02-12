import { NextResponse } from "next/server";
import { deleteEntrySlot, getEntriesForPartnerYear, upsertEntrySlot } from "@/lib/db";
import { currentYear } from "@/lib/valentine";
import { getSessionFromRequest } from "@/lib/apiAuth";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number.parseInt(yearParam, 10) : currentYear();

  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const entries = await getEntriesForPartnerYear(session.partner, year);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { year?: number; slot?: number; question?: string; answer?: string }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const year = body.year ? Number.parseInt(String(body.year), 10) : currentYear();
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const slot = body.slot ? Number.parseInt(String(body.slot), 10) : NaN;
  if (!Number.isFinite(slot) || slot < 1 || slot > 5) {
    return NextResponse.json({ error: "Slot must be between 1 and 5." }, { status: 400 });
  }

  const question = body.question?.trim();
  const answer = body.answer?.trim();

  if (!question || !answer) {
    return NextResponse.json(
      { error: "Question and answer are required." },
      { status: 400 }
    );
  }

  const entry = await upsertEntrySlot(session.partner, year, slot, question, answer);
  return NextResponse.json({ entry });
}

export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { year?: number; slot?: number }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const year = body.year ? Number.parseInt(String(body.year), 10) : currentYear();
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const slot = body.slot ? Number.parseInt(String(body.slot), 10) : NaN;
  if (!Number.isFinite(slot) || slot < 1 || slot > 5) {
    return NextResponse.json({ error: "Slot must be between 1 and 5." }, { status: 400 });
  }

  await deleteEntrySlot(session.partner, year, slot);
  return NextResponse.json({ ok: true });
}
