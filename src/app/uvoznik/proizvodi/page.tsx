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

    let redirected = false;

    async function load() {
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

            const res = await fetch("/api/uvoznik/proizvodi");
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

    useEffect(() => {
        load();
    }, []);

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
                    <Button onClick={() => router.push("/uvoznik/dobavljaci")}>
                        Dobavljači
                    </Button>
                    <Button onClick={load}>Osveži</Button>
                </div>
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
                                Dobavljač: <b>{p.dobavljacIme ?? "-"}</b> • Kategorija:{" "}
                                <b>{p.kategorijaIme ?? "-"}</b>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}