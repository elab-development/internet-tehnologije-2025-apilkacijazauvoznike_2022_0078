import { db } from "@/src/db";
import { korisnik } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sanitizeText } from "@/src/lib/sanitize";

export type Role = "ADMIN" | "UVOZNIK" | "DOBAVLJAC";

type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export async function getUserByEmail(email: string) {
  const checkEmail = email.trim().toLowerCase();
  const [u] = await db.select().from(korisnik).where(eq(korisnik.email, checkEmail));
  return u ?? null;
}

export async function getUserById(id: number) {
  const [u] = await db.select().from(korisnik).where(eq(korisnik.id, id));
  return u ?? null;
}

// LOGIN
export async function loginUser(input: {
  email: string;
  sifra: string;
}): Promise<
  Result<{
    id: number;
    imePrezime: string;
    email: string;
    uloga: Role;
    status: boolean;
  }>
> {
  const email = input.email?.trim().toLowerCase();
  const sifra = input.sifra;

  if (!email || !sifra) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: "Email i šifra su obavezni" },
    };
  }

  const u = await getUserByEmail(email);
  if (!u) {
    return {
      ok: false,
      error: { code: "INVALID_CREDENTIALS", message: "Pogrešan email ili šifra" },
    };
  }

  if (u.status === false) {
    return {
      ok: false,
      error: { code: "USER_DISABLED", message: "Korisnik je deaktiviran" },
    };
  }

  const passOk = await bcrypt.compare(sifra, u.sifra);
  if (!passOk) {
    return {
      ok: false,
      error: { code: "INVALID_CREDENTIALS", message: "Pogrešan email ili šifra" },
    };
  }

  return {
    ok: true,
    data: {
      id: u.id,
      imePrezime: u.imePrezime,
      email: u.email,
      uloga: u.uloga as Role,
      status: u.status,
    },
  };
}

// REGISTER
export async function registerUser(input: {
  imePrezime: string;
  email: string;
  sifra: string;
  uloga?: "UVOZNIK" | "DOBAVLJAC";
}): Promise<
  Result<{
    id: number;
    imePrezime: string;
    email: string;
    uloga: Role;
    status: boolean;
  }>
> {
  const imePrezimeRaw = input.imePrezime?.trim();
  const email = input.email?.trim().toLowerCase();
  const sifra = input.sifra;
  const uloga = input.uloga;

  if (!imePrezimeRaw || !email || !sifra || !uloga) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "Ime i prezime, email, šifra i uloga su obavezni",
      },
    };
  }

  if (uloga !== "UVOZNIK" && uloga !== "DOBAVLJAC") {
    return {
      ok: false,
      error: {
        code: "INVALID_ROLE",
        message: "Dozvoljena je registracija samo za uvoznika i dobavljača",
      },
    };
  }

  if (sifra.length < 6) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: "Šifra mora imati bar 6 karaktera" },
    };
  }

  const exists = await getUserByEmail(email);
  if (exists) {
    return {
      ok: false,
      error: { code: "EMAIL_EXISTS", message: "Email je već registrovan" },
    };
  }

  const imePrezime = sanitizeText(imePrezimeRaw);
  const sifraHash = await bcrypt.hash(sifra, 10);

  const inserted = await db
    .insert(korisnik)
    .values({
      imePrezime,
      email,
      sifra: sifraHash,
      uloga,
      status: true,
    })
    .returning();

  const u = inserted[0];

  return {
    ok: true,
    data: {
      id: u.id,
      imePrezime: u.imePrezime,
      email: u.email,
      uloga: u.uloga as Role,
      status: u.status,
    },
  };
}