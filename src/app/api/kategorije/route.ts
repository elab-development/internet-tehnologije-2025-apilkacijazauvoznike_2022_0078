import { NextResponse } from "next/server";
import { getAllCategories, createCategory } from "@/src/controllers/kategorije_controller";


export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json({ ok: true, data: categories });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Greska pri citanju kategorija!" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await createCategory({
      ime: body.ime,
      opis: body.opis,
    });

    if (result.error) {
      return NextResponse.json(
        { ok: false, error: result.error.code, message: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Greska pri kreiranju kategorije!" },
      { status: 500 }
    );
  }
}