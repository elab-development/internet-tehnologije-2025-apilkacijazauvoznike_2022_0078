"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import HeroSection from "@/src/components/HeroSection";
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
      setError("Šifra mora imati bar 6 karaktera.");
      return;
    }

    if (sifra !== potvrdaSifre) {
      setError("Šifra i potvrda šifre se ne poklapaju.");
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <HeroSection
        badge="BizSupply platforma"
        title="Kreiranje naloga"
        subtitle="Registrujte se kao uvoznik ili dobavljač i započnite rad na platformi za digitalnu B2B nabavku."
        minHeightClassName="min-h-[320px]"
      />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_520px] lg:items-start">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Kome je namenjena platforma?
              </h2>

              <p className="max-w-xl text-sm leading-6 text-slate-600">
                BizSupply je namenjen firmama koje učestvuju u procesu nabavke,
                prodaje i organizacije uvoza kroz jasan, pregledan i centralizovan sistem.
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
                label="Šifra"
                type="password"
                value={sifra}
                onChange={(e) => setSifra(e.target.value)}
                required
              />

              <Input
                label="Potvrda šifre"
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
                  <option value="DOBAVLJAC">Dobavljač</option>
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
      </section>
    </main>
  );
}