import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { getMojiProizvodiDobavljaca } from "@/src/controllers/dobavljac_controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const user = await requireUser();
  requireRole(user, ["DOBAVLJAC"]);

  const url = new URL(req.url);
  const kategorijaId = url.searchParams.get("kategorijaId");

  const res = await getMojiProizvodiDobavljaca(user.id, {
    kategorijaId: kategorijaId ? Number(kategorijaId) : undefined,
  });

  return NextResponse.json(res.json, { status: res.status });
}