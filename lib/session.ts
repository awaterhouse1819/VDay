import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { PartnerId } from "./auth";

const encoder = new TextEncoder();
const SESSION_COOKIE = "vtimecapsule_session";
const SESSION_TTL_DAYS = 30;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.");
  }
  return secret;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export type SessionPayload = {
  partner: PartnerId;
};

export async function signSession(partner: PartnerId) {
  const secret = encoder.encode(getSessionSecret());
  return new SignJWT({ partner })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const secret = encoder.encode(getSessionSecret());
  const { payload } = await jwtVerify(token, secret);
  const partner = payload.partner;
  if (partner !== "ACW" && partner !== "SLS") {
    return null;
  }
  return { partner } satisfies SessionPayload;
}

async function getCookieStore() {
  return await cookies();
}

export async function setSessionCookie(partner: PartnerId) {
  const token = await signSession(partner);
  const cookieStore = await getCookieStore();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60
  });
}

export async function clearSessionCookie() {
  const cookieStore = await getCookieStore();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export async function getSessionFromCookies() {
  const cookieStore = await getCookieStore();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
