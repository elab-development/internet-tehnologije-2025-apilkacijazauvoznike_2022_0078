import { db } from "@/src/db";
import { and, eq, inArray, asc, desc, sql } from "drizzle-orm";
import {
  faktura,
  stavkaFakture,
  kontejner,
  stavkaKontejnera,
  proizvod,
  saradnja,
  korisnik,
} from "@/src/db/schema";

type Role = "UVOZNIK" | "DOBAVLJAC";

const CENA_KONTEJNERA = 3200;

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}


type Filters = {
  partnerId?: number;
  sortDir?: "ASC" | "DESC";
};

function isPosInt(n: any) {
  return Number.isInteger(n) && n > 0;
}

export async function getIstorijaPorudzbina(userId: number, role: Role, filters: Filters) {
  try {
    const partnerId = filters.partnerId;
    const sortDir = filters.sortDir ?? "DESC"; 

    
    const whereBase =
      role === "UVOZNIK"
        ? eq(saradnja.idUvoznik, userId)
        : eq(saradnja.idDobavljac, userId);

    
    const wherePartner =
      partnerId && isPosInt(partnerId)
        ? role === "UVOZNIK"
          ? eq(saradnja.idDobavljac, partnerId)
          : eq(saradnja.idUvoznik, partnerId)
        : undefined;

    

    const faktureRows = await db
      .select({
        idFaktura: faktura.idFaktura,
        datumIzdavanja: faktura.datumIzdavanja,
        troskoviCarine: faktura.troskoviCarine,
        ukupniTroskoviUvoza: faktura.ukupniTroskoviUvoza,
        idSaradnja: faktura.idSaradnje,

        idUvoznik: saradnja.idUvoznik,
        idDobavljac: saradnja.idDobavljac,

        uvoznikIme: sql<string>`
      (select k."imePrezime" from "korisnik" k where k."id" = ${saradnja.idUvoznik})
    `.as("uvoznikIme"),

        dobavljacIme: sql<string>`
      (select k."imePrezime" from "korisnik" k where k."id" = ${saradnja.idDobavljac})
    `.as("dobavljacIme"),
      })
      .from(faktura)
      .innerJoin(saradnja, eq(faktura.idSaradnje, saradnja.idSaradnja))
      .where(and(whereBase, wherePartner ?? sql`TRUE`))
      .orderBy(
        sortDir === "ASC" ? asc(faktura.datumIzdavanja) : desc(faktura.datumIzdavanja),
        sortDir === "ASC" ? asc(faktura.idFaktura) : desc(faktura.idFaktura)
      );

    if (faktureRows.length === 0) {
      return { status: 200, json: { ok: true, fakture: [] } };
    }

    // ucitamo sve stavke fakture i dobijamo koji kontejneri pripadaju kojoj fakturi
    const fakturaIds = faktureRows.map((f) => f.idFaktura);

    const sfRows = await db
      .select({
        idFaktura: stavkaFakture.idFaktura,
        idKontejner: stavkaFakture.idKontejner,
        iznosStavke: stavkaFakture.iznosStavke,

        status: kontejner.status,
        ukupnaCenaKontejnera: kontejner.ukupnaCenaKontejnera,
      })
      .from(stavkaFakture)
      .innerJoin(kontejner, eq(stavkaFakture.idKontejner, kontejner.idKontejner))
      .where(inArray(stavkaFakture.idFaktura, fakturaIds));

    // sakupimo sve kontejner ID 
    const kontejnerIds = Array.from(
      new Set(sfRows.map((r) => Number(r.idKontejner)).filter((x) => Number.isInteger(x) && x > 0))
    );

    const skRows =
      kontejnerIds.length === 0
        ? []
        : await db
          .select({
            idKontejner: stavkaKontejnera.idKontejner,
            rb: stavkaKontejnera.rb,
            idProizvod: stavkaKontejnera.idProizvod,
            kolicina: stavkaKontejnera.kolicina,
            iznosStavke: stavkaKontejnera.iznosStavke,

            naziv: proizvod.naziv,
            slika: proizvod.slika,
            cena: proizvod.cena,
            idDobavljac: proizvod.idDobavljac,
          })
          .from(stavkaKontejnera)
          .innerJoin(proizvod, eq(stavkaKontejnera.idProizvod, proizvod.id))
          .where(inArray(stavkaKontejnera.idKontejner, kontejnerIds));

    // slozimo stavke po kontejneru
    const itemsByKontejner: Record<number, any[]> = {};
    for (const it of skRows) {
      const kid = Number(it.idKontejner);
      if (!itemsByKontejner[kid]) itemsByKontejner[kid] = [];
      itemsByKontejner[kid].push(it);
    }

    // slozimo kontejner po fakturi 
    const kontejneriByFaktura: Record<number, any[]> = {};
    for (const r of sfRows) {
      const fid = Number(r.idFaktura);
      const kid = Number(r.idKontejner);

      const kObj = {
        idKontejner: kid,
        status: r.status,
        //  ako nema ukupnaCenaKontejnera uzmi iznosStavke
        ukupnaCenaKontejnera: Number(r.ukupnaCenaKontejnera ?? r.iznosStavke ?? 0),
        stavke: itemsByKontejner[kid] ?? [],
      };

      if (!kontejneriByFaktura[fid]) kontejneriByFaktura[fid] = [];
      kontejneriByFaktura[fid].push(kObj);
    }

    // Finalno formiranje odgovora 
    const out = faktureRows.map((f) => {
      const kontejneri = kontejneriByFaktura[Number(f.idFaktura)] ?? [];

      const roba = round2(
        kontejneri.reduce((acc: number, k: any) => acc + Number(k.ukupnaCenaKontejnera ?? 0), 0)
      );

      const brojKontejnera = kontejneri.length;
      const kontejneriFee = round2(brojKontejnera * CENA_KONTEJNERA);

      const carina = round2(Number(f.troskoviCarine ?? 0));
      const ukupno = round2(Number(f.ukupniTroskoviUvoza ?? roba + carina + kontejneriFee));

      const partner =
        role === "UVOZNIK"
          ? { id: Number(f.idDobavljac), ime: String(f.dobavljacIme ?? "Dobavljač") }
          : { id: Number(f.idUvoznik), ime: String(f.uvoznikIme ?? "Uvoznik") };

      return {
        idFaktura: f.idFaktura,
        datumIzdavanja: f.datumIzdavanja,
        idSaradnja: f.idSaradnja,

        partner,

        roba,
        brojKontejnera,
        kontejneriFee,
        carina,
        ukupno,

        kontejneri,
      };
    });

    return { status: 200, json: { ok: true, fakture: out } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}