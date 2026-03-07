import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { getPrihodPoProizvodima } from "@/src/controllers/dobavljac_analitika_controller";
 
export const dynamic = "force-dynamic";
export const revalidate = 0;
 
export async function GET() {
  const user = await requireUser();
  requireRole(user, ["DOBAVLJAC"]);
 
  const res = await getPrihodPoProizvodima(user.id);
 
  return NextResponse.json(res.json, { status: res.status });
}