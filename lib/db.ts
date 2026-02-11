import { supabaseAdmin } from "./supabase";
import type { PartnerId } from "./auth";

export type Question = {
  id: number;
  prompt: string;
  is_active: boolean;
};

export type Entry = {
  id: number;
  year: number;
  partner_id: PartnerId;
  answers: Record<string, string>;
};

export async function getActiveQuestions() {
  const { data, error } = await supabaseAdmin
    .from("questions")
    .select("id,prompt,is_active")
    .eq("is_active", true)
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Question[];
}

export async function getAllQuestions() {
  const { data, error } = await supabaseAdmin
    .from("questions")
    .select("id,prompt,is_active")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Question[];
}

export async function getOrCreateEntry(partner: PartnerId, year: number) {
  const { data: existing, error } = await supabaseAdmin
    .from("entries")
    .select("id,year,partner_id,answers")
    .eq("partner_id", partner)
    .eq("year", year)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing as Entry;

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("entries")
    .insert({ partner_id: partner, year, answers: {} })
    .select("id,year,partner_id,answers")
    .single();
  if (insertError) throw insertError;
  return inserted as Entry;
}

export async function upsertEntry(
  partner: PartnerId,
  year: number,
  answers: Record<string, string>
) {
  const { data, error } = await supabaseAdmin
    .from("entries")
    .upsert(
      { partner_id: partner, year, answers },
      { onConflict: "partner_id,year" }
    )
    .select("id,year,partner_id,answers")
    .single();
  if (error) throw error;
  return data as Entry;
}

export async function listYearsWithEntries() {
  const { data, error } = await supabaseAdmin
    .from("entries")
    .select("year")
    .order("year", { ascending: false });
  if (error) throw error;
  const years = Array.from(new Set((data ?? []).map((row) => row.year)));
  years.sort((a, b) => b - a);
  return years;
}

export async function getEntriesByYear(year: number) {
  const { data, error } = await supabaseAdmin
    .from("entries")
    .select("id,year,partner_id,answers")
    .eq("year", year);
  if (error) throw error;
  return (data ?? []) as Entry[];
}
