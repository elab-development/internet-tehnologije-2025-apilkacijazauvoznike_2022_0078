import { NextResponse } from "next/server";
import { db } from "@/src/db"; 
import { korisnik } from "@/src/db/schema";

export async function POST() {
  try {
    // Napomena: sifra je plain-text samo za test. Posle u Auth delu hešujemo.
    const inserted = await db
      .insert(korisnik)
      .values([
        {
          imePrezime: "Admin Adminic",
          email: "admin@test.com",
          sifra: "admin123",
          uloga: "ADMIN",
          status: true,
        },
        {
          imePrezime: "Uvoznik Uvoznic",
          email: "uvoznik@test.com",
          sifra: "uvoznik123",
          uloga: "UVOZNIK",
          status: true,
        },
        {
          imePrezime: "Dobavljac Dobavljic",
          email: "dobavljac@test.com",
          sifra: "dobavljac123",
          uloga: "DOBAVLJAC",
          status: true,
        },
      ])
      .returning();

    return NextResponse.json(
      { ok: true, message: "Seed korisnika uspešan", korisnici: inserted },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Greška" },
      { status: 500 }
    );
  }
}
