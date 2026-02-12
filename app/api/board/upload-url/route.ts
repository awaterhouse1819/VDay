import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "vday-board";
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic"
};

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { year?: number; fileName?: string; contentType?: string }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const year = body.year ? Number.parseInt(String(body.year), 10) : NaN;
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const contentType = body.contentType ?? "";
  const extension = ALLOWED_TYPES[contentType];
  if (!extension) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const storagePath = `${year}/${session.partner}/${id}.${extension}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Unable to create upload URL" }, { status: 500 });
  }

  return NextResponse.json({
    uploadUrl: data.signedUrl,
    storage_path: storagePath
  });
}
