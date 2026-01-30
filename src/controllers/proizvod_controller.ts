import { db } from "@/src/db";
import { proizvod, kategorija, korisnik } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export type CreateProizvodInput = {
  sifra: string;
  naziv: string;
  slika: string;
  sirina: number;
  visina: number;
  duzina: number;
  cena: number;
  idKategorija: number;
  idDobavljac: number;
};

function validateCreateInput(body: any): { ok: true; data: CreateProizvodInput } | { ok: false; error: string } {
  const {
    sifra,
    naziv,
    slika,
    sirina,
    visina,
    duzina,
    cena,
    idKategorija,
    idDobavljac,
  } = body ?? {};

  // string i nije prazan?
  if (typeof sifra !== "string" || sifra.trim() === "") return { ok: false, error: "Polje 'sifra' je obavezno" };
  if (typeof naziv !== "string" || naziv.trim() === "") return { ok: false, error: "Polje 'naziv' je obavezno" };
  if (typeof slika !== "string" || slika.trim() === "") return { ok: false, error: "Polje 'slika' je obavezno" };

  // provera brojeva
  const nSirina = Number(sirina);
  const nVisina = Number(visina);
  const nDuzina = Number(duzina);
  const nCena = Number(cena);
  const nIdKategorija = Number(idKategorija);
  const nIdDobavljac = Number(idDobavljac);

  if (!Number.isFinite(nSirina)) return { ok: false, error: "Polje 'sirina' mora biti broj" };
  if (!Number.isFinite(nVisina)) return { ok: false, error: "Polje 'visina' mora biti broj" };
  if (!Number.isFinite(nDuzina)) return { ok: false, error: "Polje 'duzina' mora biti broj" };
  if (!Number.isFinite(nCena)) return { ok: false, error: "Polje 'cena' mora biti broj" };
  if (!Number.isInteger(nIdKategorija) || nIdKategorija <= 0) return { ok: false, error: "Polje 'idKategorija' mora biti pozitivan ceo broj" };
  if (!Number.isInteger(nIdDobavljac) || nIdDobavljac <= 0) return { ok: false, error: "Polje 'idDobavljac' mora biti pozitivan ceo broj" };

  return {
    ok: true,
    data: {
      sifra: sifra.trim(),
      naziv: naziv.trim(),
      slika: slika.trim(),
      sirina: nSirina,
      visina: nVisina,
      duzina: nDuzina,
      cena: nCena,
      idKategorija: nIdKategorija,
      idDobavljac: nIdDobavljac,
    },
  };
}

