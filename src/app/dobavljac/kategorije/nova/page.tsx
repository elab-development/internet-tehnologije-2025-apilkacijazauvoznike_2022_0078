"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";

type Me = { id: number; uloga: "ADMIN" | "UVOZNIK" | "DOBAVLJAC" };

function NovaKategorijaContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const returnTo = sp.get("returnTo") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [me, setMe] = useState<Me | null>(null);

  const [ime, setIme] = useState("");
  const [opis, setOpis] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!meRes.ok) {
          setLoading(false);
          router.push("/login");
          return;
        }

        const meJson = await meRes.json();
        const u = meJson.data as Me;

        if (u.uloga !== "ADMIN" && u.uloga !== "DOBAVLJAC") {
          router.replace(homeByRole(u.uloga));
          return;
        }

        setMe(u);
        setLoading(false);
      } catch {
        setError("Greška pri učitavanju.");
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!ime.trim()) {
      setError("Ime kategorije je obavezno.");
      return;
    }

    try {
      const res = await fetch("/api/kategorije", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ime: ime.trim(), opis: opis.trim() || null }),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {}

      if (!res.ok || (json && json.ok === false)) {
        setError(json?.message ?? json?.error ?? text ?? "Neuspešno dodavanje kategorije.");
        return;
      }

      if (returnTo) router.push(returnTo);
      else if (me) router.push(homeByRole(me.uloga));
      else router.push("/");
    } catch {
      setError("Greška pri slanju (network).");
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Učitavanje...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Kategorije | Nova stavka
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Nova kategorija
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Dodavanje nove kategorije proizvoda koja se može koristiti u daljem
              radu sa ponudom.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => (returnTo ? router.push(returnTo) : router.back())}
          >
            Nazad
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="font-semibold">Greška:</span> {error}
          </div>
        )}

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <Input label="Ime" value={ime} onChange={(e) => setIme(e.target.value)} required />
          <Input label="Opis (opciono)" value={opis} onChange={(e) => setOpis(e.target.value)} />

          <div className="pt-2">
            <Button type="submit">Sačuvaj</Button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function NovaKategorijaPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Učitavanje...
        </div>
      }
    >
      <NovaKategorijaContent />
    </Suspense>
  );
}