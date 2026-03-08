"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";

type PublicRole = "UVOZNIK" | "DOBAVLJAC";

export default function RegisterPage() {
  const router = useRouter();

  const [imePrezime, setImePrezime] = useState("");
  const [email, setEmail] = useState("");
  const [sifra, setSifra] = useState("");
  const [potvrdaSifre, setPotvrdaSifre] = useState("");
  const [uloga, setUloga] = useState<PublicRole>("UVOZNIK");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!imePrezime.trim() || !email.trim() || !sifra.trim() || !potvrdaSifre.trim()) {
      setError("Sva polja su obavezna.");
      return;
    }

    if (sifra.length < 6) {
      setError("Sifra mora imati bar 6 karaktera.");
      return;
    }

    if (sifra !== potvrdaSifre) {
      setError("Sifra i potvrda sifre se ne poklapaju.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          imePrezime: imePrezime.trim(),
          email: email.trim(),
          sifra,
          uloga,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.message ?? "Neuspesna registracija.");
        return;
      }

      router.push(homeByRole(uloga));
    } catch {
      setError("Greska pri registraciji (fetch/network).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-slate-50 px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_520px] lg:items-center">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              BizSupply platforma
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Kreiranje naloga
            </h1>

            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Otvorite nalog na platformi i pristupite sistemu za upravljanje
              saradnjama, ponudama proizvoda, kontejnerima i poslovnom analitikom.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Za uvoznike</div>
              <div className="mt-1 text-sm text-slate-600">
                Pregled dobavljača, kupovina robe i rad sa kontejnerima.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Za dobavljače</div>
              <div className="mt-1 text-sm text-slate-600">
                Upravljanje ponudom, proizvodima i poslovnim saradnjama.
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Registracija
            </h2>
            <p className="text-sm text-slate-500">
              Popunite podatke za kreiranje novog korisničkog naloga.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span className="font-semibold">Greška:</span> {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Ime i prezime"
              value={imePrezime}
              onChange={(e) => setImePrezime(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Sifra"
              type="password"
              value={sifra}
              onChange={(e) => setSifra(e.target.value)}
              required
            />

            <Input
              label="Potvrda sifre"
              type="password"
              value={potvrdaSifre}
              onChange={(e) => setPotvrdaSifre(e.target.value)}
              required
            />

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Uloga</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                value={uloga}
                onChange={(e) => setUloga(e.target.value as PublicRole)}
              >
                <option value="UVOZNIK">Uvoznik</option>
                <option value="DOBAVLJAC">Dobavljac</option>
              </select>
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Registracija..." : "Registruj se"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/")}
              >
                Nazad
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}