export async function createProizvod(body: any) {
  const validated = validateCreateInput(body);
  if (!validated.ok) {
    return { status: 400, json: { ok: false, error: validated.error } };
  }

  try {
    const inserted = await db
      .insert(proizvod)
      .values(validated.data)
      .returning();

    return { status: 201, json: { ok: true, proizvod: inserted[0] } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

export async function getAllProizvodi(filter?: {idDobavljac?: number}) {
   try {
    if (filter?.idDobavljac) {
      const rows = await db
        .select({
          id: proizvod.id,
          sifra: proizvod.sifra,
          naziv: proizvod.naziv,
          cena: proizvod.cena,
          slika: proizvod.slika,
          idKategorija: proizvod.idKategorija,
          kategorijaIme: kategorija.ime,
          idDobavljac: proizvod.idDobavljac,
          dobavljacIme: korisnik.imePrezime,
        })
        .from(proizvod)
        .leftJoin(kategorija, eq(proizvod.idKategorija, kategorija.id))
        .leftJoin(korisnik, eq(proizvod.idDobavljac, korisnik.id))
        .where(eq(proizvod.idDobavljac, filter.idDobavljac));

      return { status: 200, json: { ok: true, proizvodi: rows } };
    }

    const rows = await db
      .select({
        id: proizvod.id,
        sifra: proizvod.sifra,
        naziv: proizvod.naziv,
        cena: proizvod.cena,
        slika: proizvod.slika,
        idKategorija: proizvod.idKategorija,
        kategorijaIme: kategorija.ime,
        idDobavljac: proizvod.idDobavljac,
        dobavljacIme: korisnik.imePrezime,
      })
      .from(proizvod)
      .leftJoin(kategorija, eq(proizvod.idKategorija, kategorija.id))
      .leftJoin(korisnik, eq(proizvod.idDobavljac, korisnik.id));

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

// export async function updateProizvod(idParam: string, body: any) {
//   const id = parseId(idParam);
//   if (!id) return { status: 400, json: { ok: false, error: "Neispravan id" } };

//   const zaIzmenu: any = {};

//   if (body?.sifra !== undefined) {
//     if (typeof body.sifra !== "string" || body.sifra.trim() === "") {
//       return { status: 400, json: { ok: false, error: "sifra mora biti string" } };
//     }
//     zaIzmenu.sifra = body.sifra.trim();
//   }

//   if (body?.naziv !== undefined) {
//     if (typeof body.naziv !== "string" || body.naziv.trim() === "") {
//       return { status: 400, json: { ok: false, error: "naziv mora biti string" } };
//     }
//     zaIzmenu.naziv = body.naziv.trim();
//   }

//   if (body?.slika !== undefined) {
//     if (typeof body.slika !== "string" || body.slika.trim() === "") {
//       return { status: 400, json: { ok: false, error: "slika mora biti string" } };
//     }
//     zaIzmenu.slika = body.slika.trim();
//   }

//   for (const key of ["sirina", "visina", "duzina", "cena"] as const) {
//     if (body?.[key] !== undefined) {
//       const num = Number(body[key]);
//       if (!Number.isFinite(num)) {
//         return { status: 400, json: { ok: false, error: `${key} mora biti broj` } };
//       }
//       zaIzmenu[key] = num;
//     }
//   }

//   if (body?.idKategorija !== undefined) {
//     const n = Number(body.idKategorija);
//     if (!Number.isInteger(n) || n <= 0) {
//       return { status: 400, json: { ok: false, error: "idKategorija mora biti pozitivan ceo broj" } };
//     }
//     zaIzmenu.idKategorija = n;
//   }

//   // if (body?.idDobavljac !== undefined) {
//   //   const n = Number(body.idDobavljac);
//   //   if (!Number.isInteger(n) || n <= 0) {
//   //     return { status: 400, json: { ok: false, error: "idDobavljac mora biti pozitivan ceo broj" } };
//   //   }
//   //   zaIzmenu.idDobavljac = n;
//   // }

//   if (Object.keys(zaIzmenu).length === 0) {
//     return { status: 400, json: { ok: false, error: "Nema polja za izmenu" } };
//   }

//   try {
//     const updated = await db
//       .update(proizvod)
//       .set(zaIzmenu)
//       .where(eq(proizvod.id, id))
//       .returning();

//     if (updated.length === 0) {
//       return { status: 404, json: { ok: false, error: "Proizvod nije pronađen" } };
//     }

//     return { status: 200, json: { ok: true, proizvod: updated[0] } };
//   } catch (err: any) {
//     return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
//   }
// }

// export async function deleteProizvod(idParam: string) {
//   const id = parseId(idParam);
//   if (!id) return { status: 400, json: { ok: false, error: "Neispravan id" } };

//   try {
//     const deleted = await db
//       .delete(proizvod)
//       .where(eq(proizvod.id, id))
//       .returning();

//     if (deleted.length === 0) {
//       return { status: 404, json: { ok: false, error: "Proizvod nije pronađen" } };
//     }

//     return { status: 200, json: { ok: true, deleted: deleted[0] } };
//   } catch (err: any) {
//     return {
//       status: 409,
//       json: {
//         ok: false,
//         error:
//           "Ne može se obrisati proizvod, jer je trenutno u nekoj stavci. Prvo obrišite zavisne stavke.",
//       },
//     };
//   }
// }

async function assertOwnership(userId: number, productId: number) {
  
  const rows = await db
    .select({ id: proizvod.id, idDobavljac: proizvod.idDobavljac })
    .from(proizvod)
    .where(eq(proizvod.id, productId))
    .limit(1);

  const p = rows[0];
  if (!p) {
    return { status: 404, json: { ok: false, error: "Proizvod nije pronađen" } };
  }
  if (p.idDobavljac !== userId) {
    return { status: 403, json: { ok: false, error: "Ne možete menjati/brisati tuđi proizvod" } };
  }
  return {status:200,json:{ok:true}}; 
}

export async function updateProizvod(userId: number, productId: string, body: any) {
  const id = parseId(productId);
  if (!id) return { status: 400, json: { ok: false, error: "Neispravan id" } };

  const ownershipErr = await assertOwnership(userId, id);
  if (!ownershipErr.json.ok) {
    return ownershipErr;
    }

  // zabranjujemo promenu iddobavljac
  if (body?.idDobavljac !== undefined) {
    return { status: 400, json: { ok: false, error: "Nije dozvoljeno menjati idDobavljac" } };
  }

  const zaIzmenu: any = {};

  if (body?.sifra !== undefined) {
    if (typeof body.sifra !== "string" || body.sifra.trim() === "") {
      return { status: 400, json: { ok: false, error: "sifra mora biti string" } };
    }
    zaIzmenu.sifra = body.sifra.trim();
  }

  if (body?.naziv !== undefined) {
    if (typeof body.naziv !== "string" || body.naziv.trim() === "") {
      return { status: 400, json: { ok: false, error: "naziv mora biti string" } };
    }
    zaIzmenu.naziv = body.naziv.trim();
  }

  if (body?.slika !== undefined) {
    if (typeof body.slika !== "string" || body.slika.trim() === "") {
      return { status: 400, json: { ok: false, error: "slika mora biti string" } };
    }
    zaIzmenu.slika = body.slika.trim();
  }

  for (const key of ["sirina", "visina", "duzina", "cena"] as const) {
    if (body?.[key] !== undefined) {
      const num = Number(body[key]);
      if (!Number.isFinite(num)) {
        return { status: 400, json: { ok: false, error: `${key} mora biti broj` } };
      }
      zaIzmenu[key] = num;
    }
  }

  if (body?.idKategorija !== undefined) {
    const n = Number(body.idKategorija);
    if (!Number.isInteger(n) || n <= 0) {
      return { status: 400, json: { ok: false, error: "idKategorija mora biti pozitivan ceo broj" } };
    }
    zaIzmenu.idKategorija = n;
  }

  // if (body?.idDobavljac !== undefined) {
  //   const n = Number(body.idDobavljac);
  //   if (!Number.isInteger(n) || n <= 0) {
  //     return { status: 400, json: { ok: false, error: "idDobavljac mora biti pozitivan ceo broj" } };
  //   }
  //   zaIzmenu.idDobavljac = n;
  // }

  if (Object.keys(zaIzmenu).length === 0) {
    return { status: 400, json: { ok: false, error: "Nema polja za izmenu" } };
  }

  try {
    const updated = await db
      .update(proizvod)
      .set(zaIzmenu)
      .where(eq(proizvod.id, id))
      .returning();

    if (updated.length === 0) {
      return { status: 404, json: { ok: false, error: "Proizvod nije pronađen" } };
    }

    return { status: 200, json: { ok: true, proizvod: updated[0] } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

export async function deleteProizvod(userId: number, productId: string) {
  const id = parseId(productId);
  if (!id) return { status: 400, json: { ok: false, error: "Neispravan id" } };

  const ownershipErr = await assertOwnership(userId,id);
  if (!ownershipErr.json.ok) {
   return ownershipErr;
    }

  try {
    const deleted = await db
      .delete(proizvod)
      .where(eq(proizvod.id, id))
      .returning();

    if (deleted.length === 0) {
      return { status: 404, json: { ok: false, error: "Proizvod nije pronađen" } };
    }

    return { status: 200, json: { ok: true, deleted: deleted[0] } };
  } catch (err: any) {
    return {
      status: 409,
      json: {
        ok: false,
        error:
          "Ne može se obrisati proizvod, jer je trenutno u nekoj stavci. Prvo obrišite zavisne stavke.",
      },
    };
  }
}

