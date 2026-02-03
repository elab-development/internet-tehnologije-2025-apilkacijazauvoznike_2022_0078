import { NextResponse } from "next/server";
import { createProizvod, getAllProizvodi } from "@/src/controllers/proizvod_controller";
import { requireRole, requireUser } from "@/src/lib/auth_guard";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    requireRole(user, ["DOBAVLJAC"]);

    const body = await req.json();
    
    const payload = { ...body, idDobavljac: user.id };

    const result = await createProizvod(payload);
    return NextResponse.json(result.json, { status: result.status });
  }
  catch (err: any) {
    if (err instanceof Response) return err;

    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Greska pri kreiranju proizvoda" },
      { status: 500 }
    );
  }
}

export async function GET() {

  try {
    const user = await requireUser();


    if (user.uloga === "ADMIN") {
      const result = await getAllProizvodi();
      return NextResponse.json(result.json, { status: result.status });
    }

    if (user.uloga === "DOBAVLJAC") {

      const result = await getAllProizvodi({ idDobavljac: user.id } as any);
      return NextResponse.json(result.json, { status: result.status });
    }

    return NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: "Uvoznik jos nema pristup svim proizvodima (bice u delu saradnji)" },
      { status: 403 }
    );

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Greska pri citanju proizvoda" },
      { status: 500 }
    );
  }
}
