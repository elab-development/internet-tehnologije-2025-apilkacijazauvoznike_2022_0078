"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";
import LogoutButton from "@/src/components/LogoutButton";

type Role = "ADMIN" | "UVOZNIK" | "DOBAVLJAC";
type Me = { id: number; uloga: Role };

type Dobavljac = { id: number; imePrezime: string; email: string; status: boolean };

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

export default function UvoznikSaradnjePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");

  const [dobavljaci, setDobavljaci] = useState<Dobavljac[]>([]);
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

        if (m.uloga !== "UVOZNIK") {
          router.replace(homeByRole(m.uloga));
          return;
        }
        setMe(m);

        const dRes = await fetch("/api/uvoznik/svi_dobavljaci", { credentials: "include" });
        const dJson = await dRes.json();
        if (dRes.ok && dJson?.ok) {
          setDobavljaci(dJson.dobavljaci ?? []);
        }

        const sRes = await fetch("/api/saradnja", { credentials: "include" });
        const sJson = await sRes.json();
        if (sRes.ok && sJson?.ok) {
          setSaradnje(sJson.saradnje ?? []);
        }
      } catch (e: any) {
        setError(e?.message ?? "Greška");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // dobavljaci koji vec imaju saradnju sa ovim uvoznikom
  const usedDobavljacIds = useMemo(() => {
    const set = new Set<number>();
    saradnje.forEach((s) => {
      if (s.pending === true || s.status === true) {
        set.add(s.idDobavljac);
      }
    });
    return set;
  }, [saradnje]);

  const availableDobavljaci = useMemo(() => {
    return dobavljaci.filter((d) => !usedDobavljacIds.has(d.id));
  }, [dobavljaci, usedDobavljacIds]);

  const pendingMine = useMemo(() => {
    if (!me) return [];
    return saradnje.filter((s) => s.idUvoznik === me.id && s.pending === true);
  }, [saradnje, me]);

  const activeMine = useMemo(() => {
    if (!me) return [];
    return saradnje.filter((s) => s.idUvoznik === me.id && s.pending === false && s.status === true);
  }, [saradnje, me]);

  async function refreshSaradnje() {
    const sRes = await fetch("/api/saradnja", { credentials: "include" ,cache: "no-store"});
    const sJson = await sRes.json();
    if (sRes.ok && sJson?.ok) setSaradnje(sJson.saradnje ?? []);
  }

  async function refreshDobavljaci() {
    const dRes = await fetch("/api/uvoznik/svi_dobavljaci", {
      credentials: "include",
      cache: "no-store",
    });
    const dJson = await dRes.json();
    if (dRes.ok && dJson?.ok) setDobavljaci(dJson.dobavljaci ?? []);
  }

  async function refreshAll() {
    await Promise.all([refreshSaradnje(), refreshDobavljaci()]);
  }

  async function requestSaradnja(idDobavljac: number) {
    setError("");
    try {
      const res = await fetch("/api/saradnja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idDobavljac }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setError(json?.message ?? json?.error ?? "Neuspešno slanje zahteva");
        return;
      }
      await refreshAll();
    } catch (e: any) {
      setError(e?.message ?? "Greška");
    }
  }

  async function cancelRequest(idSaradnja: number) {
    setError("");
    try {
      const res = await fetch(`/api/saradnja/${idSaradnja}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setError(json?.message ?? json?.error ?? "Neuspešno otkazivanje");
        return;
      }
      await refreshAll();
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
      await refreshAll();
    } catch (e: any) {
      setError(e?.message ?? "Greška");
    }
  }

  if (loading) return <div className="p-6">Učitavanje...</div>;

  return (
  <div className="grid gap-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Uvoznik / Saradnje
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Saradnje
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Upravljanje zahtevima za saradnju sa dobavljačima, pregled aktivnih
            partnerstava i zahteva koji su trenutno na čekanju.
          </p>
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
        <h2 className="text-lg font-semibold text-slate-900">
          Zatraži saradnju
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Novi dobavljači sa kojima još nemate aktivnu saradnju.
        </p>
      </div>

      {availableDobavljaci.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          Nema novih dobavljača za saradnju.
        </div>
      ) : (
        <div className="grid gap-3">
          {availableDobavljaci.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="space-y-1">
                <div className="text-base font-semibold text-slate-900">
                  {d.imePrezime}
                </div>
                <div className="text-sm text-slate-600">{d.email}</div>
              </div>

              <Button onClick={() => requestSaradnja(d.id)}>Zatraži</Button>
            </div>
          ))}
        </div>
      )}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Moji zahtevi
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Zahtevi za saradnju koji su poslati i još čekaju odgovor.
        </p>
      </div>

      {pendingMine.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          Nema zahteva na čekanju.
        </div>
      ) : (
        <div className="grid gap-3">
          {pendingMine.map((s) => (
            <div
              key={s.idSaradnja}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"
            >
              <div className="space-y-1">
                <div className="text-base font-semibold text-slate-900">
                  {s.dobavljacIme ?? "-"}
                </div>
                <div className="text-sm text-slate-600">
                  {s.dobavljacEmail ?? "-"}
                </div>
              </div>

              <Button variant="danger" onClick={() => cancelRequest(s.idSaradnja)}>
                Otkaži zahtev
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Aktivne saradnje
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Dobavljači sa kojima trenutno imate aktivan poslovni odnos.
        </p>
      </div>

      {activeMine.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          Nema aktivnih saradnji.
        </div>
      ) : (
        <div className="grid gap-3">
          {activeMine.map((s) => (
            <div
              key={s.idSaradnja}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
            >
              <div className="space-y-1">
                <div className="text-base font-semibold text-slate-900">
                  {s.dobavljacIme ?? "-"}
                </div>
                <div className="text-sm text-slate-600">
                  {s.dobavljacEmail ?? "-"}
                </div>
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