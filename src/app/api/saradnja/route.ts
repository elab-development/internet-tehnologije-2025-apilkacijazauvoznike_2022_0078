import { NextResponse } from "next/server";
import { createSaradnja, getAllSaradnje } from "@/src/controllers/saradnja_controller";
import { requireUser } from "@/src/lib/auth_guard";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    let payload = body;

    if (user.uloga === "UVOZNIK") {
      payload = { ...body, idUvoznik: user.id };
    } else if (user.uloga === "DOBAVLJAC") {
      payload = { ...body, idDobavljac: user.id };
    } else if (user.uloga === "ADMIN") {
      payload = body;
    } else {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const result = await createSaradnja(payload);
    return NextResponse.json(result.json, { status: result.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();

    if (user.uloga === "ADMIN") {
      const result = await getAllSaradnje();
      return NextResponse.json(result.json, { status: result.status });
    }

    //uvoznik vidi svoje
    if (user.uloga === "UVOZNIK") {
      const result = await getAllSaradnje({ idUvoznik: user.id });
      return NextResponse.json(result.json, { status: result.status });
    }

    // dobavljac vidi svoje
    const result = await getAllSaradnje({ idDobavljac: user.id });
    return NextResponse.json(result.json, { status: result.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
