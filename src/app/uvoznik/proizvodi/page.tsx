"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import ProductCard from "@/src/components/ProductCard";
import { homeByRole } from "@/src/lib/role_routes";
import LogoutButton from "@/src/components/LogoutButton";

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

  // ✅ NOVO: filteri za dropdown
  const [selectedDobavljacId, setSelectedDobavljacId] = useState<number | "">("");
  const [selectedKategorijaId, setSelectedKategorijaId] = useState<number | "">("");

  let redirected = false;

  // ✅ NOVO: helper koji pravi URL sa query parametrima
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

      setProizvodi(json.proizvodi ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Neočekivana greška");
    } finally {
      if (!redirected) {
        setLoading(false);
      }
    }
  }

  // ✅ prvi put učitaj SVE (bez filtera)
  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ NOVO: opcije za dropdown dobijamo iz proizvoda (sigurno i bez dodatnih API-ja)
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

  if (loading) return <div style={{ padding: 16 }}>Učitavanje...</div>;

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1>Proizvodi mojih dobavljača</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => router.push("/uvoznik/dobavljaci")}>Dobavljači</Button>

          {/* ✅ Osveži: resetuje filtere i učita SVE */}
          <Button
            onClick={() => {
              setSelectedDobavljacId("");
              setSelectedKategorijaId("");
              load(false);
            }}
          >
            Osveži
          </Button>
        </div>
      </div>

      {/* ✅ NOVO: dropdown filteri */}
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

        {/* ✅ Primeni filtere: učita sa query parametrima */}
        <Button onClick={() => load(true)}>Primeni filtere</Button>
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
            <div key={p.id} style={{ display: "grid", gap: 6 }}>
              <ProductCard p={p} />
              <div style={{ opacity: 0.85 }}>
                Dobavljač: <b>{p.dobavljacIme ?? "-"}</b> • Kategorija: <b>{p.kategorijaIme ?? "-"}</b>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}