import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { getSviDobavljaciBezSaradnje } from "@/src/controllers/uvoznik_controller";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    requireRole(user, ["UVOZNIK"]);

    const res = await getSviDobavljaciBezSaradnje(user.id);
    return NextResponse.json(res.json, { status: res.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}