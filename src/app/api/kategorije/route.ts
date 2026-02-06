import { NextResponse } from "next/server";
import { getAllCategories, createCategory } from "@/src/controllers/kategorije_controller";
import { requireRole, requireUser } from "@/src/lib/auth_guard";


export async function GET() {
  try {
    await requireUser();

    const categories = await getAllCategories();
    return NextResponse.json({ ok: true, data: categories });
  } catch (err:any) {
    if(err instanceof Response) return err;
    
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Greska pri citanju kategorija!" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {

    const user = await requireUser();
    requireRole(user, ["ADMIN", "DOBAVLJAC"]);

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
  } catch (err:any) {
    if(err instanceof Response) return err;

    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Greska pri kreiranju kategorije!" },
      { status: 500 }
    );
  }
}