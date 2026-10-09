import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "vc_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET não configurado no .env");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(username: string, expiresAt: Date) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload as { username: string };
  } catch {
    return null;
  }
}
