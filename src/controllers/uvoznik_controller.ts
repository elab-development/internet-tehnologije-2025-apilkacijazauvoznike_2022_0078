import { db } from "@/src/db";
import { saradnja, korisnik, proizvod, kategorija } from "@/src/db/schema";
import { and, eq, or, isNull, notExists, aliasedTable } from "drizzle-orm";


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
      .where(and(
  eq(saradnja.idUvoznik, uvoznikId),
  eq(saradnja.status, true),
  eq(saradnja.pending, false)
));

    return { status: 200, json: { ok: true, dobavljaci: rows } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

export async function getSviDobavljaciBezSaradnje(idUvoznik: number) {
  try {
    const rows = await db
      .select({
        id: korisnik.id,
        imePrezime: korisnik.imePrezime,
        email: korisnik.email,
        status: korisnik.status,
      })
      .from(korisnik)
      .where(
        and(
          eq(korisnik.uloga, "DOBAVLJAC"),
          eq(korisnik.status, true), // Dobavljač mora biti aktivan kao korisnik
          notExists(
            db
              .select({ x: saradnja.idSaradnja })
              .from(saradnja)
              .where(
                and(
                  eq(saradnja.idUvoznik, idUvoznik),
                  eq(saradnja.idDobavljac, korisnik.id),
                  // USLOV: Izbaci ga samo ako ima saradnju koja je "u toku" ili "aktivna"
                  or(
                    eq(saradnja.pending, true), 
                    eq(saradnja.status, true)
                  )
                )
              )
          )
        )
      );

    return { status: 200, json: { ok: true, dobavljaci: rows } };
  } catch (err: any) {
    console.error("Greška u upitu:", err); // Dodaj log da vidiš grešku u konzoli beka
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}


type ProizvodiFilter = {
  dobavljacId?: number;
  kategorijaId?: number;
};

function isPosInt(n: any) {
  return Number.isInteger(n) && n > 0;
}

export async function getProizvodiMojihDobavljaca(uvoznikId: number, filter: ProizvodiFilter = {}) {
  try {
    const conditions: any[] = [
  eq(saradnja.idUvoznik, uvoznikId),
  eq(saradnja.status, true),
  eq(saradnja.pending, false),
];
if (filter.dobavljacId && isPosInt(filter.dobavljacId)) {
  conditions.push(eq(saradnja.idDobavljac, filter.dobavljacId));
}

if (filter.kategorijaId && isPosInt(filter.kategorijaId)) {
  conditions.push(eq(proizvod.idKategorija, filter.kategorijaId));
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
    dobavljacIme: korisnik.imePrezime,
  })
  .from(saradnja)
  .innerJoin(korisnik, eq(saradnja.idDobavljac, korisnik.id))
  .innerJoin(proizvod, eq(proizvod.idDobavljac, saradnja.idDobavljac))
  .leftJoin(kategorija, eq(proizvod.idKategorija, kategorija.id))
  .where(and(...conditions));

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
  eq(saradnja.status, true),
  eq(saradnja.pending, false)
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