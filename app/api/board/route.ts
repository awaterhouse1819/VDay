import { NextResponse } from "next/server";
import { getBoardImagesByYear } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/apiAuth";
import { isYearUnlocked } from "@/lib/valentine";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "vday-board";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number.parseInt(yearParam, 10) : NaN;

  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  if (!isYearUnlocked(year)) {
    return NextResponse.json({ locked: true, images: [] });
  }

  const images = await getBoardImagesByYear(year);
  const signedImages = await Promise.all(
    images.map(async (image) => {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(image.storage_path, 3600);
      if (error || !data?.signedUrl) {
        return null;
      }
      return {
        id: image.id,
        url: data.signedUrl,
        caption: image.caption,
        uploaded_by_initials: image.uploaded_by_initials,
        created_at: image.created_at
      };
    })
  );

  return NextResponse.json({
    locked: false,
    images: signedImages.filter(Boolean)
  });
}
