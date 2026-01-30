import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { korisnik } from "@/src/db/schema";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    
    const adminHash = await bcrypt.hash("admin123", 10);
    const uvoznikHash = await bcrypt.hash("uvoznik123", 10);
    const dobavljacHash = await bcrypt.hash("dobavljac123", 10);

    const inserted = await db
      .insert(korisnik)
      .values([
        {
          imePrezime: "Admin Adminic",
          email: "admin@test.com",
          sifra: adminHash,
          uloga: "ADMIN",
          status: true,
        },
        {
          imePrezime: "Uvoznik Uvoznic",
          email: "uvoznik@test.com",
          sifra: uvoznikHash,
          uloga: "UVOZNIK",
          status: true,
        },
        {
          imePrezime: "Dobavljac Dobavljic",
          email: "dobavljac@test.com",
          sifra: dobavljacHash,
          uloga: "DOBAVLJAC",
          status: true,
        },
      ])
      .returning();

    return NextResponse.json(
      { ok: true, message: "Seed korisnika uspešan", korisnici: inserted.map(u => ({
        id: u.id, imePrezime: u.imePrezime, email: u.email, uloga: u.uloga, status: u.status
      })) },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Greška" },
      { status: 500 }
    );
  }
}