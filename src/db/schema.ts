import { pgTable, serial, text, varchar, integer, doublePrecision, timestamp, boolean, uniqueIndex,pgEnum } from "drizzle-orm/pg-core";

export const ulogaEnum = pgEnum("uloga", ["ADMIN", "UVOZNIK", "DOBAVLJAC"]);

export const korisnik = pgTable("korisnik", {
  id: serial("id").primaryKey(),
  imePrezime: varchar("imePrezime", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  sifra: varchar("sifra", { length: 255 }).notNull(),
  uloga: ulogaEnum("uloga").notNull(), 
  status: boolean("status").default(true).notNull()
  
});

export const kategorija = pgTable("kategorija", {
  id: serial("id").primaryKey(),
  ime: varchar("ime", { length: 100 }).notNull().unique(),
  opis: varchar("opis", { length: 255 })
});

export const proizvod = pgTable("proizvod", {
  id: serial("id").primaryKey(),
  sifra: varchar("sifra", { length: 50 }).notNull().unique(),
  naziv: varchar("naziv", { length: 255 }).notNull(),
  slika: varchar("slika", { length: 255 }).notNull(), 
  sirina: doublePrecision("sirina").notNull(),
  visina: doublePrecision("visina").notNull(),
  duzina: doublePrecision("duzina").notNull(),
  cena: doublePrecision("cena").notNull(),
  idKategorija: integer("idKategorija").notNull().references(() => kategorija.id, { onDelete: "restrict" }),
  idDobavljac: integer("idDobavljac").notNull().references(() => korisnik.id, { onDelete: "restrict" }),
});

export const saradnja = pgTable("saradnja", {
  idSaradnja: serial("idSaradnja").primaryKey(),
  idUvoznik: integer("idUvoznik").notNull().references(() => korisnik.id, { onDelete: "cascade" }),
  idDobavljac: integer("idDobavljac").notNull().references(() => korisnik.id, { onDelete: "cascade" }),
  datumPocetka: timestamp("datumPocetka").defaultNow().notNull(),
  status: boolean("status").default(true).notNull(),
},
  (t) => ({
    uvoznikDobavljacUnique: uniqueIndex("uq_saradnja_uvoznik_dobavljac").on(
      t.idUvoznik,
      t.idDobavljac
    ),
  })
);

export const kontejner = pgTable("kontejner", {
  idKontejner: serial("idKontejner").primaryKey(),
  maxZapremina: doublePrecision("maxZapremina").notNull(), 
//   trenutnaZapremina: doublePrecision("trenutna_zapremina").default(0), //?
  cenaKontejnera: doublePrecision("cenaKontejnera").notNull(),
//   ukupnaCenaKontejnera: doublePrecision("ukupna_cena_kontejnera").default(0), //?
});

export const stavkaKontejnera = pgTable("stavkaKontejnera", {
  rb: serial("rb").primaryKey(),
  idKontejner: integer("idKontejner").notNull().references(() => kontejner.idKontejner, { onDelete: "cascade" }),
  idProizvod: integer("idProizvod").notNull().references(() => proizvod.id, { onDelete: "restrict" }),
  kolicina: integer("kolicina").notNull(),
//   cenaProizvoda: doublePrecision("cenaProizvoda").notNull(),
  iznosStavke: doublePrecision("iznosStavke").notNull(),
//   zapreminaProizvoda: doublePrecision("zapreminaProizvoda"),
  zapreminaStavke: doublePrecision("zapreminaStavke").default(0)


});

export const faktura = pgTable("faktura", {
  idFaktura: serial("idFaktura").primaryKey(),
  //brojFakture: varchar("broj_fakture", { length: 50 }).unique(),
  troskoviCarine: doublePrecision("troskoviCarine").notNull(),
  datumIzdavanja: timestamp("datumIzdavanja").defaultNow(),
  ukupniTroskoviUvoza: doublePrecision("ukupnoTroskoviUvoza").default(0),
  idSaradnje: integer("idSaradnja").notNull().references(() => saradnja.idSaradnja, { onDelete: "restrict" })

});

export const stavkaFakture = pgTable("stavkaFakture", {
  rb: serial("rb").primaryKey(),
  idFaktura: integer("idFaktura").references(() => faktura.idFaktura, { onDelete: "cascade" }),
  idKontejner: integer("idKontejner").references(() => kontejner.idKontejner, { onDelete: "restrict" }),
  kolicina: integer("kolicina").notNull(),
//   cenaKontejnera: doublePrecision("cenaKontejnera").notNull(),
  iznosStavke: doublePrecision("iznosStavke").notNull()
});