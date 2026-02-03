import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { getProizvodiMojihDobavljaca } from "@/src/controllers/uvoznik_controller";

export async function GET() {
  const user = await requireUser();
  requireRole(user, ["UVOZNIK"]);

  const res = await getProizvodiMojihDobavljaca(user.id);
  return NextResponse.json(res.json, { status: res.status });
}