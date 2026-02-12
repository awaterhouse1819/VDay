import bcrypt from "bcryptjs";

export const PARTNERS = ["ACW", "SLS"] as const;
export type PartnerId = (typeof PARTNERS)[number];

export const PARTNER_NAMES: Record<PartnerId, string> = {
  ACW: "Anna",
  SLS: "Samara"
};

export function isPartnerId(value: string): value is PartnerId {
  return PARTNERS.includes(value as PartnerId);
}

export function requireUppercaseInitials(raw: string | undefined | null): PartnerId | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed !== trimmed.toUpperCase()) return null;
  if (!isPartnerId(trimmed)) return null;
  return trimmed;
}

function getPartnerPasswordHash(partner: PartnerId) {
  const hash =
    partner === "ACW" ? process.env.ACW_PASSWORD_HASH : process.env.SLS_PASSWORD_HASH;
  if (!hash || !hash.trim()) return null;
  return hash.trim();
}

function getPartnerPlainPassword(partner: PartnerId) {
  const shared = process.env.PLAINTEXT_PASSWORD;
  if (shared && shared.trim()) return shared.trim();
  const plain = partner === "ACW" ? process.env.ACW_PASSWORD : process.env.SLS_PASSWORD;
  if (!plain || !plain.trim()) return null;
  return plain.trim();
}

export async function verifyPartnerPassword(partner: PartnerId, password: string) {
  const hash = getPartnerPasswordHash(partner);
  if (hash) {
    return bcrypt.compare(password, hash);
  }
  const plain = getPartnerPlainPassword(partner);
  if (!plain) return false;
  return password === plain;
}
