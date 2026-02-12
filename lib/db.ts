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
  slot: number;
  question: string;
  answer: string;
};

export type BoardImage = {
  id: string;
  year: number;
  uploaded_by_initials: PartnerId;
  storage_path: string;
  caption: string | null;
  created_at: string;
};

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
    .select("id,year,partner_id,slot,question,answer")
    .eq("year", year)
    .order("partner_id", { ascending: true })
    .order("slot", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function listBoardYears() {
  const { data, error } = await supabaseAdmin
    .from("board_images")
    .select("year")
    .order("year", { ascending: false });
  if (error) throw error;
  const years = Array.from(new Set((data ?? []).map((row) => row.year)));
  years.sort((a, b) => b - a);
  return years;
}

export async function getBoardImagesByYear(year: number) {
  const { data, error } = await supabaseAdmin
    .from("board_images")
    .select("id,year,uploaded_by_initials,storage_path,caption,created_at")
    .eq("year", year)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BoardImage[];
}

export async function insertBoardImage(payload: {
  year: number;
  uploaded_by_initials: PartnerId;
  storage_path: string;
  caption?: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from("board_images")
    .insert({
      year: payload.year,
      uploaded_by_initials: payload.uploaded_by_initials,
      storage_path: payload.storage_path,
      caption: payload.caption ?? null
    })
    .select("id,year,uploaded_by_initials,storage_path,caption,created_at")
    .single();
  if (error) throw error;
  return data as BoardImage;
}

export async function getEntriesForPartnerYear(partner: PartnerId, year: number) {
  const { data, error } = await supabaseAdmin
    .from("entries")
    .select("id,year,partner_id,slot,question,answer")
    .eq("partner_id", partner)
    .eq("year", year)
    .order("slot", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function upsertEntrySlot(
  partner: PartnerId,
  year: number,
  slot: number,
  question: string,
  answer: string
) {
  const { data, error } = await supabaseAdmin
    .from("entries")
    .upsert(
      { partner_id: partner, year, slot, question, answer },
      { onConflict: "partner_id,year,slot" }
    )
    .select("id,year,partner_id,slot,question,answer")
    .single();
  if (error) throw error;
  return data as Entry;
}

export async function insertEntrySlot(
  partner: PartnerId,
  year: number,
  slot: number,
  question: string,
  answer: string
) {
  const { data, error } = await supabaseAdmin
    .from("entries")
    .insert({ partner_id: partner, year, slot, question, answer })
    .select("id,year,partner_id,slot,question,answer")
    .single();
  if (error) throw error;
  return data as Entry;
}

export async function deleteEntrySlot(partner: PartnerId, year: number, slot: number) {
  const { error } = await supabaseAdmin
    .from("entries")
    .delete()
    .eq("partner_id", partner)
    .eq("year", year)
    .eq("slot", slot);
  if (error) throw error;
}
