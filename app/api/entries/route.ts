import { NextResponse } from "next/server";
import { getEntriesByYear, upsertEntry } from "@/lib/db";
import { currentYear, isYearUnlocked } from "@/lib/valentine";
import { getSessionCookieName, verifySessionToken } from "@/lib/session";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${getSessionCookieName()}=`))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let session;
  try {
    session = await verifySessionToken(token);
  } catch {
    session = null;
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number.parseInt(yearParam, 10) : currentYear();

  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  if (!isYearUnlocked(year)) {
    return NextResponse.json({ error: "This year is still locked." }, { status: 403 });
  }

  const entries = await getEntriesByYear(year);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${getSessionCookieName()}=`))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let session;
  try {
    session = await verifySessionToken(token);
  } catch {
    session = null;
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { year?: number; answers?: Record<string, string> }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const year = body.year ?? currentYear();
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const answers = body.answers ?? {};
  const entry = await upsertEntry(session.partner, year, answers);
  return NextResponse.json({ entry });
}
