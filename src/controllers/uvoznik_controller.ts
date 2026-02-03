import { db } from "@/src/db";
import { saradnja, korisnik, proizvod, kategorija } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";


export async function getMojiDobavljaci(uvoznikId: number) {
  try {
    const rows = await db
      .select({
        idDobavljac: korisnik.id,
        imePrezime: korisnik.imePrezime,
        email: korisnik.email,
        saradnjaId: saradnja.idSaradnja,
        datumPocetka: saradnja.datumPocetka,
        statusSaradnje: saradnja.status,
      })
      .from(saradnja)
      .innerJoin(korisnik, eq(saradnja.idDobavljac, korisnik.id))
      .where(and(eq(saradnja.idUvoznik, uvoznikId), eq(saradnja.status, true)));

    return { status: 200, json: { ok: true, dobavljaci: rows } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

export async function getProizvodiMojihDobavljaca(uvoznikId: number) {
  try {
    const rows = await db
      .select({
        id: proizvod.id,
        sifra: proizvod.sifra,
        naziv: proizvod.naziv,
        slika: proizvod.slika,
        sirina: proizvod.sirina,
        visina: proizvod.visina,
        duzina: proizvod.duzina,
        cena: proizvod.cena,

        idKategorija: proizvod.idKategorija,
        kategorijaIme: kategorija.ime,

        idDobavljac: proizvod.idDobavljac,
        dobavljacIme: korisnik.imePrezime,
      })
      .from(saradnja)
      .innerJoin(korisnik, eq(saradnja.idDobavljac, korisnik.id))
      .innerJoin(proizvod, eq(proizvod.idDobavljac, saradnja.idDobavljac))
      .leftJoin(kategorija, eq(proizvod.idKategorija, kategorija.id))
      .where(and(eq(saradnja.idUvoznik, uvoznikId), eq(saradnja.status, true)));

    return { status: 200, json: { ok: true, proizvodi: rows } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

function parseId(id: string) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function getProizvodiDobavljacaAkoSaradjujemo(uvoznikId: number, dobavljacIdParam: string) {
  const dobavljacId = parseId(dobavljacIdParam);
  if (!dobavljacId) return { status: 400, json: { ok: false, error: "Neispravan idDobavljac" } };

  try {
    const s = await db
      .select({ id: saradnja.idSaradnja })
      .from(saradnja)
      .where(and(
        eq(saradnja.idUvoznik, uvoznikId),
        eq(saradnja.idDobavljac, dobavljacId),
        eq(saradnja.status, true)
      ))
      .limit(1);

    if (s.length === 0) {
      return { status: 403, json: { ok: false, error: "FORBIDDEN", message: "Nemate saradnju sa ovim dobavljačem" } };
    }

    const rows = await db
      .select({
        id: proizvod.id,
        sifra: proizvod.sifra,
        naziv: proizvod.naziv,
        slika: proizvod.slika,
        sirina: proizvod.sirina,
        visina: proizvod.visina,
        duzina: proizvod.duzina,
        cena: proizvod.cena,
        idKategorija: proizvod.idKategorija,
        kategorijaIme: kategorija.ime,
        idDobavljac: proizvod.idDobavljac,
      })
      .from(proizvod)
      .leftJoin(kategorija, eq(proizvod.idKategorija, kategorija.id))
      .where(eq(proizvod.idDobavljac, dobavljacId));

    return { status: 200, json: { ok: true, proizvodi: rows } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}