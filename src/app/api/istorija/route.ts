import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { getIstorijaPorudzbina } from "@/src/controllers/istorija_controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parsePartnerId(raw: string | null) {
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return undefined;
  return n;
}

function parseSortDir(raw: string | null): "ASC" | "DESC" {
  // default najnovije prvo
  if (raw === "ASC") return "ASC";
  return "DESC";
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    requireRole(user, ["UVOZNIK", "DOBAVLJAC"]);

    const url = new URL(req.url);

    const partnerId = parsePartnerId(url.searchParams.get("partnerId"));
    const sortDir = parseSortDir(url.searchParams.get("sortDir"));

    const res = await getIstorijaPorudzbina(user.id, user.uloga as any, {
      partnerId,
      sortDir,
    });

    return NextResponse.json(res.json, { status: res.status });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: "Greška na serveru." },
      { status: 500 }
    );
  }
}