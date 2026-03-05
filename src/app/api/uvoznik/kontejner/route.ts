import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { getMojiKontejneriSaStavkama } from "@/src/controllers/kontejner_controller";

export async function GET() {
  const user = await requireUser();
  requireRole(user, ["UVOZNIK"]);

  const res = await getMojiKontejneriSaStavkama(user.id);
  return NextResponse.json(res.json, { status: res.status });
}