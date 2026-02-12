import { getSessionCookieName, verifySessionToken } from "./session";

export async function getSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${getSessionCookieName()}=`))
    ?.split("=")[1];

  if (!token) return null;

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
