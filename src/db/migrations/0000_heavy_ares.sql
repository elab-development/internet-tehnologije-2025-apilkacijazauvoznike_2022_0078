CREATE TYPE "public"."uloga" AS ENUM('ADMIN', 'UVOZNIK', 'DOBAVLJAC');--> statement-breakpoint
CREATE TABLE "faktura" (
	"idFaktura" serial PRIMARY KEY NOT NULL,
	"troskoviCarine" double precision NOT NULL,
	"datumIzdavanja" timestamp DEFAULT now(),
	"ukupnoTroskoviUvoza" double precision DEFAULT 0,
	"idSaradnja" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kategorija" (
	"id" serial PRIMARY KEY NOT NULL,
	"ime" varchar(100) NOT NULL,
	"opis" varchar(255),
	CONSTRAINT "kategorija_ime_unique" UNIQUE("ime")
);
--> statement-breakpoint
CREATE TABLE "kontejner" (
	"idKontejner" serial PRIMARY KEY NOT NULL,
	"maxZapremina" double precision NOT NULL,
	"cenaKontejnera" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "korisnik" (
	"id" serial PRIMARY KEY NOT NULL,
	"imePrezime" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"sifra" varchar(255) NOT NULL,
	"uloga" "uloga" NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	CONSTRAINT "korisnik_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "proizvod" (
	"id" serial PRIMARY KEY NOT NULL,
	"sifra" varchar(50) NOT NULL,
	"naziv" varchar(255) NOT NULL,
	"slika" varchar(255) NOT NULL,
	"sirina" double precision NOT NULL,
	"visina" double precision NOT NULL,
	"duzina" double precision NOT NULL,
	"cena" double precision NOT NULL,
	"idKategorija" integer NOT NULL,
	"idDobavljac" integer NOT NULL,
	CONSTRAINT "proizvod_sifra_unique" UNIQUE("sifra")
);
--> statement-breakpoint
CREATE TABLE "saradnja" (
	"idSaradnja" serial PRIMARY KEY NOT NULL,
	"idUvoznik" integer NOT NULL,
	"idDobavljac" integer NOT NULL,
	"datumPocetka" timestamp DEFAULT now() NOT NULL,
	"status" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stavkaFakture" (
	"rb" serial PRIMARY KEY NOT NULL,
	"idFaktura" integer,
	"idKontejner" integer,
	"kolicina" integer NOT NULL,
	"iznosStavke" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stavkaKontejnera" (
	"rb" serial PRIMARY KEY NOT NULL,
	"idKontejner" integer NOT NULL,
	"idProizvod" integer NOT NULL,
	"kolicina" integer NOT NULL,
	"iznosStavke" double precision NOT NULL,
	"zapreminaStavke" double precision DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "faktura" ADD CONSTRAINT "faktura_idSaradnja_saradnja_idSaradnja_fk" FOREIGN KEY ("idSaradnja") REFERENCES "public"."saradnja"("idSaradnja") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proizvod" ADD CONSTRAINT "proizvod_idKategorija_kategorija_id_fk" FOREIGN KEY ("idKategorija") REFERENCES "public"."kategorija"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proizvod" ADD CONSTRAINT "proizvod_idDobavljac_korisnik_id_fk" FOREIGN KEY ("idDobavljac") REFERENCES "public"."korisnik"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saradnja" ADD CONSTRAINT "saradnja_idUvoznik_korisnik_id_fk" FOREIGN KEY ("idUvoznik") REFERENCES "public"."korisnik"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saradnja" ADD CONSTRAINT "saradnja_idDobavljac_korisnik_id_fk" FOREIGN KEY ("idDobavljac") REFERENCES "public"."korisnik"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stavkaFakture" ADD CONSTRAINT "stavkaFakture_idFaktura_faktura_idFaktura_fk" FOREIGN KEY ("idFaktura") REFERENCES "public"."faktura"("idFaktura") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stavkaFakture" ADD CONSTRAINT "stavkaFakture_idKontejner_kontejner_idKontejner_fk" FOREIGN KEY ("idKontejner") REFERENCES "public"."kontejner"("idKontejner") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stavkaKontejnera" ADD CONSTRAINT "stavkaKontejnera_idKontejner_kontejner_idKontejner_fk" FOREIGN KEY ("idKontejner") REFERENCES "public"."kontejner"("idKontejner") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stavkaKontejnera" ADD CONSTRAINT "stavkaKontejnera_idProizvod_proizvod_id_fk" FOREIGN KEY ("idProizvod") REFERENCES "public"."proizvod"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_saradnja_uvoznik_dobavljac" ON "saradnja" USING btree ("idUvoznik","idDobavljac");