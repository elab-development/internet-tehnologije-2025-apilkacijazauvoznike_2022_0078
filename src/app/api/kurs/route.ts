import { NextResponse } from "next/server";
import { getExchangeRate } from "@/src/controllers/kurs_controller";
 
export const dynamic = "force-dynamic";
export const revalidate = 0;
 
const ALLOWED = ["EUR", "USD"] as const;
type AllowedCurrency = (typeof ALLOWED)[number];
 
function isAllowedCurrency(v: string): v is AllowedCurrency {
  return ALLOWED.includes(v as AllowedCurrency);
}
 
export async function GET(req: Request) {
  const url = new URL(req.url);
 
  const from = (url.searchParams.get("from") ?? "EUR").toUpperCase();
  const to = (url.searchParams.get("to") ?? "USD").toUpperCase();
 
  if (!isAllowedCurrency(from) || !isAllowedCurrency(to)) {
    return NextResponse.json(
      {
        ok: false,
        error: "BAD_CURRENCY",
        message: "Dozvoljene valute su EUR i USD.",
      },
      { status: 400 }
    );
  }
 
  const res = await getExchangeRate(from, to);
 
  return NextResponse.json(res.json, { status: res.status });
}