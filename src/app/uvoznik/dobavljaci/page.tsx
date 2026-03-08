"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";

type DobavljacRow = {
  idDobavljac: number;
  imePrezime: string;
  email: string;
  saradnjaId: number;
  datumPocetka: string;
  statusSaradnje: boolean;
};

type ApiResp = {
  ok: boolean;
  dobavljaci?: DobavljacRow[];
  error?: string;
  message?: string;
};

export default function UvoznikDobavljaciPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [dobavljaci, setDobavljaci] = useState<DobavljacRow[]>([]);
  const [q, setQ] = useState("");

  let redirected = false;

  async function init() {
    setLoading(true);
    setErr(null);

    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }

      const meJson = await meRes.json();
      const uloga = meJson?.data?.uloga;

      if (uloga !== "UVOZNIK") {
        redirected = true;
        router.replace(homeByRole(uloga));
        return;
      }

      const res = await fetch("/api/uvoznik/dobavljaci");
      const json: ApiResp = await res.json();

      if (!res.ok || !json.ok) {
        setErr(json.message ?? json.error ?? "Greška pri učitavanju dobavljača");
        return;
      }

      setDobavljaci(json.dobavljaci ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Neočekivana greška");
    } finally {
      if (!redirected) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    init();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return dobavljaci;

    return dobavljaci.filter((d) => {
      return (
        d.imePrezime.toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term)
      );
    });
  }, [dobavljaci, q]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Učitavanje dobavljača...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Uvoznik / Partneri
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Moji dobavljači
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Pregled aktivnih dobavljača sa kojima postoji saradnja. Možete brzo
              pronaći partnera po imenu ili email adresi i preći na ponudu proizvoda.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/uvoznik/proizvodi")}>
              Vidi proizvode
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Pretraga dobavljača</h2>
            <p className="mt-1 text-sm text-slate-500">
              Unesite ime ili email da biste suzili prikaz.
            </p>
          </div>

          <Input
            value={q}
            onChange={(e: any) => setQ(e.target.value)}
            placeholder="Pretraga (ime ili email)"
          />
        </div>
      </section>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          <span className="font-semibold">Greška:</span> {err}
        </div>
      )}

      {filtered.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">
            Nema aktivnih dobavljača
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Trenutno nema rezultata za zadatu pretragu ili nema aktivnih saradnji.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {filtered.map((d) => (
            <article
              key={d.saradnjaId}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="grid gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {d.imePrezime}
                    </h3>
                    <p className="text-sm text-slate-600">{d.email}</p>
                  </div>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Aktivna saradnja
                  </span>
                </div>

                <div className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">ID dobavljača</span>
                    <span className="font-medium text-slate-900">#{d.idDobavljac}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Saradnja od</span>
                    <span className="font-medium text-slate-900">
                      {new Date(d.datumPocetka).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}