import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { UserRole } from "@/types/permissions";

export const familySessionCookie = "family_schedule_session";

const roles: UserRole[] = ["admin", "parent", "child_editor"];
type SessionRole = UserRole | "display";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;

type Session = {
  role: SessionRole;
  exp: number;
};

type AuthState = {
  password_hashes?: Partial<Record<UserRole, string>>;
};

function sessionSecret() {
  const value = process.env.FAMILY_SESSION_SECRET;
  return value && value.length >= 32 ? value : null;
}

function rolePassword(role: UserRole) {
  const name = `FAMILY_${role.toUpperCase()}_PASSWORD`;
  return process.env[name];
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sameText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function readAuthState(state: unknown): AuthState {
  if (!state || typeof state !== "object") return {};
  const value = (state as Record<string, unknown>).__family_auth;
  if (!value || typeof value !== "object") return {};
  const password_hashes = (value as AuthState).password_hashes;
  return password_hashes && typeof password_hashes === "object" ? { password_hashes } : {};
}

export function withoutPrivateAuth(state: unknown) {
  if (!state || typeof state !== "object") return state;
  const { __family_auth: _privateAuth, ...safeState } = state as Record<string, unknown>;
  return safeState;
}

export function withExistingPrivateAuth(state: unknown, existingState: unknown) {
  const safeState = withoutPrivateAuth(state) as Record<string, unknown>;
  const auth = readAuthState(existingState);
  return auth.password_hashes ? { ...safeState, __family_auth: auth } : safeState;
}

export function updatePasswordHash(state: unknown, role: UserRole, password: string) {
  const safeState = withoutPrivateAuth(state) as Record<string, unknown>;
  const auth = readAuthState(state);
  return {
    ...safeState,
    __family_auth: {
      password_hashes: {
        ...auth.password_hashes,
        [role]: hashPassword(password)
      }
    }
  };
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${base64Url(salt)}$${base64Url(derived)}`;
}

function matchesHash(password: string, encoded: string) {
  const [kind, salt, expected] = encoded.split("$");
  if (kind !== "scrypt" || !salt || !expected) return false;
  try {
    return sameText(base64Url(scryptSync(password, Buffer.from(salt, "base64url"), 64)), expected);
  } catch {
    return false;
  }
}

export function verifyRolePassword(role: UserRole, password: string, state: unknown) {
  if (!roles.includes(role) || !password) return { ok: false, reason: "invalid" as const };
  const stored = readAuthState(state).password_hashes?.[role];
  if (stored) return { ok: matchesHash(password, stored), reason: "stored" as const };

  const initialPassword = rolePassword(role);
  if (!initialPassword) return { ok: false, reason: "missing_configuration" as const };
  return { ok: sameText(password, initialPassword), reason: "environment" as const };
}

export function createSession(role: SessionRole) {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload: Session = { role, exp: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds };
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function readSession(request: Request): Session | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${familySessionCookie}=`))?.slice(familySessionCookie.length + 1);
  if (!value) return null;
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  if (!sameText(signature, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Session;
    if (![...roles, "display"].includes(parsed.role) || !Number.isFinite(parsed.exp) || parsed.exp <= Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function verifyDisplayToken(token: string) {
  const expected = process.env.FAMILY_DISPLAY_TOKEN;
  return Boolean(expected && token && sameText(token, expected));
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionLifetimeSeconds
  };
}

export function clearSessionCookieOptions() {
  return { ...sessionCookieOptions(), maxAge: 0 };
}
