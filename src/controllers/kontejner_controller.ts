import { db } from "@/src/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  kontejner,
  proizvod,
  saradnja,
  stavkaKontejnera,
  kategorija,
  korisnik,
} from "@/src/db/schema";
import { isActiveStatus, validateAddInput, type AddToKontejnerInput, type KontejnerStatus } from "@/src/lib/kontejner-utils";

// export type AddToKontejnerInput = {
//   uvoznikId: number;
//   idProizvod: number;
//   kolicina: number;
//   forceNewContainer?: boolean;
// };

// type KontejnerStatus = "OPEN" | "CLOSED" | "REOPEN" | "PAUSED" | "PAID";

// function isActiveStatus(s: KontejnerStatus) {
//   return s === "OPEN" || s === "REOPEN";
// }

// function validateAddInput(body: any):
//   | { ok: true; data: AddToKontejnerInput }
//   | { ok: false; error: string } {
//   const { uvoznikId, idProizvod, kolicina } = body ?? {};

//   const nUvoznikId = Number(uvoznikId);
//   const nIdProizvod = Number(idProizvod);
//   const nKolicina = Number(kolicina);

//   if (!Number.isInteger(nUvoznikId) || nUvoznikId <= 0)
//     return { ok: false, error: "uvoznikId mora biti pozitivan ceo broj" };

//   if (!Number.isInteger(nIdProizvod) || nIdProizvod <= 0)
//     return { ok: false, error: "idProizvod mora biti pozitivan ceo broj" };

//   if (!Number.isInteger(nKolicina) || nKolicina <= 0)
//     return { ok: false, error: "kolicina mora biti pozitivan ceo broj" };

//   return {
//     ok: true,
//     data: {
//       uvoznikId: nUvoznikId,
//       idProizvod: nIdProizvod,
//       kolicina: nKolicina,
//       forceNewContainer: Boolean(body?.forceNewContainer),
//     },
//   };
// }

async function createNewContainer(uvoznikId: number, idSaradnja: number) {
  const maxZapremina = 33 * 1000000; // m^3 -> cm^3
  const cenaKontejnera = 3200;

  const inserted = await db
    .insert(kontejner)
    .values({
      idUvoznik: uvoznikId,
      idSaradnja,
      status: "OPEN",
      maxZapremina,
      cenaKontejnera,
      trenutnaZapremina: 0,
      ukupnaCenaKontejnera: 0,
    })
    .returning();

  return inserted[0] as any;
}

async function getActiveKontejner(uvoznikId: number, idSaradnja: number) {
  const rows = await db
    .select()
    .from(kontejner)
    .where(
      and(
        eq(kontejner.idUvoznik, uvoznikId),
        eq(kontejner.idSaradnja, idSaradnja),
        inArray(kontejner.status, ["OPEN", "REOPEN"] as any)
      )
    )
    .orderBy(desc(kontejner.idKontejner))
    .limit(1);

  return rows[0] as any;
}

