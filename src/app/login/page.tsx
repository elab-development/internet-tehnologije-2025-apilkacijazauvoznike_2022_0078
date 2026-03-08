"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import HeroSection from "@/src/components/HeroSection";
import { homeByRole } from "@/src/lib/role_routes";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sifra, setSifra] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, sifra }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.message ?? "Neuspesan login.");
        return;
      }

      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      if (!meRes.ok) {
        setError("Login ok, ali /me i dalje 401 (cookie nije postavljen).");
        return;
      }

      const meJson = await meRes.json();
      const uloga = meJson?.data?.uloga;

      router.push(homeByRole(uloga));
    } catch {
      setError("Greska pri loginu (fetch/network).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <HeroSection
        badge="BizSupply platforma"
        title="Prijava na sistem"
        subtitle="Pristupite platformi za upravljanje dobavljačima, ponudama, kontejnerima, porudžbinama i analitikom."
        minHeightClassName="min-h-[320px]"
      />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_480px] lg:items-start">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Zašto koristiti BizSupply?
              </h2>

              <p className="max-w-xl text-sm leading-6 text-slate-600">
                Platforma omogućava efikasniju saradnju između uvoznika i dobavljača,
                pregled ponude, kontrolu kontejnera i jednostavniji pristup poslovnim podacima.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">Ponude</div>
                <div className="mt-1 text-sm text-slate-600">
                  Pregled proizvoda i saradnji sa partnerima.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">Kontejneri</div>
                <div className="mt-1 text-sm text-slate-600">
                  Kontrola robe, zapremine i troškova uvoza.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">Analitika</div>
                <div className="mt-1 text-sm text-slate-600">
                  Uvid u potrošnju, partnere i istoriju porudžbina.
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Login
              </h2>
              <p className="text-sm text-slate-500">
                Unesite svoje pristupne podatke da biste nastavili.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <span className="font-semibold">Greška:</span> {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
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

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Prijavljivanje..." : "Uloguj se"}
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