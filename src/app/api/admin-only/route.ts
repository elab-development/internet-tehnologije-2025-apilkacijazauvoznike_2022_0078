import { NextResponse } from "next/server";
import { requireRole, requireUser } from "@/src/lib/auth_guard";

export async function GET() {
  try {
    const user = await requireUser();
    requireRole(user, ["ADMIN"]);

    return NextResponse.json({ ok: true, message: "Samo ADMIN vidi ovo" });
  } catch (err) {
    if (err instanceof Response) return err;

    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Server greska" },
      { status: 500 }
    );
  }
}
