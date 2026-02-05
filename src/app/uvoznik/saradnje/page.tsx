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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Saradnje (Uvoznik)</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/uvoznik/dobavljaci")}>
            Nazad
          </Button>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <div className="border rounded-2xl p-4">
        <div className="font-semibold mb-3">Zatraži saradnju (novi dobavljači)</div>
        {availableDobavljaci.length === 0 ? (
          <div>Nema novih dobavljača za saradnju.</div>
        ) : (
          <div className="space-y-2">
            {availableDobavljaci.map((d) => (
              <div key={d.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{d.imePrezime}</div>
                  <div className="text-sm text-gray-600">{d.email}</div>
                </div>
                <Button onClick={() => requestSaradnja(d.id)}>Zatraži</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded-2xl p-4">
        <div className="font-semibold mb-3">Moji zahtevi (na čekanju)</div>
        {pendingMine.length === 0 ? (
          <div>Nema zahteva na čekanju.</div>
        ) : (
          <div className="space-y-2">
            {pendingMine.map((s) => (
              <div key={s.idSaradnja} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div>
                    <div className="font-medium">{s.dobavljacIme ?? "-"}</div>
                    <div className="text-sm text-gray-600">{s.dobavljacEmail ?? "-"}</div>
                  </div>
                </div>
                <Button variant="danger" onClick={() => cancelRequest(s.idSaradnja)}>
                  Otkaži zahtev
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded-2xl p-4">
        <div className="font-semibold mb-3">Aktivne saradnje</div>
        {activeMine.length === 0 ? (
          <div>Nema aktivnih saradnji.</div>
        ) : (
          <div className="space-y-2">
            {activeMine.map((s) => (
              <div key={s.idSaradnja} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div>
                    <div className="font-medium">{s.dobavljacIme ?? "-"}</div>
                    <div className="text-sm text-gray-600">{s.dobavljacEmail ?? "-"}</div>
                  </div>
                </div>
                <Button variant="danger" onClick={() => cancelActive(s.idSaradnja)}>
                  Prekini saradnju
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}