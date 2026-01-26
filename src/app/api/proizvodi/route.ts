import { NextResponse } from "next/server";
import { createProizvod, getAllProizvodi } from "@/src/controllers/proizvod_controller";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await createProizvod(body);
  return NextResponse.json(result.json, { status: result.status });
}

export async function GET() {
  const result = await getAllProizvodi();
  return NextResponse.json(result.json, { status: result.status });
}
