import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, verifyAuthToken } from "@/src/lib/auth";
import { db } from "@/src/db";
import { korisnik } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { getURL } from "next/dist/shared/lib/utils";
import { getUserById } from "@/src/controllers/auth_controller";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED", message: "Niste ulogovani" },
        { status: 401 }
      );
    }

    const claims = verifyAuthToken(token); // { sub, email, uloga }

    const u = await getUserById(claims.sub);
   
    if (!u) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED", message: "Korisnik ne postoji" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { id: u.id, imePrezime: u.imePrezime, email: u.email, uloga: u.uloga },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED", message: "Token nije validan" },
      { status: 401 }
    );
  }
}