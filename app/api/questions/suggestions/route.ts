import { NextResponse } from "next/server";
import { questionBank } from "@/lib/questionBank";

function sampleQuestions(count: number) {
  const unique = new Set<string>();
  const max = Math.min(count, questionBank.length);
  while (unique.size < max) {
    const idx = Math.floor(Math.random() * questionBank.length);
    unique.add(questionBank[idx]);
  }
  return Array.from(unique);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCount = searchParams.get("count") ?? "12";
  const parsed = Number.parseInt(rawCount, 10);
  const count = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 20) : 12;
  return NextResponse.json({ questions: sampleQuestions(count) });
}
