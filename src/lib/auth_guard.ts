import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, verifyAuthToken, type JwtUserClaims } from "@/src/lib/auth";
import { getUserById } from "@/src/controllers/auth_controller";

export type Role = JwtUserClaims["uloga"];

export type CurrentUser = {
  id: number;
  imePrezime: string;
  email: string;
  uloga: Role;
  status: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  //uzmia token iz cookiea
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  //provera tokena 
  let claims: { sub: number; email: string; uloga: Role };
  try {
    claims = verifyAuthToken(token);
  } catch {
    return null;
  }

  const u = await getUserById(claims.sub);
  if (!u) return null;

  return {
    id: u.id,
    imePrezime: u.imePrezime,
    email: u.email,
    uloga: u.uloga,
    status: u.status,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw NextResponse.json(
      { ok: false, error: "UNAUTHORIZED", message: "Niste ulogovani" },
      { status: 401 }
    );
  }
  if (!user.status) {
    throw NextResponse.json(
      { ok: false, error: "USER_DISABLED", message: "Korisnik je deaktiviran" },
      { status: 403 }
    );
  }
  return user;
}

export function requireRole(user: CurrentUser, allowed: Role[]) {
  if (!allowed.includes(user.uloga)) {
    throw NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: "Nemate dozvolu za ovu akciju" },
      { status: 403 }
    );
  }
}
