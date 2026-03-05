CREATE TYPE "public"."kontejner_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
ALTER TABLE "kontejner" ADD COLUMN "idUvoznik" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "kontejner" ADD COLUMN "status" "kontejner_status" DEFAULT 'OPEN' NOT NULL;--> statement-breakpoint
ALTER TABLE "kontejner" ADD COLUMN "trenutna_zapremina" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "kontejner" ADD COLUMN "ukupna_cena_kontejnera" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "kontejner" ADD CONSTRAINT "kontejner_idUvoznik_korisnik_id_fk" FOREIGN KEY ("idUvoznik") REFERENCES "public"."korisnik"("id") ON DELETE cascade ON UPDATE no action;