export async function addToKontejner(body: any) {
  const validated = validateAddInput(body);
  if (!validated.ok) {
    return { status: 400, json: { ok: false, error: validated.error } };
  }

  const { uvoznikId, idProizvod, kolicina } = validated.data as any;
  const forceNewContainer = Boolean((validated as any).data?.forceNewContainer);

  try {
    const pRows = await db
      .select()
      .from(proizvod)
      .where(eq(proizvod.id, idProizvod))
      .limit(1);

    const p = pRows[0] as any;
    if (!p) {
      return {
        status: 404,
        json: { ok: false, error: "NOT_FOUND", message: "Proizvod ne postoji" },
      };
    }

    // saradnja postoji 
    const sRows = await db
      .select({ id: saradnja.idSaradnja })
      .from(saradnja)
      .where(
        and(
          eq(saradnja.idUvoznik, uvoznikId),
          eq(saradnja.idDobavljac, p.idDobavljac),
          eq(saradnja.status, true),
          eq(saradnja.pending, false)
        )
      )
      .limit(1);

    if (sRows.length === 0) {
      return {
        status: 403,
        json: {
          ok: false,
          error: "FORBIDDEN",
          message: "Nemate aktivnu saradnju sa ovim dobavljačem",
        },
      };
    }

    const idSaradnja = sRows[0].id;

    const zapreminaProizvoda = p.sirina * p.visina * p.duzina; // cm^3
    const zapreminaStavkeAdd = zapreminaProizvoda * kolicina;
    const iznosStavkeAdd = p.cena * kolicina;

    // aktivni kontejner je po saradnji
    let k = await getActiveKontejner(uvoznikId, idSaradnja);
    if (!k) k = await createNewContainer(uvoznikId, idSaradnja);

    const trenutna = k.trenutnaZapremina ?? 0;
    const maxZ = k.maxZapremina * 0.9;

    
    // Ako je aktivni kontejner REOPEN, ne dozvoljavamo kreiranje novog
    // Ako je OPEN tražimo potvrdu zatvorimo i kreiramo novi 
    if (trenutna + zapreminaStavkeAdd > maxZ) {
      if (k.status === "REOPEN") {
        return {
          status: 409,
          json: {
            ok: false,
            error: "REOPEN_CONTAINER_FULL",
            message:
              "Reopen kontejner je pun. Ne možete kreirati novi kontejner dok ste u REOPEN režimu. Zatvorite ili obrišite REOPEN kontejner da biste nastavili.",
            data: {
              currentContainerId: k.idKontejner,
              maxZapreminaCm3: maxZ,
              trenutnaZapreminaCm3: trenutna,
              stavkaZapreminaCm3: zapreminaStavkeAdd,
            },
          },
        };
      }

      if (!forceNewContainer) {
        return {
          status: 409,
          json: {
            ok: false,
            error: "CONTAINER_OVERFLOW",
            message:
              "Nema mesta u trenutnom kontejneru. Ako nastavite, ovaj proizvod će biti dodat u NOVI kontejner. Da li želite da nastavite?",
            data: {
              currentContainerId: k.idKontejner,
              maxZapreminaCm3: maxZ,
              trenutnaZapreminaCm3: trenutna,
              stavkaZapreminaCm3: zapreminaStavkeAdd,
            },
          },
        };
      }

      // kad korisnik potvrdi zatvori i napravi novi OPEN
      await db
        .update(kontejner)
        .set({ status: "CLOSED" })
        .where(eq(kontejner.idKontejner, k.idKontejner));

      k = await createNewContainer(uvoznikId, idSaradnja);
    }

    const existingRows = await db
      .select()
      .from(stavkaKontejnera)
      .where(
        and(
          eq(stavkaKontejnera.idKontejner, k.idKontejner),
          eq(stavkaKontejnera.idProizvod, idProizvod)
        )
      )
      .limit(1);

    let stavkaResult: any;

    if (existingRows.length > 0) {
      const st = existingRows[0] as any;
      const updated = await db
        .update(stavkaKontejnera)
        .set({
          kolicina: st.kolicina + kolicina,
          iznosStavke: (st.iznosStavke ?? 0) + iznosStavkeAdd,
          zapreminaStavke: (st.zapreminaStavke ?? 0) + zapreminaStavkeAdd,
        })
        .where(eq(stavkaKontejnera.rb, st.rb))
        .returning();

      stavkaResult = updated[0];
    } else {
      const inserted = await db
        .insert(stavkaKontejnera)
        .values({
          idKontejner: k.idKontejner,
          idProizvod,
          kolicina,
          iznosStavke: iznosStavkeAdd,
          zapreminaStavke: zapreminaStavkeAdd,
        })
        .returning();

      stavkaResult = inserted[0];
    }

    const updatedK = await db
      .update(kontejner)
      .set({
        trenutnaZapremina: (k.trenutnaZapremina ?? 0) + zapreminaStavkeAdd,
        ukupnaCenaKontejnera: (k.ukupnaCenaKontejnera ?? 0) + iznosStavkeAdd,
      })
      .where(eq(kontejner.idKontejner, k.idKontejner))
      .returning();

    return {
      status: 200,
      json: {
        ok: true,
        message: "Dodato u kontejner",
        kontejner: updatedK[0],
        stavka: stavkaResult,
      },
    };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

export async function updateStavkaDelta(body: any, uvoznikId: number) {
  const rb = Number(body?.rb);
  const delta = Number(body?.delta);
  const forceNewContainer = Boolean(body?.forceNewContainer);

  if (!Number.isInteger(rb) || rb <= 0) {
    return { status: 400, json: { ok: false, error: "Neispravan rb" } };
  }
  if (!Number.isInteger(delta) || (delta !== 1 && delta !== -1)) {
    return { status: 400, json: { ok: false, error: "delta mora biti 1 ili -1" } };
  }

  try {
    const rows = await db
      .select({
        rb: stavkaKontejnera.rb,
        idKontejner: stavkaKontejnera.idKontejner,
        idProizvod: stavkaKontejnera.idProizvod,
        kolicina: stavkaKontejnera.kolicina,
        iznosStavke: stavkaKontejnera.iznosStavke,
        zapreminaStavke: stavkaKontejnera.zapreminaStavke,

        kontejnerStatus: kontejner.status,
        maxZapremina: kontejner.maxZapremina,
        trenutnaZapremina: kontejner.trenutnaZapremina,
        ukupnaCenaKontejnera: kontejner.ukupnaCenaKontejnera,
        idUvoznik: kontejner.idUvoznik,

        idSaradnja: kontejner.idSaradnja,
      })
      .from(stavkaKontejnera)
      .innerJoin(kontejner, eq(stavkaKontejnera.idKontejner, kontejner.idKontejner))
      .where(eq(stavkaKontejnera.rb, rb))
      .limit(1);

    const st = rows[0] as any;
    if (!st) {
      return { status: 404, json: { ok: false, error: "NOT_FOUND", message: "Stavka ne postoji" } };
    }

    if (st.idUvoznik !== uvoznikId) {
      return { status: 403, json: { ok: false, error: "FORBIDDEN" } };
    }

    const status = st.kontejnerStatus as KontejnerStatus;

    // zabrani izmene u PAID
    if (status === "PAID") {
      return {
        status: 409,
        json: { ok: false, error: "PAID_CONTAINER", message: "Plaćen kontejner ne može da se menja." },
      };
    }

    // izmene dozvoljene samo u OPEN/REOPEN
    if (!isActiveStatus(status)) {
      return {
        status: 409,
        json: {
          ok: false,
          error: "CONTAINER_NOT_ACTIVE",
          message: "Izmene stavki su dozvoljene samo u aktivnom kontejneru (OPEN/REOPEN).",
          data: { containerId: st.idKontejner, status },
        },
      };
    }

    // briši stavku
    if (delta === -1 && st.kolicina === 1) {
      await db.delete(stavkaKontejnera).where(eq(stavkaKontejnera.rb, rb));

      const updatedK = await db
        .update(kontejner)
        .set({
          trenutnaZapremina: (st.trenutnaZapremina ?? 0) - (st.zapreminaStavke ?? 0),
          ukupnaCenaKontejnera: (st.ukupnaCenaKontejnera ?? 0) - (st.iznosStavke ?? 0),
        })
        .where(eq(kontejner.idKontejner, st.idKontejner))
        .returning();

      return { status: 200, json: { ok: true, message: "Stavka obrisana", kontejner: updatedK[0] } };
    }

    if (delta === 1) {
      const pRows = await db.select().from(proizvod).where(eq(proizvod.id, st.idProizvod)).limit(1);
      const p = pRows[0] as any;
      if (!p) return { status: 404, json: { ok: false, error: "NOT_FOUND", message: "Proizvod ne postoji" } };

      const zapreminaProizvoda = p.sirina * p.visina * p.duzina;
      const zapreminaAdd = zapreminaProizvoda * 1;
      const iznosAdd = p.cena * 1;

      const maxZ = st.maxZapremina * 0.9;
      const trenutna = st.trenutnaZapremina ?? 0;

      if (trenutna + zapreminaAdd > maxZ) {
        if (status === "REOPEN") {
          return {
            status: 409,
            json: {
              ok: false,
              error: "REOPEN_CONTAINER_FULL",
              message:
                "Reopen kontejner je pun. Ne možete kreirati novi kontejner dok ste u REOPEN režimu. Zatvorite ili obrišite REOPEN kontejner da biste nastavili.",
              data: {
                currentContainerId: st.idKontejner,
                maxZapreminaCm3: maxZ,
                trenutnaZapreminaCm3: trenutna,
                stavkaZapreminaCm3: zapreminaAdd,
              },
            },
          };
        }

        if (!forceNewContainer) {
          return {
            status: 409,
            json: {
              ok: false,
              error: "CONTAINER_OVERFLOW",
              message:
                "Nema mesta u trenutnom kontejneru. Ako nastavite, dodatna količina će otići u NOVI kontejner. Nastaviti?",
              data: {
                currentContainerId: st.idKontejner,
                maxZapreminaCm3: maxZ,
                trenutnaZapreminaCm3: trenutna,
                stavkaZapreminaCm3: zapreminaAdd,
              },
            },
          };
        }

        //  zatvori OPEN i napravi novi OPEN iy iste saradnje 
        await db.update(kontejner).set({ status: "CLOSED" }).where(eq(kontejner.idKontejner, st.idKontejner));

        const newK = await createNewContainer(uvoznikId, st.idSaradnja);

        const existNew = await db
          .select()
          .from(stavkaKontejnera)
          .where(and(eq(stavkaKontejnera.idKontejner, newK.idKontejner), eq(stavkaKontejnera.idProizvod, st.idProizvod)))
          .limit(1);

        let newItem;
        if (existNew.length) {
          const ex = existNew[0] as any;
          const upd = await db
            .update(stavkaKontejnera)
            .set({
              kolicina: ex.kolicina + 1,
              iznosStavke: (ex.iznosStavke ?? 0) + iznosAdd,
              zapreminaStavke: (ex.zapreminaStavke ?? 0) + zapreminaAdd,
            })
            .where(eq(stavkaKontejnera.rb, ex.rb))
            .returning();
          newItem = upd[0];
        } else {
          const ins = await db
            .insert(stavkaKontejnera)
            .values({
              idKontejner: newK.idKontejner,
              idProizvod: st.idProizvod,
              kolicina: 1,
              iznosStavke: iznosAdd,
              zapreminaStavke: zapreminaAdd,
            })
            .returning();
          newItem = ins[0];
        }

        const updNewK = await db
          .update(kontejner)
          .set({
            trenutnaZapremina: (newK.trenutnaZapremina ?? 0) + zapreminaAdd,
            ukupnaCenaKontejnera: (newK.ukupnaCenaKontejnera ?? 0) + iznosAdd,
          })
          .where(eq(kontejner.idKontejner, newK.idKontejner))
          .returning();

        return { status: 200, json: { ok: true, message: "Dodato u novi kontejner", kontejner: updNewK[0], stavka: newItem } };
      }

      const updatedItem = await db
        .update(stavkaKontejnera)
        .set({
          kolicina: st.kolicina + 1,
          iznosStavke: (st.iznosStavke ?? 0) + iznosAdd,
          zapreminaStavke: (st.zapreminaStavke ?? 0) + zapreminaAdd,
        })
        .where(eq(stavkaKontejnera.rb, rb))
        .returning();

      const updatedK = await db
        .update(kontejner)
        .set({
          trenutnaZapremina: (st.trenutnaZapremina ?? 0) + zapreminaAdd,
          ukupnaCenaKontejnera: (st.ukupnaCenaKontejnera ?? 0) + iznosAdd,
        })
        .where(eq(kontejner.idKontejner, st.idKontejner))
        .returning();

      return { status: 200, json: { ok: true, kontejner: updatedK[0], stavka: updatedItem[0] } };
    }

    const iznosPerOne = (st.iznosStavke ?? 0) / st.kolicina;
    const zapPerOne = (st.zapreminaStavke ?? 0) / st.kolicina;

    const updatedItem = await db
      .update(stavkaKontejnera)
      .set({
        kolicina: st.kolicina - 1,
        iznosStavke: (st.iznosStavke ?? 0) - iznosPerOne,
        zapreminaStavke: (st.zapreminaStavke ?? 0) - zapPerOne,
      })
      .where(eq(stavkaKontejnera.rb, rb))
      .returning();

    const updatedK = await db
      .update(kontejner)
      .set({
        trenutnaZapremina: (st.trenutnaZapremina ?? 0) - zapPerOne,
        ukupnaCenaKontejnera: (st.ukupnaCenaKontejnera ?? 0) - iznosPerOne,
      })
      .where(eq(kontejner.idKontejner, st.idKontejner))
      .returning();

    return { status: 200, json: { ok: true, kontejner: updatedK[0], stavka: updatedItem[0] } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

export async function getMojiKontejneriSaStavkama(uvoznikId: number) {
  if (!Number.isInteger(uvoznikId) || uvoznikId <= 0) {
    return { status: 400, json: { ok: false, error: "Neispravan uvoznikId" } };
  }

  try {
    // prikazujemo samo kontejnere koji nisu PAID
    const ks = await db
      .select()
      .from(kontejner)
      .where(and(eq(kontejner.idUvoznik, uvoznikId), inArray(kontejner.status, ["OPEN", "CLOSED", "REOPEN", "PAUSED"] as any)))
      .orderBy(desc(kontejner.idKontejner));

    if (ks.length === 0) {
      return { status: 200, json: { ok: true, kontejneri: [] } };
    }

    const ids = ks.map((k) => (k as any).idKontejner);

    const stavkeRows = await db
      .select({
        rb: stavkaKontejnera.rb,
        idKontejner: stavkaKontejnera.idKontejner,
        idProizvod: stavkaKontejnera.idProizvod,
        kolicina: stavkaKontejnera.kolicina,
        iznosStavke: stavkaKontejnera.iznosStavke,
        zapreminaStavke: stavkaKontejnera.zapreminaStavke,

        naziv: proizvod.naziv,
        slika: proizvod.slika,
        cena: proizvod.cena,

        dobavljacIme: korisnik.imePrezime,
        kategorijaIme: kategorija.ime,
      })
      .from(stavkaKontejnera)
      .innerJoin(proizvod, eq(stavkaKontejnera.idProizvod, proizvod.id))
      .leftJoin(korisnik, eq(proizvod.idDobavljac, korisnik.id))
      .leftJoin(kategorija, eq(proizvod.idKategorija, kategorija.id))
      .where(inArray(stavkaKontejnera.idKontejner, ids))
      .orderBy(stavkaKontejnera.rb);

    const map = new Map<number, any[]>();
    for (const s of stavkeRows) {
      map.set(s.idKontejner, [...(map.get(s.idKontejner) ?? []), s]);
    }

    const kontejneri = (ks as any[])
      .map((k) => ({ ...k, stavke: map.get(k.idKontejner) ?? [] }))
      .filter((k) => (k.stavke?.length ?? 0) > 0);

    return { status: 200, json: { ok: true, kontejneri } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}



export async function reopenKontejner(uvoznikId: number, idKontejner: number) {
  const kid = Number(idKontejner);
  if (!Number.isInteger(kid) || kid <= 0) {
    return { status: 400, json: { ok: false, error: "Neispravan idKontejner" } };
  }

  try {
    const targetRows = await db
      .select()
      .from(kontejner)
      .where(and(eq(kontejner.idKontejner, kid), eq(kontejner.idUvoznik, uvoznikId)))
      .limit(1);

    const target = targetRows[0] as any;
    if (!target) {
      return { status: 404, json: { ok: false, error: "NOT_FOUND", message: "Kontejner ne postoji" } };
    }

    if (target.status === "PAID") {
      return { status: 409, json: { ok: false, error: "PAID_CONTAINER", message: "Plaćen kontejner ne može da se REOPEN." } };
    }

    if (target.status !== "CLOSED") {
      return {
        status: 409,
        json: { ok: false, error: "INVALID_STATUS", message: "Samo CLOSED kontejner može da se REOPEN" },
      };
    }

    const reopenExisting = await db
      .select({ id: kontejner.idKontejner })
      .from(kontejner)
      .where(and(eq(kontejner.idUvoznik, uvoznikId), eq(kontejner.idSaradnja, target.idSaradnja), eq(kontejner.status, "REOPEN")))
      .limit(1);

    if (reopenExisting.length > 0) {
      return {
        status: 409,
        json: { ok: false, error: "REOPEN_ALREADY_ACTIVE", message: "Već imate aktivan REOPEN kontejner za ovog dobavljača." },
      };
    }

    // trenutni OPEN za istu saradnju prebaci u PAUSED
    const openRows = await db
      .select()
      .from(kontejner)
      .where(and(eq(kontejner.idUvoznik, uvoznikId), eq(kontejner.idSaradnja, target.idSaradnja), eq(kontejner.status, "OPEN")))
      .orderBy(desc(kontejner.idKontejner))
      .limit(1);

    const openK = openRows[0] as any;
    if (openK) {
      await db.update(kontejner).set({ status: "PAUSED" }).where(eq(kontejner.idKontejner, openK.idKontejner));
    }

    // CLOSED u REOPEN
    const updated = await db
      .update(kontejner)
      .set({ status: "REOPEN" })
      .where(eq(kontejner.idKontejner, target.idKontejner))
      .returning();

    return { status: 200, json: { ok: true, message: "Kontejner je REOPEN", kontejner: updated[0] } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

export async function closeReopenKontejner(uvoznikId: number, idKontejner: number) {
  const kid = Number(idKontejner);
  if (!Number.isInteger(kid) || kid <= 0) {
    return { status: 400, json: { ok: false, error: "Neispravan idKontejner" } };
  }

  try {
    const rows = await db
      .select()
      .from(kontejner)
      .where(and(eq(kontejner.idKontejner, kid), eq(kontejner.idUvoznik, uvoznikId)))
      .limit(1);

    const k = rows[0] as any;
    if (!k) return { status: 404, json: { ok: false, error: "NOT_FOUND" } };

    if (k.status !== "REOPEN") {
      return { status: 409, json: { ok: false, error: "INVALID_STATUS", message: "Samo REOPEN može da se zatvori ovako." } };
    }

    // REOPEN u CLOSED
    await db.update(kontejner).set({ status: "CLOSED" }).where(eq(kontejner.idKontejner, k.idKontejner));

    // PAUSED u OPEN 
    const pausedRows = await db
      .select()
      .from(kontejner)
      .where(and(eq(kontejner.idUvoznik, uvoznikId), eq(kontejner.idSaradnja, k.idSaradnja), eq(kontejner.status, "PAUSED")))
      .orderBy(desc(kontejner.idKontejner))
      .limit(1);

    const paused = pausedRows[0] as any;
    if (paused) {
      await db.update(kontejner).set({ status: "OPEN" }).where(eq(kontejner.idKontejner, paused.idKontejner));
    } else {
      const active = await getActiveKontejner(uvoznikId, k.idSaradnja);
      if (!active) await createNewContainer(uvoznikId, k.idSaradnja);
    }

    return { status: 200, json: { ok: true, message: "REOPEN zatvoren i vraćen OPEN kontejner." } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

export async function deleteKontejner(uvoznikId: number, idKontejner: number) {
  const kid = Number(idKontejner);
  if (!Number.isInteger(kid) || kid <= 0) {
    return { status: 400, json: { ok: false, error: "Neispravan idKontejner" } };
  }

  try {
    const rows = await db
      .select()
      .from(kontejner)
      .where(and(eq(kontejner.idKontejner, kid), eq(kontejner.idUvoznik, uvoznikId)))
      .limit(1);

    const k = rows[0] as any;
    if (!k) return { status: 404, json: { ok: false, error: "NOT_FOUND" } };

    if (k.status === "PAID") {
      return { status: 409, json: { ok: false, error: "PAID_CONTAINER", message: "Plaćen kontejner ne može da se briše." } };
    }

    

    await db.delete(kontejner).where(eq(kontejner.idKontejner, k.idKontejner));

    // Ako je obrisan REOPEN vraca PAUSED u OPEN
    if (k.status === "REOPEN") {
      const pausedRows = await db
        .select()
        .from(kontejner)
        .where(and(eq(kontejner.idUvoznik, uvoznikId), eq(kontejner.idSaradnja, k.idSaradnja), eq(kontejner.status, "PAUSED")))
        .orderBy(desc(kontejner.idKontejner))
        .limit(1);

      const paused = pausedRows[0] as any;
      if (paused) {
        await db.update(kontejner).set({ status: "OPEN" }).where(eq(kontejner.idKontejner, paused.idKontejner));
      } else {
        const active = await getActiveKontejner(uvoznikId, k.idSaradnja);
        if (!active) await createNewContainer(uvoznikId, k.idSaradnja);
      }
    }

    return { status: 200, json: { ok: true, message: "Kontejner obrisan." } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}