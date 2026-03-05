"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import ProductCard from "@/src/components/ProductCard";
import LogoutButton from "@/src/components/LogoutButton";
import { homeByRole } from "@/src/lib/role_routes";

type ProizvodRow = {
  id: number;
  sifra: string;
  naziv: string;
  cena: number;
  slika: string;

  sirina: number;
  visina: number;
  duzina: number;

  idKategorija: number;
  kategorijaIme: string | null;

  idDobavljac: number;
  dobavljacIme: string | null;
};

type ApiResp = {
  ok: boolean;
  proizvodi?: ProizvodRow[];
  error?: string;
  message?: string;
};

export default function UvoznikProizvodiPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [proizvodi, setProizvodi] = useState<ProizvodRow[]>([]);
  const [q, setQ] = useState("");

  const [selectedDobavljacId, setSelectedDobavljacId] = useState<number | "">("");
  const [selectedKategorijaId, setSelectedKategorijaId] = useState<number | "">("");

  const [addingId, setAddingId] = useState<number | null>(null);
  const [qtyById, setQtyById] = useState<Record<number, number>>({});

  let redirected = false;

  function buildUrl() {
    const params = new URLSearchParams();
    if (selectedDobavljacId !== "") params.set("dobavljacId", String(selectedDobavljacId));
    if (selectedKategorijaId !== "") params.set("kategorijaId", String(selectedKategorijaId));
    const qs = params.toString();
    return `/api/uvoznik/proizvodi${qs ? `?${qs}` : ""}`;
  }

  async function load(withFilters: boolean) {
    setLoading(true);
    setErr(null);

    try {
      const meRes = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
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

      const url = withFilters ? buildUrl() : "/api/uvoznik/proizvodi";
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      const json: ApiResp = await res.json();

      if (!res.ok || !json.ok) {
        setErr(json.message ?? json.error ?? "Greška pri učitavanju proizvoda");
        return;
      }

      const list = json.proizvodi ?? [];
      setProizvodi(list);

      // inicijalizuj qty na 1 za sve proizvode koji još nemaju vrednost
      setQtyById((prev) => {
        const next = { ...prev };
        for (const p of list) {
          if (!next[p.id] || next[p.id] < 1) next[p.id] = 1;
        }
        return next;
      });
    } catch (e: any) {
      setErr(e?.message ?? "Neočekivana greška");
    } finally {
      if (!redirected) setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addToCart(idProizvod: number) {
    const qty = Math.max(1, Number(qtyById[idProizvod] ?? 1));

    try {
      setAddingId(idProizvod);

      const doRequest = async (forceNewContainer: boolean) => {
        const res = await fetch("/api/uvoznik/kontejner/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            idProizvod,
            kolicina: qty,
            forceNewContainer,
          }),
        });

        const json = await res.json();
        return { res, json };
      };

      const firstTry = await doRequest(false);

      if (firstTry.res.status === 409 && firstTry.json?.error === "CONTAINER_OVERFLOW") {
        const ok = confirm(firstTry.json?.message ?? "Nema mesta u kontejneru. Otvoriti novi kontejner?");
        if (!ok) return;

        const retry = await doRequest(true);

        if (!retry.res.ok || !retry.json?.ok) {
          alert(retry.json?.message ?? retry.json?.error ?? "Greška pri dodavanju");
          return;
        }

        alert("Dodato u novi kontejner!");
        return;
      }

      if (!firstTry.res.ok || !firstTry.json?.ok) {
        alert(firstTry.json?.message ?? firstTry.json?.error ?? "Greška pri dodavanju");
        return;
      }

      alert("Dodato u korpu!");
    } catch (e: any) {
      alert(e?.message ?? "Greška");
    } finally {
      setAddingId(null);
    }
  }

  const dobavljacOptions = useMemo(() => {
    const map = new Map<number, string>();

    for (const p of proizvodi) {
      map.set(p.idDobavljac, p.dobavljacIme ?? `Dobavljač ${p.idDobavljac}`);
    }

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [proizvodi]);

  const kategorijaOptions = useMemo(() => {
    const map = new Map<number, string>();

    for (const p of proizvodi) {
      map.set(p.idKategorija, p.kategorijaIme ?? `Kategorija ${p.idKategorija}`);
    }

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [proizvodi]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return proizvodi;

    return proizvodi.filter((p) => {
      return (
        p.naziv.toLowerCase().includes(term) ||
        p.sifra.toLowerCase().includes(term) ||
        (p.kategorijaIme ?? "").toLowerCase().includes(term) ||
        (p.dobavljacIme ?? "").toLowerCase().includes(term)
      );
    });
  }, [proizvodi, q]);

  function incQty(id: number) {
    setQtyById((prev) => ({
      ...prev,
      [id]: Math.min(999, (prev[id] ?? 1) + 1),
    }));
  }

  function decQty(id: number) {
    setQtyById((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] ?? 1) - 1),
    }));
  }

  if (loading) return <div style={{ padding: 16 }}>Učitavanje...</div>;

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1>Proizvodi mojih dobavljača</h1>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button onClick={() => router.push("/uvoznik/kontejner")}>Moja korpa</Button>
          <Button onClick={() => router.push("/uvoznik/dobavljaci")}>Dobavljači</Button>

          <Button
            onClick={() => {
              setSelectedDobavljacId("");
              setSelectedKategorijaId("");
              load(false);
            }}
          >
            Osveži
          </Button>

          <LogoutButton />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          Dobavljač:
          <select
            value={selectedDobavljacId}
            onChange={(e) => setSelectedDobavljacId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">Svi</option>
            {dobavljacOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          Kategorija:
          <select
            value={selectedKategorijaId}
            onChange={(e) => setSelectedKategorijaId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">Sve</option>
            {kategorijaOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>

        <Button onClick={() => load(true)}>Primeni filtere</Button>
        <Button onClick={() => router.push("/uvoznik/uporedi")}>Otvori upoređivanje</Button>
      </div>

      <Input
        value={q}
        onChange={(e: any) => setQ(e.target.value)}
        placeholder="Pretraga (naziv, šifra, dobavljač, kategorija)"
      />

      {err && (
        <div style={{ padding: 12, border: "1px solid #ccc" }}>
          <b>Greška:</b> {err}
        </div>
      )}

      {filtered.length === 0 ? (
        <div>Nema proizvoda (ili nema aktivnih saradnji).</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gap: 8,
                border: "1px solid #eee",
                padding: 12,
                borderRadius: 10,
              }}
            >
              <ProductCard p={p as any} />

              <div style={{ opacity: 0.85 }}>
                Dobavljač: <b>{p.dobavljacIme ?? "-"}</b> • Kategorija: <b>{p.kategorijaIme ?? "-"}</b>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <Button onClick={() => router.push(`/uvoznik/uporedi?left=${p.id}`)}>Uporedi</Button>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Button onClick={() => decQty(p.id)} disabled={addingId === p.id}>
                      -
                    </Button>

                    <div style={{ minWidth: 30, textAlign: "center" }}>
                      <b>{qtyById[p.id] ?? 1}</b>
                    </div>

                    <Button onClick={() => incQty(p.id)} disabled={addingId === p.id}>
                      +
                    </Button>
                  </div>

                  <Button onClick={() => addToCart(p.id)} disabled={addingId === p.id}>
                    {addingId === p.id ? "Dodavanje..." : "Dodaj u korpu"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}