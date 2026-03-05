
import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { getProizvodMojihDobavljacaById } from "@/src/controllers/uvoznik_controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    requireRole(user, ["UVOZNIK"]);

    const { id } = await params;
    const proizvodId = Number(id);

    if (!Number.isInteger(proizvodId) || proizvodId <= 0) {
      return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });
    }

    const res = await getProizvodMojihDobavljacaById(user.id, proizvodId);
    return NextResponse.json(res.json, { status: res.status });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}