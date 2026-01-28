import { NextResponse } from "next/server";
import { registerUser } from "@/src/controllers/auth_controller";
import { AUTH_COOKIE, cookieOpts, signAuthToken } from "@/src/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await registerUser({
      imePrezime: body.imePrezime,
      email: body.email,
      sifra: body.sifra,
      uloga: body.uloga, // opcionalno
    });

    if (!result.ok) {
      const status = result.error.code === "EMAIL_EXISTS" ? 409 : 400;

      return NextResponse.json(
        { ok: false, error: result.error.code, message: result.error.message },
        { status }
      );
    }

    const token = signAuthToken({
      sub: result.data.id,
      email: result.data.email,
      uloga: result.data.uloga,
    });

    const res = NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    res.cookies.set(AUTH_COOKIE, token, cookieOpts());
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Greska pri registraciji", details: err?.message },
      { status: 500 }
    );
  }
}