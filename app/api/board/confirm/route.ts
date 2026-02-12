import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/apiAuth";
import { insertBoardImage } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { year?: number; storage_path?: string; caption?: string | null }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const year = body.year ? Number.parseInt(String(body.year), 10) : NaN;
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const storagePath = body.storage_path?.trim();
  if (!storagePath) {
    return NextResponse.json({ error: "Missing storage_path" }, { status: 400 });
  }

  const expectedPrefix = `${year}/${session.partner}/`;
  if (!storagePath.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
  }

  const entry = await insertBoardImage({
    year,
    uploaded_by_initials: session.partner,
    storage_path: storagePath,
    caption: body.caption ?? null
  });

  return NextResponse.json({ image: entry });
}
