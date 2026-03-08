"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";

type Role = "ADMIN" | "UVOZNIK" | "DOBAVLJAC";
type Me = { id: number; uloga: Role };

type Saradnja = {
  idSaradnja: number;
  idUvoznik: number;
  idDobavljac: number;
  datumPocetka: string;
  status: boolean;
  pending: boolean;
  uvoznikIme: string | null;
  uvoznikEmail: string | null;
  dobavljacIme: string | null;
  dobavljacEmail: string | null;
};

export default function DobavljacSaradnjePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [saradnje, setSaradnje] = useState<Saradnja[]>([]);

  useEffect(() => {
    async function init() {
      setError("");
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!meRes.ok) {
          router.replace("/login");
          return;
        }
        const meJson = await meRes.json();
        const m = meJson?.data as Me;

        if (m.uloga !== "DOBAVLJAC") {
          router.replace(homeByRole(m.uloga));
          return;
        }
        setMe(m);

        const sRes = await fetch("/api/saradnja", { credentials: "include" });
        const sJson = await sRes.json();
        if (sRes.ok && sJson?.ok) setSaradnje(sJson.saradnje ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Greška");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  async function refresh() {
    const sRes = await fetch("/api/saradnja", { credentials: "include" });
    const sJson = await sRes.json();
    if (sRes.ok && sJson?.ok) setSaradnje(sJson.saradnje ?? []);
  }

  const incomingPending = useMemo(() => {
    if (!me) return [];
    return saradnje.filter((s) => s.idDobavljac === me.id && s.pending === true);
  }, [saradnje, me]);

  const active = useMemo(() => {
    if (!me) return [];
    return saradnje.filter((s) => s.idDobavljac === me.id && s.pending === false && s.status === true);
  }, [saradnje, me]);

  async function accept(idSaradnja: number) {
    setError("");
    try {
      const res = await fetch(`/api/saradnja/${idSaradnja}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pending: false, status: true }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setError(json?.message ?? json?.error ?? "Neuspešno prihvatanje");
        return;
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Greška");
    }
  }

  async function decline(idSaradnja: number) {
    setError("");
    try {
      const res = await fetch(`/api/saradnja/${idSaradnja}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setError(json?.message ?? json?.error ?? "Neuspešno odbijanje");
        return;
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Greška");
    }
  }

  async function cancelActive(idSaradnja: number) {
    setError("");
    try {
      const res = await fetch(`/api/saradnja/${idSaradnja}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pending: false, status: false }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setError(json?.message ?? json?.error ?? "Neuspešan prekid saradnje");
        return;
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Greška");
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
              Dobavljač / Saradnje
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Saradnje
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Pregled zahteva za saradnju od uvoznika i upravljanje aktivnim
              partnerstvima.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/dobavljac/proizvod")}>
              Moji proizvodi
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          <span className="font-semibold">Greška:</span> {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Zahtevi koji čekaju</h2>
          <p className="mt-1 text-sm text-slate-500">
            Zahtevi uvoznika koji čekaju prihvatanje ili odbijanje.
          </p>
        </div>

        {incomingPending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Nema zahteva.
          </div>
        ) : (
          <div className="grid gap-3">
            {incomingPending.map((s) => (
              <div
                key={s.idSaradnja}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"
              >
                <div className="space-y-1">
                  <div className="text-base font-semibold text-slate-900">
                    {s.uvoznikIme ?? "-"}
                  </div>
                  <div className="text-sm text-slate-600">{s.uvoznikEmail ?? "-"}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => accept(s.idSaradnja)}>Prihvati</Button>
                  <Button variant="danger" onClick={() => decline(s.idSaradnja)}>
                    Odbij
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Aktivne saradnje</h2>
          <p className="mt-1 text-sm text-slate-500">
            Uvoznici sa kojima trenutno postoji aktivna saradnja.
          </p>
        </div>

        {active.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Nema aktivnih saradnji.
          </div>
        ) : (
          <div className="grid gap-3">
            {active.map((s) => (
              <div
                key={s.idSaradnja}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
              >
                <div className="space-y-1">
                  <div className="text-base font-semibold text-slate-900">
                    {s.uvoznikIme ?? "-"}
                  </div>
                  <div className="text-sm text-slate-600">{s.uvoznikEmail ?? "-"}</div>
                </div>

                <Button variant="danger" onClick={() => cancelActive(s.idSaradnja)}>
                  Prekini saradnju
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}