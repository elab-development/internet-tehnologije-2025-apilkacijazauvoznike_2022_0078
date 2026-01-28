import { NextResponse } from "next/server";
import { loginUser } from "@/src/controllers/auth_controller";
import { AUTH_COOKIE, cookieOpts, signAuthToken } from "@/src/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await loginUser({ email: body.email, sifra: body.sifra });

    if (!result.ok) {
      const status = result.error.code === "INVALID_CREDENTIALS" ? 401
        : result.error.code === "USER_DISABLED" ? 403
        : 400;

      return NextResponse.json(
        { ok: false, error: result.error.code, message: result.error.message },
        { status }
      );
    }

    // cookie + jwt su HTTP nivo => ovde u ruti
    const token = signAuthToken({
      sub: result.data.id,
      email: result.data.email,
      uloga: result.data.uloga,
    });

    const res = NextResponse.json({ ok: true, data: result.data });
    res.cookies.set(AUTH_COOKIE, token, cookieOpts());
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Greska pri login-u", details: err?.message },
      { status: 500 }
    );
  }
}